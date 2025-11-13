// scripts/reset-clients-only.ts
import { prisma } from '@/lib/prisma';
import { syncService } from '@/services/sync/directSyncService';

async function resetAndSyncClients() {
  console.log('🔄 RESET Y SINCRONIZACIÓN DE TABLA CLIENTS');
  console.log('=========================================\n');
  
  try {
    // 1. CONTAR REGISTROS ACTUALES
    const countBefore = await prisma.client.count();
    console.log(`📊 Registros actuales: ${countBefore}\n`);
    
    // 2. VACIAR TABLA CLIENTS
    console.log('🗑️  Vaciando tabla clients...');
    await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 0;');
    await prisma.client.deleteMany({});
    await prisma.$executeRawUnsafe('ALTER TABLE clients AUTO_INCREMENT = 1;');
    await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 1;');
    console.log('✅ Tabla vaciada y AUTO_INCREMENT reseteado\n');
    
    // 3. SINCRONIZAR SIN LÍMITE (batchSize = 0)
    console.log('📥 Sincronizando TODOS los registros desde RAMP...');
    const result = await syncService.syncTable({
      tableName: 'clients',
      primaryKey: 'id',
      timestampField: 'updated_at',
      batchSize: 0  // 🔥 SIN LÍMITE - SINCRONIZA TODO
    });
    
    // 4. MOSTRAR RESULTADOS
    console.log('\n=========================================');
    console.log('📊 RESULTADOS:');
    console.log(`✅ Insertados: ${result.recordsInserted}`);
    console.log(`🔄 Actualizados: ${result.recordsUpdated}`);
    console.log(`❌ Errores: ${result.errors}`);
    console.log(`⏱️  Duración: ${(result.duration / 1000).toFixed(2)}s`);
    
    if (result.errors > 0 && result.errorDetails) {
      console.log('\n⚠️  DETALLES DE ERRORES:');
      result.errorDetails.forEach((err, idx) => {
        console.log(`  ${idx + 1}. ID ${err.record}: ${err.error}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error fatal:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetAndSyncClients();