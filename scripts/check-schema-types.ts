// scripts/check-schema-types.ts
// Script para verificar discrepancias entre tipos MySQL y Prisma

import { ventasDb } from '../src/lib/ventasDb';
import { prisma } from '../src/lib/prisma';

async function checkSchemaTypes(tableName: string) {
  console.log(`\n🔍 Verificando tipos de datos para tabla: ${tableName}`);
  console.log('='  .repeat(60));
  
  try {
    // 1. Obtener estructura de MySQL
    const columnInfo = `
      SELECT 
        COLUMN_NAME,
        DATA_TYPE,
        COLUMN_TYPE,
        IS_NULLABLE,
        COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = '${tableName}'
        AND TABLE_SCHEMA = DATABASE()
      ORDER BY ORDINAL_POSITION
    `;
    
    const mysqlColumns = await ventasDb.query(columnInfo);
    
    console.log('\n📊 Estructura en MySQL:');
    console.log('-'.repeat(40));
    
    // Campos problemáticos conocidos
    const problemFields: Record<string, string[]> = {
      'agents': ['can_reservate', 'is_broker', 'is_google_calendar_synced', 'is_google_mail_synced'],
      'movements': ['movement_id', 'countable', 'is_credit', 'sent'],
      'promissories': ['isPaid', 'isCreditPromisse'],
      'references': ['reference'],
      'beneficiaries': ['is_complete', 'is_verified'],
      'client_references': ['phone', 'is_active']
    };
    
    const fieldsToCheck = problemFields[tableName] || [];
    
    for (const col of mysqlColumns as any[]) {
      const columnName = col.COLUMN_NAME;
      const dataType = col.DATA_TYPE;
      const columnType = col.COLUMN_TYPE;
      const isNullable = col.IS_NULLABLE === 'YES';
      
      // Resaltar campos problemáticos
      const isProblem = fieldsToCheck.includes(columnName);
      const marker = isProblem ? ' ⚠️' : '';
      
      // Determinar tipo esperado en Prisma
      let prismaType = '';
      if (dataType === 'tinyint' && columnType === 'tinyint(1)') {
        prismaType = 'Boolean';
      } else if (dataType === 'bigint') {
        prismaType = 'BigInt o String';
      } else if (dataType === 'int') {
        prismaType = 'Int';
      } else if (dataType === 'varchar' || dataType === 'text') {
        prismaType = 'String';
      } else if (dataType === 'decimal') {
        prismaType = 'Decimal o Float';
      } else if (dataType === 'datetime' || dataType === 'timestamp') {
        prismaType = 'DateTime';
      } else {
        prismaType = dataType;
      }
      
      if (isProblem) {
        console.log(`${marker} ${columnName}:`);
        console.log(`    MySQL: ${columnType}`);
        console.log(`    Debería ser en Prisma: ${prismaType}${isNullable ? '?' : ''}`);
        console.log(`    Nullable: ${isNullable ? 'Sí' : 'No'}`);
      }
    }
    
    // 2. Obtener un registro de ejemplo
    console.log('\n📋 Valores de ejemplo del primer registro:');
    console.log('-'.repeat(40));
    
    const sampleSql = `SELECT * FROM \`${tableName}\` LIMIT 1`;
    const sampleRecords = await ventasDb.query(sampleSql);
    
    if (sampleRecords.length > 0) {
      const record = sampleRecords[0] as any;
      
      for (const field of fieldsToCheck) {
        if (field in record) {
          const value = record[field];
          const type = typeof value;
          const isBigInt = type === 'bigint';
          
          console.log(`${field}:`);
          console.log(`  Valor: ${value === null ? 'NULL' : value}`);
          console.log(`  Tipo JS: ${type}${isBigInt ? ' (BigInt)' : ''}`);
          
          // Sugerir conversión
          if (field === 'can_reservate' || field.startsWith('is_')) {
            console.log(`  💡 Sugerencia: Debería ser Boolean en Prisma`);
          } else if (field === 'movement_id' && isBigInt) {
            console.log(`  💡 Sugerencia: Convertir a String si Prisma lo requiere`);
          } else if (field === 'reference' && isBigInt) {
            console.log(`  💡 Sugerencia: Convertir a String`);
          }
        }
      }
    }
    
    // 3. Sugerir correcciones para el schema Prisma
    console.log('\n📝 CORRECCIONES SUGERIDAS PARA schema.prisma:');
    console.log('-'.repeat(40));
    
    if (tableName === 'agents') {
      console.log(`
model Agent {
  // Si actualmente está como:
  // canReservate    String?
  
  // Debería ser:
  canReservate    Boolean?    @map("can_reservate")
  isBroker        Boolean     @default(false) @map("is_broker")
  
  // Verificar también estos campos:
  isGoogleCalendarSynced  Boolean  @map("is_google_calendar_synced")
  isGoogleMailSynced      Boolean  @map("is_google_mail_synced")
}
      `);
    } else if (tableName === 'movements') {
      console.log(`
model Movement {
  // Si movementId es BigInt muy grande:
  movementId      String     @map("movement_id")
  
  // Campos booleanos:
  countable       Boolean    @map("countable")
  isCredit        Boolean    @map("is_credit")
  sent            Boolean    @map("sent")
}
      `);
    } else if (tableName === 'promissories') {
      console.log(`
model Promissory {
  isPaid          Boolean?   @map("isPaid")
  isCreditPromisse Boolean?  @map("isCreditPromisse")
}
      `);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await ventasDb.close();
    await prisma.$disconnect();
  }
}

// Ejecutar
const table = process.argv[2];

if (!table) {
  console.log('Uso: npx tsx scripts/check-schema-types.ts <tabla>');
  console.log('\nTablas con problemas conocidos:');
  console.log('  - agents');
  console.log('  - movements');
  console.log('  - promissories');
  console.log('  - references');
  console.log('  - beneficiaries');
  console.log('  - client_references');
  process.exit(1);
}

checkSchemaTypes(table).catch(console.error);