// src/app/api/promissories/stats/route.ts
import { NextResponse } from 'next/server';
import { getPromissoryStats } from '@/lib/queries/promissoryQueries';

export const dynamic = 'force-dynamic';

/**
 * GET /api/promissories/stats
 * Obtiene estadísticas generales de pagarés
 */
export async function GET() {
  try {
    const stats = await getPromissoryStats();

    return NextResponse.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('❌ Error obteniendo estadísticas:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error al obtener estadísticas de pagarés' 
      },
      { status: 500 }
    );
  }
}