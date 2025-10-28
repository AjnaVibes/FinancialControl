// update-batch-sizes.ts
import { prisma } from './src/lib/prisma';
import { RAMP_TABLES_CONFIG } from './src/config/sync-tables.config';

async function updateBatchSizes() {
  console.log('🔧 Actualizando batchSize en webhook_configs...\n');
  
  let updated = 0;
  
  for (const tableConfig of RAMP_TABLES_CONFIG) {
    try {
      const webhookConfig = await prisma.webhookConfig.findUnique({
        where: { tabla: tableConfig.tableName }
      });
      
      if (webhookConfig) {
        const currentMetadata = (webhookConfig.metadata as any) || {};
        const newMetadata = {
          ...currentMetadata,
          batchSize: tableConfig.batchSize || 1000000,
          primaryKey: tableConfig.primaryKey,
          timestampField: tableConfig.timestampField
        };
        
        await prisma.webhookConfig.update({
          where: { id: webhookConfig.id },
          data: {
            metadata: newMetadata
          }
        });
        
        console.log(`✅ ${tableConfig.tableName.padEnd(25)} - batchSize: ${(tableConfig.batchSize || 1000000).toLocaleString()}`);
        updated++;
      }
    } catch (error) {
      console.error(`❌ Error actualizando ${tableConfig.tableName}:`, error);
    }
  }
  
  console.log(`\n✅ ${updated} tablas actualizadas`);
  await prisma.$disconnect();
}

updateBatchSizes();