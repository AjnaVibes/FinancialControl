import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Obtener todas las configuraciones de webhook (tablas de sincronización)
    const webhookConfigs = await prisma.webhookConfig.findMany({
      orderBy: [
        { categoria: 'asc' },
        { nombre: 'asc' }
      ]
    })

    // Calcular el conteo de registros para cada tabla
    const tablesWithCounts = await Promise.all(
      webhookConfigs.map(async (config: any) => {
        let recordCount = 0
        
        try {
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
          if (model && typeof model.count === 'function') {
            recordCount = await model.count()
          }
        } catch (error) {
          console.error(`Error counting records for ${config.tabla}:`, error)
        }

        return {
          ...config,
          recordCount
        }
      })
    )

    return NextResponse.json(tablesWithCounts)
  } catch (error) {
    console.error('Error fetching sync tables:', error)
    return NextResponse.json(
      { error: 'Error al obtener las tablas' },
      { status: 500 }
    )
  }
}
