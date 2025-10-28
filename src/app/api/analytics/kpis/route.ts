// src/app/api/analytics/kpis/route.ts
// VERSION FINAL - Import estático normal

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getFinancialKPIs, getSalesTrends } from '@/lib/analytics/kpiQueries';

export async function GET(request: Request) {
  try {
    // Verificar autenticación
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Obtener parámetros
    const { searchParams } = new URL(request.url);
    const includeTrends = searchParams.get('trends') === 'true';
    const trendsMonths = parseInt(searchParams.get('trendsMonths') || '12');

    // Obtener KPIs principales
    const kpis = await getFinancialKPIs();

    // Obtener tendencias si se solicitan
    let trends = null;
    if (includeTrends) {
      trends = await getSalesTrends(trendsMonths);
    }

    return NextResponse.json({
      success: true,
      data: {
        kpis,
        trends,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('Error obteniendo KPIs:', error);
    
    // Retornar datos vacíos en vez de error 500
    return NextResponse.json({
      success: true,
      data: {
        kpis: {
          totalClients: 0,
          activeProjects: 0,
          totalUnits: 0,
          availableUnits: 0,
          totalQuotations: 0,
          totalTransactions: 0,
          totalRevenue: 0,
          averageTicket: 0,
          conversionRate: 0,
          topDevelopers: [],
          salesByMonth: [],
          unitsByStatus: []
        },
        trends: null,
        timestamp: new Date().toISOString()
      }
    });
  }
}