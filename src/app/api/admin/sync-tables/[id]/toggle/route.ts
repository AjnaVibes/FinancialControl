// src/app/api/admin/sync-tables/[id]/toggle/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json();
    const { enabled } = body;

    // Obtener configuración de la tabla
    const config = await prisma.webhookConfig.findUnique({
      where: { id }
    });

    if (!config) {
      return NextResponse.json(
        { success: false, error: 'Tabla no encontrada' },
        { status: 404 }
      );
    }

    // Actualizar estado de la tabla
    const updated = await prisma.webhookConfig.update({
      where: { id },
      data: {
        isEnabled: enabled,
        // Si se está habilitando, programar próxima sincronización
        nextSyncAt: enabled 
          ? new Date(Date.now() + config.intervalMinutes * 60 * 1000)
          : null
      }
    });

    // Registrar log
    await prisma.webhookSyncLog.create({
      data: {
        configId: id,
        status: 'SUCCESS',
        action: enabled ? 'ENABLE' : 'DISABLE',
        recordsReceived: 0,
        recordsInserted: 0,
        recordsUpdated: 0,
        recordsDuplicate: 0,
        recordsErrors: 0,
        duration: 0,
        requestPayload: { enabled }
      }
    });

    return NextResponse.json({
      success: true,
      enabled: updated.isEnabled,
      message: `Tabla ${config.tabla} ${enabled ? 'habilitada' : 'deshabilitada'} exitosamente`
    });

  } catch (error) {
    console.error('Error toggling table:', error);
    return NextResponse.json(
      { success: false, error: 'Error al cambiar estado de tabla' },
      { status: 500 }
    );
  }
}
