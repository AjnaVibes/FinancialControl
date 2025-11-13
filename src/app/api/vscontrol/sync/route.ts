import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import VSControlSyncService from '@/services/vscontrol/vsControlSyncService';

export async function POST(request: NextRequest) {
  try {
    // Verificar sesión
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Obtener credenciales del body
    const body = await request.json();
    const { usuario, password, empresa, tabla } = body;

    if (!usuario || !password || !empresa) {
      return NextResponse.json(
        { error: 'Credenciales de VS Control requeridas' },
        { status: 400 }
      );
    }

    // Inicializar servicio
    const syncService = new VSControlSyncService();
    syncService.setCredentials({ usuario, password, empresa });

    let results;

    if (tabla) {
      // Sincronizar tabla específica
      switch (tabla) {
        case 'empresas':
          results = [await syncService.syncEmpresas()];
          break;
        case 'proyectos':
          results = [await syncService.syncProyectos()];
          break;
        case 'clientes':
          results = [await syncService.syncClientes()];
          break;
        case 'viviendas':
          results = [await syncService.syncViviendas()];
          break;
        case 'clienteVivienda':
          results = [await syncService.syncClienteVivienda()];
          break;
        case 'avancesFisicos':
          results = [await syncService.syncAvancesFisicos()];
          break;
        case 'ordenesCompra':
          results = [await syncService.syncOrdenesCompra()];
          break;
        case 'controlDocumentos':
          results = [await syncService.syncControlDocumentos()];
          break;
        default:
          return NextResponse.json(
            { error: 'Tabla no válida' },
            { status: 400 }
          );
      }
    } else {
      // Sincronizar todas las tablas
      results = await syncService.syncAll();
    }

    // Desconectar
    await syncService.disconnect();

    // Calcular totales
    const totales = {
      registrosSincronizados: 0,
      registrosNuevos: 0,
      registrosActualizados: 0,
      errores: 0
    };

    results.forEach(r => {
      totales.registrosSincronizados += r.registrosSincronizados;
      totales.registrosNuevos += r.registrosNuevos;
      totales.registrosActualizados += r.registrosActualizados;
      totales.errores += r.errores;
    });

    return NextResponse.json({
      success: true,
      totales,
      resultados: results
    });

  } catch (error) {
    console.error('Error en sincronización de VS Control:', error);
    return NextResponse.json(
      { 
        error: 'Error al sincronizar VS Control',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}

// GET para obtener estadísticas
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Por ahora retornamos información básica
    return NextResponse.json({
      tablas: [
        { id: 'empresas', nombre: 'Empresas', descripcion: 'Catálogo de empresas' },
        { id: 'proyectos', nombre: 'Proyectos', descripcion: 'Desarrollos inmobiliarios' },
        { id: 'clientes', nombre: 'Clientes', descripcion: 'Información de clientes' },
        { id: 'viviendas', nombre: 'Viviendas', descripcion: 'Catálogo de viviendas' },
        { id: 'clienteVivienda', nombre: 'Cliente-Vivienda', descripcion: 'Asignación de viviendas' },
        { id: 'avancesFisicos', nombre: 'Avances Físicos', descripcion: 'Progreso de obra' },
        { id: 'ordenesCompra', nombre: 'Órdenes de Compra', descripcion: 'Órdenes de compra' },
        { id: 'controlDocumentos', nombre: 'Control Documentos', descripcion: 'Gestión documental' }
      ],
      ultimaSincronizacion: null,
      estado: 'disponible'
    });

  } catch (error) {
    console.error('Error obteniendo información de VS Control:', error);
    return NextResponse.json(
      { error: 'Error al obtener información' },
      { status: 500 }
    );
  }
}
