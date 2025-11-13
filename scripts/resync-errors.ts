// scripts/resync-errors.ts
// Script para re-sincronizar todas las tablas con errores

import { directSyncService } from '../src/services/sync/directSyncService';
import { prisma } from '../src/lib/prisma';
import { ventasDb } from '../src/lib/ventasDb';
import chalk from 'chalk';
import * as readline from 'readline';

const colors = {
  success: chalk.green,
  error: chalk.red,
  warning: chalk.yellow,
  info: chalk.blue,
  dim: chalk.gray
};

interface TableToSync {
  name: string;
  displayName: string;
  errorCount: number;
  priority: number;
}

// Tablas con errores ordenadas por prioridad
const TABLES_WITH_ERRORS: TableToSync[] = [
  // Primero las tablas sin dependencias o con dependencias mínimas
  { name: 'developers', displayName: 'Desarrolladores', errorCount: 2, priority: 1 },
  { name: 'agencies', displayName: 'Agencias', errorCount: 46, priority: 1 },
  { name: 'coordinators', displayName: 'Coordinadores', errorCount: 26, priority: 1 },
  { name: 'projects', displayName: 'Proyectos', errorCount: 12, priority: 2 },
  { name: 'agents', displayName: 'Agentes', errorCount: 860, priority: 2 },
  { name: 'movement_methods', displayName: 'Métodos de Movimiento', errorCount: 112, priority: 2 },
  
  // Luego las tablas de clientes
  { name: 'client_references', displayName: 'Referencias de Clientes', errorCount: 865, priority: 3 },
  { name: 'beneficiaries', displayName: 'Beneficiarios', errorCount: 378, priority: 3 },
  
  // Finalmente las tablas con más dependencias
  { name: 'references', displayName: 'Referencias', errorCount: 1000, priority: 4 },
  { name: 'movements', displayName: 'Movimientos', errorCount: 61, priority: 4 },
  { name: 'promissories', displayName: 'Pagarés', errorCount: 930, priority: 4 }
];

// Helper para leer input del usuario
function readInput(prompt: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(colors.info(prompt), (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function showMenu() {
  console.clear();
  console.log(colors.info('╔════════════════════════════════════════════════════╗'));
  console.log(colors.info('║     RE-SINCRONIZACIÓN DE TABLAS CON ERRORES       ║'));
  console.log(colors.info('╚════════════════════════════════════════════════════╝'));
  console.log();
  
  console.log(colors.warning('📋 TABLAS CON ERRORES DETECTADOS:'));
  console.log(colors.dim('─'.repeat(50)));
  
  let totalErrors = 0;
  TABLES_WITH_ERRORS.forEach((table, index) => {
    const errorColor = table.errorCount > 500 ? colors.error : 
                       table.errorCount > 100 ? colors.warning : 
                       colors.info;
    console.log(`${index + 1}. ${table.displayName} (${table.name}): ${errorColor(table.errorCount + ' errores')}`);
    totalErrors += table.errorCount;
  });
  
  console.log(colors.dim('─'.repeat(50)));
  console.log(colors.error(`TOTAL: ${totalErrors} errores en ${TABLES_WITH_ERRORS.length} tablas`));
  console.log();
  
  console.log(colors.info('OPCIONES:'));
  console.log('1. Re-sincronizar TODAS las tablas con errores (orden optimizado)');
  console.log('2. Re-sincronizar solo tablas críticas (>500 errores)');
  console.log('3. Re-sincronizar una tabla específica');
  console.log('4. Ver diagnóstico detallado de errores');
  console.log('5. Limpiar y re-sincronizar desde cero (FULL SYNC)');
  console.log('6. Salir');
  console.log();
}

async function resyncTable(table: TableToSync, type: 'incremental' | 'full' = 'incremental'): Promise<boolean> {
  console.log(colors.info(`\n🔄 Re-sincronizando ${table.displayName}...`));
  
  try {
    // Obtener última sincronización
    const config = await prisma.webhookConfig.findUnique({
      where: { tabla: table.name }
    });
    
    const lastSync = type === 'incremental' ? config?.lastSyncAt : undefined;
    
    // Ejecutar sincronización
    const result = await directSyncService.syncTable({ 
      tableName: table.name,
      batchSize: type === 'full' ? 0 : 1000
    });
    
    if (result.success) {
      console.log(colors.success(`✅ ${table.displayName}: Sincronización exitosa`));
      console.log(colors.dim(`   Insertados: ${result.recordsInserted}, Actualizados: ${result.recordsUpdated}`));
      return true;
    } else {
      console.log(colors.warning(`⚠️ ${table.displayName}: Sincronización con errores`));
      console.log(colors.dim(`   Procesados: ${result.recordsProcessed}, Errores: ${result.errors}`));
      
      if (result.errorDetails && result.errorDetails.length > 0) {
        console.log(colors.dim(`   Primer error: ${result.errorDetails[0].error}`));
      }
      
      return false;
    }
  } catch (error: any) {
    console.log(colors.error(`❌ ${table.displayName}: Error fatal`));
    console.log(colors.dim(`   ${error.message}`));
    return false;
  }
}

async function resyncAll(onlyCritical: boolean = false) {
  const tablesToSync = onlyCritical 
    ? TABLES_WITH_ERRORS.filter(t => t.errorCount > 500)
    : TABLES_WITH_ERRORS;
  
  console.log(colors.info(`\n📊 Iniciando re-sincronización de ${tablesToSync.length} tablas...`));
  
  // Agrupar por prioridad y sincronizar
  const priorities = [...new Set(tablesToSync.map(t => t.priority))].sort();
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const priority of priorities) {
    const tablesInPriority = tablesToSync.filter(t => t.priority === priority);
    console.log(colors.info(`\n🎯 Procesando prioridad ${priority} (${tablesInPriority.length} tablas)...`));
    
    for (const table of tablesInPriority) {
      const success = await resyncTable(table);
      if (success) {
        successCount++;
      } else {
        errorCount++;
      }
      
      // Pequeña pausa entre tablas
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  console.log(colors.info('\n📊 RESUMEN FINAL:'));
  console.log(colors.success(`   ✅ Exitosas: ${successCount}`));
  console.log(colors.error(`   ❌ Con errores: ${errorCount}`));
}

async function diagnosticErrors() {
  console.log(colors.info('\n📊 DIAGNÓSTICO DE ERRORES'));
  console.log(colors.dim('─'.repeat(50)));
  
  for (const table of TABLES_WITH_ERRORS) {
    const config = await prisma.webhookConfig.findUnique({
      where: { tabla: table.name },
      include: {
        logs: {
          where: { status: 'error' },
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });
    
    if (config && config.lastError) {
      console.log(`\n${colors.warning(table.displayName)}:`);
      console.log(`  Último error: ${config.lastError}`);
      console.log(`  Última sync: ${config.lastSyncAt?.toLocaleString() || 'Nunca'}`);
      
      if (config.logs && config.logs.length > 0) {
        const log = config.logs[0];
        console.log(`  Detalles: ${JSON.stringify(log.errorMessage || 'Sin detalles')}`);
      }
    }
  }
}

async function fullResync() {
  console.log(colors.warning('\n⚠️ ADVERTENCIA: Esto eliminará todos los datos locales y los volverá a sincronizar.'));
  console.log(colors.warning('Este proceso puede tomar varios minutos.'));
  
  const answer = await readInput('\n¿Estás seguro? (s/n): ');
  
  if (answer.toLowerCase() === 's') {
    console.log(colors.info('\n🔄 Iniciando sincronización completa...'));
    
    for (const table of TABLES_WITH_ERRORS) {
      // Resetear configuración
      await prisma.webhookConfig.update({
        where: { tabla: table.name },
        data: {
          lastSyncAt: null,
          totalSyncs: 0,
          successSyncs: 0,
          errorSyncs: 0,
          lastError: null
        }
      });
      
      // Sincronizar completo
      await resyncTable(table, 'full');
    }
  } else {
    console.log(colors.dim('Cancelado'));
  }
}

async function syncSpecificTable() {
  console.log('\nTablas disponibles:');
  TABLES_WITH_ERRORS.forEach((table, index) => {
    console.log(`${index + 1}. ${table.displayName} (${table.name})`);
  });
  
  const tableInput = await readInput('\nNombre o número de la tabla: ');
  
  let table: TableToSync | undefined;
  
  // Verificar si es un número
  const tableNumber = parseInt(tableInput);
  if (!isNaN(tableNumber) && tableNumber >= 1 && tableNumber <= TABLES_WITH_ERRORS.length) {
    table = TABLES_WITH_ERRORS[tableNumber - 1];
  } else {
    // Buscar por nombre
    table = TABLES_WITH_ERRORS.find(t => t.name === tableInput);
  }
  
  if (table) {
    const typeInput = await readInput('Tipo de sincronización (incremental/full) [incremental]: ');
    const type = typeInput === 'full' ? 'full' : 'incremental';
    await resyncTable(table, type);
  } else {
    console.log(colors.error('Tabla no encontrada'));
  }
  
  await readInput('\nPresiona Enter para continuar...');
}

async function main() {
  try {
    let exit = false;
    
    while (!exit) {
      await showMenu();
      const answer = await readInput('Selecciona una opción: ');
      
      switch (answer) {
        case '1':
          await resyncAll(false);
          await readInput('\nPresiona Enter para continuar...');
          break;
          
        case '2':
          await resyncAll(true);
          await readInput('\nPresiona Enter para continuar...');
          break;
          
        case '3':
          await syncSpecificTable();
          break;
          
        case '4':
          await diagnosticErrors();
          await readInput('\nPresiona Enter para continuar...');
          break;
          
        case '5':
          await fullResync();
          await readInput('\nPresiona Enter para continuar...');
          break;
          
        case '6':
          console.log(colors.dim('Saliendo...'));
          exit = true;
          break;
          
        default:
          console.log(colors.error('Opción no válida'));
          await readInput('\nPresiona Enter para continuar...');
      }
    }
    
  } catch (error) {
    console.error(colors.error('Error fatal:'), error);
  } finally {
    await prisma.$disconnect();
    await ventasDb.close();
    process.exit(0);
  }
}

// Ejecutar
main().catch(error => {
  console.error('Error fatal:', error);
  process.exit(1);
});
