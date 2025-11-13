// src/app/api/admin/ramp-tables/generate-schema/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ventasDb } from '@/lib/ventasDb';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

// Mapeo de tipos MySQL a Prisma
function mapToPrismaType(mysqlType: string): string {
  const type = mysqlType.toLowerCase();
  
  if (type.includes('int')) return 'Int';
  if (type.includes('bigint')) return 'BigInt';
  if (type.includes('decimal') || type.includes('numeric')) return 'Decimal';
  if (type.includes('float') || type.includes('double')) return 'Float';
  if (type.includes('varchar') || type.includes('text') || type.includes('char')) return 'String';
  if (type.includes('datetime') || type.includes('timestamp')) return 'DateTime';
  if (type.includes('date')) return 'DateTime';
  if (type.includes('time')) return 'String';
  if (type.includes('boolean') || type.includes('bool') || type.includes('tinyint(1)')) return 'Boolean';
  if (type.includes('json')) return 'Json';
  if (type.includes('blob')) return 'Bytes';
  
  return 'String'; // Default
}

export async function POST(req: Request) {
  try {
    const { tableName, displayName, relatedTables, intervalMinutes = 60 } = await req.json();

    // 1. Obtener estructura de la tabla desde Ramp
    const columns = await ventasDb.query(`
      SELECT 
        COLUMN_NAME as name,
        DATA_TYPE as type,
        IS_NULLABLE as nullable,
        COLUMN_KEY as key_type,
        COLUMN_DEFAULT as defaultValue,
        EXTRA as extra
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = ?
      ORDER BY ORDINAL_POSITION
    `, [tableName]);

    if (!columns || (columns as any[]).length === 0) {
      return NextResponse.json(
        { success: false, error: 'Tabla no encontrada en Ramp' },
        { status: 404 }
      );
    }

    // 2. Generar el modelo Prisma
    const modelName = tableName.charAt(0).toUpperCase() + tableName.slice(1);
    let prismaModel = `\n// Generado automáticamente desde Ramp\nmodel ${modelName} {\n`;
    
    for (const col of columns as any[]) {
      const fieldName = col.name;
      const fieldType = mapToPrismaType(col.type);
      const isNullable = col.nullable === 'YES' ? '?' : '';
      const isPrimaryKey = col.key_type === 'PRI';
      const isAutoIncrement = col.extra?.includes('auto_increment');
      
      let fieldDef = `  ${fieldName} ${fieldType}${isNullable}`;
      
      if (isPrimaryKey) {
        fieldDef += ' @id';
        if (isAutoIncrement) {
          fieldDef += ' @default(autoincrement())';
        }
      }
      
      if (col.defaultValue && !isAutoIncrement) {
        if (col.defaultValue === 'CURRENT_TIMESTAMP') {
          fieldDef += ' @default(now())';
        } else if (col.defaultValue !== 'NULL') {
          fieldDef += ` @default(${col.defaultValue})`;
        }
      }
      
      if (fieldName === 'created_at' || fieldName === 'createdAt') {
        fieldDef += ' @default(now())';
      }
      
      if (fieldName === 'updated_at' || fieldName === 'updatedAt') {
        fieldDef += ' @updatedAt';
      }
      
      prismaModel += fieldDef + '\n';
    }
    
    // Agregar relaciones si existen
    if (relatedTables && relatedTables.length > 0) {
      prismaModel += '\n  // Relaciones\n';
      for (const related of relatedTables) {
        const relatedModel = related.charAt(0).toUpperCase() + related.slice(1);
        // Buscar columnas que podrían ser foreign keys
        for (const col of columns as any[]) {
          if (col.name.toLowerCase().includes(related.toLowerCase()) && 
              (col.name.endsWith('_id') || col.name.endsWith('Id'))) {
            prismaModel += `  ${related} ${relatedModel}? @relation(fields: [${col.name}], references: [id])\n`;
          }
        }
      }
    }
    
    prismaModel += '\n  @@map("' + tableName + '")\n';
    prismaModel += '}\n';

    // 3. Leer el archivo schema.prisma actual
    const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
    let schemaContent = await fs.readFile(schemaPath, 'utf-8');
    
    // Verificar si el modelo ya existe
    if (schemaContent.includes(`model ${modelName}`)) {
      return NextResponse.json(
        { success: false, error: 'El modelo ya existe en Prisma' },
        { status: 400 }
      );
    }
    
    // 4. Agregar el nuevo modelo al schema
    schemaContent += prismaModel;
    await fs.writeFile(schemaPath, schemaContent);

    // 5. Ejecutar migración
    console.log('Ejecutando migración...');
    const migrationName = `add_${tableName}_table`;
    const { stdout, stderr } = await execAsync(
      `npx prisma migrate dev --name ${migrationName} --skip-generate`
    );
    
    if (stderr && !stderr.includes('Done')) {
      console.error('Error en migración:', stderr);
      // Revertir cambios en schema
      schemaContent = schemaContent.replace(prismaModel, '');
      await fs.writeFile(schemaPath, schemaContent);
      
      return NextResponse.json(
        { success: false, error: 'Error al ejecutar migración: ' + stderr },
        { status: 500 }
      );
    }

    // 6. Generar cliente Prisma
    console.log('Generando cliente Prisma...');
    await execAsync('npx prisma generate');

    // 7. Crear configuración de webhook
    const config = await prisma.webhookConfig.create({
      data: {
        tabla: tableName,
        nombre: displayName || tableName,
        categoria: categorizeTable(tableName),
        color: getColorForCategory(categorizeTable(tableName)),
        isEnabled: true, // Habilitada por defecto para sincronización inicial
        intervalMinutes,
        nextSyncAt: new Date(Date.now() + 5000), // Sincronizar en 5 segundos
        totalSyncs: 0,
        successSyncs: 0,
        errorSyncs: 0
      }
    });

    // 8. Realizar sincronización inicial
    console.log('Iniciando sincronización de datos...');
    const syncResult = await syncTableData(tableName, config.id);

    return NextResponse.json({
      success: true,
      config,
      model: prismaModel,
      syncResult,
      message: `Tabla ${tableName} agregada exitosamente a Prisma y sincronizada`
    });

  } catch (error) {
    console.error('Error generating schema:', error);
    return NextResponse.json(
      { success: false, error: 'Error al generar esquema: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

async function syncTableData(tableName: string, configId: string) {
  const startTime = Date.now();
  
  try {
    // Obtener datos desde Ramp
    const rampData = await ventasDb.query(`SELECT * FROM ${tableName}`, []);
    
    if (!rampData || (rampData as any[]).length === 0) {
      return {
        success: true,
        recordsProcessed: 0,
        recordsInserted: 0,
        message: 'No hay datos para sincronizar'
      };
    }

    let inserted = 0;
    let errors = 0;

    // Insertar datos en batch
    const batchSize = 100;
    const records = rampData as any[];
    
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      
      try {
        // Usar raw query para inserción dinámica
        const columns = Object.keys(batch[0]);
        const values = batch.map((record: any) => 
          `(${columns.map(col => {
            const val = record[col];
            if (val === null) return 'NULL';
            if (typeof val === 'number') return val;
            if (val instanceof Date) return `'${val.toISOString()}'`;
            return `'${String(val).replace(/'/g, "''")}'`;
          }).join(', ')})`
        ).join(', ');
        
        const insertQuery = `
          INSERT INTO ${tableName} (${columns.join(', ')})
          VALUES ${values}
          ON DUPLICATE KEY UPDATE
          ${columns.map(col => `${col} = VALUES(${col})`).join(', ')}
        `;
        
        await prisma.$executeRawUnsafe(insertQuery);
        inserted += batch.length;
      } catch (error) {
        console.error(`Error insertando batch ${i}-${i + batchSize}:`, error);
        errors += batch.length;
      }
    }

    // Registrar log de sincronización
    await prisma.webhookSyncLog.create({
      data: {
        configId,
        status: errors > 0 ? 'ERROR' : 'SUCCESS',
        action: 'INITIAL_SYNC',
        recordsReceived: records.length,
        recordsInserted: inserted,
        recordsUpdated: 0,
        recordsDuplicate: 0,
        recordsErrors: errors,
        duration: Date.now() - startTime,
        requestPayload: { source: 'ramp', table: tableName }
      }
    });

    // Actualizar configuración
    await prisma.webhookConfig.update({
      where: { id: configId },
      data: {
        lastSyncAt: new Date(),
        totalSyncs: 1,
        successSyncs: errors === 0 ? 1 : 0,
        errorSyncs: errors > 0 ? 1 : 0,
        lastError: errors > 0 ? `${errors} errores durante sincronización` : null
      }
    });

    return {
      success: true,
      recordsProcessed: records.length,
      recordsInserted: inserted,
      recordsErrors: errors
    };

  } catch (error) {
    console.error('Error syncing table data:', error);
    
    await prisma.webhookSyncLog.create({
      data: {
        configId,
        status: 'ERROR',
        action: 'INITIAL_SYNC',
        recordsReceived: 0,
        recordsInserted: 0,
        recordsUpdated: 0,
        recordsDuplicate: 0,
        recordsErrors: 0,
        duration: Date.now() - startTime,
        errorMessage: (error as Error).message,
        requestPayload: { source: 'ramp', table: tableName }
      }
    });

    return {
      success: false,
      error: (error as Error).message
    };
  }
}

// Helper para categorizar tablas
function categorizeTable(tableName: string): string {
  const categories: Record<string, string[]> = {
    'clients': ['client', 'customer', 'account'],
    'projects': ['project', 'phase', 'stage', 'unit'],
    'finance': ['payment', 'transaction', 'invoice', 'promissory', 'movement', 'commission'],
    'legal': ['contract', 'agreement', 'document'],
    'administration': ['user', 'role', 'permission', 'config', 'log'],
    'catalog': ['catalog', 'type', 'status', 'category']
  };

  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some(keyword => tableName.toLowerCase().includes(keyword))) {
      return category;
    }
  }

  return 'other';
}

// Helper para obtener color según categoría
function getColorForCategory(category: string): string {
  const colors: Record<string, string> = {
    'clients': 'blue',
    'projects': 'green',
    'finance': 'yellow',
    'legal': 'purple',
    'administration': 'red',
    'catalog': 'indigo',
    'other': 'gray'
  };
  
  return colors[category] || 'gray';
}
