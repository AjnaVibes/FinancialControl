// src/app/api/sync/trigger/route.ts
// API para ejecutar sincronización - VERSION SIMPLIFICADA SIN syncTableComplete

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { directSyncService } from '@/services/sync/directSyncService';

export async function POST(request: Request) {
  try {
    // Verificar autenticación
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { tableName, type = 'incremental' } = body;

    if (!tableName) {
      return NextResponse.json(
        { success: false, error: 'Se requiere el nombre de la tabla' },
        { status: 400 }
      );
    }

    console.log(`🔄 Iniciando sincronización: ${tableName} (${type})`);

    // 🔧 SIMPLIFICADO: Solo usar syncTable sin syncTableComplete
    const result = await directSyncService.syncTable(
      tableName, 
      type === 'complete' ? 'full' : type  // Convertir 'complete' a 'full'
    );

    return NextResponse.json({
      success: true,
      data: {
        tableName,
        type,
        ...result
      }
    });

  } catch (error: any) {
    console.error('Error en sincronización:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message,
        details: error.stack 
      },
      { status: 500 }
    );
  }
}