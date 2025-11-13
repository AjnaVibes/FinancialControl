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

    // Obtener transacciones del proyecto
    let transactionIds: number[] = [];
    if (projectId) {
      const transactions = await prisma.transaction.findMany({
        where: { project: projectId },
        select: { id: true }
      });
      transactionIds = transactions.map(t => t.id);
    }

    // Obtener pagarés pendientes
    const today = new Date();
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const nextQuarter = new Date();
    nextQuarter.setMonth(nextQuarter.getMonth() + 3);

    const whereCondition = transactionIds.length > 0 
      ? { transaction: { in: transactionIds } }
      : {};

    // Pagarés vencidos
    const overduePromissories = await prisma.promissory.aggregate({
      where: {
        ...whereCondition,
        dueDate: { lt: today },
        isPaid: false
      },
      _sum: { amount: true },
      _count: { id: true }
    });

    // Pagarés próximos 30 días
    const next30Days = await prisma.promissory.aggregate({
      where: {
        ...whereCondition,
        dueDate: {
          gte: today,
          lt: nextMonth
        },
        isPaid: false
      },
      _sum: { amount: true },
      _count: { id: true }
    });

    // Pagarés próximos 90 días
    const next90Days = await prisma.promissory.aggregate({
      where: {
        ...whereCondition,
        dueDate: {
          gte: today,
          lt: nextQuarter
        },
        isPaid: false
      },
      _sum: { amount: true },
      _count: { id: true }
    });

    // Pagarés por mes (próximos 6 meses)
    const monthlyProjection = [];
    for (let i = 0; i < 6; i++) {
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() + i);
      startDate.setDate(1);
      
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 1);
      
      const monthData = await prisma.promissory.aggregate({
        where: {
          ...whereCondition,
          dueDate: {
            gte: startDate,
            lt: endDate
          },
          isPaid: false
        },
        _sum: { amount: true },
        _count: { id: true }
      });
      
      monthlyProjection.push({
        month: startDate.toLocaleDateString('es-MX', { month: 'short', year: 'numeric' }),
        amount: monthData._sum.amount || 0,
        count: monthData._count.id
      });
    }

    // Movimientos recientes
    const recentMovements = await prisma.movement.aggregate({
      where: transactionIds.length > 0
        ? {
            transaction: { in: transactionIds },
            paymentDate: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
          }
        : {
            paymentDate: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
          },
      _sum: {
        amount: true,
        payment: true
      },
      _count: { id: true }
    });

    // Balance de transacciones
    const transactionBalance = await prisma.transaction.aggregate({
      where: projectId ? { project: projectId } : {},
      _sum: {
        totalDebt: true,
        payments: true,
        balance: true,
        balanceDue: true
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        overdue: {
          amount: overduePromissories._sum.amount || 0,
          count: overduePromissories._count.id,
          status: 'critical'
        },
        upcoming: {
          next30Days: {
            amount: next30Days._sum.amount || 0,
            count: next30Days._count.id
          },
          next90Days: {
            amount: next90Days._sum.amount || 0,
            count: next90Days._count.id
          }
        },
        projection: monthlyProjection,
        recentIncome: {
          amount: recentMovements._sum.amount || 0,
          payment: recentMovements._sum.payment || 0,
          transactions: recentMovements._count.id
        },
        balance: {
          totalDebt: transactionBalance._sum.totalDebt || 0,
          totalPayments: transactionBalance._sum.payments || 0,
          currentBalance: transactionBalance._sum.balance || 0,
          balanceDue: transactionBalance._sum.balanceDue || 0
        },
        healthScore: calculateHealthScore({
          overdue: overduePromissories._sum.amount || 0,
          upcoming: next30Days._sum.amount || 0,
          balance: transactionBalance._sum.balance || 0
        })
      }
    });
  } catch (error) {
    console.error('Error fetching cashflow:', error);
    return NextResponse.json(
      { error: 'Error al obtener flujo de caja', details: error },
      { status: 500 }
    );
  }
}

function calculateHealthScore(data: any): string {
  const overdueRatio = data.balance > 0 ? data.overdue / data.balance : 0;
  
  if (overdueRatio > 0.2) return 'critical';
  if (overdueRatio > 0.1) return 'warning';
  return 'healthy';
}
