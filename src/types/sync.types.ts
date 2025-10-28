// src/types/sync.types.ts

import { Prisma } from '@prisma/client';

// Tipo para el metadata de webhook_config
export interface WebhookMetadata {
  primaryKey?: string;
  timestampField?: string;
  dependencies?: string[];
  priority?: number;
  batchSize?: number;
  prismaModel?: string;
  lastSyncResult?: SyncResultMetadata;
  lastFullSync?: Date | string;
  lastReset?: Date | string;
  [key: string]: any; // Para campos adicionales
}

// Tipo para los resultados de sincronización en metadata
export interface SyncResultMetadata {
  processed: number;
  inserted: number;
  updated: number;
  skipped: number;
  errors: number;
  duration: number;
}

// Tipo para responseData en webhookSyncLog
export interface SyncLogResponseData {
  type: string;
  lastSyncTimestamp?: string;
  summary?: SyncResultMetadata;
  [key: string]: any;
}

// Helper para convertir a Prisma.InputJsonValue
export function toJsonValue(data: any): Prisma.InputJsonValue {
  return data as Prisma.InputJsonValue;
}

// Helper para parsear metadata de webhook_config
export function parseWebhookMetadata(metadata: Prisma.JsonValue | null): WebhookMetadata {
  if (!metadata) return {};
  
  try {
    if (typeof metadata === 'object' && metadata !== null) {
      return metadata as WebhookMetadata;
    }
    if (typeof metadata === 'string') {
      return JSON.parse(metadata) as WebhookMetadata;
    }
    return {};
  } catch {
    return {};
  }
}

// Helper para validar y convertir fechas
export function toSafeDate(value: any): Date | null {
  if (!value) return null;
  
  try {
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
}

// Helper para convertir snake_case a camelCase
export function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

// Helper para verificar si un campo es booleano en MySQL
export function isBooleanField(fieldName: string): boolean {
  const booleanFields = [
    'is_foreign', 'work_foreign', 'is_broker', 'is_google_calendar_synced', 
    'is_google_mail_synced', 'hidden', 'complete', 'send', 'is_coacredited',
    'commissionable', 'is_deed_informative', 'phone_verification', 
    'is_document_complete', 'fisical_person', 'canceled', 'countable',
    'is_credit', 'sent', 'is_paid', 'is_credit_promisse', 'used'
  ];
  
  return booleanFields.includes(fieldName);
}

// Helper para verificar si un campo es de fecha
export function isDateField(fieldName: string): boolean {
  return fieldName.endsWith('_at') || 
         fieldName.endsWith('_date') || 
         fieldName === 'birthday' || 
         fieldName === 'deadline';
}

// Helper para verificar si un campo es de tiempo
export function isTimeField(fieldName: string): boolean {
  return fieldName.endsWith('_time_start') || fieldName.endsWith('_time_end');
}

// Helper para convertir valor MySQL a TypeScript
export function convertMySQLValue(key: string, value: any): any {
  if (value === null || value === undefined) {
    return null;
  }

  if (isBooleanField(key)) {
    return value === 1 || value === true;
  }

  if (isDateField(key)) {
    return toSafeDate(value);
  }

  if (isTimeField(key)) {
    return value;
  }

  // Manejar BigInt - convertir a string si es necesario
  if (typeof value === 'bigint') {
    // Para campos que esperan string (como reference), convertir a string
    // Para otros campos, mantener como BigInt o convertir según el caso
    if (key === 'reference' || key.includes('reference')) {
      return value.toString();
    }
    // Para IDs y otros campos numéricos grandes, decidir caso por caso
    if (key.includes('id') || key.includes('_id')) {
      return value; // Mantener como BigInt si el campo lo soporta
    }
    return value.toString(); // Por defecto convertir a string
  }

  // Detectar números muy grandes que deberían ser BigInt
  if (typeof value === 'string' && /^\d{10,}$/.test(value)) {
    const num = BigInt(value);
    // Si el campo espera string (como reference), devolver como string
    if (key === 'reference' || key.includes('reference')) {
      return value; // Mantener como string
    }
    return num;
  }

  if (typeof value === 'number' && value > Number.MAX_SAFE_INTEGER) {
    // Número muy grande, convertir según el campo
    if (key === 'reference' || key.includes('reference')) {
      return value.toString();
    }
    return BigInt(value);
  }

  return value;
}