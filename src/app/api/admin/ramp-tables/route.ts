// src/app/api/admin/ramp-tables/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ventasDb } from '@/lib/ventasDb';

export async function GET() {
  try {
    // Obtener lista de tablas directamente desde Ramp (ventas DB)
    const rampTablesResult = await ventasDb.query(`
      SELECT 
        TABLE_NAME as tableName,
        TABLE_ROWS as recordCount
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = DATABASE()
      ORDER BY TABLE_NAME
    `, []);

    // Obtener columnas para cada tabla
    const rampTables = await Promise.all(
      rampTablesResult.map(async (table: any) => {
        const columns = await ventasDb.query(`
          SELECT 
            COLUMN_NAME as name,
            DATA_TYPE as type,
            IS_NULLABLE as nullable,
            COLUMN_KEY as key_type,
            COLUMN_COMMENT as comment
          FROM information_schema.COLUMNS
          WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = ?
          ORDER BY ORDINAL_POSITION
        `, [table.tableName]);

        // Obtener si ya está sincronizada
        const isSynced = await prisma.webhookConfig.findFirst({
          where: { tabla: table.tableName }
        });

        return {
          name: table.tableName,
          displayName: table.tableName.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
          recordCount: Number(table.recordCount || 0),
          columns: (columns as any[]).map((col: any) => ({
            name: col.name,
            type: col.type,
            nullable: col.nullable === 'YES',
            isPrimaryKey: col.key_type === 'PRI',
            isForeignKey: col.key_type === 'MUL'
          })),
          isSynced: !!isSynced,
          syncedAt: isSynced?.lastSyncAt?.toISOString() || null
        };
      })
    );

    // Obtener tablas actuales en Prisma para las relaciones
    const prismaTablesResult = await prisma.$queryRaw`
      SELECT 
        TABLE_NAME as tableName
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = DATABASE()
      ORDER BY TABLE_NAME
    ` as any[];

    const prismaTables = prismaTablesResult.map((t: any) => ({
      name: t.tableName,
      displayName: t.tableName.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
      canBeRelated: true
    }));

    // Analizar posibles relaciones basadas en nombres de columnas
    const analyzedTables = rampTables.map(table => {
      const possibleRelations: any[] = [];
      
      // Buscar columnas que parezcan foreign keys
      table.columns.forEach((column: any) => {
        // Buscar patrones comunes de foreign keys
        if (column.name.endsWith('_id') || column.name.endsWith('Id')) {
          const relatedTableName = column.name.replace(/_id$/i, '').replace(/Id$/i, '');
          const relatedTable = prismaTables.find(t => 
            t.name.toLowerCase() === relatedTableName.toLowerCase() ||
            t.name.toLowerCase() === relatedTableName.toLowerCase() + 's'
          );
          
          if (relatedTable) {
            possibleRelations.push({
              column: column.name,
              relatedTable: relatedTable.name,
              type: 'belongsTo'
            });
          }
        }
      });

      return {
        ...table,
        possibleRelations,
        category: categorizeTable(table.name)
      };
    });

    return NextResponse.json({
      success: true,
      tables: analyzedTables.filter(t => !t.isSynced), // Solo mostrar las no sincronizadas
      prismaTables, // Tablas disponibles para relaciones
      summary: {
        totalRampTables: rampTables.length,
        syncedTables: rampTables.filter(t => t.isSynced).length,
        availableToSync: rampTables.filter(t => !t.isSynced).length
      }
    });

  } catch (error) {
    console.error('Error fetching Ramp tables:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener tablas de Ramp' },
      { status: 500 }
    );
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

// Endpoint para agregar una nueva tabla a sincronización
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { tableName, displayName, relatedTables, intervalMinutes = 60 } = body;

    // Verificar que la tabla existe en Ramp
    const tableExists = await ventasDb.query(`
      SELECT COUNT(*) as count
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = ?
    `, [tableName]);

    if (!(tableExists as any[])[0].count) {
      return NextResponse.json(
        { success: false, error: 'La tabla no existe en Ramp' },
        { status: 400 }
      );
    }

    // Crear configuración de webhook para la nueva tabla
    const config = await prisma.webhookConfig.create({
      data: {
        tabla: tableName,
        nombre: displayName || tableName,
        categoria: categorizeTable(tableName),
        color: getColorForCategory(categorizeTable(tableName)),
        isEnabled: false, // Deshabilitada por defecto
        intervalMinutes,
        nextSyncAt: new Date(Date.now() + intervalMinutes * 60 * 1000),
        totalSyncs: 0,
        successSyncs: 0,
        errorSyncs: 0
      }
    });

    // Registrar log de creación
    await prisma.webhookSyncLog.create({
      data: {
        configId: config.id,
        status: 'SUCCESS',
        action: 'CREATE',
        recordsReceived: 0,
        recordsInserted: 0,
        recordsUpdated: 0,
        recordsDuplicate: 0,
        recordsErrors: 0,
        duration: 0,
        requestPayload: { tableName, displayName, relatedTables }
      }
    });

    return NextResponse.json({
      success: true,
      config,
      message: `Tabla ${tableName} agregada exitosamente a la sincronización`
    });

  } catch (error) {
    console.error('Error adding table to sync:', error);
    return NextResponse.json(
      { success: false, error: 'Error al agregar tabla a sincronización' },
      { status: 500 }
    );
  }
}
