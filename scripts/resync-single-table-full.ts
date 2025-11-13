// scripts/resync-single-table-full.ts
// Script para resincronizar UNA tabla específica SIN LÍMITE DE REGISTROS

import { directSyncService } from '../src/services/sync/directSyncService';
import { prisma } from '../src/lib/prisma';
import { ventasDb } from '../src/lib/ventasDb';
import { TABLE_TO_MODEL_MAP } from '../src/config/sync-tables.config';
import * as fs from 'fs';
import * as path from 'path';

async function resyncSingleTable(tableName: string) {
  console.log('\n' + '='.repeat(60));
  console.log(`RESINCRONIZACIÓN COMPLETA DE TABLA: ${tableName.toUpperCase()}`);
  console.log('='.repeat(60));

  try {
    // Verificar que la tabla exista en la configuración
    const modelName = TABLE_TO_MODEL_MAP[tableName];
    if (!modelName) {
      throw new Error(`Modelo no encontrado para tabla: ${tableName} (modelo: ${modelName})`);
    }

    const prismaModel = (prisma as any)[modelName];
    if (!prismaModel) {
      throw new Error(`Modelo Prisma no encontrado: ${modelName}`);
    }

    // PASO 1: Obtener el total de registros en RAMP
    console.log('\n📊 PASO 1: Verificando registros en RAMP...');
    const totalQuery = `SELECT COUNT(*) as total FROM ${tableName}`;
    const totalResult = await ventasDb.query(totalQuery);
    const totalInRamp = totalResult[0].total;
    console.log(`   Total en RAMP: ${totalInRamp.toLocaleString()} registros`);

    // Verificar registros actuales en local
    const currentCount = await prismaModel.count();
    console.log(`   Total en Local: ${currentCount.toLocaleString()} registros`);

    if (totalInRamp === 0) {
      console.log('\n⚠️  No hay registros en RAMP para sincronizar');
      return;
    }

    // PASO 2: Preguntar si desea limpiar la tabla
    console.log('\n🗑️  PASO 2: Limpieza de tabla');
    console.log(`   ⚠️  Se eliminarán ${currentCount.toLocaleString()} registros locales`);
    console.log(`   ✅ Se sincronizarán ${totalInRamp.toLocaleString()} registros desde RAMP`);
    
    // Eliminar todos los registros de la tabla
    console.log(`\n   Eliminando registros de ${tableName}...`);
    const deleteResult = await prismaModel.deleteMany({});
    console.log(`   ✅ ${deleteResult.count.toLocaleString()} registros eliminados`);

    // PASO 3: Sincronizar TODOS los registros (sin límite)
    console.log('\n🔄 PASO 3: Sincronización completa');
    console.log(`   Sincronizando ${totalInRamp.toLocaleString()} registros...`);
    console.log('   ⏳ Esto puede tomar varios minutos...\n');

    const startTime = Date.now();
    
    // Sincronizar con batchSize = 0 (sin límite)
    const result = await directSyncService.syncTable({
      tableName,
      batchSize: 0  // ⭐ SIN LÍMITE
    });

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    // PASO 4: Mostrar resultados
    console.log('\n' + '='.repeat(60));
    console.log('RESULTADO DE SINCRONIZACIÓN');
    console.log('='.repeat(60));

    if (result.success && result.errors === 0) {
      console.log('✅ Sincronización completada exitosamente\n');
    } else {
      console.log('⚠️  Sincronización completada con errores\n');
    }

    console.log('📊 Estadísticas:');
    console.log(`   • Registros procesados: ${result.recordsProcessed.toLocaleString()}`);
    console.log(`   • Registros insertados: ${result.recordsInserted.toLocaleString()}`);
    console.log(`   • Registros actualizados: ${result.recordsUpdated.toLocaleString()}`);
    console.log(`   • Registros omitidos: ${result.recordsSkipped.toLocaleString()}`);
    console.log(`   • Errores: ${result.errors.toLocaleString()}`);
    console.log(`   • Duración: ${duration}s`);

    // Verificar el conteo final
    const finalCount = await prismaModel.count();
    console.log(`\n📊 Verificación final:`);
    console.log(`   • Total en RAMP: ${totalInRamp.toLocaleString()}`);
    console.log(`   • Total en Local: ${finalCount.toLocaleString()}`);
    
    const syncRate = ((finalCount / totalInRamp) * 100).toFixed(1);
    console.log(`   • Tasa de éxito: ${syncRate}%`);

    // Mostrar errores si existen
    if (result.errors > 0 && result.errorDetails) {
      console.log('\n❌ ERRORES ENCONTRADOS:\n');
      result.errorDetails.forEach((error, index) => {
        console.log(`Error ${index + 1}:`);
        console.log(`   Record ID: ${error.record}`);
        console.log(`   Error: ${error.error}`);
        console.log(`   Stack: ${error.stack}\n`);
      });

      // Guardar errores en archivo JSON
      const logsDir = path.join(process.cwd(), 'logs');
      if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
      }

      const errorFile = path.join(logsDir, `error-${tableName}-${new Date().toISOString().split('T')[0]}.json`);
      fs.writeFileSync(errorFile, JSON.stringify(result.errorDetails, null, 2));
      console.log(`📝 Errores completos guardados en: ${errorFile}`);
    }

    console.log('='.repeat(60));

    // PASO 5: Mensaje final
    console.log('\n✅ PROCESO COMPLETADO\n');
    console.log(`Tabla: ${tableName}`);
    console.log(`Registros eliminados: ${deleteResult.count.toLocaleString()}`);
    console.log(`Registros sincronizados: ${finalCount.toLocaleString()}`);
    console.log(`Estado: ${result.errors === 0 ? 'Sincronizada completamente' : 'Sincronizada con errores'}\n`);

  } catch (error: any) {
    console.error('\n❌ ERROR EN EL PROCESO:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    await ventasDb.close();
  }
}

// Ejecutar el script
const tableName = process.argv[2];

if (!tableName) {
  console.error('\n❌ Error: Debes especificar el nombre de la tabla');
  console.log('\n📝 Uso:');
  console.log('   npx tsx scripts/resync-single-table-full.ts <nombre-tabla>');
  console.log('\n📋 Ejemplos:');
  console.log('   npx tsx scripts/resync-single-table-full.ts clients');
  console.log('   npx tsx scripts/resync-single-table-full.ts properties');
  console.log('   npx tsx scripts/resync-single-table-full.ts quotations\n');
  process.exit(1);
}

resyncSingleTable(tableName).catch(error => {
  console.error('Error fatal:', error);
  process.exit(1);
});