// scripts/resync-single-table.ts
// Script para RESINCRONIZAR una tabla específica
// Uso: npx tsx scripts/resync-single-table.ts [nombre-tabla]

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
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

// Mapeo de tablas a modelos de Prisma
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

async function clearTable(tableName: string): Promise<number> {
  console.log(`\n${colors.yellow}🗑️  Limpiando tabla ${tableName}...${colors.reset}`);
  
  const modelName = getModelName(tableName);
  const model = (prisma as any)[modelName];
  
  if (!model) {
    throw new Error(`Modelo no encontrado para tabla: ${tableName} (modelo: ${modelName})`);
  }

  // Contar registros antes
  const countBefore = await model.count();
  console.log(`   Registros actuales: ${countBefore.toLocaleString()}`);
  
  if (countBefore === 0) {
    console.log(`${colors.blue}   ℹ️  La tabla ya está vacía${colors.reset}`);
    return 0;
  }

  // Desactivar foreign key checks temporalmente
  await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 0;');
  
  try {
    // Eliminar todos los registros
    await model.deleteMany({});
    
    // Resetear auto-increment
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE \`${tableName}\` AUTO_INCREMENT = 1;`);
    } catch (error) {
      // Ignorar errores de auto-increment
    }
    
    console.log(`${colors.green}   ✓ ${countBefore.toLocaleString()} registros eliminados${colors.reset}`);
    return countBefore;
    
  } finally {
    // Reactivar foreign key checks
    await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 1;');
  }
}

async function resyncTable(tableName: string): Promise<void> {
  console.log(`\n${colors.cyan}🔄 Sincronizando tabla ${tableName} desde RAMP...${colors.reset}\n`);
  
  const startTime = Date.now();
  
  try {
    const result = await syncService.syncTable({
      tableName,
      primaryKey: 'id',
      timestampField: 'updated_at',
      batchSize: 0
    });
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    console.log('\n' + '='.repeat(60));
    console.log(`${colors.bright}${colors.magenta}RESULTADO DE SINCRONIZACIÓN${colors.reset}`);
    console.log('='.repeat(60));
    
    if (result.success) {
      console.log(`${colors.green}✅ Sincronización completada exitosamente${colors.reset}`);
    } else {
      console.log(`${colors.yellow}⚠️  Sincronización completada con errores${colors.reset}`);
    }
    
    console.log(`\n📊 Estadísticas:`);
    console.log(`   • Registros procesados: ${result.recordsProcessed.toLocaleString()}`);
    console.log(`   • Registros insertados: ${colors.green}${result.recordsInserted.toLocaleString()}${colors.reset}`);
    console.log(`   • Registros actualizados: ${colors.blue}${result.recordsUpdated.toLocaleString()}${colors.reset}`);
    console.log(`   • Registros omitidos: ${result.recordsSkipped.toLocaleString()}`);
    console.log(`   • Errores: ${result.errors > 0 ? colors.red : colors.green}${result.errors}${colors.reset}`);
    console.log(`   • Duración: ${duration}s`);
    
    if (result.errors > 0 && result.errorDetails) {
      console.log(`\n${colors.red}❌ ERRORES ENCONTRADOS:${colors.reset}`);
      result.errorDetails.slice(0, 5).forEach((err: any, idx: number) => {
        console.log(`\n${colors.yellow}Error ${idx + 1}:${colors.reset}`);
        console.log(`   Record ID: ${err.record}`);
        console.log(`   Error: ${err.error}`);
        if (err.stack) {
          console.log(`   Stack: ${err.stack}`);
        }
      });
      
      if (result.errorDetails.length > 5) {
        console.log(`\n${colors.yellow}... y ${result.errorDetails.length - 5} errores más${colors.reset}`);
      }
      
      // Guardar errores en archivo
      const errorLogFile = path.join(LOG_DIR, `error-${tableName}-${new Date().toISOString().split('T')[0]}.json`);
      fs.writeFileSync(errorLogFile, JSON.stringify(result.errorDetails, null, 2));
      console.log(`\n${colors.blue}📝 Errores completos guardados en: ${errorLogFile}${colors.reset}`);
    }
    
    console.log('='.repeat(60));
    
  } catch (error: any) {
    console.error(`\n${colors.red}❌ ERROR FATAL durante la sincronización:${colors.reset}`);
    console.error(error.message);
    if (error.stack) {
      console.error(`\nStack trace:\n${error.stack}`);
    }
    throw error;
  }
}

async function main() {
  // Obtener nombre de tabla desde argumentos o usar 'clients' por defecto
  const tableName = process.argv[2] || 'clients';
  
  console.log('\n' + '='.repeat(60));
  console.log(`${colors.bright}${colors.cyan}RESINCRONIZACIÓN DE TABLA: ${tableName.toUpperCase()}${colors.reset}`);
  console.log('='.repeat(60));
  
  try {
    // Paso 1: Limpiar la tabla
    console.log(`\n${colors.bright}PASO 1: Limpieza de tabla${colors.reset}`);
    const deletedCount = await clearTable(tableName);
    
    // Paso 2: Resincronizar
    console.log(`\n${colors.bright}PASO 2: Resincronización desde RAMP${colors.reset}`);
    await resyncTable(tableName);
    
    // Resumen final
    console.log(`\n${colors.green}${colors.bright}✅ PROCESO COMPLETADO${colors.reset}`);
    console.log(`\n${colors.cyan}Tabla: ${tableName}${colors.reset}`);
    console.log(`${colors.cyan}Registros eliminados: ${deletedCount.toLocaleString()}${colors.reset}`);
    console.log(`${colors.cyan}Estado: Resincronizada con RAMP${colors.reset}\n`);
    
  } catch (error: any) {
    console.error(`\n${colors.red}${colors.bright}❌ PROCESO FALLIDO${colors.reset}`);
    console.error(`${colors.red}Error: ${error.message}${colors.reset}\n`);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Manejo de señales para cancelación
process.on('SIGINT', async () => {
  console.log(`\n\n${colors.yellow}⚠️  Proceso cancelado por el usuario${colors.reset}\n`);
  await prisma.$disconnect();
  process.exit(0);
});

main();