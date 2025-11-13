// src/app/api/promissories/projects/route.ts
import { NextResponse } from 'next/server';
import { getProjectsForFilter } from '@/lib/queries/promissoryQueries';

export const dynamic = 'force-dynamic';

/**
 * GET /api/promissories/projects
 * Obtiene lista de proyectos para el filtro con información de empresa
 */
export async function GET() {
  try {
    const projectsWithCompany = await getProjectsForFilter();

    // Devolver tanto la lista de proyectos con empresa como formato compatible
    return NextResponse.json({
      success: true,
      data: projectsWithCompany, // Array de {name: string, company: string}
      projects: projectsWithCompany.map(p => p.name) // Array de strings para retrocompatibilidad
    });
  } catch (error) {
    console.error('❌ Error obteniendo proyectos:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error al obtener lista de proyectos' 
      },
      { status: 500 }
    );
  }
}
