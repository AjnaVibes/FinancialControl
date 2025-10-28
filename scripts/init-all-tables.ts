// scripts/init-all-tables.ts

import { syncOrchestrator } from '@/services/sync/syncOrchestrator';
import { ventasDb } from '@/lib/ventasDb';
import { prisma } from '@/lib/prisma';
import { RAMP_TABLES_CONFIG, getTablesByCategory, getTableConfig } from '@/config/sync-tables.config';
import chalk from 'chalk'; // npm install chalk para colores en consola
import * as readline from 'readline';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Configuración de colores
const colors = {
  success: chalk.green,
  error: chalk.red,
  warning: chalk.yellow,
  info: chalk.blue,
  dim: chalk.gray
};

/**
 * Mostrar banner de inicio
 */
function showBanner() {
  console.clear();
  console.log(colors.info('╔════════════════════════════════════════════════════╗'));
  console.log(colors.info('║     SISTEMA DE SINCRONIZACIÓN RAMP → LOCAL DB     ║'));
  console.log(colors.info('╚════════════════════════════════════════════════════╝'));
  console.log();
}

/**
 * Mostrar menú principal
 */
function showMenu() {
  console.log(colors.info('\n📋 MENÚ PRINCIPAL'));
  console.log(colors.dim('─'.repeat(40)));
  console.log('1. Sincronización completa (todas las tablas)');
  console.log('2. Sincronización por categoría');
  console.log('3. Sincronizar tabla específica');
  console.log('4. Ver estado global');
  console.log('5. Reintentar tablas con errores');
  console.log('6. Inicializar configuraciones (webhook_configs)');
  console.log('7. Reset de tabla específica');
  console.log('8. Verificar conexión a base de datos');
  console.log('9. Salir');
  console.log(colors.dim('─'.repeat(40)));
}

/**
 * Leer entrada del usuario
 */
async function readInput(prompt: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(colors.info(`\n${prompt}: `), (answer: string) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

/**
 * Sincronización completa
 */
async function fullSync() {
  console.log(colors.info('\n🚀 SINCRONIZACIÓN COMPLETA'));
  
  const type = await readInput('Tipo de sincronización (incremental/full) [incremental]') || 'incremental';
  const parallel = (await readInput('¿Ejecutar en paralelo? (s/n) [s]') || 's').toLowerCase() === 's';
  
  if (type !== 'incremental' && type !== 'full') {
    console.log(colors.error('Tipo inválido. Debe ser "incremental" o "full"'));
    return;
  }

  console.log(colors.warning(`\n⚠️  Se sincronizarán TODAS las tablas RAMP (${RAMP_TABLES_CONFIG.length} tablas)`));
  const confirm = await readInput('¿Continuar? (s/n)');
  
  if (confirm.toLowerCase() !== 's') {
    console.log(colors.dim('Cancelado'));
    return;
  }

  try {
    console.log(colors.info('\n⏳ Iniciando sincronización...'));
    const result = await syncOrchestrator.syncAll({
      type: type as 'incremental' | 'full',
      parallel,
      maxParallel: 3
    });

    if (result.success) {
      console.log(colors.success('\n✅ Sincronización completada exitosamente!'));
    } else {
      console.log(colors.warning('\n⚠️ Sincronización completada con algunos errores'));
    }

  } catch (error) {
    console.log(colors.error('\n❌ Error durante la sincronización:'), error);
  }
}

/**
 * Sincronización por categoría
 */
async function syncByCategory() {
  console.log(colors.info('\n📂 SINCRONIZACIÓN POR CATEGORÍA'));
  
  const categories = getTablesByCategory();
  console.log('\nCategorías disponibles:');
  
  let index = 1;
  const categoryList = Array.from(categories.keys());
  
  categoryList.forEach(cat => {
    const tables = categories.get(cat)!;
    console.log(`${index}. ${cat} (${tables.length} tablas)`);
    index++;
  });

  const selection = await readInput('Seleccione categoría (número)');
  const selectedIndex = parseInt(selection) - 1;
  
  if (selectedIndex < 0 || selectedIndex >= categoryList.length) {
    console.log(colors.error('Selección inválida'));
    return;
  }

  const selectedCategory = categoryList[selectedIndex];
  const type = await readInput('Tipo de sincronización (incremental/full) [incremental]') || 'incremental';

  try {
    console.log(colors.info(`\n⏳ Sincronizando categoría: ${selectedCategory}...`));
    const result = await syncOrchestrator.syncByCategory(selectedCategory, {
      type: type as 'incremental' | 'full',
      parallel: true
    });

    if (result.success) {
      console.log(colors.success('\n✅ Categoría sincronizada exitosamente!'));
    } else {
      console.log(colors.warning('\n⚠️ Sincronización con algunos errores'));
    }

  } catch (error) {
    console.log(colors.error('\n❌ Error:'), error);
  }
}

/**
 * Sincronizar tabla específica
 */
async function syncSpecificTable() {
  console.log(colors.info('\n📋 SINCRONIZAR TABLA ESPECÍFICA'));
  
  const tableName = await readInput('Nombre de la tabla');
  const type = await readInput('Tipo de sincronización (incremental/full) [incremental]') || 'incremental';
  const force = (await readInput('¿Ignorar dependencias? (s/n) [n]') || 'n').toLowerCase() === 's';

  try {
    console.log(colors.info(`\n⏳ Sincronizando ${tableName}...`));
    const result = await syncOrchestrator.syncMultipleTables({
      tables: [tableName],
      type: type as 'incremental' | 'full',
      skipDependencies: force
    });

    if (result.success) {
      console.log(colors.success('\n✅ Tabla sincronizada exitosamente!'));
      const detail = result.details[0];
      if (detail) {
        console.log(`   Insertados: ${detail.recordsInserted}`);
        console.log(`   Actualizados: ${detail.recordsUpdated}`);
        console.log(`   Errores: ${detail.errors}`);
      }
    } else {
      console.log(colors.error('\n❌ Error en la sincronización'));
    }

  } catch (error) {
    console.log(colors.error('\n❌ Error:'), error);
  }
}

/**
 * Ver estado global
 */
async function showGlobalStatus() {
  console.log(colors.info('\n📊 ESTADO GLOBAL DE SINCRONIZACIÓN'));
  
  try {
    const status = await syncOrchestrator.getGlobalStatus();
    
    console.log(colors.dim('\n─'.repeat(50)));
    console.log(colors.info('RESUMEN:'));
    console.log(`   Total tablas: ${status.summary.total}`);
    console.log(`   Sincronizadas: ${colors.success(status.summary.synced)} (${status.summary.syncedPercentage}%)`);
    console.log(`   Pendientes: ${colors.warning(status.summary.pending)}`);
    console.log(`   Con errores: ${colors.error(status.summary.withErrors)}`);
    
    console.log(colors.dim('\n─'.repeat(50)));
    console.log(colors.info('POR CATEGORÍA:'));
    
    Object.entries(status.byCategory).forEach(([category, tables]: [string, any]) => {
      console.log(`\n${colors.info(category)}:`);
      tables.forEach((table: any) => {
        const statusIcon = table.lastSync ? '✅' : '⏳';
        const errorIcon = table.hasError ? '⚠️ ' : '';
        console.log(`   ${statusIcon} ${errorIcon}${table.nombre} (${table.tabla})`);
        if (table.lastSync) {
          console.log(colors.dim(`      Última sync: ${new Date(table.lastSync).toLocaleString()}`));
        }
        if (table.hasError) {
          console.log(colors.error(`      Error: ${table.lastError?.substring(0, 50)}...`));
        }
      });
    });

  } catch (error) {
    console.log(colors.error('\n❌ Error obteniendo estado:'), error);
  }
}

/**
 * Reintentar tablas con errores
 */
async function retryFailed() {
  console.log(colors.info('\n🔄 REINTENTAR TABLAS CON ERRORES'));
  
  try {
    const result = await syncOrchestrator.retryFailed({
      type: 'incremental',
      parallel: true
    });

    if (result) {
      console.log(colors.success(`\n✅ Reintento completado: ${result.successfulTables}/${result.totalTables} exitosas`));
    }

  } catch (error) {
    console.log(colors.error('\n❌ Error:'), error);
  }
}

/**
 * Inicializar configuraciones
 */
async function initConfigs() {
  console.log(colors.info('\n⚙️ INICIALIZAR CONFIGURACIONES'));
  
  const confirm = await readInput('¿Esto agregará todas las tablas a webhook_configs. Continuar? (s/n)');
  
  if (confirm.toLowerCase() !== 's') {
    console.log(colors.dim('Cancelado'));
    return;
  }

  try {
    // Ejecutar el script de inicialización de webhook_configs
    console.log(colors.info('\n⏳ Ejecutando inicialización...'));
    
    const { stdout, stderr } = await execAsync('npm run init-webhooks init');
    
    if (stderr && !stderr.includes('npm warn')) {
      console.log(colors.warning('Advertencias:'), stderr);
    }
    
    console.log(stdout);
    console.log(colors.success('\n✅ Configuraciones inicializadas'));

  } catch (error) {
    console.log(colors.error('\n❌ Error:'), error);
  }
}

/**
 * Reset de tabla
 */
async function resetTable() {
  console.log(colors.warning('\n⚠️ RESET DE TABLA'));
  console.log(colors.error('ADVERTENCIA: Esto eliminará TODOS los datos locales de la tabla'));
  
  const tableName = await readInput('Nombre de la tabla');
  const confirm = await readInput('¿Confirmar eliminación de TODOS los datos de ${tableName}? (escriba "ELIMINAR")');
  
  if (confirm !== 'ELIMINAR') {
    console.log(colors.dim('Cancelado'));
    return;
  }

  try {
    // Opción 1: Llamar directamente al servicio sin usar la API
    console.log(colors.info(`\n⏳ Reseteando tabla ${tableName}...`));
    
    // Obtener el modelo de Prisma para la tabla
    const tableConfig = getTableConfig(tableName);
    if (!tableConfig) {
      console.log(colors.error(`❌ Tabla ${tableName} no está configurada`));
      return;
    }

    // Obtener el nombre del modelo en Prisma
    const modelName = tableConfig.prismaModel;
    const model = (prisma as any)[modelName];
    
    if (!model) {
      console.log(colors.error(`❌ Modelo Prisma '${modelName}' no encontrado para tabla ${tableName}`));
      return;
    }

    // Eliminar todos los registros
    const deleteResult = await model.deleteMany({});
    
    // Resetear configuración de sincronización
    await prisma.webhookConfig.update({
      where: { tabla: tableName },
      data: {
        lastSyncAt: null,
        totalSyncs: 0,
        successSyncs: 0,
        errorSyncs: 0,
        lastError: null,
        metadata: {
          ...(await prisma.webhookConfig.findUnique({ where: { tabla: tableName } }))?.metadata as any,
          lastReset: new Date()
        } as any
      }
    });

    // Eliminar logs antiguos
    await prisma.webhookSyncLog.deleteMany({
      where: {
        config: { tabla: tableName }
      }
    });

    console.log(colors.success(`\n✅ Tabla ${tableName} reseteada. ${deleteResult.count} registros eliminados.`));

  } catch (error) {
    console.log(colors.error('\n❌ Error:'), error);
  }
}

/**
 * Verificar conexión
 */
async function checkConnection() {
  console.log(colors.info('\n🔌 VERIFICANDO CONEXIONES...'));
  
  try {
    // Verificar conexión a RAMP (VentasDB)
    console.log('\nConexión a RAMP (VentasDB):');
    const rampConnected = await ventasDb.testConnection();
    if (rampConnected) {
      console.log(colors.success('✅ Conectado exitosamente'));
      
      // Mostrar algunas tablas disponibles
      const tables = await ventasDb.getTables();
      console.log(colors.dim(`   ${tables.length} tablas disponibles`));
      console.log(colors.dim(`   Primeras 5: ${tables.slice(0, 5).join(', ')}`));
    } else {
      console.log(colors.error('❌ No se pudo conectar'));
    }

    // Verificar conexión local
    console.log('\nConexión a Base de Datos Local:');
    const localCount = await prisma.webhookConfig.count();
    console.log(colors.success('✅ Conectado exitosamente'));
    console.log(colors.dim(`   ${localCount} configuraciones de webhook encontradas`));

  } catch (error) {
    console.log(colors.error('\n❌ Error verificando conexiones:'), error);
  }
}

/**
 * Función principal
 */
async function main() {
  showBanner();
  
  // Verificar argumentos de línea de comandos
  const args = process.argv.slice(2);
  
  if (args.length > 0) {
    // Modo comando directo
    const command = args[0];
    
    switch (command) {
      case 'all':
        await fullSync();
        break;
      case 'category':
        await syncByCategory();
        break;
      case 'table':
        await syncSpecificTable();
        break;
      case 'status':
        await showGlobalStatus();
        break;
      case 'retry':
        await retryFailed();
        break;
      case 'init':
        await initConfigs();
        break;
      case 'check':
        await checkConnection();
        break;
      default:
        console.log(colors.error(`Comando no reconocido: ${command}`));
        console.log('Comandos disponibles: all, category, table, status, retry, init, check');
    }
  } else {
    // Modo interactivo
    let exit = false;
    
    while (!exit) {
      showMenu();
      const choice = await readInput('Seleccione opción');
      
      switch (choice) {
        case '1':
          await fullSync();
          break;
        case '2':
          await syncByCategory();
          break;
        case '3':
          await syncSpecificTable();
          break;
        case '4':
          await showGlobalStatus();
          break;
        case '5':
          await retryFailed();
          break;
        case '6':
          await initConfigs();
          break;
        case '7':
          await resetTable();
          break;
        case '8':
          await checkConnection();
          break;
        case '9':
          exit = true;
          console.log(colors.dim('\n👋 Hasta luego!'));
          break;
        default:
          console.log(colors.error('Opción inválida'));
      }
      
      if (!exit) {
        await readInput('\nPresione ENTER para continuar');
      }
    }
  }

  // Cerrar conexiones
  await ventasDb.close();
  await prisma.$disconnect();
  process.exit(0);
}

// Manejo de errores global
process.on('unhandledRejection', (error) => {
  console.error(colors.error('\n❌ Error no manejado:'), error);
  process.exit(1);
});

// Ejecutar
main().catch(error => {
  console.error(colors.error('\n❌ Error fatal:'), error);
  process.exit(1);
});