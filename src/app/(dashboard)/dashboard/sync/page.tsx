// src/app/(dashboard)/dashboard/sync/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { 
  Database, 
  RefreshCw, 
  TrendingUp, 
  AlertCircle,
  Clock,
  Activity
} from 'lucide-react';
import SyncStatusCard from '@/components/organisms/SyncStatusCard';

interface SyncData {
  tables: any[];
  categories: Array<{
    name: string;
    tables: any[];
    totalRecords: number;
    tablesCount: number;
    healthScore: number;
  }>;
  globalStats: {
    totalTables: number;
    enabledTables: number;
    tablesWithData: number;
    tablesWithErrors: number;
    totalRecords: number;
    totalSyncs: number;
    successRate: number;
    lastGlobalSync: string | null;
  };
  timestamp: string;
}

export default function SyncDashboard() {
  const [data, setData] = useState<SyncData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [syncingTable, setSyncingTable] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/sync/status');
      if (!response.ok) throw new Error('Error al obtener datos');
      const result = await response.json();
      setData(result.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    // Auto-refresh cada 30 segundos
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
  };

  const handleSync = async (tableName: string, type: 'incremental' | 'full' | 'complete') => {
    setSyncingTable(tableName);
    try {
      const response = await fetch('/api/sync/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tableName, type })
      });

      const result = await response.json();
      
      if (result.success) {
        alert(`✅ Sincronización completada:\n- Insertados: ${result.data.recordsInserted}\n- Actualizados: ${result.data.recordsUpdated}\n- Errores: ${result.data.errors}`);
        await fetchData(); // Recargar datos
      } else {
        alert(`❌ Error en sincronización:\n${result.error}`);
      }
    } catch (error: any) {
      alert(`❌ Error: ${error.message}`);
    } finally {
      setSyncingTable(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-red-500">Error al cargar datos</p>
      </div>
    );
  }

  const filteredTables = selectedCategory === 'all' 
    ? data.tables 
    : data.tables.filter(t => t.categoria === selectedCategory);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Dashboard de Sincronización
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Monitor y control de sincronización con RAMP
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Actualizar
        </button>
      </div>

      {/* Global Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total de Tablas</p>
              <p className="text-3xl font-bold mt-1 text-gray-900 dark:text-white">
                {data.globalStats.totalTables}
              </p>
            </div>
            <Database className="w-10 h-10 text-blue-500" />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            {data.globalStats.enabledTables} habilitadas
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total de Registros</p>
              <p className="text-3xl font-bold mt-1 text-gray-900 dark:text-white">
                {data.globalStats.totalRecords.toLocaleString()}
              </p>
            </div>
            <Activity className="w-10 h-10 text-green-500" />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            {data.globalStats.tablesWithData} tablas con datos
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Tasa de Éxito</p>
              <p className="text-3xl font-bold mt-1 text-gray-900 dark:text-white">
                {data.globalStats.successRate}%
              </p>
            </div>
            <TrendingUp className="w-10 h-10 text-purple-500" />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            {data.globalStats.totalSyncs} sincronizaciones totales
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Con Errores</p>
              <p className="text-3xl font-bold mt-1 text-red-500">
                {data.globalStats.tablesWithErrors}
              </p>
            </div>
            <AlertCircle className="w-10 h-10 text-red-500" />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Requieren atención
          </p>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            selectedCategory === 'all'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          Todas ({data.tables.length})
        </button>
        {data.categories.map(cat => (
          <button
            key={cat.name}
            onClick={() => setSelectedCategory(cat.name)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedCategory === cat.name
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            {cat.name} ({cat.tablesCount})
          </button>
        ))}
      </div>

      {/* Tables Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredTables.map(table => (
          <SyncStatusCard
            key={table.id}
            table={table}
            onSync={handleSync}
          />
        ))}
      </div>

      {/* Last Update */}
      <div className="text-center text-sm text-gray-500 dark:text-gray-400">
        <Clock className="w-4 h-4 inline mr-1" />
        Última actualización: {new Date(data.timestamp).toLocaleString('es-MX')}
      </div>
    </div>
  );
}