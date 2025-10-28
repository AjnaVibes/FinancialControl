import { Prisma } from '@prisma/client';

export interface TableConfig {
  tableName: string;
  displayName: string;
  categoria: string;
  icono: string;
  color: string;
  primaryKey: string;
  timestampField?: string;
  dependencies: string[];
  priority: number;
  batchSize?: number;
  enabled: boolean;
  prismaModel: string; // Nombre del modelo en Prisma
}

// Mapa de nombres de tabla MySQL a nombres de modelo Prisma
export const TABLE_TO_MODEL_MAP: Record<string, string> = {
  // Catálogos
  'marital_statuses': 'maritalStatus',
  'marital_registries': 'maritalRegistry',
  'marital_regimen': 'maritalRegimen',
  'client_statuses': 'clientStatus',
  'project_statuses': 'projectStatus',
  'phase_statuses': 'phaseStatus',
  'quotation_statuses': 'quotationStatus',
  'promise_types': 'promiseType',
  'transaction_statuses': 'transactionStatus',
  'operates' : 'operate',
  
  // Agentes y Coordinadores
  'agencies': 'agency',
  'agents': 'agent',
  'coordinators': 'coordinator',
  
  // Clientes
  'clients': 'client',
  'beneficiaries': 'beneficiary',
  'client_references': 'clientReference',
  
  // Desarrolladores
  'developers': 'developer',
  'sub_developers': 'subDeveloper',
  
  // Proyectos
  'projects': 'project',
  'phases': 'phase',
  'facades': 'facade',
  
  // Prototipos y Unidades
  'prototipes': 'prototype', // Nota: mantiene el typo de la BD
  'sub_prototypes': 'subPrototype',
  'units': 'unit',
  
  // Finanzas
  'payment_methods': 'paymentMethod',
  'payment_entities': 'paymentEntity',
  'deposits': 'deposit',
  'movement_methods': 'movementMethod',
  
  // Transacciones
  'quotations': 'quotation',
  'transactions': 'transaction',
  'movements': 'movement',
  'promissories': 'promissory',
  'references': 'reference',
};

// Configuración de todas las tablas RAMP
export const RAMP_TABLES_CONFIG: TableConfig[] = [
  // ========== NIVEL 1: CATÁLOGOS (Sin dependencias) ==========
  {
    tableName: 'marital_statuses',
    displayName: 'Estados Civiles',
    categoria: 'Catálogos',
    icono: '👥',
    color: '#6B7280',
    primaryKey: 'id',
    timestampField: 'updated_at',
    dependencies: [],
    priority: 1,
    batchSize: 1000,
    enabled: true,
    prismaModel: 'maritalStatus'
  },
  {
    tableName: 'marital_registries',
    displayName: 'Registros Civiles',
    categoria: 'Catálogos',
    icono: '📋',
    color: '#6B7280',
    primaryKey: 'id',
    timestampField: 'updated_at',
    dependencies: [],
    priority: 1,
    batchSize: 1000,
    enabled: true,
    prismaModel: 'maritalRegistry'
  },
  {
    tableName: 'marital_regimen',
    displayName: 'Régimen Matrimonial',
    categoria: 'Catálogos',
    icono: '📜',
    color: '#6B7280',
    primaryKey: 'id',
    timestampField: 'updated_at',
    dependencies: [],
    priority: 1,
    batchSize: 1000,
    enabled: true,
    prismaModel: 'maritalRegimen'
  },
  {
    tableName: 'client_statuses',
    displayName: 'Estados de Cliente',
    categoria: 'Catálogos',
    icono: '🏷️',
    color: '#6B7280',
    primaryKey: 'id',
    timestampField: 'updated_at',
    dependencies: [],
    priority: 1,
    batchSize: 1000,
    enabled: true,
    prismaModel: 'clientStatus'
  },
  {
    tableName: 'project_statuses',
    displayName: 'Estados de Proyecto',
    categoria: 'Catálogos',
    icono: '🏗️',
    color: '#6B7280',
    primaryKey: 'id',
    timestampField: 'updated_at',
    dependencies: [],
    priority: 1,
    batchSize: 1000,
    enabled: true,
    prismaModel: 'projectStatus'
  },
  {
    tableName: 'phase_statuses',
    displayName: 'Estados de Fase',
    categoria: 'Catálogos',
    icono: '📊',
    color: '#6B7280',
    primaryKey: 'id',
    timestampField: 'updated_at',
    dependencies: [],
    priority: 1,
    batchSize: 1000,
    enabled: true,
    prismaModel: 'phaseStatus'
  },
  {
    tableName: 'quotation_statuses',
    displayName: 'Estados de Cotización',
    categoria: 'Catálogos',
    icono: '💰',
    color: '#6B7280',
    primaryKey: 'id',
    timestampField: 'updated_at',
    dependencies: [],
    priority: 1,
    batchSize: 1000,
    enabled: true,
    prismaModel: 'quotationStatus'
  },
  {
    tableName: 'promise_types',
    displayName: 'Tipos de Pagaré',
    categoria: 'Catálogos',
    icono: '📄',
    color: '#6B7280',
    primaryKey: 'id',
    timestampField: 'updated_at',
    dependencies: [],
    priority: 1,
    batchSize: 1000,
    enabled: true,
    prismaModel: 'promiseType'
  },
  {
  tableName: 'transaction_statuses',
  displayName: 'Estados de Transacción',
  categoria: 'Catálogos',
  icono: '📄',
  color: '#6B7280',
  primaryKey: 'id',
  timestampField: 'updated_at',
  dependencies: [],
  priority: 1,
  batchSize: 1000,
  enabled: true,
  prismaModel: 'transactionStatus',
  },
  {
  tableName: 'operates',
  displayName: 'Fase de operación',
  categoria: 'Catálogos',
  icono: '📄',
  color: '#6B7280',
  primaryKey: 'id',
  timestampField: 'updated_at',
  dependencies: [],
  priority: 1,
  batchSize: 1000,
  enabled: true,
  prismaModel: 'operates',
  },

  // ========== NIVEL 2: ENTIDADES BASE ==========
  {
    tableName: 'developers',
    displayName: 'Desarrolladores',
    categoria: 'Proyectos',
    icono: '🏢',
    color: '#3B82F6',
    primaryKey: 'id',
    timestampField: 'updated_at',
    dependencies: [],
    priority: 2,
    batchSize: 500,
    enabled: true,
    prismaModel: 'developer'
  },
  {
    tableName: 'coordinators',
    displayName: 'Coordinadores',
    categoria: 'Agentes',
    icono: '👔',
    color: '#10B981',
    primaryKey: 'id',
    timestampField: 'updated_at',
    dependencies: [],
    priority: 2,
    batchSize: 500,
    enabled: true,
    prismaModel: 'coordinator'
  },
  {
    tableName: 'beneficiaries',
    displayName: 'Beneficiarios',
    categoria: 'Clientes',
    icono: '👤',
    color: '#8B5CF6',
    primaryKey: 'id',
    timestampField: 'updated_at',
    dependencies: [],
    priority: 2,
    batchSize: 1000,
    enabled: true,
    prismaModel: 'beneficiary'
  },
  
  // ========== NIVEL 3: PROYECTOS Y AGENCIAS ==========
  {
    tableName: 'projects',
    displayName: 'Proyectos',
    categoria: 'Proyectos',
    icono: '🏗️',
    color: '#3B82F6',
    primaryKey: 'id',
    timestampField: 'updated_at',
    dependencies: ['project_statuses'],
    priority: 3,
    batchSize: 100,
    enabled: true,
    prismaModel: 'project'
  },
  {
    tableName: 'agencies',
    displayName: 'Agencias',
    categoria: 'Agentes',
    icono: '🏢',
    color: '#10B981',
    primaryKey: 'id',
    timestampField: 'updated_at',
    dependencies: ['coordinators'],
    priority: 3,
    batchSize: 500,
    enabled: true,
    prismaModel: 'agency'
  },

  // ========== NIVEL 4: ENTIDADES DEPENDIENTES ==========
  {
    tableName: 'sub_developers',
    displayName: 'Sub-Desarrolladores',
    categoria: 'Proyectos',
    icono: '🏘️',
    color: '#3B82F6',
    primaryKey: 'id',
    timestampField: 'updated_at',
    dependencies: ['developers', 'projects'],
    priority: 4,
    batchSize: 500,
    enabled: true,
    prismaModel: 'subDeveloper'
  },
  {
    tableName: 'agents',
    displayName: 'Agentes',
    categoria: 'Agentes',
    icono: '👨‍💼',
    color: '#10B981',
    primaryKey: 'id',
    timestampField: 'updated_at',
    dependencies: ['agencies', 'coordinators'],
    priority: 4,
    batchSize: 1000,
    enabled: true,
    prismaModel: 'agent'
  },
  {
    tableName: 'phases',
    displayName: 'Fases',
    categoria: 'Proyectos',
    icono: '📈',
    color: '#3B82F6',
    primaryKey: 'id',
    timestampField: 'updated_at',
    dependencies: ['projects', 'phase_statuses'],
    priority: 4,
    batchSize: 500,
    enabled: true,
    prismaModel: 'phase'
  },
  {
    tableName: 'facades',
    displayName: 'Fachadas',
    categoria: 'Proyectos',
    icono: '🏠',
    color: '#3B82F6',
    primaryKey: 'id',
    timestampField: 'updated_at',
    dependencies: ['projects'],
    priority: 4,
    batchSize: 500,
    enabled: true,
    prismaModel: 'facade'
  },
  {
    tableName: 'payment_methods',
    displayName: 'Métodos de Pago',
    categoria: 'Finanzas',
    icono: '💳',
    color: '#F59E0B',
    primaryKey: 'id',
    timestampField: 'updated_at',
    dependencies: ['projects'],
    priority: 4,
    batchSize: 500,
    enabled: true,
    prismaModel: 'paymentMethod'
  },
  {
    tableName: 'deposits',
    displayName: 'Depósitos',
    categoria: 'Finanzas',
    icono: '💵',
    color: '#F59E0B',
    primaryKey: 'id',
    timestampField: 'updated_at',
    dependencies: ['projects'],
    priority: 4,
    batchSize: 5000000,
    enabled: true,
    prismaModel: 'deposit'
  },
  {
    tableName: 'movement_methods',
    displayName: 'Métodos de Movimiento',
    categoria: 'Finanzas',
    icono: '🔄',
    color: '#F59E0B',
    primaryKey: 'id',
    timestampField: 'updated_at',
    dependencies: ['agencies'],
    priority: 4,
    batchSize: 500,
    enabled: true,
    prismaModel: 'movementMethod'
  },

  // ========== NIVEL 5: PROTOTIPOS Y CLIENTES (ya existe) ==========
  {
    tableName: 'prototipes', // Nota: mantiene el typo de la BD
    displayName: 'Prototipos',
    categoria: 'Unidades',
    icono: '📐',
    color: '#EC4899',
    primaryKey: 'id',
    timestampField: 'updated_at',
    dependencies: ['projects'],
    priority: 5,
    batchSize: 5000,
    enabled: true,
    prismaModel: 'prototype'
  },
  // clients ya existe en tu webhook_configs, no lo incluimos aquí
  {
    tableName: 'payment_entities',
    displayName: 'Entidades de Pago',
    categoria: 'Finanzas',
    icono: '🏦',
    color: '#F59E0B',
    primaryKey: 'id',
    timestampField: 'updated_at',
    dependencies: ['payment_methods'],
    priority: 5,
    batchSize: 500,
    enabled: true,
    prismaModel: 'paymentEntity'
  },

  // ========== NIVEL 6: SUB-PROTOTIPOS Y REFERENCIAS ==========
  {
    tableName: 'sub_prototypes',
    displayName: 'Sub-Prototipos',
    categoria: 'Unidades',
    icono: '📏',
    color: '#EC4899',
    primaryKey: 'id',
    timestampField: 'updated_at',
    dependencies: ['prototipes', 'projects'],
    priority: 6,
    batchSize: 5000,
    enabled: true,
    prismaModel: 'subPrototype'
  },
  {
    tableName: 'client_references',
    displayName: 'Referencias de Clientes',
    categoria: 'Clientes',
    icono: '📞',
    color: '#8B5CF6',
    primaryKey: 'id',
    timestampField: 'updated_at',
    dependencies: ['clients'],
    priority: 6,
    batchSize: 100000,
    enabled: true,
    prismaModel: 'clientReference'
  },

  // ========== NIVEL 7: UNIDADES ==========
  {
    tableName: 'units',
    displayName: 'Unidades',
    categoria: 'Unidades',
    icono: '🏘️',
    color: '#EC4899',
    primaryKey: 'id',
    timestampField: 'updated_at',
    dependencies: ['prototipes', 'phases', 'projects', 'facades', 'sub_prototypes'],
    priority: 7,
    batchSize: 50000,
    enabled: true,
    prismaModel: 'unit'
  },

  // ========== NIVEL 8: COTIZACIONES Y TRANSACCIONES ==========
  {
    tableName: 'quotations',
    displayName: 'Cotizaciones',
    categoria: 'Ventas',
    icono: '📑',
    color: '#06B6D4',
    primaryKey: 'id',
    timestampField: 'updated_at',
    dependencies: [
      'units', 'sub_prototypes', 'prototipes', 'projects', 
      'agencies', 'agents', 'payment_methods', 'payment_entities', 
      'clients', 'quotation_statuses'
    ],
    priority: 8,
    batchSize: 500000,
    enabled: true,
    prismaModel: 'quotation'
  },
  {
    tableName: 'transactions',
    displayName: 'Transacciones',
    categoria: 'Ventas',
    icono: '💸',
    color: '#06B6D4',
    primaryKey: 'id',
    timestampField: 'updated_at',
    dependencies: [
      'units', 'clients', 'payment_entities', 'payment_methods', 
      'projects', 'quotations', 'prototipes', 'sub_prototypes'
    ],
    priority: 8,
    batchSize: 500000,
    enabled: true,
    prismaModel: 'transaction'
  },

  // ========== NIVEL 9: REFERENCIAS Y MOVIMIENTOS ==========
  {
    tableName: 'references',
    displayName: 'Referencias',
    categoria: 'Finanzas',
    icono: '🔖',
    color: '#F59E0B',
    primaryKey: 'id',
    timestampField: 'updated_at',
    dependencies: ['projects', 'quotations'],
    priority: 9,
    batchSize: 10000,
    enabled: true,
    prismaModel: 'reference'
  },
  {
    tableName: 'movements',
    displayName: 'Movimientos',
    categoria: 'Finanzas',
    icono: '💱',
    color: '#F59E0B',
    primaryKey: 'id',
    timestampField: 'updated_at',
    dependencies: ['transactions'],
    priority: 9,
    batchSize: 500000,
    enabled: true,
    prismaModel: 'movement'
  },
  {
    tableName: 'promissories',
    displayName: 'Pagarés',
    categoria: 'Finanzas',
    icono: '📋',
    color: '#F59E0B',
    primaryKey: 'id',
    timestampField: 'updated_at',
    dependencies: ['transactions', 'promise_types'],
    priority: 9,
    batchSize: 900000,
    enabled: true,
    prismaModel: 'promissory'
  },
];

// Función helper para obtener configuración de una tabla
export function getTableConfig(tableName: string): TableConfig | undefined {
  return RAMP_TABLES_CONFIG.find(t => t.tableName === tableName);
}

// Función para obtener tablas por prioridad
export function getTablesByPriority(): Map<number, TableConfig[]> {
  const grouped = new Map<number, TableConfig[]>();
  
  RAMP_TABLES_CONFIG.forEach(table => {
    if (!grouped.has(table.priority)) {
      grouped.set(table.priority, []);
    }
    grouped.get(table.priority)!.push(table);
  });
  
  return grouped;
}

// Función para obtener tablas por categoría
export function getTablesByCategory(): Map<string, TableConfig[]> {
  const grouped = new Map<string, TableConfig[]>();
  
  RAMP_TABLES_CONFIG.forEach(table => {
    if (!grouped.has(table.categoria)) {
      grouped.set(table.categoria, []);
    }
    grouped.get(table.categoria)!.push(table);
  });
  
  return grouped;
}

// Función para verificar si se pueden sincronizar las dependencias
export function canSyncTable(tableName: string, syncedTables: Set<string>): boolean {
  const config = getTableConfig(tableName);
  if (!config) return false;
  
  // Verificar que todas las dependencias estén sincronizadas
  return config.dependencies.every(dep => syncedTables.has(dep));
}

// Función para obtener el orden de sincronización respetando dependencias
export function getSyncOrder(): string[] {
  const order: string[] = [];
  const tablesByPriority = getTablesByPriority();
  const priorities = Array.from(tablesByPriority.keys()).sort((a, b) => a - b);
  
  priorities.forEach(priority => {
    const tables = tablesByPriority.get(priority) || [];
    tables.forEach(table => {
      order.push(table.tableName);
    });
  });
  
  return order;
}