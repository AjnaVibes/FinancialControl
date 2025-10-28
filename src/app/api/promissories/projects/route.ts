// src/app/api/promissories/projects/route.ts
import { NextResponse } from 'next/server';
import { getProjectsForFilter } from '@/lib/queries/promissoryQueries';

export const dynamic = 'force-dynamic';

/**
 * GET /api/promissories/projects
 * Obtiene lista de proyectos para el filtro
 */
export async function GET() {
  try {
    const projects = await getProjectsForFilter();

    return NextResponse.json({
      success: true,
      data: projects
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