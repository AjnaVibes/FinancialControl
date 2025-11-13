// src/services/sync/directSyncService.ts
// VERSIÓN CON DEBUG para campos TIME

import { ventasDb } from '@/lib/ventasDb';
import { prisma } from '@/lib/prisma';
import { TABLE_TO_MODEL_MAP } from '@/config/sync-tables.config';

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
  
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : value;
  }
  
  if (typeof value === 'string' || typeof value === 'number') {
    const dateValue = new Date(value);
    return isNaN(dateValue.getTime()) ? null : dateValue;
  }
  
  return null;
}

// Helper para convertir snake_case a camelCase
function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
}

export class DirectSyncService {
  /**
   * Extrae solo la parte de tiempo (HH:MM:SS) de un valor DateTime de MySQL
   */
  private extractTimeString(value: any): string | null {
    if (value === null || value === undefined) {
      return null;
    }

    // Si ya es un string simple de tiempo "HH:MM:SS"
    if (typeof value === 'string' && /^\d{2}:\d{2}:\d{2}$/.test(value)) {
      return value;
    }

    // Si es un string, buscar el patrón
    if (typeof value === 'string') {
      const timeMatch = value.match(/(\d{1,2}):(\d{2}):(\d{2})/);
      if (timeMatch) {
        const hours = timeMatch[1].padStart(2, '0');
        return `${hours}:${timeMatch[2]}:${timeMatch[3]}`;
      }
    }

    // Si es un objeto Date
    if (value instanceof Date) {
      const hours = value.getHours().toString().padStart(2, '0');
      const minutes = value.getMinutes().toString().padStart(2, '0');
      const seconds = value.getSeconds().toString().padStart(2, '0');
      return `${hours}:${minutes}:${seconds}`;
    }

    // Si no pudimos convertirlo, retornar null
    console.warn(`No se pudo convertir valor TIME: ${value}`);
    return null;
  }

  /**
   * Convierte valores numéricos a String de forma segura
   */
  private convertToString(value: any, treatZeroAsNull: boolean = false): string | null {
    if (value === null || value === undefined) {
      return null;
    }

    if (treatZeroAsNull && (value === 0 || value === '0')) {
      return null;
    }

    if (typeof value === 'number') {
      return value.toString();
    }

    if (typeof value === 'string') {
      return value;
    }

    if (typeof value === 'bigint') {
      return value.toString();
    }

    return null;
  }


  /**
   * Limpieza final de datos antes de enviar a Prisma
   * Maneja conversiones para TODAS las tablas problemáticas
   */
  private cleanDataBeforePrisma(tableName: string, data: any): any {
    const cleaned = { ...data };
    
    // 🔥 ELIMINAR campos TIME que ya no existen en el schema
    delete cleaned.workingTimeStart;
    delete cleaned.workingTimeEnd;
  
  // 🔥 CONVERSIÓN UNIVERSAL DE BOOLEANOS (0/1 a boolean)
  const convertIntToBoolean = (value: any): boolean | null => {
    if (value === null || value === undefined) return null;
    if (value === 0 || value === '0' || value === false) return false;
    if (value === 1 || value === '1' || value === true) return true;
    return null;
  };
  
  // 🔥 CONVERSIÓN UNIVERSAL: Campos que SIEMPRE deben ser String en cualquier tabla
  const universalStringFields = [
    'name', 'email', 'phone', 'mobile', 'address', 'street',
    'interiorNumber', 'externalNumber', 'postalCode',
    'rfc', 'curp', 'passport', 'ineNumber', 
    'externalId', 'idmex', 'instagramId',
    'whatsappNumberId', 'whatsappRecipientNumber',
    'messengerConversationId', 'messengerRecipientId'
  ];
  
  // Aplicar conversiones universales
  for (const field of universalStringFields) {
    if (field in cleaned && cleaned[field] !== null && cleaned[field] !== undefined) {
      if (typeof cleaned[field] === 'number' || typeof cleaned[field] === 'bigint') {
        cleaned[field] = String(cleaned[field]);
      }
    }
  }
  
  // 🔥 CONVERSIONES ESPECÍFICAS POR TABLA
  switch(tableName) {
    case 'promise_types':
      // Convertir hidden de Int a Boolean
      if ('hidden' in cleaned) {
        cleaned.hidden = convertIntToBoolean(cleaned.hidden);
      }
      break;
      
    case 'developers':
      // cellphone debe ser String
      if ('cellphone' in cleaned && cleaned.cellphone !== null) {
        cleaned.cellphone = String(cleaned.cellphone);
      }
      break;
      
    case 'projects':
      // depositAccount debe ser String
      if ('depositAccount' in cleaned && cleaned.depositAccount !== null) {
        // Si es 0, convertir a null, sino a string
        if (cleaned.depositAccount === 0 || cleaned.depositAccount === '0') {
          cleaned.depositAccount = null;
        } else {
          cleaned.depositAccount = String(cleaned.depositAccount);
        }
      }
      break;
      
    case 'agents':
      // canReservate está definido como String en Prisma pero puede llegar como Boolean
      if ('canReservate' in cleaned && cleaned.canReservate !== null) {
        if (typeof cleaned.canReservate === 'boolean') {
          cleaned.canReservate = cleaned.canReservate ? 'true' : 'false';
        } else {
          cleaned.canReservate = String(cleaned.canReservate);
        }
      }
      
      // isGoogleCalendarSynced e isGoogleMailSynced deben ser Boolean
      if ('isGoogleCalendarSynced' in cleaned) {
        cleaned.isGoogleCalendarSynced = convertIntToBoolean(cleaned.isGoogleCalendarSynced);
      }
      if ('isGoogleMailSynced' in cleaned) {
        cleaned.isGoogleMailSynced = convertIntToBoolean(cleaned.isGoogleMailSynced);
      }
      break;
      
    case 'beneficiaries':
      // identification debe ser String
      if ('identification' in cleaned && cleaned.identification !== null) {
        cleaned.identification = String(cleaned.identification);
      }
      
      // 🔥 FIX: relation debe ser String
      if ('relation' in cleaned && cleaned.relation !== null) {
        if (typeof cleaned.relation === 'number' || typeof cleaned.relation === 'bigint') {
          cleaned.relation = String(cleaned.relation);
        }
      }
      
      // 🔥 FIX: mLastname y fLastname deben ser String
      const beneficiaryStringFields = ['mLastname', 'fLastname', 'name'];
      for (const field of beneficiaryStringFields) {
        if (field in cleaned && cleaned[field] !== null && cleaned[field] !== undefined) {
          // Si es 0, convertir a null
          if (cleaned[field] === 0 || cleaned[field] === '0') {
            cleaned[field] = null;
          } else if (typeof cleaned[field] === 'number') {
            cleaned[field] = String(cleaned[field]);
          }
        }
      }
      break;
      
    case 'client_references':
      // Convertir mLastname y fLastname a String
      const refStringFields = ['mLastname', 'fLastname', 'name', 'phone'];
      for (const field of refStringFields) {
        if (field in cleaned && cleaned[field] !== null && cleaned[field] !== undefined) {
          // Si es 0, convertir a null
          if (cleaned[field] === 0 || cleaned[field] === '0') {
            cleaned[field] = null;
          } else {
            cleaned[field] = String(cleaned[field]);
          }
        }
      }
      break;
      
    case 'quotations':
      // isCoacredited debe ser Boolean
      if ('isCoacredited' in cleaned) {
        cleaned.isCoacredited = convertIntToBoolean(cleaned.isCoacredited);
      }
      
      // isDeedInformative debe ser Boolean  
      if ('isDeedInformative' in cleaned) {
        cleaned.isDeedInformative = convertIntToBoolean(cleaned.isDeedInformative);
      }
      
      // 🔥 FIX: commissionable debe ser Boolean
      if ('commissionable' in cleaned) {
        cleaned.commissionable = convertIntToBoolean(cleaned.commissionable);
      }
      
      // 🔥 FIX: complete y send deben ser Boolean
      if ('complete' in cleaned) {
        cleaned.complete = convertIntToBoolean(cleaned.complete);
      }
      if ('send' in cleaned) {
        cleaned.send = convertIntToBoolean(cleaned.send);
      }
      break;
      
    case 'transactions':
      // phoneVerification debe ser Boolean
      if ('phoneVerification' in cleaned) {
        cleaned.phoneVerification = convertIntToBoolean(cleaned.phoneVerification);
      }
      
      // fisicalPerson debe ser Boolean
      if ('fisicalPerson' in cleaned) {
        cleaned.fisicalPerson = convertIntToBoolean(cleaned.fisicalPerson);
      }
      
      // 🔥 FIX: isDocumentComplete debe ser Boolean
      if ('isDocumentComplete' in cleaned) {
        cleaned.isDocumentComplete = convertIntToBoolean(cleaned.isDocumentComplete);
      }
      
      // calculatedCommisions: si es "null" string, convertir a null
      if (cleaned.calculatedCommisions === 'null' || cleaned.calculatedCommisions === 'NULL') {
        cleaned.calculatedCommisions = null;
      }
      break;
      
    case 'movements':
      // Convertir campos booleanos
      const movementBooleanFields = ['canceled', 'countable', 'isCredit', 'sent'];
      for (const field of movementBooleanFields) {
        if (field in cleaned) {
          cleaned[field] = convertIntToBoolean(cleaned[field]);
        }
      }
      
      // 🔥 FIX: accountHolder e issuingAccount deben ser String
      if ('accountHolder' in cleaned && cleaned.accountHolder !== null) {
        if (typeof cleaned.accountHolder === 'number' || typeof cleaned.accountHolder === 'bigint') {
          cleaned.accountHolder = String(cleaned.accountHolder);
        }
      }
      
      if ('issuingAccount' in cleaned && cleaned.issuingAccount !== null) {
        if (typeof cleaned.issuingAccount === 'number' || typeof cleaned.issuingAccount === 'bigint') {
          cleaned.issuingAccount = String(cleaned.issuingAccount);
        }
      }
      
      // 🔥 FIX ADICIONAL: receivingAccount también debe ser String
      if ('receivingAccount' in cleaned && cleaned.receivingAccount !== null) {
        if (typeof cleaned.receivingAccount === 'number' || typeof cleaned.receivingAccount === 'bigint') {
          cleaned.receivingAccount = String(cleaned.receivingAccount);
        }
      }
      break;
      
    case 'clients':
      // Tu código existente para clients...
      const clientStringFields = [
        'companyName', 'companyStreet', 'companyExternalNumber',
        'companyInteriorNumber', 'companySuburb', 'companyPostalCode',
        'companyPhone', 'companyMunicipality', 'companyState',
        'companyNear', 'companyMobile', 'job', 'antiquity',
        'bank', 'gender', 'affiliationNumber', 'isRented',
        'timeRented', 'birthState', 'companyRfc', 'businessName',
        'adquisition', 'companyBussiness', 'location', 'credit',
        'creditType', 'companyBusiness', 'electorKey',
        'suburb', 'municipality', 'near', 'fLastname', 'mLastname',
        'birthplace', 'state', 'lastPhipipelinePhase', 'nationality'
      ];
      
      for (const field of clientStringFields) {
        if (field in cleaned && cleaned[field] !== null && cleaned[field] !== undefined) {
          const value = cleaned[field];
          if (value === 0 || value === '0') {
            const zeroToNullFields = ['companyStreet', 'companySuburb', 'companyMunicipality', 
                                     'companyState', 'companyBusiness', 'companyName'];
            cleaned[field] = zeroToNullFields.includes(field) ? null : '0';
          } else {
            cleaned[field] = String(value);
          }
        }
      }
      
      // Limpiar valores especiales
      const fieldsToClean = ['rfc', 'companyRfc', 'businessName', 'passport'];
      for (const field of fieldsToClean) {
        if (cleaned[field] && (
          cleaned[field] === '0' || 
          cleaned[field] === '00000000000' ||
          cleaned[field] === '0000000000' ||
          cleaned[field] === 'NA' ||
          cleaned[field] === 'N/A'
        )) {
          cleaned[field] = null;
        }
      }
      
      // Manejar campos numéricos con límites
      if (cleaned.monthlyIncome > 2147483647) cleaned.monthlyIncome = null;
      if (cleaned.additionalIncome > 2147483647) cleaned.additionalIncome = null;
      if (cleaned.fixedCosts > 2147483647) cleaned.fixedCosts = null;
      if (cleaned.monthlyRent > 2147483647) cleaned.monthlyRent = null;
      break;
      
    case 'references':
      // 🔥 FIX: identifier debe ser String
      if ('identifier' in cleaned && cleaned.identifier !== null) {
        if (typeof cleaned.identifier === 'number' || typeof cleaned.identifier === 'bigint') {
          cleaned.identifier = String(cleaned.identifier);
        }
      }
      break;
  }
  
  return cleaned;
}
  /**
   * Sincroniza una tabla específica desde RAMP
   */
  async syncTable(config: SyncConfig): Promise<SyncResult> {
    const startTime = Date.now();
    const {
      tableName,
      primaryKey = 'id',
      timestampField = 'updated_at',
      batchSize = 0
    } = config;

    console.log(`\n🔄 Iniciando sincronización de ${tableName}...`);
    if (batchSize === 0) {
      console.log('📊 Modo: SINCRONIZACIÓN COMPLETA (sin límite)');
    } else {
      console.log(`📊 Modo: Sincronización por lotes (${batchSize} registros)`);
    }

    try {
      const modelName = TABLE_TO_MODEL_MAP[tableName];
      if (!modelName) {
        throw new Error(`No se encontró mapeo para tabla: ${tableName}`);
      }

      const prismaModel = (prisma as any)[modelName];
      if (!prismaModel) {
        throw new Error(`Modelo Prisma no encontrado: ${modelName}`);
      }

      // Convertir el timestampField a camelCase para Prisma
      const timestampFieldCamel = snakeToCamel(timestampField);

      // Obtener el último timestamp sincronizado
      const lastRecord = await prismaModel.findFirst({
        orderBy: { [timestampFieldCamel]: 'desc' },
        select: { [timestampFieldCamel]: true }
      });

      const lastTimestamp = lastRecord?.[timestampFieldCamel];
      console.log(`📅 Último registro sincronizado:`, lastTimestamp || 'Ninguno');

      // Obtener total de registros a sincronizar
      let countQuery: string;
      let totalRecords: number;

      // 🔥 MANEJO ESPECIAL PARA TABLA 'references'
      if (tableName === 'references') {
        if (lastTimestamp) {
          countQuery = `SELECT COUNT(*) as total FROM \`references\` WHERE ${timestampField} > ?`;
          const countResult = await ventasDb.query(countQuery, [lastTimestamp]);
          totalRecords = countResult[0].total;
        } else {
          countQuery = `SELECT COUNT(*) as total FROM \`references\``;
          const countResult = await ventasDb.query(countQuery);
          totalRecords = countResult[0].total;
        }
      } else {
        if (lastTimestamp) {
          countQuery = `SELECT COUNT(*) as total FROM ${tableName} WHERE ${timestampField} > ?`;
          const countResult = await ventasDb.query(countQuery, [lastTimestamp]);
          totalRecords = countResult[0].total;
        } else {
          countQuery = `SELECT COUNT(*) as total FROM ${tableName}`;
          const countResult = await ventasDb.query(countQuery);
          totalRecords = countResult[0].total;
        }
      }

     // Consultar registros de RAMP
let records: any[];
let query: string;

// 🔥 MANEJO ESPECIAL PARA TABLA 'references' (palabra reservada en MySQL)
if (tableName === 'references') {
  if (batchSize === 0) {
    // SIN LÍMITE
    if (lastTimestamp) {
      query = `SELECT * FROM \`references\` WHERE ${timestampField} > ? ORDER BY ${timestampField} ASC`;
      records = await ventasDb.query(query, [lastTimestamp]);
    } else {
      query = `SELECT * FROM \`references\` ORDER BY ${timestampField} ASC`;
      records = await ventasDb.query(query);
    }
  } else {
    // CON LÍMITE
    if (lastTimestamp) {
      query = `SELECT * FROM \`references\` WHERE ${timestampField} > ? ORDER BY ${timestampField} ASC LIMIT ${batchSize}`;
      records = await ventasDb.query(query, [lastTimestamp]);
    } else {
      query = `SELECT * FROM \`references\` ORDER BY ${timestampField} ASC LIMIT ${batchSize}`;
      records = await ventasDb.query(query);
    }
  }
} else {
  // QUERIES NORMALES PARA OTRAS TABLAS
  if (batchSize === 0) {
    // SIN LÍMITE - Obtener todos los registros
    if (lastTimestamp) {
      query = `SELECT * FROM ${tableName} WHERE ${timestampField} > ? ORDER BY ${timestampField} ASC`;
      records = await ventasDb.query(query, [lastTimestamp]);
    } else {
      query = `SELECT * FROM ${tableName} ORDER BY ${timestampField} ASC`;
      records = await ventasDb.query(query);
    }
  } else {
    // CON LÍMITE - Usar batchSize
    if (lastTimestamp) {
      query = `SELECT * FROM ${tableName} WHERE ${timestampField} > ? ORDER BY ${timestampField} ASC LIMIT ${batchSize}`;
      records = await ventasDb.query(query, [lastTimestamp]);
    } else {
      query = `SELECT * FROM ${tableName} ORDER BY ${timestampField} ASC LIMIT ${batchSize}`;
      records = await ventasDb.query(query);
    }
  }
}

console.log(`📥 Registros obtenidos de RAMP: ${records.length.toLocaleString()}`);
      
      // 🔍 DEBUG - Ver cómo llegan los primeros registros problemáticos
      if (tableName === 'clients') {
        const debugRecords = records.filter(r => [19, 72, 83].includes(r.id));
        if (debugRecords.length > 0) {
          console.log('🔍 DEBUG - Registros RAW desde MySQL:');
          debugRecords.forEach(r => {
            console.log({
              id: r.id,
              working_time_start: r.working_time_start,
              type: typeof r.working_time_start
            });
          });
        }
      }

      // Procesar registros
      let inserted = 0;
      let updated = 0;
      let skipped = 0;
      let errors = 0;
      const errorDetails: any[] = [];

      // Convertir primaryKey a camelCase para Prisma
      const primaryKeyCamel = snakeToCamel(primaryKey);

      // Mostrar progreso cada 100 registros
      const showProgress = records.length > 100;
      let processed = 0;

      for (const record of records) {
        try {
          const mappedData = this.mapRecordToModel(tableName, record);
          const recordId = record[primaryKey];

          // Verificar si existe
          const existing = await prismaModel.findUnique({
            where: { [primaryKeyCamel]: recordId }
          });

          if (existing) {
            // Actualizar
            const { [primaryKeyCamel]: _, ...updateData } = mappedData;
            const cleanData = this.cleanDataBeforePrisma(tableName, updateData);
            await prismaModel.update({
              where: { [primaryKeyCamel]: recordId },
              data: cleanData
            });
            updated++;
          } else {
            // Insertar nuevo - incluir el ID
            const cleanData = this.cleanDataBeforePrisma(tableName, mappedData);
            await prismaModel.create({
              data: cleanData
            });
            inserted++;
          }

          processed++;
          
          // Mostrar progreso
          if (showProgress && processed % 100 === 0) {
            const percentage = ((processed / records.length) * 100).toFixed(1);
            console.log(`   ⏳ Progreso: ${processed.toLocaleString()}/${records.length.toLocaleString()} (${percentage}%) - Insertados: ${inserted}, Actualizados: ${updated}, Errores: ${errors}`);
          }
          
        } catch (error: any) {
          errors++;
          if (errorDetails.length < 10) {
            errorDetails.push({
              record: record[primaryKey],
              error: error.message,
              stack: error.stack?.split('\n')[0]
            });
          }
        }
      }

      const duration = Date.now() - startTime;
      console.log(`✅ Sincronización completada:`);
      console.log(`   - Insertados: ${inserted.toLocaleString()}`);
      console.log(`   - Actualizados: ${updated.toLocaleString()}`);
      console.log(`   - Errores: ${errors.toLocaleString()}`);
      console.log(`   - Duración: ${(duration / 1000).toFixed(2)}s`);

      return {
        success: errors < records.length,
        recordsProcessed: records.length,
        recordsInserted: inserted,
        recordsUpdated: updated,
        recordsSkipped: skipped,
        errors,
        errorDetails: errorDetails.length > 0 ? errorDetails : undefined,
        lastTimestamp: records[records.length - 1]?.[timestampField],
        duration
      };

    } catch (error: any) {
      console.error(`❌ Error en sincronización:`, error);
      return {
        success: false,
        recordsProcessed: 0,
        recordsInserted: 0,
        recordsUpdated: 0,
        recordsSkipped: 0,
        errors: 1,
        errorDetails: [{ error: error.message }],
        duration: Date.now() - startTime,
        message: error.message
      };
    }
  }

  /**
   * Mapea un registro de RAMP al modelo de Prisma
   */
  private mapRecordToModel(tableName: string, record: any): any {
    const mapped: any = {};
    
    // 🔍 DEBUG - Ver qué llega desde MySQL
    if (tableName === 'clients' && (record.id === 19 || record.id === 72)) {
      console.log('🔍 DEBUG mapRecordToModel ENTRADA:', {
        id: record.id,
        working_time_start: record.working_time_start,
        type_start: typeof record.working_time_start,
        working_time_end: record.working_time_end,
        type_end: typeof record.working_time_end
      });
    }

    // Lista de campos TIME de MySQL - YA NO SE USAN
    const timeFields: string[] = []; // Vacío porque fueron removidos del schema
    
    // Lista de campos numéricos que deben convertirse a String
    const numericToStringFields = [
      'mobile', 'phone', 'company_phone', 'companyPhone',
      'company_mobile', 'companyMobile', 'affiliation_number', 'affiliationNumber',
      'elector_key', 'electorKey', 'postal_code', 'postalCode',
      'company_postal_code', 'companyPostalCode', 'ine_number', 'ineNumber',
      'passport', 'company_rfc', 'companyRfc', 'business_name', 'businessName',
      'external_id', 'externalId', 'idmex', 'instagram_id', 'instagramId'
    ];
    
    // Lista de campos booleanos
    const booleanFields = [
      'is_paid', 'isPaid',
      'is_broker', 'isBroker', 
      'can_reservate', 'canReservate',
      'is_foreign', 'isForeign',
      'work_foreign', 'workForeign',
      'used', 'active', 'enabled',
      'is_credit_promisse', 'isCreditPromisse'
    ];

    // Lista de campos que NO deben convertirse a Date
    const nonDateFields = ['completion_date', 'completionDate'];

    for (const [key, value] of Object.entries(record)) {
      // Corrección de typo
      let camelKey = snakeToCamel(key);
      if (key === 'last_phipeline_phase' || camelKey === 'lastPhipelinePhase') {
        camelKey = 'lastPhipipelinePhase';
      }
      
      // Si el valor es null, mantenerlo
      if (value === null) {
        mapped[camelKey] = null;
        continue;
      }

      // IGNORAR CAMPOS TIME - Ya no existen en el schema
      if (key === 'working_time_start' || key === 'working_time_end') {
        continue; // Simplemente omitir estos campos
      }

      // MANEJAR CAMPOS NUMÉRICOS QUE DEBEN SER STRING
      if (numericToStringFields.includes(key) || numericToStringFields.includes(camelKey)) {
        const treatZeroAsNull = ['company_rfc', 'business_name'].includes(key);
        mapped[camelKey] = this.convertToString(value, treatZeroAsNull);
        continue;
      }

      // Verificar que NO sea un campo que debe preservarse
      const isNonDateField = nonDateFields.some(field => 
        key === field || camelKey === field
      );

      // Manejar fechas
      if (!isNonDateField && (key.includes('date') || key.includes('_at') || key === 'birthday')) {
        mapped[camelKey] = toSafeDate(value);
        continue;
      }

      // Manejar campos booleanos
      if (booleanFields.includes(key) || booleanFields.includes(camelKey)) {
        mapped[camelKey] = value === 1 || value === '1' || value === true;
        continue;
      }

      // Manejar BigInt
      if (typeof value === 'bigint') {
        mapped[camelKey] = this.handleBigInt(tableName, key, value);
        continue;
      }

      // Manejar strings numéricos grandes
      if (typeof value === 'string' && /^\d{10,}$/.test(value)) {
        mapped[camelKey] = this.handleBigInt(tableName, key, BigInt(value));
        continue;
      }

      // Valor regular
      mapped[camelKey] = value;
    }

    // Aplicar transformaciones específicas por tabla
    this.applyTableSpecificTransformations(tableName, record, mapped);
    
    // 🔍 DEBUG - Ver resultado del mapeo
    if (tableName === 'clients' && (mapped.id === 19 || mapped.id === 72)) {
      console.log('🔍 DEBUG mapRecordToModel SALIDA:', {
        id: mapped.id,
        workingTimeStart: mapped.workingTimeStart,
        type_start: typeof mapped.workingTimeStart,
        workingTimeEnd: mapped.workingTimeEnd,
        type_end: typeof mapped.workingTimeEnd
      });
    }

    return mapped;
  }

  /**
   * Manejar conversión de BigInt según contexto
   */
  private handleBigInt(tableName: string, fieldName: string, value: bigint): any {
    if (tableName === 'promissories' && fieldName === 'promissories') {
      return value.toString();
    }
    
    if (tableName === 'references' && (fieldName === 'reference' || fieldName === 'referencia')) {
      return value.toString();
    }
    
    if (tableName === 'movements' && (fieldName === 'movement_id' || fieldName === 'movementId')) {
      return value.toString();
    }
    
    if (tableName === 'client_references' && fieldName === 'reference') {
      return value.toString();
    }
    
    const numValue = Number(value);
    if (numValue <= Number.MAX_SAFE_INTEGER) {
      return numValue;
    }
    return value.toString();
  }

  /**
   * Aplicar transformaciones específicas por tabla
   */
  private applyTableSpecificTransformations(tableName: string, original: any, mapped: any): void {
    switch (tableName) {
      case 'references':
        if (original.quotation !== null && original.quotation !== undefined) {
          const quotationValue = Number(original.quotation);
          mapped.quotation = isNaN(quotationValue) ? null : quotationValue;
        }
        break;

      case 'clients':
        // 🔍 DEBUG - Ver antes de transformación
        if (original.id === 19 || original.id === 72) {
          console.log('🔍 DEBUG applyTableSpecific ANTES:', {
            id: original.id,
            workingTimeStart: mapped.workingTimeStart,
            original_start: original.working_time_start
          });
        }
        
        // 🔥 IGNORAR CAMPOS TIME - Ya no existen en el schema
        // Los campos working_time_start y working_time_end fueron removidos
        delete mapped.workingTimeStart;
        delete mapped.workingTimeEnd;
        
        // 🔍 DEBUG - Ver después de transformación
        if (original.id === 19 || original.id === 72) {
          console.log('🔍 DEBUG applyTableSpecific DESPUÉS:', {
            id: original.id,
            workingTimeStart: mapped.workingTimeStart
          });
        }
        
        // Asegurar conversiones de string
        if (original.passport !== undefined && original.passport !== null) {
          mapped.passport = this.convertToString(original.passport);
        }
        
        if (original.company_rfc !== undefined) {
          mapped.companyRfc = this.convertToString(original.company_rfc, true);
        }
        
        if (original.business_name !== undefined) {
          mapped.businessName = this.convertToString(original.business_name, true);
        }
        
        if (original.ine_number !== undefined && original.ine_number !== null) {
          mapped.ineNumber = this.convertToString(original.ine_number);
        }
        
        if (original.external_id !== undefined && original.external_id !== null) {
          mapped.externalId = this.convertToString(original.external_id);
        }
        
        if (original.idmex !== undefined && original.idmex !== null) {
          mapped.idmex = this.convertToString(original.idmex);
        }
        
        if (original.instagram_id !== undefined && original.instagram_id !== null) {
          mapped.instagramId = this.convertToString(original.instagram_id);
        }
        break;

      case 'movements':
        if (original.movement_id) {
          mapped.movementId = original.movement_id.toString();
        }
        break;

      case 'promissories':
        if (original.promissories) {
          mapped.promissories = original.promissories.toString();
        }
        break;
    }
  }

  /**
   * Sincronizar todas las tablas configuradas
   */
  async syncAllTables(): Promise<Record<string, SyncResult>> {
    console.log('🔄 Iniciando sincronización de todas las tablas...\n');
    
    const results: Record<string, SyncResult> = {};
    const tables = Object.keys(TABLE_TO_MODEL_MAP);

    for (const tableName of tables) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`📊 Tabla: ${tableName}`);
      console.log('='.repeat(60));

      const result = await this.syncTable({ tableName });
      results[tableName] = result;

      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Resumen final
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMEN FINAL DE SINCRONIZACIÓN');
    console.log('='.repeat(60));

    let totalInserted = 0;
    let totalUpdated = 0;
    let totalErrors = 0;

    for (const [table, result] of Object.entries(results)) {
      const status = result.success ? '✅' : '❌';
      console.log(`${status} ${table}: ${result.recordsInserted} insertados, ${result.recordsUpdated} actualizados, ${result.errors} errores`);
      totalInserted += result.recordsInserted;
      totalUpdated += result.recordsUpdated;
      totalErrors += result.errors;
    }

    console.log('\n' + '='.repeat(60));
    console.log(`📊 TOTALES:`);
    console.log(`   - Insertados: ${totalInserted}`);
    console.log(`   - Actualizados: ${totalUpdated}`);
    console.log(`   - Errores: ${totalErrors}`);
    console.log('='.repeat(60) + '\n');

    return results;
  }
}

// Exportar instancia singleton
const syncServiceInstance = new DirectSyncService();
export const directSyncService = syncServiceInstance;
export const syncService = syncServiceInstance;
