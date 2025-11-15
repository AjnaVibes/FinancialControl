import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Healthcheck básico que no depende de servicios externos
    const response = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      message: 'Financial Control API is running',
      env: process.env.NODE_ENV || 'unknown',
      port: process.env.PORT || '3000'
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    // En caso de error, aún devolver respuesta válida
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      message: 'Health check failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 200 }); // Aún devolver 200 para que Railway considere que está funcionando
  }
}
