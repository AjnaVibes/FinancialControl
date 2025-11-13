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

    // Performance por agente
    const agentPerformance = await prisma.quotation.groupBy({
      by: ['agent'],
      where: projectId ? { project: projectId } : {},
      _count: { id: true },
      _sum: { total: true }
    });

    // Obtener nombres de agentes
    const agentIds = agentPerformance.map(a => a.agent).filter(id => id !== null);
    const agents = await prisma.agent.findMany({
      where: { id: { in: agentIds as number[] } },
      select: { id: true, name: true, agency: true }
    });

    // Performance por agencia
    const agencyPerformance = await prisma.quotation.groupBy({
      by: ['agency'],
      where: projectId ? { project: projectId } : {},
      _count: { id: true },
      _sum: { total: true }
    });

    // Obtener nombres de agencias
    const agencyIds = agencyPerformance.map(a => a.agency).filter(id => id !== null);
    const agencies = await prisma.agency.findMany({
      where: { id: { in: agencyIds as number[] } },
      select: { id: true, name: true }
    });

    // Obtener cotizaciones con transacciones
    const quotationsWithTrans = await prisma.quotation.findMany({
      where: projectId ? { project: projectId } : {},
      select: {
        agent: true,
        agency: true,
        transaction: true
      }
    });

    // Crear mapa de agentes y agencias
    const agentMap = new Map();
    agents.forEach(a => agentMap.set(a.id, a));
    
    const agencyMap = new Map();
    agencies.forEach(a => agencyMap.set(a.id, a));

    // Combinar datos de performance
    const agentData = agentPerformance.map((ap: any) => {
      const agent = agentMap.get(ap.agent);
      const transCount = quotationsWithTrans.filter(q => 
        q.agent === ap.agent && q.transaction !== null
      ).length;
      
      return {
        agentId: ap.agent,
        agentName: agent?.name || 'Sin Agente',
        agencyId: agent?.agency,
        cotizaciones: ap._count.id,
        transacciones: transCount,
        montoTotal: Number(ap._sum.total || 0),
        conversionRate: ap._count.id > 0 ? (transCount / ap._count.id) * 100 : 0
      };
    });

    const agencyData = agencyPerformance.map((ap: any) => {
      const agency = agencyMap.get(ap.agency);
      const transCount = quotationsWithTrans.filter(q => 
        q.agency === ap.agency && q.transaction !== null
      ).length;
      
      return {
        agencyId: ap.agency,
        agencyName: agency?.name || 'Sin Agencia',
        cotizaciones: ap._count.id,
        transacciones: transCount,
        montoTotal: Number(ap._sum.total || 0),
        conversionRate: ap._count.id > 0 ? (transCount / ap._count.id) * 100 : 0
      };
    });

    // Top performers
    const topAgents = agentData
      .sort((a: any, b: any) => b.montoTotal - a.montoTotal)
      .slice(0, 5);

    const topAgencies = agencyData
      .sort((a: any, b: any) => b.montoTotal - a.montoTotal)
      .slice(0, 3);

    return NextResponse.json({
      success: true,
      data: {
        agents: agentData,
        agencies: agencyData,
        topAgents,
        topAgencies,
        summary: {
          totalAgents: agentData.length,
          totalAgencies: agencyData.length,
          avgConversionRate: agentData.reduce((acc, a) => acc + a.conversionRate, 0) / agentData.length || 0
        }
      }
    });
  } catch (error) {
    console.error('Error fetching performance:', error);
    return NextResponse.json(
      { error: 'Error al obtener performance', details: error },
      { status: 500 }
    );
  }
}
