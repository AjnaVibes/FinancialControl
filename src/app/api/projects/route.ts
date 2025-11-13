// src/app/api/projects/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Obtener todos los proyectos activos
    const projects = await prisma.project.findMany({
      where: {
        deletedAt: null // Solo proyectos no eliminados
      },
      select: {
        id: true,
        name: true,
        address: true,
        surface: true,
        projectStatus: true,
        createdAt: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    // Obtener estadísticas para cada proyecto
    const projectsWithStats = await Promise.all(
      projects.map(async (project) => {
        // Contar transacciones y calcular totales
        const transactions = await prisma.transaction.findMany({
          where: {
            project: project.id
          },
          select: {
            totalDebt: true,
            payments: true,
            creditTotal: true,
            transactionStatus: true
          }
        });

        // Calcular totales
        const totalSales = transactions.reduce((sum, t) => 
          sum + (t.totalDebt ? Number(t.totalDebt) : 0), 0
        );
        
        const totalIncome = transactions.reduce((sum, t) => 
          sum + (t.payments ? Number(t.payments) : 0), 0
        );

        // Contar unidades
        const totalUnits = await prisma.unit.count({
          where: { project: project.id }
        });

        const soldUnits = await prisma.transaction.count({
          where: { 
            project: project.id,
            transactionStatus: {
              in: [2, 3, 4] // Estados de vendido/cerrado
            }
          }
        });

        return {
          id: project.id.toString(),
          name: project.name || `Proyecto ${project.id}`,
          displayName: project.name || `Proyecto ${project.id}`,
          address: project.address,
          surface: project.surface ? Number(project.surface) : 0,
          totalUnits,
          soldUnits,
          availableUnits: totalUnits - soldUnits,
          totalSales,
          totalIncome,
          status: project.projectStatus === 1 ? 'active' : 
                 project.projectStatus === 2 ? 'completed' : 'paused',
          createdAt: project.createdAt
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: projectsWithStats
    });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { error: 'Error al obtener proyectos' },
      { status: 500 }
    );
  }
}
