// src/app/api/sync/status/route.ts
// API para obtener el estado de sincronización - VERSION CORREGIDA

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    // Verificar autenticación
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Obtener configuración de todas las tablas
    const webhookConfigs = await prisma.webhookConfig.findMany({
      orderBy: [
        { categoria: 'asc' },
        { tabla: 'asc' }  // 🔧 Cambié displayName por tabla
      ]
    });

    // Obtener conteo de registros por tabla
    const tableCounts = await Promise.all(
      webhookConfigs.map(async (config) => {
        try {
          // Convertir nombre de tabla a nombre de modelo Prisma
          const modelName = config.tabla
            .split('_')
            .map((word, index) => 
              index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1)
            )
            .join('');
          
          const model = (prisma as any)[modelName];
          const count = model ? await model.count() : 0;
          
          return {
            tabla: config.tabla,
            count
          };
        } catch (error) {
          return {
            tabla: config.tabla,
            count: 0
          };
        }
      })
    );

    const countsMap = new Map(tableCounts.map(tc => [tc.tabla, tc.count]));

    // Obtener últimos logs
    const recentLogs = await prisma.webhookSyncLog.findMany({
      where: {
        configId: {
          in: webhookConfigs.map(c => c.id)
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    });

    const logsMap = new Map<string, typeof recentLogs>();
    webhookConfigs.forEach(config => {
      const tableLogs = recentLogs.filter(log => log.configId === config.id);
      logsMap.set(config.tabla, tableLogs.slice(0, 5));
    });

    // Construir respuesta
    const tables = webhookConfigs.map(config => {
      const recordCount = countsMap.get(config.tabla) || 0;
      const lastLog = logsMap.get(config.tabla)?.[0];
      
      return {
        id: config.id,
        tabla: config.tabla,
        displayName: config.tabla, // 🔧 Usar tabla como displayName
        categoria: config.categoria,
        icono: config.icono || '📊', // 🔧 Icono por defecto
        color: config.color || '#3B82F6', // 🔧 Color por defecto
        isEnabled: config.isEnabled,
        
        recordCount,
        totalSyncs: config.totalSyncs,
        successSyncs: config.successSyncs,
        errorSyncs: config.errorSyncs,
        lastSyncAt: config.lastSyncAt,
        lastError: config.lastError,
        
        lastLog: lastLog ? {
          status: lastLog.status,
          recordsInserted: lastLog.recordsInserted,
          recordsUpdated: lastLog.recordsUpdated,
          recordsErrors: lastLog.recordsErrors,
          createdAt: lastLog.createdAt
        } : null,
        
        status: calculateStatus(config, recordCount),
        healthScore: calculateHealthScore(config, recordCount)
      };
    });

    // Estadísticas globales
    const globalStats = {
      totalTables: webhookConfigs.length,
      enabledTables: webhookConfigs.filter(c => c.isEnabled).length,
      tablesWithData: tables.filter(t => t.recordCount > 0).length,
      tablesWithErrors: tables.filter(t => t.errorSyncs > 0).length,
      totalRecords: tables.reduce((sum, t) => sum + t.recordCount, 0),
      totalSyncs: webhookConfigs.reduce((sum, c) => sum + c.totalSyncs, 0),
      successRate: calculateSuccessRate(webhookConfigs),
      lastGlobalSync: webhookConfigs.reduce((latest, c) => {
        if (!c.lastSyncAt) return latest;
        if (!latest || c.lastSyncAt > latest) return c.lastSyncAt;
        return latest;
      }, null as Date | null)
    };

    // Agrupar por categoría
    const categories = new Map<string, typeof tables>();
    tables.forEach(table => {
      if (!categories.has(table.categoria)) {
        categories.set(table.categoria, []);
      }
      categories.get(table.categoria)?.push(table);
    });

    const categoriesArray = Array.from(categories.entries()).map(([name, tables]) => ({
      name,
      tables,
      totalRecords: tables.reduce((sum, t) => sum + t.recordCount, 0),
      tablesCount: tables.length,
      healthScore: tables.reduce((sum, t) => sum + t.healthScore, 0) / tables.length
    }));

    return NextResponse.json({
      success: true,
      data: {
        tables,
        categories: categoriesArray,
        globalStats,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('Error obteniendo estado de sincronización:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

function calculateStatus(config: any, recordCount: number): 'success' | 'warning' | 'error' | 'pending' {
  if (!config.lastSyncAt) return 'pending';
  if (config.errorSyncs > 0 && config.lastError) return 'error';
  if (recordCount === 0) return 'warning';
  if (config.successSyncs > 0) return 'success';
  return 'pending';
}

function calculateHealthScore(config: any, recordCount: number): number {
  let score = 0;
  if (recordCount > 0) score += 40;
  if (config.successSyncs > 0) {
    const successRate = config.totalSyncs > 0 
      ? (config.successSyncs / config.totalSyncs) * 30
      : 0;
    score += successRate;
  }
  if (config.lastSyncAt) {
    const hoursSinceSync = (Date.now() - new Date(config.lastSyncAt).getTime()) / (1000 * 60 * 60);
    if (hoursSinceSync < 24) score += 20;
    else if (hoursSinceSync < 168) score += 10;
  }
  if (!config.lastError) score += 10;
  return Math.round(score);
}

function calculateSuccessRate(configs: any[]): number {
  const totalSyncs = configs.reduce((sum, c) => sum + c.totalSyncs, 0);
  const successSyncs = configs.reduce((sum, c) => sum + c.successSyncs, 0);
  if (totalSyncs === 0) return 0;
  return Math.round((successSyncs / totalSyncs) * 100);
}