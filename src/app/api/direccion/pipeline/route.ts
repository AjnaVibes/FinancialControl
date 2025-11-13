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

    // Obtener cotizaciones
    const quotations = await prisma.quotation.aggregate({
      where: projectId ? { project: projectId } : {},
      _count: { id: true },
      _sum: { total: true }
    });

    // Obtener cotizaciones por estado
    const quotationsByStatus = await prisma.quotation.groupBy({
      by: ['quotationStatus'],
      where: projectId ? { project: projectId } : {},
      _count: { id: true },
      _sum: { total: true }
    });

    // Obtener transacciones (ventas)
    const transactions = await prisma.transaction.aggregate({
      where: projectId ? { project: projectId } : {},
      _count: { id: true },
      _sum: { totalDebt: true }
    });

    // Obtener transacciones por estado
    const transactionsByStatus = await prisma.transaction.groupBy({
      by: ['transactionStatus'],
      where: projectId ? { project: projectId } : {},
      _count: { id: true }
    });

    // Obtener operaciones (escriturados)
    const escriturados = await prisma.transaction.count({
      where: {
        ...(projectId ? { project: projectId } : {}),
        operate: { in: [7, 8, 9] } // IDs de operates de escrituración
      }
    });

    // Calcular tasas de conversión
    const conversionCotizacionVenta = quotations._count.id > 0 
      ? (transactions._count.id / quotations._count.id) * 100 
      : 0;

    const conversionVentaEscritura = transactions._count.id > 0
      ? (escriturados / transactions._count.id) * 100
      : 0;

    return NextResponse.json({
      success: true,
      data: {
        pipeline: {
          cotizaciones: quotations._count.id,
          apartados: transactions._count.id,
          escriturados: escriturados,
          totalValue: quotations._sum.total || 0
        },
        conversion: {
          cotizacionVenta: conversionCotizacionVenta,
          ventaEscritura: conversionVentaEscritura
        },
        quotationsByStatus,
        transactionsByStatus
      }
    });
  } catch (error) {
    console.error('Error fetching pipeline:', error);
    return NextResponse.json(
      { error: 'Error al obtener pipeline de ventas', details: error },
      { status: 500 }
    );
  }
}
