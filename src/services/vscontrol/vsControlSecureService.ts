// src/services/vscontrol/vsControlSecureService.ts
import * as soap from 'soap';
import { createHash, createCipheriv, createDecipheriv, randomBytes, BinaryLike } from 'crypto';
import { RateLimiterMemory } from 'rate-limiter-flexible';

// Tipos de seguridad
interface SecureConfig {
  url: string;
  username: string;
  encryptedPassword: string;
  allowedTables: string[];
  maxRecordsPerQuery: number;
  timeout: number;
  enableAudit: boolean;
  enableEncryption: boolean;
}

interface AuditLog {
  timestamp: Date;
  action: string;
  table: string;
  recordCount: number;
  userId: string;
  ipAddress?: string;
  success: boolean;
  errorMessage?: string;
}

// Rate limiter - máximo 60 requests por minuto
const rateLimiter = new RateLimiterMemory({
  points: 60,
  duration: 60,
  blockDuration: 60,
});

// Clase principal del servicio seguro
export class VSControlSecureService {
  private config: SecureConfig;
  private client: any;
  private auditLogs: AuditLog[] = [];
  private encryptionKey: Buffer;
  private iv: Buffer;

  constructor(config: Partial<SecureConfig>) {
    // Configuración con valores seguros por defecto
    this.config = {
      url: process.env.VSCONTROL_URL || '',
      username: process.env.VSCONTROL_USER || 'VSControlReadOnly',
      encryptedPassword: process.env.VSCONTROL_PASSWORD || '',
      allowedTables: (process.env.VSCONTROL_ALLOWED_TABLES || '').split(','),
      maxRecordsPerQuery: parseInt(process.env.VSCONTROL_MAX_RECORDS || '10000'),
      timeout: parseInt(process.env.VSCONTROL_TIMEOUT || '30000'),
      enableAudit: true,
      enableEncryption: true,
      ...config
    };

    // Generar claves de encriptación
    this.encryptionKey = createHash('sha256')
      .update(process.env.ENCRYPTION_SECRET || 'default-secret-key')
      .digest();
    this.iv = randomBytes(16);
  }

  /**
   * Desencriptar la contraseña almacenada
   */
  private decryptPassword(encryptedPassword: string): string {
    if (!this.config.enableEncryption) {
      return encryptedPassword;
    }

    try {
      const decipher = createDecipheriv(
        'aes-256-cbc', 
        this.encryptionKey as BinaryLike, 
        this.iv as BinaryLike
      );
      let decrypted = decipher.update(encryptedPassword, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (error) {
      console.error('Error desencriptando contraseña:', error);
      throw new Error('Failed to decrypt password');
    }
  }

  /**
   * Encriptar datos sensibles antes de almacenarlos
   */
  public encryptData(data: string): string {
    if (!this.config.enableEncryption) {
      return data;
    }

    const cipher = createCipheriv(
      'aes-256-cbc',
      this.encryptionKey as BinaryLike,
      this.iv as BinaryLike
    );
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }

  /**
   * Validar que la tabla solicitada esté permitida
   */
  private validateTableAccess(tableName: string): void {
    if (!this.config.allowedTables.includes(tableName)) {
      throw new Error(`Access denied for table: ${tableName}`);
    }
  }

  /**
   * Registrar auditoría de acceso
   */
  private logAudit(log: AuditLog): void {
    if (!this.config.enableAudit) return;

    this.auditLogs.push(log);

    // Guardar en base de datos si es necesario
    // await prisma.vsControlAudit.create({ data: log });

    // Si hay error o acceso sospechoso, alertar
    if (!log.success || log.recordCount > this.config.maxRecordsPerQuery) {
      this.sendSecurityAlert(log);
    }
  }

  /**
   * Enviar alerta de seguridad
   */
  private sendSecurityAlert(log: AuditLog): void {
    console.error('🚨 SECURITY ALERT:', {
      timestamp: log.timestamp,
      action: log.action,
      table: log.table,
      error: log.errorMessage
    });

    // Aquí podrías integrar con un sistema de alertas
    // como email, Slack, Teams, etc.
  }

  /**
   * Conectar al servicio SOAP con seguridad
   */
  public async connect(): Promise<void> {
    try {
      // Verificar rate limiting
      await rateLimiter.consume('vscontrol-connection', 1);

      const password = this.decryptPassword(this.config.encryptedPassword);

      // Opciones de conexión segura
      const options = {
        wsdl_options: {
          timeout: this.config.timeout,
          strictSSL: true, // Verificar certificado SSL
          rejectUnauthorized: true
        },
        endpoint: this.config.url,
        forceSoap12Headers: true
      };

      // Crear cliente SOAP
      this.client = await soap.createClientAsync(this.config.url, options);

      // Configurar autenticación
      this.client.setSecurity(new soap.BasicAuthSecurity(
        this.config.username,
        password
      ));

      // Agregar headers de seguridad adicionales
      this.client.addHttpHeader('X-API-Version', '1.0');
      this.client.addHttpHeader('X-Client-ID', process.env.CLIENT_ID || 'financial-control');

      this.logAudit({
        timestamp: new Date(),
        action: 'CONNECT',
        table: 'N/A',
        recordCount: 0,
        userId: this.config.username,
        success: true
      });

      console.log('✅ Conexión segura establecida con VS Control');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logAudit({
        timestamp: new Date(),
        action: 'CONNECT',
        table: 'N/A',
        recordCount: 0,
        userId: this.config.username,
        success: false,
        errorMessage
      });
      throw error;
    }
  }

  /**
   * Obtener datos de una tabla con validaciones de seguridad
   */
  public async getTableData(
    tableName: string, 
    filters: Record<string, any> = {},
    options: {
      limit?: number;
      offset?: number;
      fields?: string[];
    } = {}
  ): Promise<any> {
    try {
      // Validaciones de seguridad
      this.validateTableAccess(tableName);

      // Rate limiting por tabla
      await rateLimiter.consume(`table-${tableName}`, 1);

      // Limitar cantidad de registros
      const limit = Math.min(
        options.limit || this.config.maxRecordsPerQuery,
        this.config.maxRecordsPerQuery
      );

      // Sanitizar entrada para prevenir SQL injection
      const sanitizedTable = tableName.replace(/[^a-zA-Z0-9_]/g, '');
      const sanitizedFilters = this.sanitizeFilters(filters);

      // Construir query segura
      const query = {
        empresa: 1, // Tu empresa
        tabla: sanitizedTable,
        filtros: sanitizedFilters,
        limite: limit,
        offset: options.offset || 0,
        campos: options.fields?.join(',') || '*'
      };

      // Llamar al servicio
      const result = await this.client.ConsultarTablaAsync(query);

      // Validar respuesta
      const data = result[0]?.ConsultarTablaResult;
      const recordCount = data?.length || 0;

      // Auditar acceso
      this.logAudit({
        timestamp: new Date(),
        action: 'READ',
        table: tableName,
        recordCount,
        userId: this.config.username,
        success: true
      });

      // Encriptar datos sensibles si es necesario
      if (this.config.enableEncryption && this.shouldEncryptTable(tableName)) {
        return this.encryptSensitiveData(data);
      }

      return data;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logAudit({
        timestamp: new Date(),
        action: 'READ',
        table: tableName,
        recordCount: 0,
        userId: this.config.username,
        success: false,
        errorMessage
      });
      throw error;
    }
  }

  /**
   * Sanitizar filtros para prevenir SQL injection
   */
  private sanitizeFilters(filters: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(filters)) {
      // Validar nombre de campo
      const sanitizedKey = key.replace(/[^a-zA-Z0-9_]/g, '');
      
      // Validar valor
      if (typeof value === 'string') {
        // Escapar caracteres peligrosos
        sanitized[sanitizedKey] = value
          .replace(/'/g, "''")
          .replace(/--/g, '')
          .replace(/;/g, '')
          .replace(/\/\*/g, '')
          .replace(/\*\//g, '');
      } else if (typeof value === 'number') {
        sanitized[sanitizedKey] = value;
      } else if (value === null || value === undefined) {
        sanitized[sanitizedKey] = null;
      }
    }

    return sanitized;
  }

  /**
   * Determinar si una tabla contiene datos sensibles
   */
  private shouldEncryptTable(tableName: string): boolean {
    const sensitiveTables = ['Clientes', 'Empleados', 'Pagos', 'Contratos'];
    return sensitiveTables.includes(tableName);
  }

  /**
   * Encriptar campos sensibles en los datos
   */
  private encryptSensitiveData(data: any[]): any[] {
    const sensitiveFields = ['RFC', 'CURP', 'Email', 'Telefono', 'Direccion'];
    
    return data.map(record => {
      const encrypted = { ...record };
      
      for (const field of sensitiveFields) {
        if (encrypted[field]) {
          encrypted[field] = this.encryptData(encrypted[field]);
        }
      }
      
      return encrypted;
    });
  }

  /**
   * Obtener logs de auditoría
   */
  public getAuditLogs(filters?: {
    startDate?: Date;
    endDate?: Date;
    table?: string;
    success?: boolean;
  }): AuditLog[] {
    let logs = [...this.auditLogs];

    if (filters) {
      if (filters.startDate) {
        logs = logs.filter(log => log.timestamp >= filters.startDate!);
      }
      if (filters.endDate) {
        logs = logs.filter(log => log.timestamp <= filters.endDate!);
      }
      if (filters.table) {
        logs = logs.filter(log => log.table === filters.table);
      }
      if (filters.success !== undefined) {
        logs = logs.filter(log => log.success === filters.success);
      }
    }

    return logs;
  }

  /**
   * Verificar health del servicio
   */
  public async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    latency: number;
    errors: number;
  }> {
    const startTime = Date.now();
    
    try {
      // Intentar una operación simple
      await this.client.TestConnectionAsync({ empresa: 1 });
      
      const latency = Date.now() - startTime;
      const recentErrors = this.auditLogs.filter(
        log => !log.success && 
        log.timestamp > new Date(Date.now() - 300000) // últimos 5 minutos
      ).length;

      return {
        status: recentErrors < 5 ? 'healthy' : 'unhealthy',
        latency,
        errors: recentErrors
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        latency: Date.now() - startTime,
        errors: 999
      };
    }
  }

  /**
   * Limpiar y cerrar conexión
   */
  public async disconnect(): Promise<void> {
    if (this.client) {
      // Guardar logs de auditoría pendientes
      // await this.flushAuditLogs();
      
      this.client = null;
      console.log('✅ Conexión cerrada de forma segura');
    }
  }
}

// Singleton para mantener una única instancia
let serviceInstance: VSControlSecureService | null = null;

export const getVSControlSecureService = (): VSControlSecureService => {
  if (!serviceInstance) {
    serviceInstance = new VSControlSecureService({});
  }
  return serviceInstance;
};
