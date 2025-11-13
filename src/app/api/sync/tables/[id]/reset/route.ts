import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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
    
    // Mapear nombre de tabla a modelo Prisma
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
      return NextResponse.json(
        { error: 'Modelo de tabla no encontrado' },
        { status: 400 }
      )
    }
    
    // Contar registros antes de eliminar
    let recordsBefore = 0
    try {
      recordsBefore = await model.count()
    } catch (error) {
      console.error('Error counting records:', error)
    }
    
    // Eliminar todos los registros de la tabla
    try {
      await model.deleteMany({})
    } catch (error) {
      console.error('Error deleting records:', error)
      return NextResponse.json(
        { error: 'Error al eliminar registros' },
        { status: 500 }
      )
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
    })
    
    // Crear log de reset
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
        errorMessage: null
      }
    })
    
    return NextResponse.json({
      success: true,
      message: `Tabla ${config.nombre} reseteada exitosamente`,
      recordsDeleted: recordsBefore
    })
  } catch (error) {
    console.error('Error in reset API:', error)
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    )
  }
}
