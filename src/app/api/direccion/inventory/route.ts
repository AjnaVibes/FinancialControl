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

    // Total de unidades
    const totalUnits = await prisma.unit.count({
      where: whereCondition
    });

    // Unidades vendidas (escrituradas o en proceso avanzado)
    // Consideramos vendida una unidad si:
    // 1. Tiene transacción asociada
    // 2. No está cancelada (status !== 5)
    // 3. Está en operate de escrituración (7, 8, 9) O tiene un status activo (no cancelado)
    const soldUnits = await prisma.transaction.count({
      where: projectId ? { 
        project: projectId,
        unit: { not: null },
        transactionStatus: { not: 5 }, // Excluir canceladas
        // Opcionalmente podríamos filtrar solo escrituradas:
        // operate: { in: [7, 8, 9] } // Solo escrituradas
      } : {
        unit: { not: null },
        transactionStatus: { not: 5 } // Excluir canceladas
      }
    });

    // Unidades apartadas/reservadas (opcional - para más detalle)
    const reservedUnits = await prisma.transaction.count({
      where: projectId ? { 
        project: projectId,
        unit: { not: null },
        transactionStatus: { not: 5 },
        operate: { notIn: [7, 8, 9] } // No escrituradas aún
      } : {
        unit: { not: null },
        transactionStatus: { not: 5 },
        operate: { notIn: [7, 8, 9] }
      }
    });

    // Unidades disponibles (asegurar que no sea negativo)
    const availableUnits = Math.max(0, totalUnits - soldUnits);

    // Unidades por fase
    const unitsByPhase = await prisma.unit.groupBy({
      by: ['phase'],
      where: whereCondition,
      _count: { id: true },
      _avg: { price: true },
      _sum: { surface: true }
    });

    // Unidades por prototipo
    const unitsByPrototype = await prisma.unit.groupBy({
      by: ['prototype'],
      where: whereCondition,
      _count: { id: true },
      _avg: { price: true }
    });

    // Obtener nombres de fases
    const phaseIds = unitsByPhase.map(u => u.phase).filter(id => id !== null);
    const phases = await prisma.phase.findMany({
      where: { id: { in: phaseIds as number[] } },
      select: { id: true, name: true }
    });

    // Obtener nombres de prototipos
    const prototypeIds = unitsByPrototype.map(u => u.prototype).filter(id => id !== null);
    const prototypes = await prisma.prototype.findMany({
      where: { id: { in: prototypeIds as number[] } },
      select: { id: true, name: true }
    });

    // Mapas para nombres
    const phaseMap = new Map();
    phases.forEach(p => phaseMap.set(p.id, p.name));
    
    const prototypeMap = new Map();
    prototypes.forEach(p => prototypeMap.set(p.id, p.name));

    // Análisis de precios
    const priceAnalysis = await prisma.unit.aggregate({
      where: whereCondition,
      _avg: { price: true },
      _min: { price: true },
      _max: { price: true }
    });

    // Velocidad de venta (últimos 30 días)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentSales = await prisma.transaction.count({
      where: {
        ...(projectId ? { project: projectId } : {}),
        unit: { not: null },
        createdAt: { gte: thirtyDaysAgo }
      }
    });

    // Superficie total
    const surfaceAnalysis = await prisma.unit.aggregate({
      where: whereCondition,
      _sum: { surface: true },
      _avg: { surface: true }
    });

    const inventoryByPhase = unitsByPhase.map((u: any) => ({
      phaseId: u.phase,
      phaseName: phaseMap.get(u.phase) || 'Sin Fase',
      units: u._count.id,
      avgPrice: Number(u._avg.price || 0),
      totalSurface: Number(u._sum.surface || 0)
    }));

    const inventoryByType = unitsByPrototype.map((u: any) => ({
      prototypeId: u.prototype,
      prototypeName: prototypeMap.get(u.prototype) || 'Sin Prototipo',
      units: u._count.id,
      avgPrice: Number(u._avg.price || 0)
    }));

    // Calcular absorción
    const absorptionRate = totalUnits > 0 ? (soldUnits / totalUnits) * 100 : 0;
    const monthlyAbsorption = recentSales;
    const monthsToComplete = availableUnits > 0 && monthlyAbsorption > 0 
      ? Math.ceil(availableUnits / monthlyAbsorption)
      : 0;

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          total: totalUnits,
          sold: soldUnits,
          available: availableUnits,
          absorptionRate: absorptionRate,
          monthlyAbsorption: monthlyAbsorption,
          monthsToComplete: monthsToComplete
        },
        byPhase: inventoryByPhase,
        byPrototype: inventoryByType,
        pricing: {
          average: Number(priceAnalysis._avg.price || 0),
          min: Number(priceAnalysis._min.price || 0),
          max: Number(priceAnalysis._max.price || 0),
          range: Number(priceAnalysis._max.price || 0) - Number(priceAnalysis._min.price || 0)
        },
        surface: {
          total: Number(surfaceAnalysis._sum.surface || 0),
          average: Number(surfaceAnalysis._avg.surface || 0)
        },
        salesVelocity: {
          last30Days: recentSales,
          dailyAverage: recentSales / 30,
          projectedMonthlySales: recentSales
        }
      }
    });
  } catch (error) {
    console.error('Error fetching inventory:', error);
    return NextResponse.json(
      { error: 'Error al obtener análisis de inventario', details: error },
      { status: 500 }
    );
  }
}
