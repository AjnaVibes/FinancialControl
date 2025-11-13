// src/app/api/sync/clients/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { directSyncService } from '@/services/sync/directSyncService';

/**
 * GET: Obtener información de la sincronización de clients
 */
export async function GET() {
  try {
    const { prisma } = await import('@/lib/prisma');
    
    // Obtener configuración
    const config = await prisma.webhookConfig.findUnique({
      where: { tabla: 'clients' }
    });

    // Obtener conteo de registros locales
    const localCount = await prisma.client.count();

    // Obtener últimos logs
    const logs = await prisma.webhookSyncLog.findMany({
      where: {
        config: { tabla: 'clients' }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    return NextResponse.json({
      success: true,
      config,
      localCount,
      logs
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}

/**
 * POST: Sincronizar clients manualmente
 */
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const syncType = searchParams.get('type') || 'incremental';
    const batchSize = parseInt(searchParams.get('batchSize') || '1000');

    console.log(`[API] Iniciando sincronización de clients (${syncType})`);

    const config = {
      tableName: 'clients',
      primaryKey: 'id',
      timestampField: 'updated_at',
      batchSize
    };

    // Ajustar batchSize según el tipo de sincronización
    if (syncType === 'full') {
      console.log('[API] Ejecutando sincronización COMPLETA...');
      config.batchSize = 0; // 0 significa sin límite
    } else {
      console.log('[API] Ejecutando sincronización INCREMENTAL...');
    }
    
    const result = await directSyncService.syncTable(config);

    console.log('[API] Sincronización completada:', result);

    return NextResponse.json({
      success: true,
      message: 'Sincronización completada exitosamente',
      result
    });

  } catch (error) {
    console.error('[API] Error en sincronización:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
