// src/app/api/admin/sync-tables/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Obtener configuraciones de webhook (que son las tablas sincronizadas)
    const configs = await prisma.webhookConfig.findMany({
      orderBy: { categoria: 'asc' },
      include: {
        logs: {
          orderBy: { createdAt: 'desc' },
          take: 10  // Últimos 10 logs por tabla
        }
      }
    });

    // Contar registros para cada tabla
    const tables = await Promise.all(configs.map(async (config) => {
      let recordCount = 0;
      
      // Contar registros según la tabla usando query raw para tablas dinámicas
      try {
        const result = await prisma.$queryRawUnsafe(
          `SELECT COUNT(*) as count FROM ${config.tabla}`
        );
        recordCount = Number((result as any)[0].count);
      } catch (error) {
        console.error(`Error counting ${config.tabla}:`, error);
        // Si falla, intentar con los métodos específicos
        try {
          switch(config.tabla) {
            case 'clients':
              recordCount = await prisma.client.count();
              break;
            case 'projects':
              recordCount = await prisma.project.count();
              break;
            case 'units':
              recordCount = await prisma.unit.count();
              break;
            case 'transactions':
              recordCount = await prisma.transaction.count();
              break;
            case 'promissories':
              recordCount = await prisma.promissory.count();
              break;
            case 'movements':
              recordCount = await prisma.movement.count();
              break;
            default:
              recordCount = 0;
          }
        } catch (fallbackError) {
          console.error(`Fallback error counting ${config.tabla}:`, fallbackError);
        }
      }

      // Determinar estado de sincronización
      let syncStatus: 'idle' | 'syncing' | 'error' | 'success' = 'idle';
      if (config.lastError) {
        syncStatus = 'error';
      } else if (config.lastSyncAt && new Date(config.lastSyncAt) > new Date(Date.now() - 5 * 60 * 1000)) {
        syncStatus = 'success';
      }

      // Determinar tablas relacionadas
      const relatedTables: string[] = [];
      switch(config.tabla) {
        case 'transactions':
          relatedTables.push('clients', 'projects', 'units');
          break;
        case 'promissories':
          relatedTables.push('transactions');
          break;
        case 'movements':
          relatedTables.push('transactions');
          break;
        case 'units':
          relatedTables.push('projects', 'phases');
          break;
      }

      // Calcular estadísticas de los logs
      const successLogs = config.logs.filter(log => log.status === 'SUCCESS').length;
      const errorLogs = config.logs.filter(log => log.status === 'ERROR').length;
      const totalRecordsProcessed = config.logs.reduce((sum, log) => sum + (log.recordsReceived || 0), 0);

      return {
        id: config.id,
        tableName: config.tabla,
        displayName: config.nombre,
        category: config.categoria,
        lastSync: config.lastSyncAt?.toISOString() || null,
        nextSync: config.nextSyncAt?.toISOString() || null,
        recordCount,
        syncStatus,
        errorMessage: config.lastError,
        isEnabled: config.isEnabled,
        relatedTables,
        intervalMinutes: config.intervalMinutes,
        // Nuevos campos para logs
        recentLogs: config.logs.map(log => ({
          id: log.id,
          action: log.action,
          status: log.status,
          recordsReceived: log.recordsReceived,
          recordsInserted: log.recordsInserted,
          recordsUpdated: log.recordsUpdated,
          recordsDuplicate: log.recordsDuplicate,
          recordsErrors: log.recordsErrors,
          duration: log.duration,
          errorMessage: log.errorMessage,
          createdAt: log.createdAt.toISOString()
        })),
        stats: {
          totalSyncs: config.totalSyncs || 0,
          successSyncs: config.successSyncs || 0,
          errorSyncs: config.errorSyncs || 0,
          successRate: config.totalSyncs ? Math.round((config.successSyncs / config.totalSyncs) * 100) : 0,
          recentSuccessCount: successLogs,
          recentErrorCount: errorLogs,
          totalRecordsProcessed
        }
      };
    }));

    return NextResponse.json({
      success: true,
      tables,
      summary: {
        totalTables: tables.length,
        activeTables: tables.filter(t => t.isEnabled).length,
        tablesWithErrors: tables.filter(t => t.syncStatus === 'error').length,
        totalRecords: tables.reduce((sum, t) => sum + t.recordCount, 0)
      }
    });

  } catch (error) {
    console.error('Error fetching sync tables:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener tablas de sincronización' },
      { status: 500 }
    );
  }
}
