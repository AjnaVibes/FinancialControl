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

    // Obtener clientes relacionados con el proyecto
    let clientIds: number[] = [];
    if (projectId) {
      const transactions = await prisma.transaction.findMany({
        where: { project: projectId },
        select: { client: true }
      });
      clientIds = transactions.map(t => t.client).filter(id => id !== null) as number[];
    } else {
      // Si no hay proyecto, obtener todos los clientes
      const allClients = await prisma.client.findMany({
        select: { id: true }
      });
      clientIds = allClients.map(c => c.id);
    }

    // Total de clientes
    const totalClients = clientIds.length;

    // Clientes nuevos (últimos 30 días)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const newClients = await prisma.client.count({
      where: {
        id: { in: clientIds },
        createdAt: { gte: thirtyDaysAgo }
      }
    });

    // Demografía por estado
    const clientsByState = await prisma.client.groupBy({
      by: ['state'],
      where: { id: { in: clientIds } },
      _count: { id: true }
    });

    // Demografía por género
    const clientsByGender = await prisma.client.groupBy({
      by: ['gender'],
      where: { id: { in: clientIds } },
      _count: { id: true }
    });

    // Estado civil
    const clientsByMarital = await prisma.client.groupBy({
      by: ['maritalStatus'],
      where: { id: { in: clientIds } },
      _count: { id: true }
    });

    // Capacidad de pago (promedio)
    const clientsCapacity = await prisma.client.aggregate({
      where: { 
        id: { in: clientIds },
        monthlyIncome: { not: null },
        fixedCosts: { not: null }
      },
      _avg: {
        monthlyIncome: true,
        fixedCosts: true,
        additionalIncome: true
      },
      _count: { id: true }
    });

    // Clientes con transacciones activas
    const activeClients = await prisma.transaction.groupBy({
      by: ['client'],
      where: {
        client: { in: clientIds },
        transactionStatus: { not: 5 } // No canceladas
      },
      _count: { id: true }
    });

    // Análisis de capacidad de pago
    const paymentCapacity = {
      avgMonthlyIncome: clientsCapacity._avg.monthlyIncome || 0,
      avgFixedCosts: clientsCapacity._avg.fixedCosts || 0,
      avgAdditionalIncome: clientsCapacity._avg.additionalIncome || 0,
      avgNetCapacity: (clientsCapacity._avg.monthlyIncome || 0) - (clientsCapacity._avg.fixedCosts || 0),
      clientsWithData: clientsCapacity._count.id
    };

    // Top estados
    const topStates = clientsByState
      .filter((s: any) => s.state !== null)
      .sort((a: any, b: any) => b._count.id - a._count.id)
      .slice(0, 5);

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          total: totalClients,
          newClients: newClients,
          activeClients: activeClients.length,
          conversionRate: totalClients > 0 ? (activeClients.length / totalClients) * 100 : 0
        },
        demographics: {
          byState: clientsByState.map((s: any) => ({
            state: s.state || 'No especificado',
            count: s._count.id
          })),
          byGender: clientsByGender.map((g: any) => ({
            gender: g.gender || 'No especificado',
            count: g._count.id
          })),
          byMaritalStatus: clientsByMarital.map((m: any) => ({
            status: m.maritalStatus,
            count: m._count.id
          })),
          topStates
        },
        paymentCapacity,
        growth: {
          newClientsLast30Days: newClients,
          growthRate: totalClients > 0 ? (newClients / totalClients) * 100 : 0
        }
      }
    });
  } catch (error) {
    console.error('Error fetching clients:', error);
    return NextResponse.json(
      { error: 'Error al obtener análisis de clientes', details: error },
      { status: 500 }
    );
  }
}
