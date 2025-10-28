// scripts/sync-status-real.ts
// Script para ver el estado REAL actual de las sincronizaciones

import { prisma } from '../src/lib/prisma';
import chalk from 'chalk';

const colors = {
  success: chalk.green,
  error: chalk.red,
  warning: chalk.yellow,
  info: chalk.blue,
  dim: chalk.gray
};

async function getRealStatus() {
  console.clear();
  console.log(colors.info('╔════════════════════════════════════════════════════╗'));
  console.log(colors.info('║          ESTADO REAL DE SINCRONIZACIÓN            ║'));
  console.log(colors.info('╚════════════════════════════════════════════════════╝'));
  console.log();
  
  try {
    // Obtener todas las configuraciones
    const configs = await prisma.webhookConfig.findMany({
      orderBy: [
        { categoria: 'asc' },
        { tabla: 'asc' }
      ],
      include: {
        _count: {
          select: { logs: true }
        }
      }
    });

    // Agrupar por categoría
    const byCategory = new Map<string, any[]>();
    let totalTables = 0;
    let syncedTables = 0;
    let tablesWithErrors = 0;
    let pendingTables = 0;
    let totalErrorCount = 0;

    configs.forEach(config => {
      if (!byCategory.has(config.categoria)) {
        byCategory.set(config.categoria, []);
      }

      const hasError = config.lastError !== null;
      const isSynced = config.lastSyncAt !== null;
      const isPending = !isSynced;
      
      // Extraer número de errores del mensaje
      let errorCount = 0;
      if (config.lastError) {
        const match = config.lastError.match(/(\d+) errores?/);
        if (match) {
          errorCount = parseInt(match[1]);
          totalErrorCount += errorCount;
        }
      }

      byCategory.get(config.categoria)!.push({
        ...config,
        hasError,
        isSynced,
        isPending,
        errorCount
      });

      totalTables++;
      if (isSynced) syncedTables++;
      if (hasError) tablesWithErrors++;
      if (isPending) pendingTables++;
    });

    // Mostrar resumen
    console.log(colors.info('📊 RESUMEN GLOBAL:'));
    console.log(colors.dim('─'.repeat(50)));
    console.log(`Total de tablas: ${totalTables}`);
    console.log(`${colors.success('✅ Sincronizadas sin errores:')} ${syncedTables - tablesWithErrors}`);
    console.log(`${colors.warning('⚠️  Sincronizadas con errores:')} ${tablesWithErrors}`);
    console.log(`${colors.error('❌ Pendientes:')} ${pendingTables}`);
    console.log(`${colors.error('Total de errores individuales:')} ${totalErrorCount}`);
    console.log();

    // Mostrar por categoría
    console.log(colors.info('📂 ESTADO POR CATEGORÍA:'));
    console.log(colors.dim('─'.repeat(50)));

    byCategory.forEach((tables, category) => {
      console.log(`\n${colors.warning(category)}:`);
      
      tables.forEach(table => {
        let status = '';
        let statusColor = colors.dim;
        
        if (!table.isSynced) {
          status = '❌ Pendiente';
          statusColor = colors.error;
        } else if (table.hasError) {
          status = `⚠️ ${table.errorCount} errores`;
          statusColor = colors.warning;
        } else {
          status = '✅ OK';
          statusColor = colors.success;
        }
        
        const lastSync = table.lastSyncAt 
          ? ` (última: ${new Date(table.lastSyncAt).toLocaleDateString()})` 
          : '';
        
        console.log(`  ${table.tabla.padEnd(25)} ${statusColor(status)}${lastSync}`);
      });
    });

    // Mostrar solo las tablas con errores
    console.log(`\n${colors.error('⚠️ TABLAS CON ERRORES ACTIVOS:')}`);
    console.log(colors.dim('─'.repeat(50)));
    
    const tablesWithActiveErrors = configs
      .filter(c => c.lastError !== null)
      .sort((a, b) => {
        const aCount = parseInt(a.lastError?.match(/(\d+) errores?/)?.[1] || '0');
        const bCount = parseInt(b.lastError?.match(/(\d+) errores?/)?.[1] || '0');
        return bCount - aCount;
      });

    if (tablesWithActiveErrors.length === 0) {
      console.log(colors.success('🎉 ¡No hay tablas con errores!'));
    } else {
      tablesWithActiveErrors.forEach(table => {
        const match = table.lastError?.match(/(\d+) errores?/);
        const errorCount = match ? match[1] : '?';
        console.log(`  ${table.tabla.padEnd(25)} ${colors.error(errorCount + ' errores')}`);
        console.log(colors.dim(`    Última sync: ${table.lastSyncAt?.toLocaleString() || 'Nunca'}`));
      });
    }

    // Estadísticas finales
    const successRate = totalTables > 0 
      ? Math.round(((syncedTables - tablesWithErrors) / totalTables) * 100)
      : 0;

    console.log(`\n${colors.info('📈 TASA DE ÉXITO:')}`);
    console.log(colors.dim('─'.repeat(50)));
    
    const progressBar = '█'.repeat(Math.floor(successRate / 5)) + '░'.repeat(20 - Math.floor(successRate / 5));
    console.log(`[${progressBar}] ${successRate}%`);

  } catch (error) {
    console.error(colors.error('❌ Error:'), error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar
getRealStatus().catch(console.error);