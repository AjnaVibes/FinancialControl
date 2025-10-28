// src/app/api/promissories/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getPromissoryReport, getPromissoryStats, getProjectsForFilter } from '@/lib/queries/promissoryQueries';

export const dynamic = 'force-dynamic';

/**
 * Convierte BigInt a Number y formatea Dates para serialización JSON
 */
function convertBigIntToNumber(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  
  if (typeof obj === 'bigint') {
    return Number(obj);
  }
  
  // Convertir Date a string ISO
  if (obj instanceof Date) {
    return obj.toISOString();
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => convertBigIntToNumber(item));
  }
  
  if (typeof obj === 'object') {
    const converted: any = {};
    for (const key in obj) {
      converted[key] = convertBigIntToNumber(obj[key]);
    }
    return converted;
  }
  
  return obj;
}

/**
 * GET /api/promissories
 * Obtiene el reporte de pagarés con filtros opcionales
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Extraer filtros de los query params
    const filters = {
      proyecto: searchParams.get('proyecto') || undefined,
      idTransaction: searchParams.get('idTransaction') || undefined,
      cliente: searchParams.get('cliente') || undefined,
      numeroVivienda: searchParams.get('numeroVivienda') || undefined,
    };

    // Remover filtros vacíos
    Object.keys(filters).forEach(key => {
      if (!filters[key as keyof typeof filters]) {
        delete filters[key as keyof typeof filters];
      }
    });

    console.log('🔍 Filtros aplicados:', filters);

    const rawData = await getPromissoryReport(filters);
    
    // Convertir BigInt a Number y Dates a ISO string para serialización
    const data = convertBigIntToNumber(rawData);

    return NextResponse.json({
      success: true,
      data,
      total: data.length,
      filters
    });
  } catch (error) {
    console.error('❌ Error en API de pagarés:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error al obtener el reporte de pagarés',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}