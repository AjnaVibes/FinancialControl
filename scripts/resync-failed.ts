// scripts/resync-failed.ts
import { syncOrchestrator } from '../src/services/sync/syncOrchestrator';
import { prisma } from '../src/lib/prisma';
import { ventasDb } from '../src/lib/ventasDb';

async function resyncFailed() {
  console.log('🔄 Re-sincronizando tablas con registros faltantes\n');
  
  // Tablas con registros faltantes (basado en check-counts.ts)
  const failedTables = [
    { name: 'references', missing: 9453 },      // 43.3% - Prioridad ALTA
    { name: 'promissories', missing: 5850 },    // 60.6% - Prioridad ALTA
    { name: 'transactions', missing: 2698 },    // 55.6% - Prioridad ALTA
    { name: 'quotations', missing: 1801 },      // 67.8% - Prioridad MEDIA
    { name: 'clients', missing: 1288 },         // 81.9% - Prioridad MEDIA
    { name: 'units', missing: 431 }             // 92.6% - Prioridad BAJA
  ];
  
  console.log('📋 Tablas a re-sincronizar:');
  failedTables.forEach(t => {
    console.log(`   - ${t.name.padEnd(20)} (faltan ${t.missing.toLocaleString()} registros)`);
  });
  console.log('');
  
  for (const table of failedTables) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🔄 Re-sincronizando ${table.name}`);
    console.log('='.repeat(60));
    
    try {
      const result = await syncOrchestrator.syncMultipleTables({
        type: 'full',
        force: true,
        tables: [table.name],
        skipDependencies: true,
        parallel: false
      });
      
      console.log(`\n✅ Resultado ${table.name}:`);
      console.log(`   📝 Procesados: ${result.totalRecords}`);
      console.log(`   ➕ Insertados: ${result.totalInserted}`);
      console.log(`   🔄 Actualizados: ${result.totalUpdated}`);
      console.log(`   ⚠️  Errores: ${result.totalErrors}`);
      
      if (result.totalErrors > 0) {
        console.log(`\n⚠️ Aún hay ${result.totalErrors} errores en ${table.name}`);
      }
      
      // Pausa entre tablas
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error: any) {
      console.error(`\n❌ Error fatal en ${table.name}:`, error.message);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ Re-sincronización completada');
  console.log('='.repeat(60));
  console.log('\n💡 Ejecuta: npx tsx scripts/check-counts.ts para verificar');
  
  await prisma.$disconnect();
  await ventasDb.close();
}

resyncFailed().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});