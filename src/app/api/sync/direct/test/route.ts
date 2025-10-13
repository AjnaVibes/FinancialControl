// src/app/api/sync/direct/test/route.ts
import { NextResponse } from 'next/server';
import { ventasDb } from '@/lib/ventasDb';

export async function GET() {
  try {
    const isConnected = await ventasDb.testConnection();
    
    if (isConnected) {
      const tables = await ventasDb.getTables();
      const hasClients = tables.includes('clients');
      
      return NextResponse.json({
        success: true,
        message: 'Conexión exitosa a BD de ventas',
        tables: tables.length,
        hasClientsTable: hasClients,
        timestamp: new Date().toISOString()
      });
    }
    
    return NextResponse.json({
      success: false,
      message: 'No se pudo conectar'
    }, { status: 500 });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}