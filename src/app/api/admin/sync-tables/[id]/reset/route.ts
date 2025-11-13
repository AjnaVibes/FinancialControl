// src/app/api/admin/sync-tables/[id]/reset/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

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

    // Solo permitir reset de tablas sincronizadas
    const syncTables = ['clients', 'projects', 'units', 'transactions', 'promissories', 'movements'];
    
    if (!syncTables.includes(config.tabla)) {
      return NextResponse.json(
        { success: false, error: 'Esta tabla no se puede resetear' },
        { status: 400 }
      );
    }

    // Vaciar tabla según el tipo
    let deletedCount = 0;
    
    switch(config.tabla) {
      case 'clients':
        const clientResult = await prisma.client.deleteMany();
        deletedCount = clientResult.count;
        break;
      case 'projects':
        const projectResult = await prisma.project.deleteMany();
        deletedCount = projectResult.count;
        break;
      case 'units':
        const unitResult = await prisma.unit.deleteMany();
        deletedCount = unitResult.count;
        break;
      case 'transactions':
        const transactionResult = await prisma.transaction.deleteMany();
        deletedCount = transactionResult.count;
        break;
      case 'promissories':
        const promissoryResult = await prisma.promissory.deleteMany();
        deletedCount = promissoryResult.count;
        break;
      case 'movements':
        const movementResult = await prisma.movement.deleteMany();
        deletedCount = movementResult.count;
        break;
    }

    // Actualizar configuración
    await prisma.webhookConfig.update({
      where: { id },
      data: {
        lastSyncAt: null,
        nextSyncAt: new Date(Date.now() + config.intervalMinutes * 60 * 1000),
        totalSyncs: 0,
        successSyncs: 0,
        errorSyncs: 0,
        lastError: null
      }
    });

    // Registrar log
    await prisma.webhookSyncLog.create({
      data: {
        configId: id,
        status: 'SUCCESS',
        action: 'RESET',
        recordsReceived: 0,
        recordsInserted: 0,
        recordsUpdated: 0,
        recordsDuplicate: 0,
        recordsErrors: 0,
        duration: 0,
        requestPayload: { deletedCount }
      }
    });

    return NextResponse.json({
      success: true,
      deletedCount,
      message: `Tabla ${config.tabla} vaciada exitosamente`
    });

  } catch (error) {
    console.error('Error resetting table:', error);
    return NextResponse.json(
      { success: false, error: 'Error al vaciar tabla' },
      { status: 500 }
    );
  }
}
