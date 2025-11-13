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

    // Obtener transactions con operates
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
        whereCondition.project = project.id;
      }
    }

    // Obtener conteo de transacciones por operate
    const transactionsByOperate = await prisma.transaction.groupBy({
      by: ['operate'],
      where: whereCondition,
      _count: {
        id: true
      }
    });

    // Obtener los detalles de los operates
    const operateIds = transactionsByOperate.map(t => t.operate).filter(id => id !== null);
    const operates = await prisma.operate.findMany({
      where: {
        id: {
          in: operateIds as number[]
        }
      }
    });

    // Crear mapa de operates
    const operateMap = new Map();
    operates.forEach(op => {
      operateMap.set(op.id, op);
    });

    // Datos para la gráfica de pastel
    const pieData = transactionsByOperate.map(t => {
      const operate = t.operate ? operateMap.get(t.operate) : null;
      return {
        id: t.operate || 0,
        name: operate?.name || 'Sin Estado',
        value: t._count.id,
        color: operate?.color || '#808080'
      };
    });

    // Obtener totales
    const totalTransactions = await prisma.transaction.count({
      where: whereCondition
    });

    return NextResponse.json({
      success: true,
      data: {
        total: totalTransactions,
        pieData: pieData,
        operates: operates
      }
    });
  } catch (error) {
    console.error('Error fetching operates:', error);
    return NextResponse.json(
      { error: 'Error al obtener estados de operación', details: error },
      { status: 500 }
    );
  }
}
