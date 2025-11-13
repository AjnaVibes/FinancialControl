import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    // Obtener todas las configuraciones
    const configs = await prisma.webhookConfig.findMany()
    
    if (configs.length === 0) {
      return NextResponse.json(
        { error: 'No hay tablas configuradas' },
        { status: 400 }
      )
    }
    
    // Mapear todas las tablas a modelos Prisma
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
    
    let totalRecordsDeleted = 0
    const results = []
    
    // Resetear cada tabla
    for (const config of configs) {
      const model = tableMapping[config.tabla]
      
      if (model && typeof model.deleteMany === 'function') {
        try {
          // Contar registros antes de eliminar
          const recordsBefore = await model.count()
          
          // Eliminar todos los registros
          await model.deleteMany({})
          
          totalRecordsDeleted += recordsBefore
          
          // Actualizar configuración
          await prisma.webhookConfig.update({
            where: { id: config.id },
            data: {
              lastSyncAt: null,
              nextSyncAt: config.isEnabled 
                ? new Date(Date.now() + config.intervalMinutes * 60 * 1000)
                : null,
              totalSyncs: 0,
              successSyncs: 0,
              errorSyncs: 0,
              lastError: null
            }
          })
          
          // Crear log de reset
          await prisma.webhookSyncLog.create({
            data: {
              configId: config.id,
              status: 'SUCCESS',
              action: 'RESET_ALL',
              recordsReceived: 0,
              recordsInserted: 0,
              recordsUpdated: 0,
              recordsDuplicate: 0,
              recordsErrors: 0,
              duration: 0,
              errorMessage: null
            }
          })
          
          results.push({
            table: config.nombre,
            success: true,
            recordsDeleted: recordsBefore
          })
        } catch (error: any) {
          results.push({
            table: config.nombre,
            success: false,
            error: error.message
          })
        }
      }
    }
    
    // Limpiar todos los logs anteriores
    await prisma.webhookSyncLog.deleteMany({})
    
    return NextResponse.json({
      success: true,
      message: `Se han reseteado ${configs.length} tablas y eliminado ${totalRecordsDeleted} registros`,
      totalTables: configs.length,
      totalRecordsDeleted,
      results
    })
  } catch (error) {
    console.error('Error in reset-all API:', error)
    return NextResponse.json(
      { error: 'Error al resetear todas las tablas' },
      { status: 500 }
    )
  }
}
