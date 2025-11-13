import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    const { isEnabled } = body
    
    // Validar que isEnabled sea booleano
    if (typeof isEnabled !== 'boolean') {
      return NextResponse.json(
        { error: 'isEnabled debe ser un valor booleano' },
        { status: 400 }
      )
    }
    
    // Obtener configuración actual
    const config = await prisma.webhookConfig.findUnique({
      where: { id }
    })
    
    if (!config) {
      return NextResponse.json(
        { error: 'Tabla no encontrada' },
        { status: 404 }
      )
    }
    
    // Actualizar estado
    const updatedConfig = await prisma.webhookConfig.update({
      where: { id },
      data: {
        isEnabled,
        // Si se está habilitando, calcular próxima sincronización
        nextSyncAt: isEnabled 
          ? new Date(Date.now() + config.intervalMinutes * 60 * 1000)
          : null
      }
    })
    
    // Crear log de cambio de estado
    await prisma.webhookSyncLog.create({
      data: {
        configId: id,
        status: 'SUCCESS',
        action: isEnabled ? 'ENABLE' : 'DISABLE',
        recordsReceived: 0,
        recordsInserted: 0,
        recordsUpdated: 0,
        recordsDuplicate: 0,
        recordsErrors: 0,
        duration: 0,
        errorMessage: null
      }
    })
    
    return NextResponse.json({
      success: true,
      message: `Tabla ${config.nombre} ${isEnabled ? 'habilitada' : 'deshabilitada'}`,
      isEnabled: updatedConfig.isEnabled
    })
  } catch (error) {
    console.error('Error in toggle API:', error)
    return NextResponse.json(
      { error: 'Error al cambiar estado de la tabla' },
      { status: 500 }
    )
  }
}
