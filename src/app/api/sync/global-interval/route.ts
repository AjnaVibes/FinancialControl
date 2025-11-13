import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { intervalMinutes } = body
    
    // Validar que intervalMinutes sea un número válido
    if (typeof intervalMinutes !== 'number' || intervalMinutes < 1) {
      return NextResponse.json(
        { error: 'intervalMinutes debe ser un número mayor a 0' },
        { status: 400 }
      )
    }
    
    // Actualizar todas las configuraciones
    await prisma.webhookConfig.updateMany({
      data: {
        intervalMinutes,
        // Actualizar nextSyncAt para tablas habilitadas
        nextSyncAt: new Date(Date.now() + intervalMinutes * 60 * 1000)
      }
    })
    
    // Obtener el conteo de tablas actualizadas
    const count = await prisma.webhookConfig.count()
    
    return NextResponse.json({
      success: true,
      message: `Frecuencia actualizada a ${intervalMinutes} minutos para ${count} tablas`,
      intervalMinutes,
      tablesUpdated: count
    })
  } catch (error) {
    console.error('Error in global-interval API:', error)
    return NextResponse.json(
      { error: 'Error al actualizar frecuencia global' },
      { status: 500 }
    )
  }
}
