// src/app/api/projects/[projectId]/sales/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    const projectId = parseInt(params.projectId);
    
    // Obtener información del proyecto
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        name: true,
        surface: true,
        projectStatus: true
      }
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Proyecto no encontrado' },
        { status: 404 }
      );
    }

    // Obtener parámetros de query
    const { searchParams } = new URL(request.url);
    const dateRange = searchParams.get('range') || '30d';

    // Calcular rango de fechas
    const today = new Date();
    const daysToShow = dateRange === '7d' ? 7 : 
                      dateRange === '30d' ? 30 : 
                      dateRange === '90d' ? 90 : 
                      dateRange === '1y' ? 365 : 1000;
    
    const startDate = new Date();
    startDate.setDate(today.getDate() - daysToShow);

    // Obtener todas las transacciones del proyecto
    const transactions = await prisma.transaction.findMany({
      where: {
        project: projectId,
        createdAt: {
          gte: startDate
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    // Obtener movimientos para calcular ingresos reales
    const movements = await prisma.movement.findMany({
      where: {
        transaction: {
          in: transactions.map(t => t.id)
        },
        canceled: false,
        paymentDate: {
          gte: startDate
        }
      },
      orderBy: {
        paymentDate: 'asc'
      }
    });

    // Agrupar datos por día
    const salesByDay: { [key: string]: { sales: number, income: number } } = {};
    
    // Procesar transacciones (ventas)
    transactions.forEach(transaction => {
      if (transaction.createdAt) {
        const dateKey = transaction.createdAt.toISOString().split('T')[0];
        if (!salesByDay[dateKey]) {
          salesByDay[dateKey] = { sales: 0, income: 0 };
        }
        salesByDay[dateKey].sales += Number(transaction.totalDebt || 0);
      }
    });

    // Procesar movimientos (ingresos)
    movements.forEach(movement => {
      if (movement.paymentDate) {
        const dateKey = movement.paymentDate.toISOString().split('T')[0];
        if (!salesByDay[dateKey]) {
          salesByDay[dateKey] = { sales: 0, income: 0 };
        }
        salesByDay[dateKey].income += Number(movement.amount || 0);
      }
    });

    // Generar array de datos para gráficas
    const salesData = [];
    let accumulated = 0;
    let accumulatedIncome = 0;
    
    // Obtener presupuesto del proyecto (usando unidades y precio promedio)
    const units = await prisma.unit.findMany({
      where: { project: projectId },
      select: { price: true }
    });
    
    const totalBudget = units.reduce((sum, unit) => 
      sum + Number(unit.price || 0), 0
    );
    
    const dailyGoal = totalBudget / 365;

    for (let i = daysToShow; i >= 0; i--) {
      const date = new Date();
      date.setDate(today.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];
      
      const dayData = salesByDay[dateKey] || { sales: 0, income: 0 };
      accumulated += dayData.sales;
      accumulatedIncome += dayData.income;

      salesData.push({
        date: dateKey,
        sales: dayData.sales,
        income: dayData.income,
        accumulated: accumulated,
        accumulatedIncome: accumulatedIncome,
        goal: dailyGoal * (daysToShow - i)
      });
    }

    // Calcular métricas generales
    const totalSales = transactions.reduce((sum, t) => 
      sum + Number(t.totalDebt || 0), 0
    );
    
    const totalIncome = movements.reduce((sum, m) => 
      sum + Number(m.amount || 0), 0
    );

    return NextResponse.json({
      success: true,
      data: {
        project: {
          id: project.id,
          name: project.name,
          budget: totalBudget,
          totalSales,
          totalIncome,
          status: project.projectStatus === 1 ? 'active' : 
                 project.projectStatus === 2 ? 'completed' : 'paused'
        },
        salesData,
        summary: {
          totalTransactions: transactions.length,
          averageSale: transactions.length > 0 ? totalSales / transactions.length : 0,
          conversionRate: totalSales > 0 ? totalIncome / totalSales : 0,
          daysToComplete: totalSales > 0 ? 
            Math.ceil((totalBudget - totalSales) / (totalSales / daysToShow)) : 0
        }
      }
    });
  } catch (error) {
    console.error('Error fetching project sales:', error);
    return NextResponse.json(
      { error: 'Error al obtener ventas del proyecto' },
      { status: 500 }
    );
  }
}
