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
    const range = searchParams.get('range') || '30d';

    let projectId: number | undefined;
    if (projectName) {
      const project = await prisma.project.findFirst({
        where: { name: projectName },
        select: { id: true }
      });
      projectId = project?.id;
    }

    // Calcular fechas según el rango
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    let startDate = new Date();
    if (range === '7d') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (range === '30d') {
      startDate.setDate(startDate.getDate() - 30);
    } else if (range === '90d') {
      startDate.setDate(startDate.getDate() - 90);
    } else if (range === '1y') {
      startDate.setFullYear(startDate.getFullYear() - 1);
    } else {
      startDate.setFullYear(startDate.getFullYear() - 5); // "all" - últimos 5 años
    }
    startDate.setHours(0, 0, 0, 0);

    // Obtener transacciones del proyecto
    const transactions = await prisma.transaction.findMany({
      where: {
        ...(projectId ? { project: projectId } : {}),
        createdAt: { gte: startDate },
        transactionStatus: { not: 5 } // Excluir canceladas
      },
      select: {
        id: true,
        createdAt: true,
        totalDebt: true,
        payments: true
      },
      orderBy: { createdAt: 'asc' }
    });

    // Obtener movimientos
    const transactionIds = transactions.map(t => t.id);
    const movements = await prisma.movement.findMany({
      where: {
        transaction: { in: transactionIds },
        paymentDate: { gte: startDate }
      },
      select: {
        transaction: true,
        paymentDate: true,
        amount: true,
        payment: true
      },
      orderBy: { paymentDate: 'asc' }
    });

    // Agrupar datos por día
    const salesByDate = new Map();
    const movementsByDate = new Map();
    
    // Procesar transacciones (ventas)
    transactions.forEach(t => {
      const dateKey = t.createdAt ? new Date(t.createdAt).toISOString().split('T')[0] : '';
      if (!dateKey) return;
      if (!salesByDate.has(dateKey)) {
        salesByDate.set(dateKey, { sales: 0, count: 0 });
      }
      const dayData = salesByDate.get(dateKey);
      dayData.sales += Number(t.totalDebt || 0);
      dayData.count += 1;
    });

    // Procesar movimientos (ingresos)
    movements.forEach(m => {
      if (m.paymentDate) {
        const dateKey = new Date(m.paymentDate).toISOString().split('T')[0];
        if (!movementsByDate.has(dateKey)) {
          movementsByDate.set(dateKey, 0);
        }
        movementsByDate.set(dateKey, movementsByDate.get(dateKey) + Number(m.amount || 0));
      }
    });

    // Crear serie temporal completa
    const salesData = [];
    let currentDate = new Date(startDate);
    let accumulated = 0;
    let accumulatedIncome = 0;
    const dailyGoal = projectId ? 150000000 / 365 : 100000000 / 365; // Meta estimada

    while (currentDate <= today) {
      const dateKey = currentDate.toISOString().split('T')[0];
      const daySales = salesByDate.get(dateKey) || { sales: 0, count: 0 };
      const dayIncome = movementsByDate.get(dateKey) || 0;
      
      accumulated += daySales.sales;
      accumulatedIncome += dayIncome;
      
      salesData.push({
        date: dateKey,
        sales: daySales.sales,
        income: dayIncome,
        accumulated: accumulated,
        accumulatedIncome: accumulatedIncome,
        goal: dailyGoal * salesData.length,
        count: daySales.count
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Obtener información adicional del proyecto
    const projectInfo = await prisma.project.findFirst({
      where: projectName ? { name: projectName } : {},
      select: {
        id: true,
        name: true,
        createdAt: true
      }
    });

    // Calcular totales
    const totalSales = await prisma.transaction.aggregate({
      where: {
        ...(projectId ? { project: projectId } : {}),
        transactionStatus: { not: 5 }
      },
      _sum: { totalDebt: true }
    });

    const totalPayments = await prisma.movement.aggregate({
      where: transactionIds.length > 0
        ? { transaction: { in: transactionIds } }
        : {},
      _sum: { amount: true }
    });

    return NextResponse.json({
      success: true,
      data: {
        salesData: salesData,
        summary: {
          totalSales: Number(totalSales._sum.totalDebt || 0),
          totalIncome: Number(totalPayments._sum.amount || 0),
          averageDailySales: salesData.length > 0 
            ? salesData.reduce((acc, d) => acc + d.sales, 0) / salesData.length
            : 0,
          projectStartDate: projectInfo?.createdAt,
          daysActive: Math.floor((today.getTime() - new Date(projectInfo?.createdAt || today).getTime()) / (1000 * 60 * 60 * 24))
        }
      }
    });
  } catch (error) {
    console.error('Error fetching sales timeline:', error);
    return NextResponse.json(
      { error: 'Error al obtener línea temporal de ventas', details: error },
      { status: 500 }
    );
  }
}
