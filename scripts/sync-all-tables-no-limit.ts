// scripts/sync-all-tables-no-limit.ts
import { prisma } from '@/lib/prisma';
import { syncService } from '@/services/sync/directSyncService';
import { TABLE_TO_MODEL_MAP } from '@/config/sync-tables.config';

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

async function syncAllTables() {
  console.log('🔄 SINCRONIZACIÓN COMPLETA DE TODAS LAS TABLAS');
  console.log('📊 Modo: SIN LÍMITES - Se sincronizarán TODOS los registros');
  console.log('⏱️  Tiempo estimado: 5-10 minutos\n');
  console.log('='.repeat(60));
  
  const results: any = {};
  let totalInserted = 0;
  let totalUpdated = 0;
  let totalErrors = 0;
  
  for (let i = 0; i < SYNC_ORDER.length; i++) {
    const tableName = SYNC_ORDER[i];
    
    console.log(`\n[${i + 1}/${SYNC_ORDER.length}] Sincronizando ${tableName}...`);
    
    try {
      const result = await syncService.syncTable({
        tableName,
        primaryKey: 'id',
        timestampField: 'updated_at',
        batchSize: 0  // 🔥 SIN LÍMITE - SINCRONIZA TODO
      });
      
      results[tableName] = result;
      totalInserted += result.recordsInserted;
      totalUpdated += result.recordsUpdated;
      totalErrors += result.errors;
      
      // Mostrar resumen por tabla
      const status = result.errors === 0 ? '✅' : '⚠️';
      console.log(`${status} ${tableName}: ${result.recordsInserted} insertados, ${result.recordsUpdated} actualizados, ${result.errors} errores`);
      
    } catch (error: any) {
      console.error(`❌ Error en ${tableName}:`, error.message);
      results[tableName] = { error: error.message };
      totalErrors++;
    }
  }
  
  // RESUMEN FINAL
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMEN FINAL DE SINCRONIZACIÓN');
  console.log('='.repeat(60));
  console.log(`✅ Total insertados: ${totalInserted.toLocaleString()}`);
  console.log(`🔄 Total actualizados: ${totalUpdated.toLocaleString()}`);
  console.log(`❌ Total errores: ${totalErrors}`);
  console.log(`📊 Total registros procesados: ${(totalInserted + totalUpdated).toLocaleString()}`);
  
  // Mostrar tablas con errores
  if (totalErrors > 0) {
    console.log('\n⚠️  Tablas con errores:');
    Object.entries(results).forEach(([table, result]: [string, any]) => {
      if (result.errors > 0 || result.error) {
        console.log(`   - ${table}: ${result.errors || 'Error completo'}`);
      }
    });
  } else {
    console.log('\n✅ ¡Sincronización completada sin errores!');
  }
  
  await prisma.$disconnect();
}

// Ejecutar
syncAllTables().catch(console.error);