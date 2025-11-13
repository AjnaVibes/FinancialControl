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

    // Obtener el total de unidades del desarrollo
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

    const totalUnits = await prisma.unit.count({
      where: whereCondition
    });

    // Obtener unidades por prototipo
    const unitsByPrototype = await prisma.unit.groupBy({
      by: ['prototype'],
      where: whereCondition,
      _count: {
        id: true
      }
    });

    // Obtener unidades por fase
    const unitsByPhase = await prisma.unit.groupBy({
      by: ['phase'],
      where: whereCondition,
      _count: {
        id: true
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        total: totalUnits,
        byPrototype: unitsByPrototype.map((u: any) => ({
          prototype: u.prototype,
          count: u._count.id
        })),
        byPhase: unitsByPhase.map((u: any) => ({
          phase: u.phase,
          count: u._count.id
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching units:', error);
    return NextResponse.json(
      { error: 'Error al obtener unidades', details: error },
      { status: 500 }
    );
  }
}
