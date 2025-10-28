// src/services/sync/directSyncService.ts
// VERSIÓN MEJORADA CON MANEJO DE ERRORES ESPECÍFICOS

import { ventasDb } from '@/lib/ventasDb';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import { TABLE_TO_MODEL_MAP, getTableConfig } from '@/config/sync-tables.config';

interface SyncConfig {
  tableName: string;
  primaryKey?: string;
  timestampField?: string;
  batchSize?: number;
}

interface SyncResult {
  success: boolean;
  recordsProcessed: number;
  recordsInserted: number;
  recordsUpdated: number;
  recordsSkipped: number;
  errors: number;
  errorDetails?: any[];
  lastTimestamp?: Date;
  duration: number;
  message?: string;
}

// Helper para convertir fechas de manera segura
function toSafeDate(value: any): Date | null {
  if (!value) return null;
  try {
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
}

class DirectSyncService {
  /**
   * Sincronizar datos directamente desde VentasDB
   */
  async syncTable(
    tableName: string, 
    type: 'incremental' | 'full' = 'incremental',
    lastSync?: Date
  ): Promise<SyncResult> {
    const startTime = Date.now();
    const result: SyncResult = {
      success: false,
      recordsProcessed: 0,
      recordsInserted: 0,
      recordsUpdated: 0,
      recordsSkipped: 0,
      errors: 0,
      errorDetails: [],
      duration: 0
    };

    try {
      console.log(`📊 Iniciando sincronización ${type} de ${tableName}...`);

      // Obtener configuración
      const config = await this.getSyncConfigFromWebhook(tableName);
      
      // Construir query según el tipo
      let query = `SELECT * FROM \`${tableName}\``;
      const params: any[] = [];
      
      if (type === 'incremental' && lastSync && config.timestampField) {
        query += ` WHERE \`${config.timestampField}\` > ?`;
        params.push(lastSync);
      }
      
      query += ` ORDER BY \`${config.primaryKey || 'id'}\``;
      query += ` LIMIT ${config.batchSize || 1000}`;

      // Ejecutar consulta
      const records = await ventasDb.query(query, params);
      
      console.log(`📥 Obtenidos ${records.length} registros de ${tableName}`);
      
      if (records.length === 0) {
        result.success = true;
        result.message = 'No hay registros para sincronizar';
        return result;
      }

      // Procesar registros
      let lastTimestamp: Date | undefined;
      const prismaModel = this.getPrismaModel(tableName);

      for (const record of records) {
        try {
          result.recordsProcessed++;
          
          // Mapear registro a formato Prisma
          const mappedData = await this.mapRecordToPrisma(tableName, record);
          
          // Crear hash para detectar cambios
          const recordHash = this.createHash(mappedData);
          
          // Actualizar timestamp
          if (config.timestampField && record[config.timestampField]) {
            const timestamp = toSafeDate(record[config.timestampField]);
            if (timestamp && (!lastTimestamp || timestamp > lastTimestamp)) {
              lastTimestamp = timestamp;
            }
          }

          // Verificar si existe
          const primaryKeyField = config.primaryKey || 'id';
          const primaryKeyValue = mappedData[primaryKeyField];
          
          const existing = await (prismaModel as any).findUnique({
            where: { [primaryKeyField]: primaryKeyValue }
          });

          if (existing) {
            // Actualizar si cambió
            const existingHash = this.createHash(existing);
            if (existingHash !== recordHash) {
              await (prismaModel as any).update({
                where: { [primaryKeyField]: primaryKeyValue },
                data: mappedData
              });
              result.recordsUpdated++;
            } else {
              result.recordsSkipped++;
            }
          } else {
            // Insertar nuevo
            await (prismaModel as any).create({
              data: mappedData
            });
            result.recordsInserted++;
          }

        } catch (error: any) {
          result.errors++;
          result.errorDetails?.push({
            record: record.id || record,
            error: error.message
          });
          
          // Log solo los primeros 5 errores para no saturar
          if (result.errors <= 5) {
            console.error(`❌ Error procesando registro:`, error.message);
          }
        }
      }

      result.success = result.errors === 0;
      result.lastTimestamp = lastTimestamp;
      result.duration = Date.now() - startTime;

      // Actualizar webhook_config
      const webhookConfig = await prisma.webhookConfig.findUnique({
        where: { tabla: tableName }
      });

      if (webhookConfig) {
        await prisma.webhookConfig.update({
          where: { id: webhookConfig.id },
          data: {
            lastSyncAt: lastTimestamp || new Date(),
            totalSyncs: { increment: 1 },
            successSyncs: result.errors === 0 ? { increment: 1 } : undefined,
            errorSyncs: result.errors > 0 ? { increment: 1 } : undefined,
            lastError: result.errors > 0 
              ? `${result.errors} errores durante sincronización`
              : null
          }
        });
      }

      console.log(`✅ Sincronización completada: ${result.recordsInserted} insertados, ${result.recordsUpdated} actualizados, ${result.errors} errores`);

      return result;

    } catch (error: any) {
      console.error(`❌ Error en sincronización:`, error);
      result.message = error.message;
      result.duration = Date.now() - startTime;
      
      throw error;
    }
  }

  /**
   * Mapear registro de MySQL a formato Prisma - MEJORADO
   */
  private async mapRecordToPrisma(tableName: string, record: any): Promise<any> {
    // Lista expandida de campos booleanos en todas las tablas
    const booleanFields = [
      // Campos generales
      'is_foreign', 'work_foreign', 'is_broker', 'is_google_calendar_synced', 
      'is_google_mail_synced', 'hidden', 'complete', 'send', 'is_coacredited',
      'commissionable', 'is_deed_informative', 'phone_verification', 
      'is_document_complete', 'fisical_person', 'canceled', 'countable',
      'is_credit', 'sent', 'used',
      // Campos específicos de promissories
      'isPaid', 'is_paid', 'isCreditPromisse', 'is_credit_promisse',
      // Campos de agents
      'can_reservate', 'is_active', 'has_access',
      // Campos de otras tablas
      'is_complete', 'is_verified', 'is_approved'
    ];

    // Función helper para convertir snake_case a camelCase
    const snakeToCamel = (str: string) => {
      return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    };

    const mapped: any = {};

    // Procesar cada campo
    for (const [key, value] of Object.entries(record)) {
      const camelKey = snakeToCamel(key);
      
      // Manejar valores NULL
      if (value === null || value === undefined) {
        mapped[camelKey] = null;
        continue;
      }

      // Conversiones por tipo de campo
      if (booleanFields.includes(key) || booleanFields.includes(camelKey)) {
        // Convertir tinyint/number a boolean
        mapped[camelKey] = value === 1 || value === '1' || value === true;
      } else if (key.endsWith('_at') || key.endsWith('_date') || 
                 key === 'birthday' || key === 'deadline' || key === 'due_date' || 
                 key === 'signature_date' || key === 'closing_date' || key === 'expiration_spei') {
        // Campos de fecha
        mapped[camelKey] = toSafeDate(value);
      } else if (key.endsWith('_time_start') || key.endsWith('_time_end')) {
        // Campos de tiempo
        mapped[camelKey] = value;
      } else if (typeof value === 'bigint') {
        // Manejar BigInt según el campo y tabla
        mapped[camelKey] = this.handleBigInt(tableName, key, value);
      } else if (typeof value === 'string' && /^\d{15,}$/.test(value)) {
        // String con muchos dígitos que podría ser BigInt
        mapped[camelKey] = this.handleBigInt(tableName, key, BigInt(value));
      } else {
        // Valor tal cual
        mapped[camelKey] = value;
      }
    }

    // Aplicar transformaciones específicas por tabla
    this.applyTableSpecificTransformations(tableName, record, mapped);

    return mapped;
  }

  /**
   * Manejar valores BigInt según el contexto
   */
  private handleBigInt(tableName: string, fieldName: string, value: bigint): any {
    // Referencias: el campo 'reference' debe ser String
    if (tableName === 'references' && (fieldName === 'reference' || fieldName === 'referencia')) {
      return value.toString();
    }
    
    // client_references: si hay campos de referencia numérica grande
    if (tableName === 'client_references' && fieldName.includes('phone')) {
      return value.toString();
    }
    
    // Por defecto para IDs, mantener como número si cabe, sino como string
    if (fieldName === 'id' || fieldName.endsWith('_id')) {
      // Si el valor cabe en un Number seguro, usar Number
      if (value <= Number.MAX_SAFE_INTEGER) {
        return Number(value);
      }
      // Si no, mantener como BigInt o convertir a String según el esquema
      return value;
    }
    
    // Para otros campos numéricos grandes, convertir a string
    return value.toString();
  }

  /**
   * Aplicar transformaciones específicas por tabla
   */
  private applyTableSpecificTransformations(tableName: string, record: any, mapped: any): void {
    switch (tableName) {
      case 'clients':
        // Mapeos especiales para clients
        if (record.elector_key !== undefined) mapped.electorKey = record.elector_key;
        if (record.f_lastname !== undefined) mapped.fLastname = record.f_lastname;
        if (record.m_lastname !== undefined) mapped.mLastname = record.m_lastname;
        break;
      
      case 'agents':
        // Mapeos para agents
        if (record.can_reservate !== undefined) {
          mapped.canReservate = record.can_reservate === 1 || record.can_reservate === true;
        }
        if (record.last_session !== undefined) {
          mapped.lastSession = toSafeDate(record.last_session);
        }
        // Corregir campos booleanos específicos
        if (record.is_active !== undefined) {
          mapped.isActive = record.is_active === 1 || record.is_active === true;
        }
        break;
      
      case 'coordinators':
        if (record.f_lastname !== undefined) mapped.fLastname = record.f_lastname;
        if (record.m_lastname !== undefined) mapped.mLastname = record.m_lastname;
        break;
      
      case 'units':
        if (record.surplus_mt2 !== undefined) mapped.surplusMt2 = record.surplus_mt2;
        break;
      
      case 'references':
        // Asegurar que reference sea String
        if (mapped.reference && typeof mapped.reference !== 'string') {
          mapped.reference = String(mapped.reference);
        }
        break;
      
      case 'promissories':
        // Asegurar conversiones booleanas
        if (record.isPaid !== undefined && record.isPaid !== null) {
          mapped.isPaid = record.isPaid === 1 || record.isPaid === '1' || record.isPaid === true;
        }
        if (record.is_paid !== undefined && record.is_paid !== null) {
          mapped.isPaid = record.is_paid === 1 || record.is_paid === '1' || record.is_paid === true;
        }
        if (record.isCreditPromisse !== undefined && record.isCreditPromisse !== null) {
          mapped.isCreditPromisse = record.isCreditPromisse === 1 || record.isCreditPromisse === true;
        }
        if (record.is_credit_promisse !== undefined && record.is_credit_promisse !== null) {
          mapped.isCreditPromisse = record.is_credit_promisse === 1 || record.is_credit_promisse === true;
        }
        break;
      
      case 'beneficiaries':
        // Manejar campos booleanos de beneficiaries
        if (record.is_complete !== undefined) {
          mapped.isComplete = record.is_complete === 1 || record.is_complete === true;
        }
        break;
      
      case 'client_references':
        // Manejar teléfonos y otros campos
        if (record.phone && typeof record.phone === 'bigint') {
          mapped.phone = record.phone.toString();
        }
        break;
      
      case 'agencies':
        // Campos específicos de agencies
        if (record.is_active !== undefined) {
          mapped.isActive = record.is_active === 1 || record.is_active === true;
        }
        break;
      
      case 'movement_methods':
        // Campos booleanos de movement_methods
        if (record.is_active !== undefined) {
          mapped.isActive = record.is_active === 1 || record.is_active === true;
        }
        break;
      
      case 'movements':
        // Manejar campos de movements
        if (record.is_paid !== undefined) {
          mapped.isPaid = record.is_paid === 1 || record.is_paid === true;
        }
        if (record.is_credit !== undefined) {
          mapped.isCredit = record.is_credit === 1 || record.is_credit === true;
        }
        break;
      
      case 'developers':
      case 'projects':
        // Campos booleanos generales
        if (record.is_active !== undefined) {
          mapped.isActive = record.is_active === 1 || record.is_active === true;
        }
        break;
    }

    // Limpieza final: eliminar campos undefined
    Object.keys(mapped).forEach(key => {
      if (mapped[key] === undefined) {
        delete mapped[key];
      }
    });
  }

  /**
   * Obtener modelo Prisma correspondiente
   */
  private getPrismaModel(tableName: string): any {
    const modelName = TABLE_TO_MODEL_MAP[tableName];
    if (!modelName) {
      throw new Error(`No se encontró modelo para la tabla: ${tableName}`);
    }
    
    return (prisma as any)[modelName];
  }

  /**
   * Crear hash de un objeto para detectar cambios
   */
  private createHash(obj: any): string {
    const str = JSON.stringify(obj, (_, value) =>
      typeof value === 'bigint' ? value.toString() : value
    );
    return crypto.createHash('md5').update(str).digest('hex');
  }

  /**
   * Obtener configuración desde webhook_configs
   */
  async getSyncConfigFromWebhook(tableName: string): Promise<SyncConfig> {
    const webhookConfig = await prisma.webhookConfig.findUnique({
      where: { tabla: tableName }
    });

    if (!webhookConfig) {
      throw new Error(`Configuración no encontrada para tabla: ${tableName}`);
    }

    const metadata = webhookConfig.metadata as any || {};
    
    return {
      tableName,
      primaryKey: metadata.primaryKey || 'id',
      timestampField: metadata.timestampField || 'updated_at',
      batchSize: metadata.batchSize || 1000
    };
  }

  async testConnection(): Promise<boolean> {
    return ventasDb.testConnection();
  }

  async getAvailableTables(): Promise<string[]> {
    return ventasDb.getTables();
  }
}

export const directSyncService = new DirectSyncService();