import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const projectName = searchParams.get('projectName');

    let projectId: number | undefined;
    if (projectName) {
      const project = await prisma.project.findFirst({
        where: { name: projectName },
        select: { id: true }
      });
      projectId = project?.id;
    }

    const whereCondition = projectId ? { project: projectId } : {};

    // Velocidad de absorción
    const totalUnits = await prisma.unit.count({
      where: whereCondition
    });

    const soldUnits = await prisma.transaction.count({
      where: {
        ...(projectId ? { project: projectId } : {}),
        unit: { not: null }
      }
    });

    const absorptionRate = totalUnits > 0 ? (soldUnits / totalUnits) * 100 : 0;

    // Ticket promedio
    const avgTicket = await prisma.transaction.aggregate({
      where: whereCondition,
      _avg: { totalDebt: true }
    });

    // Tasa de cancelación
    const totalTransactions = await prisma.transaction.count({
      where: whereCondition
    });

    const cancelledTransactions = await prisma.transaction.count({
      where: {
        ...whereCondition,
        transactionStatus: 5 // Canceladas
      }
    });

    const cancellationRate = totalTransactions > 0 
      ? (cancelledTransactions / totalTransactions) * 100 
      : 0;

    // Eficiencia comercial
    const quotations = await prisma.quotation.count({
      where: whereCondition
    });

    const conversionRate = quotations > 0 
      ? (soldUnits / quotations) * 100 
      : 0;

    // ROI del proyecto
    const totalRevenue = await prisma.transaction.aggregate({
      where: whereCondition,
      _sum: { totalDebt: true }
    });

    const totalPayments = await prisma.transaction.aggregate({
      where: whereCondition,
      _sum: { payments: true }
    });

    // Tiempo promedio de cierre
    const transactionsWithDates = await prisma.transaction.findMany({
      where: {
        ...whereCondition,
        createdAt: { not: null },
        updatedAt: { not: null }
      },
      select: {
        createdAt: true,
        updatedAt: true
      }
    });

    const avgClosingTime = transactionsWithDates.length > 0
      ? transactionsWithDates.reduce((acc, t) => {
          if (t.updatedAt && t.createdAt) {
            const diff = new Date(t.updatedAt).getTime() - new Date(t.createdAt).getTime();
            return acc + (diff / (1000 * 60 * 60 * 24)); // Días
          }
          return acc;
        }, 0) / transactionsWithDates.length
      : 0;

    // Índice de morosidad
    const overduePromissories = await prisma.promissory.count({
      where: {
        ...(transactionsWithDates.length > 0 
          ? { transaction: { in: transactionsWithDates.map(t => t.createdAt as any) } }
          : {}),
        dueDate: { lt: new Date() },
        isPaid: false
      }
    });

    const totalPromissories = await prisma.promissory.count({
      where: transactionsWithDates.length > 0
        ? { transaction: { in: transactionsWithDates.map(t => t.createdAt as any) } }
        : {}
    });

    const delinquencyRate = totalPromissories > 0
      ? (overduePromissories / totalPromissories) * 100
      : 0;

    // Productividad por m2
    const totalSurface = await prisma.unit.aggregate({
      where: whereCondition,
      _sum: { surface: true }
    });

    const revenuePerSqm = totalSurface._sum.surface && totalSurface._sum.surface > 0
      ? Number(totalRevenue._sum.totalDebt || 0) / Number(totalSurface._sum.surface)
      : 0;

    // Calculando salud general del proyecto
    const projectHealth = calculateProjectHealth({
      absorptionRate,
      cancellationRate,
      delinquencyRate,
      conversionRate
    });

    return NextResponse.json({
      success: true,
      data: {
        salesMetrics: {
          absorptionRate: absorptionRate,
          avgTicket: Number(avgTicket._avg.totalDebt || 0),
          conversionRate: conversionRate,
          avgClosingTime: avgClosingTime,
          unitsPerMonth: soldUnits > 0 ? soldUnits / 12 : 0 // Estimado
        },
        financialMetrics: {
          totalRevenue: Number(totalRevenue._sum.totalDebt || 0),
          collectedRevenue: Number(totalPayments._sum.payments || 0),
          collectionRate: Number(totalRevenue._sum.totalDebt || 0) > 0
            ? (Number(totalPayments._sum.payments || 0) / Number(totalRevenue._sum.totalDebt || 0)) * 100
            : 0,
          revenuePerSqm: revenuePerSqm
        },
        riskMetrics: {
          cancellationRate: cancellationRate,
          delinquencyRate: delinquencyRate,
          cancelledUnits: cancelledTransactions,
          overdueAmount: overduePromissories
        },
        efficiency: {
          leadToSale: conversionRate,
          costOfSale: 0, // Requeriría datos de costos
          roi: 0, // Requeriría datos de inversión
          projectHealth: projectHealth
        },
        summary: {
          totalUnits: totalUnits,
          soldUnits: soldUnits,
          availableUnits: totalUnits - soldUnits,
          totalQuotations: quotations,
          activeTransactions: totalTransactions - cancelledTransactions
        }
      }
    });
  } catch (error) {
    console.error('Error fetching KPIs:', error);
    return NextResponse.json(
      { error: 'Error al obtener KPIs ejecutivos', details: error },
      { status: 500 }
    );
  }
}

function calculateProjectHealth(metrics: any): string {
  let score = 100;
  
  // Penalizaciones
  if (metrics.absorptionRate < 50) score -= 20;
  if (metrics.cancellationRate > 10) score -= 25;
  if (metrics.delinquencyRate > 15) score -= 25;
  if (metrics.conversionRate < 20) score -= 15;
  
  if (score >= 80) return 'excellent';
  if (score >= 60) return 'good';
  if (score >= 40) return 'regular';
  return 'critical';
}
