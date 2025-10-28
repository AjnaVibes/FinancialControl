// src/services/sync/syncOrchestrator.ts

import { directSyncService } from './directSyncService';
import { 
  RAMP_TABLES_CONFIG, 
  getTableConfig, 
  getTablesByPriority, 
  canSyncTable,
  getSyncOrder 
} from '@/config/sync-tables.config';
import { prisma } from '@/lib/prisma';

interface OrchestratorOptions {
  type?: 'incremental' | 'full';
  force?: boolean;
  tables?: string[];  // Si se especifica, solo sincronizar estas tablas
  category?: string;  // Si se especifica, sincronizar solo esta categoría
  skipDependencies?: boolean; // Si true, ignora verificación de dependencias
  parallel?: boolean; // Si true, sincroniza tablas del mismo nivel en paralelo
  maxParallel?: number; // Máximo de tablas sincronizando en paralelo
}

interface OrchestratorResult {
  success: boolean;
  totalTables: number;
  successfulTables: number;
  failedTables: number;
  totalRecords: number;
  totalInserted: number;
  totalUpdated: number;
  totalErrors: number;
  duration: number;
  details: TableSyncResult[];
}

interface TableSyncResult {
  table: string;
  success: boolean;
  recordsProcessed: number;
  recordsInserted: number;
  recordsUpdated: number;
  errors: number;
  duration: number;
  error?: string;
}

export class SyncOrchestrator {
  private syncedTables: Set<string> = new Set();
  private failedTables: Set<string> = new Set();

  /**
   * Sincronizar múltiples tablas respetando dependencias
   */
  async syncMultipleTables(options: OrchestratorOptions = {}): Promise<OrchestratorResult> {
    const startTime = Date.now();
    const {
      type = 'incremental',
      force = false,
      tables,
      category,
      skipDependencies = false,
      parallel = true,
      maxParallel = 3
    } = options;

    console.log('🚀 Iniciando orquestación de sincronización');
    console.log(`   Tipo: ${type}`);
    console.log(`   Forzar: ${force}`);
    console.log(`   Paralelo: ${parallel} (max: ${maxParallel})`);
    
    const result: OrchestratorResult = {
      success: true,
      totalTables: 0,
      successfulTables: 0,
      failedTables: 0,
      totalRecords: 0,
      totalInserted: 0,
      totalUpdated: 0,
      totalErrors: 0,
      duration: 0,
      details: []
    };

    try {
      // Determinar qué tablas sincronizar
      let tablesToSync: string[] = [];

      if (tables && tables.length > 0) {
        // Tablas específicas
        tablesToSync = tables;
        console.log(`📋 Sincronizando tablas específicas: ${tablesToSync.join(', ')}`);
      } else if (category) {
        // Por categoría
        const configs = RAMP_TABLES_CONFIG.filter(t => t.categoria === category);
        tablesToSync = configs.map(c => c.tableName);
        console.log(`📂 Sincronizando categoría ${category}: ${tablesToSync.length} tablas`);
      } else {
        // Todas las tablas en orden
        tablesToSync = getSyncOrder();
        // Excluir 'clients' si ya existe (ya lo tienen)
        const existingTables = await this.getExistingSyncedTables();
        if (existingTables.includes('clients')) {
          tablesToSync = tablesToSync.filter(t => t !== 'clients');
        }
        console.log(`📊 Sincronizando todas las tablas: ${tablesToSync.length} tablas`);
      }

      result.totalTables = tablesToSync.length;

      // Si no se saltan dependencias, verificar primero
      if (!skipDependencies && !force) {
        await this.loadSyncedTables();
      }

      // Agrupar por prioridad
      const tablesByPriority = new Map<number, string[]>();
      for (const tableName of tablesToSync) {
        const config = getTableConfig(tableName);
        if (!config) continue;
        
        if (!tablesByPriority.has(config.priority)) {
          tablesByPriority.set(config.priority, []);
        }
        tablesByPriority.get(config.priority)!.push(tableName);
      }

      // Sincronizar por niveles de prioridad
      const priorities = Array.from(tablesByPriority.keys()).sort((a, b) => a - b);
      
      for (const priority of priorities) {
        const tablesAtLevel = tablesByPriority.get(priority) || [];
        console.log(`\n📈 Sincronizando nivel de prioridad ${priority}: ${tablesAtLevel.length} tablas`);

        if (parallel && tablesAtLevel.length > 1) {
          // Sincronización en paralelo
          await this.syncTablesInParallel(tablesAtLevel, type, maxParallel, result, skipDependencies);
        } else {
          // Sincronización secuencial
          for (const tableName of tablesAtLevel) {
            await this.syncSingleTable(tableName, type, result, skipDependencies);
          }
        }
      }

      result.duration = Date.now() - startTime;
      result.success = result.failedTables === 0;

      // Resumen
      console.log('\n' + '='.repeat(60));
      console.log('📊 RESUMEN DE SINCRONIZACIÓN');
      console.log('='.repeat(60));
      console.log(`✅ Exitosas: ${result.successfulTables}/${result.totalTables}`);
      console.log(`❌ Fallidas: ${result.failedTables}/${result.totalTables}`);
      console.log(`📝 Total registros procesados: ${result.totalRecords}`);
      console.log(`➕ Insertados: ${result.totalInserted}`);
      console.log(`🔄 Actualizados: ${result.totalUpdated}`);
      console.log(`⚠️  Errores: ${result.totalErrors}`);
      console.log(`⏱️  Duración total: ${(result.duration / 1000).toFixed(2)}s`);
      console.log('='.repeat(60));

      // Mostrar tablas fallidas si las hay
      if (this.failedTables.size > 0) {
        console.log('\n❌ Tablas con errores:');
        this.failedTables.forEach(table => {
          const detail = result.details.find(d => d.table === table);
          console.log(`   - ${table}: ${detail?.error || 'Error desconocido'}`);
        });
      }

      return result;

    } catch (error) {
      console.error('❌ Error en orquestación:', error);
      result.success = false;
      result.duration = Date.now() - startTime;
      throw error;
    }
  }

  /**
   * Sincronizar una sola tabla
   */
  private async syncSingleTable(
    tableName: string, 
    type: 'incremental' | 'full',
    result: OrchestratorResult,
    skipDependencies: boolean
  ): Promise<void> {
    const tableResult: TableSyncResult = {
      table: tableName,
      success: false,
      recordsProcessed: 0,
      recordsInserted: 0,
      recordsUpdated: 0,
      errors: 0,
      duration: 0
    };

    try {
      // Verificar dependencias
      if (!skipDependencies && !this.canSyncTable(tableName)) {
        const config = getTableConfig(tableName);
        const missingDeps = config?.dependencies.filter(dep => !this.syncedTables.has(dep)) || [];
        throw new Error(`Dependencias faltantes: ${missingDeps.join(', ')}`);
      }

      console.log(`\n🔄 Sincronizando ${tableName}...`);
      
      // Obtener última sincronización para modo incremental
      let lastSync: Date | undefined;
      if (type === 'incremental') {
        const webhookConfig = await prisma.webhookConfig.findUnique({
          where: { tabla: tableName }
        });
        lastSync = webhookConfig?.lastSyncAt || undefined;
      }

      // CORRECCIÓN: Usar el método syncTable que sí existe
      const syncResult = await directSyncService.syncTable(
        tableName,
        type,
        lastSync
      );

      tableResult.success = syncResult.success;
      tableResult.recordsProcessed = syncResult.recordsProcessed;
      tableResult.recordsInserted = syncResult.recordsInserted;
      tableResult.recordsUpdated = syncResult.recordsUpdated;
      tableResult.errors = syncResult.errors;
      tableResult.duration = syncResult.duration;

      if (syncResult.success) {
        this.syncedTables.add(tableName);
        result.successfulTables++;
        console.log(`✅ ${tableName}: ${syncResult.recordsInserted} insertados, ${syncResult.recordsUpdated} actualizados`);
      } else {
        this.failedTables.add(tableName);
        result.failedTables++;
        console.log(`❌ ${tableName}: Sincronización fallida - ${syncResult.errors} errores`);
      }

      // Actualizar totales
      result.totalRecords += syncResult.recordsProcessed;
      result.totalInserted += syncResult.recordsInserted;
      result.totalUpdated += syncResult.recordsUpdated;
      result.totalErrors += syncResult.errors;

    } catch (error) {
      tableResult.success = false;
      tableResult.error = error instanceof Error ? error.message : String(error);
      this.failedTables.add(tableName);
      result.failedTables++;
      console.error(`❌ Error sincronizando ${tableName}:`, error);
    }

    result.details.push(tableResult);
  }

  /**
   * Sincronizar múltiples tablas en paralelo
   */
  private async syncTablesInParallel(
    tables: string[],
    type: 'incremental' | 'full',
    maxParallel: number,
    result: OrchestratorResult,
    skipDependencies: boolean
  ): Promise<void> {
    console.log(`🔀 Sincronizando ${tables.length} tablas en paralelo (max: ${maxParallel})`);

    // Dividir en lotes según maxParallel
    for (let i = 0; i < tables.length; i += maxParallel) {
      const batch = tables.slice(i, i + maxParallel);
      
      const promises = batch.map(tableName => 
        this.syncSingleTable(tableName, type, result, skipDependencies)
      );

      await Promise.allSettled(promises);
    }
  }

  /**
   * Verificar si una tabla puede ser sincronizada
   */
  private canSyncTable(tableName: string): boolean {
    const config = getTableConfig(tableName);
    if (!config) return false;

    return config.dependencies.every(dep => this.syncedTables.has(dep));
  }

  /**
   * Cargar tablas ya sincronizadas desde la BD
   */
  private async loadSyncedTables(): Promise<void> {
    const configs = await prisma.webhookConfig.findMany({
      where: {
        lastSyncAt: { not: null }
      },
      select: { tabla: true }
    });

    this.syncedTables = new Set(configs.map(c => c.tabla));
    console.log(`📌 Tablas ya sincronizadas: ${this.syncedTables.size}`);
  }

  /**
   * Obtener lista de tablas ya sincronizadas
   */
  private async getExistingSyncedTables(): Promise<string[]> {
    const configs = await prisma.webhookConfig.findMany({
      where: {
        lastSyncAt: { not: null }
      },
      select: { tabla: true }
    });

    return configs.map(c => c.tabla);
  }

  /**
   * Sincronizar por categoría
   */
  async syncByCategory(category: string, options: Omit<OrchestratorOptions, 'category'> = {}) {
    return this.syncMultipleTables({ ...options, category });
  }

  /**
   * Sincronizar todas las tablas RAMP
   */
  async syncAll(options: Omit<OrchestratorOptions, 'tables' | 'category'> = {}) {
    return this.syncMultipleTables(options);
  }

  /**
   * Obtener estado de sincronización global
   */
  async getGlobalStatus() {
    const configs = await prisma.webhookConfig.findMany({
      orderBy: [
        { categoria: 'asc' },
        { tabla: 'asc' }
      ]
    });

    const byCategory = new Map<string, any[]>();
    let totalSynced = 0;
    let totalPending = 0;
    let totalErrors = 0;

    configs.forEach(config => {
      if (!byCategory.has(config.categoria)) {
        byCategory.set(config.categoria, []);
      }

      const status = {
        tabla: config.tabla,
        nombre: config.nombre,
        icono: config.icono,
        color: config.color,
        lastSync: config.lastSyncAt,
        isEnabled: config.isEnabled,
        totalSyncs: config.totalSyncs,
        successRate: config.totalSyncs > 0 
          ? Math.round((config.successSyncs / config.totalSyncs) * 100)
          : 0,
        hasError: !!config.lastError,
        lastError: config.lastError
      };

      byCategory.get(config.categoria)!.push(status);

      if (config.lastSyncAt) {
        totalSynced++;
      } else {
        totalPending++;
      }

      if (config.lastError) {
        totalErrors++;
      }
    });

    return {
      summary: {
        total: configs.length,
        synced: totalSynced,
        pending: totalPending,
        withErrors: totalErrors,
        syncedPercentage: Math.round((totalSynced / configs.length) * 100)
      },
      byCategory: Object.fromEntries(byCategory),
      recentErrors: configs
        .filter(c => c.lastError)
        .map(c => ({
          tabla: c.tabla,
          nombre: c.nombre,
          error: c.lastError,
          lastAttempt: c.updatedAt
        }))
    };
  }

  /**
   * Reintentar tablas fallidas
   */
  async retryFailed(options: OrchestratorOptions = {}) {
    const failedConfigs = await prisma.webhookConfig.findMany({
      where: {
        lastError: { not: null }
      },
      select: { tabla: true }
    });

    if (failedConfigs.length === 0) {
      console.log('✅ No hay tablas con errores para reintentar');
      return null;
    }

    const tablesToRetry = failedConfigs.map(c => c.tabla);
    console.log(`🔄 Reintentando ${tablesToRetry.length} tablas con errores...`);
    
    return this.syncMultipleTables({ 
      ...options, 
      tables: tablesToRetry,
      skipDependencies: true // Las dependencias ya deberían estar sincronizadas
    });
  }
}

export const syncOrchestrator = new SyncOrchestrator();