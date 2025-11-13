// scripts/reset-and-resync
// Script MEJORADO para VACIAR tablas y resincronizar desde RAMP
// Versión 2.0 con LOGGING DETALLADO

import { prisma } from '@/lib/prisma';
import { syncService } from '@/services/sync/directSyncService';
import * as fs from 'fs';
import * as path from 'path';

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Configuración de logging
const LOG_DIR = './logs';
const LOG_FILE = path.join(LOG_DIR, `reset-sync-${new Date().toISOString().split('T')[0]}.log`);

// Asegurar que existe el directorio de logs
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

// Orden correcto de eliminación (de DEPENDIENTE a INDEPENDIENTE)
const DELETION_ORDER = [
  'promissories',
  'movements',
  'references',
  'transactions',
  'quotations',
  'units',
  'sub_prototypes',
  'prototipes',
  'phases',
  'facades',
  'deposits',
  'payment_entities',
  'payment_methods',
  'client_references',
  'beneficiaries',
  'clients',
  'agents',
  'coordinators',
  'agencies',
  'projects',
  'developers',
  'sub_developers',
  'operates',
  'transaction_statuses',
  'promise_types',
  'quotation_statuses',
  'phase_statuses',
  'project_statuses',
  'client_statuses',
  'marital_regimen',
  'marital_registries',
  'marital_statuses',
];

// Orden de sincronización (inverso al de eliminación)
const SYNC_ORDER = [
  'marital_statuses',
  'marital_registries',
  'marital_regimen',
  'client_statuses',
  'project_statuses',
  'phase_statuses',
  'quotation_statuses',
  'promise_types',
  'transaction_statuses',
  'operates',
  'developers',
  'sub_developers',
  'projects',
  'agencies',
  'coordinators',
  'agents',
  'clients',
  'beneficiaries',
  'client_references',
  'payment_methods',
  'payment_entities',
  'deposits',
  'facades',
  'phases',
  'prototipes',
  'sub_prototypes',
  'units',
  'quotations',
  'transactions',
  'references',
  'movements',
  'promissories',
];

interface DetailedError {
  table: string;
  phase: 'deletion' | 'sync';
  error: string;
  timestamp: Date;
  recordsAffected?: number;
  additionalInfo?: any;
}

interface ResetStats {
  tablesCleared: number;
  recordsDeleted: number;
  errors: DetailedError[];
  duration: number;
}

interface SyncStats {
  tablesSynced: number;
  recordsInserted: number;
  recordsUpdated: number;
  recordsSkipped: number;
  totalErrors: number;
  errors: DetailedError[];
  duration: number;
}

// Logger mejorado
class Logger {
  private logStream: fs.WriteStream;

  constructor() {
    this.logStream = fs.createWriteStream(LOG_FILE, { flags: 'a' });
    this.log('='.repeat(80));
    this.log(`INICIO DE RESET Y RESINCRONIZACIÓN - ${new Date().toISOString()}`);
    this.log('='.repeat(80));
  }

  private formatMessage(level: string, message: string, color?: string): string {
    const timestamp = new Date().toISOString();
    const colorCode = color || colors.reset;
    return `${colorCode}[${timestamp}] [${level}] ${message}${colors.reset}`;
  }

  log(message: string, toFile = true) {
    console.log(message);
    if (toFile) {
      this.logStream.write(`${message}\n`);
    }
  }

  info(message: string) {
    const formatted = this.formatMessage('INFO', message, colors.blue);
    console.log(formatted);
    this.logStream.write(`[INFO] ${message}\n`);
  }

  success(message: string) {
    const formatted = this.formatMessage('SUCCESS', message, colors.green);
    console.log(formatted);
    this.logStream.write(`[SUCCESS] ${message}\n`);
  }

  warning(message: string) {
    const formatted = this.formatMessage('WARNING', message, colors.yellow);
    console.log(formatted);
    this.logStream.write(`[WARNING] ${message}\n`);
  }

  error(message: string, error?: any) {
    const formatted = this.formatMessage('ERROR', message, colors.red);
    console.log(formatted);
    this.logStream.write(`[ERROR] ${message}\n`);
    if (error) {
      const errorDetails = typeof error === 'string' ? error : JSON.stringify(error, null, 2);
      this.logStream.write(`  Details: ${errorDetails}\n`);
      if (error.stack) {
        this.logStream.write(`  Stack: ${error.stack}\n`);
      }
    }
  }

  progress(current: number, total: number, item: string) {
    const percentage = ((current / total) * 100).toFixed(1);
    const barLength = 30;
    const filled = Math.round((current / total) * barLength);
    const bar = '█'.repeat(filled) + '░'.repeat(barLength - filled);
    
    const message = `${colors.cyan}[${current}/${total}] ${bar} ${percentage}% - ${item}${colors.reset}`;
    process.stdout.write(`\r${message}`);
    
    if (current === total) {
      console.log(''); // Nueva línea al completar
    }
  }

  section(title: string) {
    const line = '='.repeat(60);
    this.log('');
    this.log(`${colors.bright}${colors.magenta}${line}${colors.reset}`);
    this.log(`${colors.bright}${colors.magenta}${title}${colors.reset}`);
    this.log(`${colors.bright}${colors.magenta}${line}${colors.reset}`);
    this.log('');
  }

  close() {
    this.log('='.repeat(80));
    this.log(`FIN - ${new Date().toISOString()}`);
    this.log('='.repeat(80));
    this.logStream.end();
  }
}

const logger = new Logger();

async function clearAllTables(): Promise<ResetStats> {
  logger.section('FASE 1: VACIADO DE TABLAS');
  
  const stats: ResetStats = {
    tablesCleared: 0,
    recordsDeleted: 0,
    errors: [],
    duration: 0
  };

  const startTime = Date.now();

  logger.info('Desactivando foreign key checks...');
  await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 0;');

  for (let i = 0; i < DELETION_ORDER.length; i++) {
    const tableName = DELETION_ORDER[i];
    logger.progress(i + 1, DELETION_ORDER.length, tableName);

    try {
      const modelName = getModelName(tableName);
      const model = (prisma as any)[modelName];
      
      if (!model) {
        logger.warning(`Modelo no encontrado para tabla: ${tableName}`);
        continue;
      }

      // Contar registros antes
      const countBefore = await model.count();
      
      if (countBefore === 0) {
        logger.info(`  ✓ ${tableName}: Ya está vacía`);
        stats.tablesCleared++;
        continue;
      }

      // Eliminar todos los registros
      await model.deleteMany({});
      
      logger.success(`  ✓ ${tableName}: ${countBefore.toLocaleString()} registros eliminados`);
      stats.tablesCleared++;
      stats.recordsDeleted += countBefore;

      // Resetear auto-increment
      try {
        await prisma.$executeRawUnsafe(`ALTER TABLE \`${tableName}\` AUTO_INCREMENT = 1;`);
      } catch (error) {
        // Ignorar errores de auto-increment (algunas tablas usan cuid)
      }

    } catch (error: any) {
      logger.error(`  ✗ ${tableName}: ${error.message}`, error);
      stats.errors.push({
        table: tableName,
        phase: 'deletion',
        error: error.message,
        timestamp: new Date(),
        additionalInfo: error.stack
      });
    }
  }

  logger.info('Reactivando foreign key checks...');
  await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 1;');

  stats.duration = Date.now() - startTime;

  // Resumen de limpieza
  logger.section('RESUMEN DE FASE 1: VACIADO');
  logger.log(`  ✓ Tablas procesadas: ${stats.tablesCleared}/${DELETION_ORDER.length}`);
  logger.log(`  🗑️  Registros eliminados: ${stats.recordsDeleted.toLocaleString()}`);
  logger.log(`  ⏱️  Duración: ${(stats.duration / 1000).toFixed(2)}s`);
  
  if (stats.errors.length > 0) {
    logger.error(`  ✗ Errores encontrados: ${stats.errors.length}`);
    stats.errors.forEach(err => {
      logger.error(`    - ${err.table}: ${err.error}`);
    });
  } else {
    logger.success('  ✓ Sin errores');
  }

  return stats;
}

async function resyncAllTables(): Promise<SyncStats> {
  logger.section('FASE 2: RESINCRONIZACIÓN DESDE RAMP');
  
  const stats: SyncStats = {
    tablesSynced: 0,
    recordsInserted: 0,
    recordsUpdated: 0,
    recordsSkipped: 0,
    totalErrors: 0,
    errors: [],
    duration: 0
  };

  const startTime = Date.now();

  for (let i = 0; i < SYNC_ORDER.length; i++) {
    const tableName = SYNC_ORDER[i];
    logger.progress(i + 1, SYNC_ORDER.length, tableName);

    try {
      const syncStartTime = Date.now();
      const result = await syncService.syncTable({
  tableName,
  primaryKey: 'id',
  timestampField: 'updated_at',
  batchSize: 0
});
      const syncDuration = ((Date.now() - syncStartTime) / 1000).toFixed(2);

      // Determinar el ícono de estado
      let statusIcon = '✓';
      let statusColor = colors.green;
      
      if (result.errors > 0) {
        statusIcon = '⚠';
        statusColor = colors.yellow;
      }

      logger.log(`${statusColor}  ${statusIcon} ${tableName}:${colors.reset} ${result.recordsInserted} insertados, ${result.recordsUpdated} actualizados, ${result.errors} errores (${syncDuration}s)`);

      stats.tablesSynced++;
      stats.recordsInserted += result.recordsInserted;
      stats.recordsUpdated += result.recordsUpdated;
      stats.recordsSkipped += result.recordsSkipped;
      stats.totalErrors += result.errors;

      if (result.errors > 0) {
        // Registrar detalles de errores
        const errorDetails: DetailedError = {
          table: tableName,
          phase: 'sync',
          error: `${result.errors} errores durante sincronización`,
          timestamp: new Date(),
          recordsAffected: result.recordsProcessed,
          additionalInfo: result.errorDetails?.slice(0, 5) // Primeros 5 errores
        };
        stats.errors.push(errorDetails);

        // Log detallado de errores
        if (result.errorDetails && result.errorDetails.length > 0) {
          logger.warning(`    Primeros errores en ${tableName}:`);
          result.errorDetails.slice(0, 3).forEach((err: any, idx: number) => {
            logger.error(`      ${idx + 1}. Record ID ${err.record}: ${err.error}`);
          });
          if (result.errorDetails.length > 3) {
            logger.warning(`    ... y ${result.errorDetails.length - 3} errores más`);
          }
        }
      }

      // Actualizar webhook config
      await prisma.webhookConfig.update({
        where: { tabla: tableName },
        data: {
          lastSyncAt: new Date(),
          totalSyncs: { increment: 1 },
          successSyncs: result.errors === 0 ? { increment: 1 } : undefined,
          errorSyncs: result.errors > 0 ? { increment: 1 } : undefined,
        }
      }).catch(() => {
        // Ignorar si no existe el config
      });

    } catch (error: any) {
      logger.error(`  ✗ ${tableName}: FALLO COMPLETO - ${error.message}`, error);
      stats.errors.push({
        table: tableName,
        phase: 'sync',
        error: error.message,
        timestamp: new Date(),
        additionalInfo: error.stack
      });
    }
  }

  stats.duration = Date.now() - startTime;

  // Resumen de sincronización
  logger.section('RESUMEN DE FASE 2: SINCRONIZACIÓN');
  logger.log(`  ✓ Tablas sincronizadas: ${stats.tablesSynced}/${SYNC_ORDER.length}`);
  logger.log(`  📥 Registros insertados: ${stats.recordsInserted.toLocaleString()}`);
  logger.log(`  🔄 Registros actualizados: ${stats.recordsUpdated.toLocaleString()}`);
  logger.log(`  ⏭️  Registros omitidos: ${stats.recordsSkipped.toLocaleString()}`);
  logger.log(`  ⏱️  Duración: ${(stats.duration / 1000 / 60).toFixed(2)} minutos`);
  
  if (stats.totalErrors > 0) {
    logger.warning(`  ⚠️  Total de errores: ${stats.totalErrors}`);
    logger.warning(`  Tablas con errores: ${stats.errors.length}`);
    stats.errors.forEach(err => {
      logger.error(`    - ${err.table}: ${err.error}`);
    });
  } else {
    logger.success('  ✓ Sin errores');
  }

  return stats;
}

function getModelName(tableName: string): string {
  const map: Record<string, string> = {
    'marital_statuses': 'maritalStatus',
    'marital_registries': 'maritalRegistry',
    'marital_regimen': 'maritalRegimen',
    'client_statuses': 'clientStatus',
    'project_statuses': 'projectStatus',
    'phase_statuses': 'phaseStatus',
    'quotation_statuses': 'quotationStatus',
    'promise_types': 'promiseType',
    'transaction_statuses': 'transactionStatus',
    'operates': 'operate',
    'developers': 'developer',
    'sub_developers': 'subDeveloper',
    'projects': 'project',
    'agencies': 'agency',
    'coordinators': 'coordinator',
    'agents': 'agent',
    'clients': 'client',
    'beneficiaries': 'beneficiary',
    'client_references': 'clientReference',
    'payment_methods': 'paymentMethod',
    'payment_entities': 'paymentEntity',
    'deposits': 'deposit',
    'facades': 'facade',
    'phases': 'phase',
    'prototipes': 'prototype',
    'sub_prototypes': 'subPrototype',
    'units': 'unit',
    'quotations': 'quotation',
    'transactions': 'transaction',
    'references': 'reference',
    'movements': 'movement',
    'promissories': 'promissory',
  };

  return map[tableName] || tableName;
}

async function main() {
  logger.section('🔄 RESET Y RESINCRONIZACIÓN COMPLETA v2.0');
  
  logger.warning('⚠️  ADVERTENCIA:');
  logger.warning('    - Se eliminarán TODOS los datos sincronizados');
  logger.warning('    - Los IDs se resetearán');
  logger.warning('    - La sincronización puede tardar 10-20 minutos');
  logger.warning('    - Los datos en RAMP NO se verán afectados');
  logger.log('');
  logger.info(`📝 Log guardado en: ${LOG_FILE}`);
  logger.log('');
  logger.warning('⏸️  Presiona Ctrl+C en los próximos 10 segundos para cancelar...');
  logger.log('');

  await new Promise(resolve => setTimeout(resolve, 10000));

  const totalStartTime = Date.now();

  try {
    // FASE 1: Vaciar todas las tablas
    const resetStats = await clearAllTables();

    // Pausa breve entre fases
    await new Promise(resolve => setTimeout(resolve, 2000));

    // FASE 2: Resincronizar desde RAMP
    const syncStats = await resyncAllTables();

    // RESUMEN FINAL
    const totalDuration = Date.now() - totalStartTime;
    
    logger.section('🎉 PROCESO COMPLETADO');
    logger.log('');
    logger.info(`⏱️  DURACIÓN TOTAL: ${(totalDuration / 1000 / 60).toFixed(2)} minutos`);
    logger.log('');
    
    logger.log('📊 FASE 1 - LIMPIEZA:');
    logger.log(`   • Tablas vaciadas: ${resetStats.tablesCleared}`);
    logger.log(`   • Registros eliminados: ${resetStats.recordsDeleted.toLocaleString()}`);
    logger.log(`   • Errores: ${resetStats.errors.length}`);
    logger.log(`   • Duración: ${(resetStats.duration / 1000).toFixed(2)}s`);
    logger.log('');
    
    logger.log('📊 FASE 2 - SINCRONIZACIÓN:');
    logger.log(`   • Tablas sincronizadas: ${syncStats.tablesSynced}`);
    logger.log(`   • Registros insertados: ${syncStats.recordsInserted.toLocaleString()}`);
    logger.log(`   • Registros actualizados: ${syncStats.recordsUpdated.toLocaleString()}`);
    logger.log(`   • Total de errores: ${syncStats.totalErrors}`);
    logger.log(`   • Duración: ${(syncStats.duration / 1000 / 60).toFixed(2)} min`);
    logger.log('');
    
    const totalErrors = resetStats.errors.length + syncStats.errors.length;
    
    if (totalErrors > 0) {
      logger.warning(`⚠️  RESUMEN DE ERRORES (${totalErrors} tablas con problemas):`);
      logger.log('');
      
      if (resetStats.errors.length > 0) {
        logger.error('  ERRORES EN FASE DE LIMPIEZA:');
        resetStats.errors.forEach(err => {
          logger.error(`    • ${err.table}: ${err.error}`);
        });
        logger.log('');
      }
      
      if (syncStats.errors.length > 0) {
        logger.error('  ERRORES EN FASE DE SINCRONIZACIÓN:');
        syncStats.errors.forEach(err => {
          logger.error(`    • ${err.table}: ${err.error}`);
          if (err.additionalInfo && Array.isArray(err.additionalInfo)) {
            err.additionalInfo.forEach((detail: any, idx: number) => {
              logger.error(`      ${idx + 1}. ${detail.error}`);
            });
          }
        });
      }
      
      logger.log('');
      logger.warning(`📝 Revisa el log completo en: ${LOG_FILE}`);
      logger.warning('💡 Puedes intentar resincronizar las tablas con errores individualmente');
    } else {
      logger.success('✅ ¡PROCESO COMPLETADO SIN ERRORES!');
      logger.success('🎯 Todos los datos fueron sincronizados correctamente');
      logger.success('📊 Los IDs ahora coinciden perfectamente con RAMP');
    }

  } catch (error: any) {
    logger.error('❌ ERROR FATAL DURANTE EL PROCESO', error);
    logger.error(`Stack trace completo guardado en: ${LOG_FILE}`);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    logger.close();
    
    console.log('');
    console.log(`${colors.cyan}📝 Log completo guardado en: ${LOG_FILE}${colors.reset}`);
    console.log('');
  }
}

main();