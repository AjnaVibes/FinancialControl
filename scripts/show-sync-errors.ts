// scripts/show-sync-errors.ts
import { directSyncService } from '../src/services/sync/directSyncService';
import { prisma } from '../src/lib/prisma';
import { ventasDb } from '../src/lib/ventasDb';

async function showSyncErrors() {
  console.log('🔍 Testeando sincronización de promissories para ver errores\n');
  
  try {
    // Sincronizar promissories con el servicio directo
    const result = await directSyncService.syncTable({
      tableName: 'promissories',
      batchSize: 0 // 0 para sincronización completa
    });
    
    console.log('\n📊 Resultado:');
    console.log(`Procesados: ${result.recordsProcessed}`);
    console.log(`Insertados: ${result.recordsInserted}`);
    console.log(`Actualizados: ${result.recordsUpdated}`);
    console.log(`Errores: ${result.errors}`);
    console.log(`Duración: ${(result.duration / 1000).toFixed(2)}s`);
    
    // Mostrar errores detallados si existen
    if (result.errorDetails && result.errorDetails.length > 0) {
      console.log('\n❌ Primeros 20 errores:');
      result.errorDetails.slice(0, 20).forEach((err: any, i: number) => {
        console.log(`\n${i + 1}. Record ID: ${JSON.stringify(err.record)}`);
        console.log(`   Error: ${err.error}`);
      });
    } else if (result.errors > 0) {
      console.log('\n⚠️ Hubo errores pero no hay detalles disponibles');
      console.log('Mensaje:', result.message || 'Sin mensaje');
    } else {
      console.log('\n✅ No hubo errores');
    }
    
  } catch (error: any) {
    console.error('\n❌ Error fatal:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
    await ventasDb.close();
  }
}

showSyncErrors();
