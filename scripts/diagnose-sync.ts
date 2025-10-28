// scripts/diagnose-sync.ts
import { ventasDb } from '../src/lib/ventasDb';
import { prisma } from '../src/lib/prisma';

async function diagnoseTable(tableName: string) {
  console.log(`\n🔍 Diagnosticando tabla: ${tableName}`);
  
  try {
    // Obtener primeros 10 registros de RAMP
    const sql = `SELECT * FROM \`${tableName}\` LIMIT 10`;
    const records = await ventasDb.query(sql);
    
    console.log(`📊 Registros encontrados: ${records.length}`);
    
    if (records.length > 0) {
      console.log('\n📋 Estructura de datos (primer registro):');
      console.log('----------------------------------------');
      
      const first = records[0] as Record<string, any>;
      
      for (const [key, value] of Object.entries(first)) {
        const type = typeof value;
        const isBigInt = type === 'bigint';
        const isNull = value === null;
        
        let sample = '';
        if (isNull) {
          sample = 'NULL';
        } else if (isBigInt) {
          sample = String(value) + 'n';
        } else if (type === 'object' && value instanceof Date) {
          sample = value.toISOString();
        } else if (type === 'string' && value.length > 50) {
          sample = value.substring(0, 50) + '...';
        } else {
          sample = String(value);
        }
        
        // Indicar si es un campo problemático
        let warning = '';
        if (isBigInt && key === 'reference') {
          warning = ' ⚠️ (BigInt pero espera String)';
        } else if ((key === 'isPaid' || key === 'is_paid' || key.includes('is_')) && type === 'number') {
          warning = ' ⚠️ (Number pero espera Boolean)';
        }
        
        console.log(`  ${key.padEnd(25)}: ${type.padEnd(10)} = ${sample}${warning}`);
      }
      
      // Analizar todos los registros para encontrar patrones
      console.log('\n📊 Análisis de campos problemáticos:');
      console.log('----------------------------------------');
      
      const fieldTypes: Record<string, Set<string>> = {};
      const nullFields: Set<string> = new Set();
      const bigIntFields: Set<string> = new Set();
      const booleanLikeFields: Set<string> = new Set();
      
      for (const record of records as Record<string, any>[]) {
        for (const [key, value] of Object.entries(record)) {
          if (!fieldTypes[key]) {
            fieldTypes[key] = new Set();
          }
          
          const type = typeof value;
          fieldTypes[key].add(type);
          
          if (value === null) {
            nullFields.add(key);
          }
          
          if (type === 'bigint') {
            bigIntFields.add(key);
          }
          
          // Detectar campos que parecen booleanos
          if ((key.startsWith('is') || key.startsWith('has') || key.includes('is_') || key.includes('has_')) 
              && (type === 'number' && (value === 0 || value === 1))) {
            booleanLikeFields.add(key);
          }
        }
      }
      
      if (bigIntFields.size > 0) {
        console.log('\n🔢 Campos con BigInt:');
        bigIntFields.forEach(field => {
          console.log(`  - ${field}`);
        });
      }
      
      if (booleanLikeFields.size > 0) {
        console.log('\n✓ Campos que parecen booleanos (0/1):');
        booleanLikeFields.forEach(field => {
          console.log(`  - ${field}`);
        });
      }
      
      // Mostrar campos con tipos mixtos
      console.log('\n⚠️ Campos con tipos inconsistentes:');
      for (const [field, types] of Object.entries(fieldTypes)) {
        if (types.size > 1) {
          console.log(`  - ${field}: ${Array.from(types).join(', ')}`);
        }
      }
      
      // Verificar estado en la base de datos local
      console.log('\n📊 Estado en webhook_configs:');
      const webhookConfig = await prisma.webhookConfig.findUnique({
        where: { tabla: tableName },
        include: {
          _count: {
            select: { logs: true }
          }
        }
      });
      
      if (webhookConfig) {
        console.log(`  - Total syncs: ${webhookConfig.totalSyncs}`);
        console.log(`  - Successful: ${webhookConfig.successSyncs}`);
        console.log(`  - Errors: ${webhookConfig.errorSyncs}`);
        console.log(`  - Total logs: ${(webhookConfig as any)._count.logs}`);
        console.log(`  - Last sync: ${webhookConfig.lastSyncAt?.toLocaleString() || 'Never'}`);
        
        if (webhookConfig.lastError) {
          console.log(`  - Last error: ${webhookConfig.lastError}`);
        }
      } else {
        console.log('  ⚠️ Tabla no configurada en webhook_configs');
      }
      
    } else {
      console.log('⚠️ No se encontraron registros en la tabla');
    }
    
  } catch (error) {
    console.error('❌ Error diagnosticando tabla:', error);
  } finally {
    await ventasDb.close();
    await prisma.$disconnect();
  }
}

// Script principal
async function main() {
  const table = process.argv[2];
  
  if (!table) {
    console.log('Uso: npx tsx scripts/diagnose-sync.ts <nombre_tabla>');
    console.log('\nTablas disponibles:');
    console.log('  - promissories');
    console.log('  - references');
    console.log('  - quotations');
    console.log('  - transactions');
    console.log('  - movements');
    console.log('  ... y más');
    process.exit(1);
  }
  
  await diagnoseTable(table);
}

main().catch(error => {
  console.error('Error fatal:', error);
  process.exit(1);
});