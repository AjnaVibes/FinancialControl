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

    // Obtener el total cobrado de movements
    let whereCondition: any = {};

    if (projectName) {
      // Primero obtener el ID del proyecto por su nombre
      const project = await prisma.project.findFirst({
        where: {
          name: projectName
        },
        select: {
          id: true
        }
      });

      if (project) {
        // Filtrar movements por proyecto a través de transaction
        const transactions = await prisma.transaction.findMany({
          where: {
            project: project.id
          },
          select: {
            id: true
          }
        });

        const transactionIds = transactions.map(t => t.id);
        
        whereCondition = {
          transaction: {
            in: transactionIds
          }
        };
      }
    }

    // Total cobrado
    const totalCobrado = await prisma.movement.aggregate({
      where: whereCondition,
      _sum: {
        amount: true,
        payment: true
      }
    });

    // Movimientos por tipo
    const movementsByType = await prisma.movement.groupBy({
      by: ['movementType'],
      where: whereCondition,
      _sum: {
        amount: true
      },
      _count: {
        id: true
      }
    });

    // Movimientos por método de pago
    const movementsByMethod = await prisma.movement.groupBy({
      by: ['paymentMethod'],
      where: whereCondition,
      _sum: {
        amount: true
      },
      _count: {
        id: true
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        totalCobrado: totalCobrado._sum.amount || 0,
        totalPayment: totalCobrado._sum.payment || 0,
        byType: movementsByType.map((m: any) => ({
          type: m.movementType,
          total: m._sum.amount || 0,
          count: m._count.id
        })),
        byPaymentMethod: movementsByMethod.map((m: any) => ({
          method: m.paymentMethod,
          total: m._sum.amount || 0,
          count: m._count.id
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching movements:', error);
    return NextResponse.json(
      { error: 'Error al obtener movimientos', details: error },
      { status: 500 }
    );
  }
}
