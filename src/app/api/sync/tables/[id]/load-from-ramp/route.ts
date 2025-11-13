import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ventasDb } from '@/lib/ventasDb'

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
    
    const startTime = Date.now()
    let recordsLoaded = 0
    let success = true
    let errorMessage = null
    
    try {
      // Ejecutar consulta según la tabla
      const rows = await ventasDb.query(`SELECT * FROM ${config.tabla}`)
      
      if (!Array.isArray(rows)) {
        throw new Error('Respuesta inesperada de la base de datos')
      }
      
      // Mapear tabla a modelo Prisma
      const tableMapping: Record<string, any> = {
        'clients': prisma.client,
        'marital_statuses': prisma.maritalStatus,
        'marital_registries': prisma.maritalRegistry,
        'marital_regimen': prisma.maritalRegimen,
        'client_statuses': prisma.clientStatus,
        'project_statuses': prisma.projectStatus,
        'phase_statuses': prisma.phaseStatus,
        'quotation_statuses': prisma.quotationStatus,
        'promise_types': prisma.promiseType,
        'transaction_statuses': prisma.transactionStatus,
        'operates': prisma.operate,
        'agencies': prisma.agency,
        'coordinators': prisma.coordinator,
        'agents': prisma.agent,
        'beneficiaries': prisma.beneficiary,
        'client_references': prisma.clientReference,
        'developers': prisma.developer,
        'sub_developers': prisma.subDeveloper,
        'projects': prisma.project,
        'facades': prisma.facade,
        'phases': prisma.phase,
        'prototypes': prisma.prototype,
        'sub_prototypes': prisma.subPrototype,
        'units': prisma.unit,
        'quotations': prisma.quotation,
        'transactions': prisma.transaction,
        'movements': prisma.movement,
        'promissories': prisma.promissory,
        'payment_methods': prisma.paymentMethod,
        'payment_entities': prisma.paymentEntity,
        'references': prisma.reference,
        'deposits': prisma.deposit,
        'movement_methods': prisma.movementMethod,
        'creditos': prisma.credit,
        'credit_types': prisma.creditType,
        'credit_statuses': prisma.creditStatus,
        'financing_types': prisma.financingType,
        'financial_institutions': prisma.financialInstitution,
        'credit_stages': prisma.creditStage,
        'invoices': prisma.invoice
      }
      
      const model = tableMapping[config.tabla]
      
      if (!model) {
        throw new Error(`Modelo no encontrado para tabla ${config.tabla}`)
      }
      
      // Eliminar registros existentes
      await model.deleteMany({})
      
      // Insertar nuevos registros
      if (rows.length > 0) {
        // Para algunas tablas necesitamos procesamiento especial
        if (config.tabla === 'clients') {
          // Procesar clientes uno por uno por las fechas
          for (const row of rows as any[]) {
            const processedRow = {
              ...row,
              birthday: row.birthday ? new Date(row.birthday) : null,
              created_at: row.created_at ? new Date(row.created_at) : null,
              updated_at: row.updated_at ? new Date(row.updated_at) : null,
              completion_date: row.completion_date ? new Date(row.completion_date) : null,
              campaign_form_date: row.campaign_form_date ? new Date(row.campaign_form_date) : null,
              last_contact: row.last_contact ? new Date(row.last_contact) : null,
              change_phase_date: row.change_phase_date ? new Date(row.change_phase_date) : null,
              assigned_at: row.assigned_at ? new Date(row.assigned_at) : null,
            }
            
            await model.create({ data: processedRow })
            recordsLoaded++
          }
        } else {
          // Para otras tablas, inserción masiva
          await model.createMany({
            data: rows
          })
          recordsLoaded = rows.length
        }
      }
      
      // Actualizar estadísticas
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
      
      // No cerrar la conexión aquí ya que es un pool compartido
    } catch (loadError: any) {
      success = false
      errorMessage = loadError.message || 'Error desconocido'
      
      // Actualizar estadísticas de error
      await prisma.webhookConfig.update({
        where: { id },
        data: {
          lastSyncAt: new Date(),
          totalSyncs: { increment: 1 },
          errorSyncs: { increment: 1 },
          lastError: errorMessage
        }
      })
    }
    
    const duration = Date.now() - startTime
    
    // Crear log
    await prisma.webhookSyncLog.create({
      data: {
        configId: id,
        status: success ? 'SUCCESS' : 'ERROR',
        action: 'LOAD_FROM_RAMP',
        duration,
        errorMessage,
        recordsReceived: recordsLoaded,
        recordsInserted: recordsLoaded,
        recordsUpdated: 0,
        recordsDuplicate: 0,
        recordsErrors: success ? 0 : recordsLoaded
      }
    })
    
    return NextResponse.json({
      success,
      message: success 
        ? `${recordsLoaded} registros cargados desde Ramp para ${config.nombre}` 
        : `Error al cargar desde Ramp: ${errorMessage}`,
      recordsLoaded,
      duration
    })
  } catch (error) {
    console.error('Error in load-from-ramp API:', error)
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    )
  }
}
