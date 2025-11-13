// src/app/api/sync/[table]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { directSyncService } from '@/services/sync/directSyncService';
import { getTableConfig } from '@/config/sync-tables.config';
import { prisma } from '@/lib/prisma';

interface Params {
  params: {
    table: string;
  };
}

/**
 * GET: Obtener información de la sincronización de una tabla específica
 */
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { table } = params;

    // Verificar si la tabla existe en la configuración
    const tableConfig = getTableConfig(table);
    if (!tableConfig) {
      return NextResponse.json({
        success: false,
        error: `Tabla '${table}' no está configurada`
      }, { status: 404 });
    }

    // Obtener configuración de webhook
    const webhookConfig = await prisma.webhookConfig.findUnique({
      where: { tabla: table }
    });

    if (!webhookConfig) {
      return NextResponse.json({
        success: false,
        error: `Configuración de webhook no encontrada para tabla '${table}'`
      }, { status: 404 });
    }

    // Obtener conteo de registros locales
    let localCount = 0;
    try {
      const { TABLE_TO_MODEL_MAP } = await import('@/config/sync-tables.config');
      const modelName = TABLE_TO_MODEL_MAP[table];
      if (modelName && (prisma as any)[modelName]) {
        const model = (prisma as any)[modelName];
        localCount = await model.count();
      }
    } catch (error) {
      console.warn(`No se pudo obtener conteo local para ${table}:`, error);
    }

    // Obtener últimos logs
    const logs = await prisma.webhookSyncLog.findMany({
      where: {
        config: { tabla: table }
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        status: true,
        action: true,
        recordsReceived: true,
        recordsInserted: true,
        recordsUpdated: true,
        recordsDuplicate: true,
        recordsErrors: true,
        duration: true,
        createdAt: true,
        errorMessage: true
      }
    });

    // Obtener estadísticas
    const stats = {
      totalSyncs: webhookConfig.totalSyncs,
      successfulSyncs: webhookConfig.successSyncs,
      failedSyncs: webhookConfig.errorSyncs,
      lastSync: webhookConfig.lastSyncAt,
      nextSync: webhookConfig.nextSyncAt,
      isEnabled: webhookConfig.isEnabled,
      successRate: webhookConfig.totalSyncs > 0 
        ? Math.round((webhookConfig.successSyncs / webhookConfig.totalSyncs) * 100)
        : 0
    };

    return NextResponse.json({
      success: true,
      table,
      config: {
        ...tableConfig,
        webhookConfig: {
          id: webhookConfig.id,
          nombre: webhookConfig.nombre,
          categoria: webhookConfig.categoria,
          icono: webhookConfig.icono,
          color: webhookConfig.color,
          isEnabled: webhookConfig.isEnabled,
          intervalMinutes: webhookConfig.intervalMinutes,
          lastError: webhookConfig.lastError
        }
      },
      localCount,
      stats,
      logs
    });

  } catch (error) {
    console.error(`[API] Error obteniendo info de ${params.table}:`, error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}

/**
 * POST: Sincronizar tabla manualmente
 */
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { table } = params;
    const { searchParams } = request.nextUrl;
    const syncType = searchParams.get('type') || 'incremental';
    const force = searchParams.get('force') === 'true';
    
    console.log(`[API] Iniciando sincronización de ${table} (${syncType})`);

    // Verificar si la tabla existe en la configuración
    const tableConfig = getTableConfig(table);
    if (!tableConfig) {
      return NextResponse.json({
        success: false,
        error: `Tabla '${table}' no está configurada`
      }, { status: 404 });
    }

    // Verificar si la tabla está habilitada (a menos que se fuerce)
    if (!tableConfig.enabled && !force) {
      return NextResponse.json({
        success: false,
        error: `Tabla '${table}' está deshabilitada. Use force=true para sincronizar de todos modos.`
      }, { status: 403 });
    }

    // Verificar dependencias
    if (tableConfig.dependencies.length > 0 && !force) {
      console.log(`[API] Verificando dependencias para ${table}:`, tableConfig.dependencies);
      
      for (const dep of tableConfig.dependencies) {
        const depConfig = await prisma.webhookConfig.findUnique({
          where: { tabla: dep }
        });
        
        if (!depConfig || !depConfig.lastSyncAt) {
          return NextResponse.json({
            success: false,
            error: `Dependencia '${dep}' no ha sido sincronizada. Sincronícela primero o use force=true.`,
            dependencies: tableConfig.dependencies
          }, { status: 400 });
        }
      }
    }

    // Configurar parámetros de sincronización
    const batchSize = syncType === 'full' ? 0 : (tableConfig.batchSize || 1000);
    
    console.log(`[API] Ejecutando sincronización ${syncType.toUpperCase()} de ${table}...`);
    
    // Ejecutar sincronización
    const result = await directSyncService.syncTable({
      tableName: table,
      batchSize: batchSize
    });

    console.log(`[API] Sincronización de ${table} completada:`, result);

    return NextResponse.json({
      success: true,
      message: `Sincronización de ${table} completada exitosamente`,
      result,
      summary: {
        table,
        type: syncType,
        totalProcessed: result.recordsProcessed,
        inserted: result.recordsInserted,
        updated: result.recordsUpdated,
        skipped: result.recordsSkipped,
        errors: result.errors,
        duration: `${(result.duration / 1000).toFixed(2)}s`,
        successRate: result.recordsProcessed > 0 
          ? `${Math.round(((result.recordsProcessed - result.errors) / result.recordsProcessed) * 100)}%`
          : '0%'
      }
    });

  } catch (error) {
    console.error(`[API] Error en sincronización de ${params.table}:`, error);
    
    // Registrar error en webhook_config
    try {
      await prisma.webhookConfig.update({
        where: { tabla: params.table },
        data: {
          errorSyncs: { increment: 1 },
          lastError: error instanceof Error ? error.message : String(error)
        }
      });
    } catch (updateError) {
      console.error('Error actualizando webhook_config:', updateError);
    }
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}

/**
 * DELETE: Limpiar datos locales de una tabla (usar con precaución)
 */
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { table } = params;
    const { searchParams } = request.nextUrl;
    const confirm = searchParams.get('confirm');
    
    if (confirm !== 'yes-delete-all-data') {
      return NextResponse.json({
        success: false,
        error: 'Debes confirmar la eliminación con ?confirm=yes-delete-all-data'
      }, { status: 400 });
    }

    // Verificar si la tabla existe
    const tableConfig = getTableConfig(table);
    if (!tableConfig) {
      return NextResponse.json({
        success: false,
        error: `Tabla '${table}' no está configurada`
      }, { status: 404 });
    }

    // Obtener el modelo y eliminar todos los registros
    const { TABLE_TO_MODEL_MAP } = await import('@/config/sync-tables.config');
    const modelName = TABLE_TO_MODEL_MAP[table];
    if (!modelName) {
      return NextResponse.json({
        success: false,
        error: `No se encontró mapeo para tabla '${table}'`
      }, { status: 404 });
    }
    
    const model = (prisma as any)[modelName];
    if (!model) {
      return NextResponse.json({
        success: false,
        error: `Modelo no encontrado para tabla '${table}'`
      }, { status: 404 });
    }
    
    const deleteResult = await model.deleteMany({});

    // Resetear configuración de sincronización
    await prisma.webhookConfig.update({
      where: { tabla: table },
      data: {
        lastSyncAt: null,
        totalSyncs: 0,
        successSyncs: 0,
        errorSyncs: 0,
        lastError: null,
        metadata: {
          ...(await prisma.webhookConfig.findUnique({ where: { tabla: table } }))?.metadata as any,
          lastReset: new Date()
        }
      }
    });

    // Eliminar logs antiguos
    await prisma.webhookSyncLog.deleteMany({
      where: {
        config: { tabla: table }
      }
    });

    console.log(`[API] ⚠️ Eliminados ${deleteResult.count} registros de ${table}`);

    return NextResponse.json({
      success: true,
      message: `Tabla ${table} reseteada exitosamente`,
      deletedRecords: deleteResult.count
    });

  } catch (error) {
    console.error(`[API] Error reseteando ${params.table}:`, error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}
