import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { syncService } from '@/services/sync/directSyncService'

// Mismo orden que el script que funciona
const SYNC_ORDER = [
  'marital_statuses',
  'marital_registries',
  'marital_regimen',
  'client_statuses',
  'project_statuses',
  'phase_statuses',
  'quotation_statuses',
  'promise_types',
  'transaction_statuses',
  'operates',
  'developers',
  'sub_developers',
  'projects',
  'agencies',
  'coordinators',
  'agents',
  'clients',
  'beneficiaries',
  'client_references',
  'payment_methods',
  'payment_entities',
  'deposits',
  'facades',
  'phases',
  'prototipes',
  'sub_prototypes',
  'units',
  'quotations',
  'transactions',
  'references',
  'movements',
  'promissories',
]

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Iniciando sincronización completa de todas las tablas...')
    
    const results: any = {}
    let totalInserted = 0
    let totalUpdated = 0
    let totalErrors = 0
    let successCount = 0
    let errorCount = 0
    
    // Obtener configuraciones para actualizar estadísticas
    const configs = await prisma.webhookConfig.findMany()
    const configMap = new Map(configs.map(c => [c.tabla, c]))
    
    for (let i = 0; i < SYNC_ORDER.length; i++) {
      const tableName = SYNC_ORDER[i]
      const config = configMap.get(tableName)
      
      // Solo sincronizar si la tabla está habilitada o no tiene configuración
      if (config && !config.isEnabled) {
        console.log(`⏭️  Omitiendo ${tableName} (deshabilitada)`)
        continue
      }
      
      console.log(`[${i + 1}/${SYNC_ORDER.length}] Sincronizando ${tableName}...`)
      
      try {
        // Usar la misma lógica del script que funciona
        const result = await syncService.syncTable({
          tableName,
          primaryKey: 'id',
          timestampField: 'updated_at',
          batchSize: 0  // Sin límite - sincroniza todo
        })
        
        results[tableName] = result
        totalInserted += result.recordsInserted
        totalUpdated += result.recordsUpdated
        totalErrors += result.errors
        
        if (result.errors === 0) {
          successCount++
        } else {
          errorCount++
        }
        
        // Actualizar estadísticas en webhookConfig si existe
        if (config) {
          await prisma.webhookConfig.update({
            where: { id: config.id },
            data: {
              lastSyncAt: new Date(),
              nextSyncAt: new Date(Date.now() + config.intervalMinutes * 60 * 1000),
              totalSyncs: { increment: 1 },
              successSyncs: result.errors === 0 ? { increment: 1 } : undefined,
              errorSyncs: result.errors > 0 ? { increment: 1 } : undefined,
              lastError: result.errors > 0 ? `${result.errors} errores durante la sincronización` : null
            }
          })
          
          // Crear log de sincronización
          await prisma.webhookSyncLog.create({
            data: {
              configId: config.id,
              status: result.errors === 0 ? 'SUCCESS' : 'ERROR',
              action: 'SYNC_ALL',
              duration: result.duration || 0,
              errorMessage: result.errors > 0 ? `${result.errors} errores` : null,
              recordsReceived: result.recordsInserted + result.recordsUpdated,
              recordsInserted: result.recordsInserted,
              recordsUpdated: result.recordsUpdated,
              recordsDuplicate: 0,
              recordsErrors: result.errors
            }
          })
        }
        
        console.log(`✅ ${tableName}: ${result.recordsInserted} insertados, ${result.recordsUpdated} actualizados`)
        
      } catch (error: any) {
        console.error(`❌ Error en ${tableName}:`, error.message)
        results[tableName] = { error: error.message }
        totalErrors++
        errorCount++
        
        // Actualizar error en webhookConfig si existe
        if (config) {
          await prisma.webhookConfig.update({
            where: { id: config.id },
            data: {
              lastSyncAt: new Date(),
              errorSyncs: { increment: 1 },
              lastError: error.message
            }
          })
        }
      }
    }
    
    console.log('✅ Sincronización completada')
    console.log(`📊 Total: ${totalInserted} insertados, ${totalUpdated} actualizados, ${totalErrors} errores`)
    
    return NextResponse.json({
      success: true,
      message: `Sincronización completada: ${(totalInserted + totalUpdated).toLocaleString()} registros procesados`,
      totalTables: SYNC_ORDER.length,
      totalInserted,
      totalUpdated,
      totalErrors,
      successCount,
      errorCount,
      results
    })
    
  } catch (error) {
    console.error('Error en sincronización global:', error)
    return NextResponse.json(
      { error: 'Error al sincronizar todas las tablas', details: error },
      { status: 500 }
    )
  }
}
