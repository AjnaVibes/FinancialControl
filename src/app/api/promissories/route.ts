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
    
    // Verificar si se están solicitando múltiples proyectos
    const proyectos = searchParams.get('proyectos');
    const limit = searchParams.get('limit');
    
    let rawData;
    let appliedFilters = {};
    
    if (proyectos) {
      // Si se envían múltiples proyectos (separados por coma), procesarlos todos
      const projectList = proyectos.split(',').filter(p => p.trim());
      console.log('📋 Buscando múltiples proyectos:', projectList);
      
      // Obtener datos para cada proyecto
      const allData = [];
      for (const proyecto of projectList) {
        const projectData = await getPromissoryReport({ proyecto });
        allData.push(...projectData);
      }
      rawData = allData;
      appliedFilters = { proyectos: projectList };
    } else {
      // Extraer filtros de los query params para búsqueda simple
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
      rawData = await getPromissoryReport(filters);
      appliedFilters = filters;
    }
    
    // Aplicar límite si se especifica
    if (limit) {
      const limitNumber = parseInt(limit);
      if (!isNaN(limitNumber) && limitNumber > 0) {
        rawData = rawData.slice(0, limitNumber);
        console.log(`🔢 Limitando resultados a ${limitNumber} registros`);
      }
    }
    
    // Convertir BigInt a Number y Dates a ISO string para serialización
    const data = convertBigIntToNumber(rawData);

    return NextResponse.json({
      success: true,
      data,
      total: data.length,
      filters: appliedFilters
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
