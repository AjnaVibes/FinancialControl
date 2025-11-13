import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { directSyncService } from '@/services/sync/directSyncService'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    
    // Obtener configuración de la tabla
    const config = await prisma.webhookConfig.findUnique({
      where: { id }
    })
    
    if (!config) {
      return NextResponse.json(
        { error: 'Tabla no encontrada' },
        { status: 404 }
      )
    }
    
    if (!config.isEnabled) {
      return NextResponse.json(
        { error: 'La tabla está deshabilitada' },
        { status: 400 }
      )
    }
    
    // Ejecutar sincronización
    const startTime = Date.now()
    let success = true
    let errorMessage = null
    
    try {
      // Crear configuración de sincronización
      const syncConfig = {
        source: 'webhook',
        entityType: config.tabla,
        tableName: config.tabla,
        isEnabled: true,
        intervalMinutes: config.intervalMinutes,
        lastSyncAt: config.lastSyncAt,
        nextSyncAt: config.nextSyncAt,
        errorCount: config.errorSyncs || 0,
        lastError: config.lastError,
        webhookUrl: config.webhookUrl,
        webhookSecret: config.webhookSecret,
        config: config.metadata
      }
      
      await directSyncService.syncTable(syncConfig)
      
      // Actualizar estadísticas de éxito
      await prisma.webhookConfig.update({
        where: { id },
        data: {
          lastSyncAt: new Date(),
          nextSyncAt: new Date(Date.now() + config.intervalMinutes * 60 * 1000),
          totalSyncs: { increment: 1 },
          successSyncs: { increment: 1 },
          lastError: null
        }
      })
    } catch (syncError: any) {
      success = false
      errorMessage = syncError.message || 'Error desconocido'
      
      // Actualizar estadísticas de error
      await prisma.webhookConfig.update({
        where: { id },
        data: {
          lastSyncAt: new Date(),
          nextSyncAt: new Date(Date.now() + config.intervalMinutes * 60 * 1000),
          totalSyncs: { increment: 1 },
          errorSyncs: { increment: 1 },
          lastError: errorMessage
        }
      })
    }
    
    const duration = Date.now() - startTime
    
    // Crear log de sincronización
    await prisma.webhookSyncLog.create({
      data: {
        configId: id,
        status: success ? 'SUCCESS' : 'ERROR',
        action: 'SYNC',
        duration,
        errorMessage,
        recordsReceived: 0, // Se puede actualizar con datos reales del servicio
        recordsInserted: 0,
        recordsUpdated: 0,
        recordsDuplicate: 0,
        recordsErrors: 0
      }
    })
    
    return NextResponse.json({
      success,
      message: success 
        ? `Tabla ${config.nombre} sincronizada exitosamente` 
        : `Error al sincronizar ${config.nombre}: ${errorMessage}`,
      duration
    })
  } catch (error) {
    console.error('Error in sync API:', error)
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    )
  }
}
