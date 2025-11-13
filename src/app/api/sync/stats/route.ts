import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Obtener configuraciones de webhook
    const webhookConfigs = await prisma.webhookConfig.findMany()
    
    // Calcular estadísticas generales
    const totalTables = webhookConfigs.length
    const enabledTables = webhookConfigs.filter(c => c.isEnabled).length
    
    // Obtener último sync global
    const lastGlobalSync = webhookConfigs.reduce((latest: Date | null, config) => {
      if (!config.lastSyncAt) return latest
      if (!latest) return config.lastSyncAt
      return config.lastSyncAt > latest ? config.lastSyncAt : latest
    }, null)
    
    // Obtener próximo sync global
    const nextGlobalSync = webhookConfigs.reduce((earliest: Date | null, config) => {
      if (!config.nextSyncAt || !config.isEnabled) return earliest
      if (!earliest) return config.nextSyncAt
      return config.nextSyncAt < earliest ? config.nextSyncAt : earliest
    }, null)
    
    // Calcular salud del sistema (porcentaje de sincronizaciones exitosas)
    let syncHealth = 0
    if (totalTables > 0) {
      const totalSyncs = webhookConfigs.reduce((sum, c) => sum + c.totalSyncs, 0)
      const successSyncs = webhookConfigs.reduce((sum, c) => sum + c.successSyncs, 0)
      
      if (totalSyncs > 0) {
        syncHealth = Math.round((successSyncs / totalSyncs) * 100)
      }
    }
    
    // Calcular total de registros
    let totalRecords = 0
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
    
    for (const config of webhookConfigs) {
      const model = tableMapping[config.tabla]
      if (model && typeof model.count === 'function') {
        try {
          const count = await model.count()
          totalRecords += count
        } catch (error) {
          console.error(`Error counting ${config.tabla}:`, error)
        }
      }
    }
    
    return NextResponse.json({
      totalTables,
      enabledTables,
      totalRecords,
      lastGlobalSync,
      nextGlobalSync,
      syncHealth
    })
  } catch (error) {
    console.error('Error fetching sync stats:', error)
    return NextResponse.json(
      { error: 'Error al obtener estadísticas' },
      { status: 500 }
    )
  }
}
