// src/app/(dashboard)/dashboard/admin/sync-manager/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { VSCONTROL_TABLES_CONFIG } from '@/config/sync-tables.config';
import {
  Database,
  RefreshCw,
  Settings,
  Trash2,
  Plus,
  Check,
  X,
  AlertCircle,
  Clock,
  Zap,
  Table2,
  Link,
  Shield,
  Activity,
  History,
  TrendingUp,
  Server,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  XCircle,
  Loader
} from 'lucide-react';

interface SyncLog {
  id: string;
  action: string;
  status: string;
  recordsReceived: number;
  recordsInserted: number;
  recordsUpdated: number;
  recordsDuplicate: number;
  recordsErrors: number;
  duration: number;
  errorMessage: string | null;
  createdAt: string;
}

interface SyncStats {
  totalSyncs: number;
  successSyncs: number;
  errorSyncs: number;
  successRate: number;
  recentSuccessCount: number;
  recentErrorCount: number;
  totalRecordsProcessed: number;
}

interface SyncTable {
  id: string;
  tableName: string;
  displayName: string;
  category: string;
  lastSync: string | null;
  nextSync: string | null;
  recordCount: number;
  syncStatus: 'idle' | 'syncing' | 'error' | 'success';
  errorMessage?: string;
  isEnabled: boolean;
  relatedTables: string[];
  intervalMinutes: number;
  recentLogs: SyncLog[];
  stats: SyncStats;
}

interface RampTable {
  name: string;
  displayName: string;
  recordCount: number;
  columns: Array<{
    name: string;
    type: string;
    nullable: boolean;
    isPrimaryKey?: boolean;
    isForeignKey?: boolean;
  }>;
  possibleRelations: Array<{
    column: string;
    relatedTable: string;
    type: string;
  }>;
  category: string;
  isSynced: boolean;
}

interface PrismaTable {
  name: string;
  displayName: string;
  canBeRelated: boolean;
}

export default function SyncManagerPage() {
  const [syncTables, setSyncTables] = useState<SyncTable[]>([]);
  const [rampTables, setRampTables] = useState<RampTable[]>([]);
  const [prismaTables, setPrismaTables] = useState<PrismaTable[]>([]);
  const [selectedTable, setSelectedTable] = useState<SyncTable | null>(null);
  const [expandedTable, setExpandedTable] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [syncingTable, setSyncingTable] = useState<string | null>(null);
  const [summary, setSummary] = useState({
    totalTables: 0,
    activeTables: 0,
    tablesWithErrors: 0,
    totalRecords: 0
  });
  const [activeTab, setActiveTab] = useState<'ramp' | 'vscontrol'>('ramp');
  const [vsControlTables] = useState(VSCONTROL_TABLES_CONFIG);

  // Form para nueva tabla
  const [newTableForm, setNewTableForm] = useState({
    tableName: '',
    displayName: '',
    relatedTables: [] as string[],
    intervalMinutes: 60
  });

  useEffect(() => {
    fetchSyncTables();
  }, []);

  const fetchSyncTables = async () => {
    try {
      const response = await fetch('/api/admin/sync-tables');
      const data = await response.json();
      if (data.success) {
        setSyncTables(data.tables || []);
        setSummary(data.summary || {
          totalTables: 0,
          activeTables: 0,
          tablesWithErrors: 0,
          totalRecords: 0
        });
      }
    } catch (error) {
      console.error('Error loading sync tables:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRampTables = async () => {
    try {
      const response = await fetch('/api/admin/ramp-tables');
      const data = await response.json();
      if (data.success) {
        setRampTables(data.tables || []);
        setPrismaTables(data.prismaTables || []);
      }
    } catch (error) {
      console.error('Error loading Ramp tables:', error);
    }
  };

  const handleSync = async (tableId: string) => {
    setSyncingTable(tableId);
    try {
      const response = await fetch(`/api/admin/sync-tables/${tableId}/sync`, {
        method: 'POST'
      });
      const data = await response.json();
      if (data.success) {
        alert(`Sincronización completada. ${data.recordsProcessed} registros procesados.`);
        fetchSyncTables();
      } else {
        alert(`Error en sincronización: ${data.error}`);
      }
    } catch (error) {
      alert('Error al sincronizar tabla');
    } finally {
      setSyncingTable(null);
    }
  };

  const handleAddTable = async () => {
    if (!newTableForm.tableName) {
      alert('Selecciona una tabla');
      return;
    }

    try {
      // Mostrar mensaje de proceso
      alert('Generando esquema Prisma y sincronizando datos... Este proceso puede tomar unos minutos.');
      
      // Usar el nuevo endpoint que genera esquema y sincroniza
      const response = await fetch('/api/admin/ramp-tables/generate-schema', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTableForm)
      });
      const data = await response.json();
      
      if (data.success) {
        alert(`✅ ${data.message}\n\n` +
              `📊 Modelo Prisma generado\n` +
              `🔄 ${data.syncResult?.recordsInserted || 0} registros sincronizados\n` +
              `⚠️ ${data.syncResult?.recordsErrors || 0} errores`);
        setShowAddModal(false);
        setNewTableForm({
          tableName: '',
          displayName: '',
          relatedTables: [],
          intervalMinutes: 60
        });
        fetchSyncTables();
      } else {
        alert(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      alert('❌ Error al agregar tabla: ' + (error as Error).message);
    }
  };

  const handleReset = async (tableId: string) => {
    if (!confirm('¿Estás seguro de que deseas vaciar esta tabla? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/sync-tables/${tableId}/reset`, {
        method: 'POST'
      });
      const data = await response.json();
      if (data.success) {
        alert('Tabla vaciada exitosamente');
        fetchSyncTables();
      } else {
        alert(`Error al vaciar tabla: ${data.error}`);
      }
    } catch (error) {
      alert('Error al vaciar tabla');
    }
  };

  const handleToggle = async (tableId: string, enabled: boolean) => {
    try {
      const response = await fetch(`/api/admin/sync-tables/${tableId}/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled })
      });
      const data = await response.json();
      if (data.success) {
        fetchSyncTables();
      }
    } catch (error) {
      alert('Error al cambiar estado de tabla');
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'clients': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'projects': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'finance': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      'legal': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      'administration': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      'catalog': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
      'other': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
    };
    return colors[category] || colors.other;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300';
      case 'syncing':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300';
      case 'error':
        return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <Check className="w-4 h-4" />;
      case 'syncing':
        return <RefreshCw className="w-4 h-4 animate-spin" />;
      case 'error':
        return <X className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Database className="w-8 h-8 text-purple-600" />
            Administrador de Sincronización
          </h1>
          <p className="text-gray-500 mt-1">Gestiona las tablas sincronizadas con Ramp y VS Control</p>
        </div>

        <button
          onClick={() => {
            setShowAddModal(true);
            fetchRampTables();
          }}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Agregar Tabla
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-8">
          <button
            onClick={() => setActiveTab('ramp')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'ramp'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              Tablas RAMP
            </div>
          </button>
          <button
            onClick={() => setActiveTab('vscontrol')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'vscontrol'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4" />
              Tablas VS Control
            </div>
          </button>
        </nav>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Tablas Activas</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {summary.activeTables}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                de {summary.totalTables} totales
              </p>
            </div>
            <Activity className="w-8 h-8 text-green-400" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Registros</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {summary.totalRecords?.toLocaleString() || 0}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                en todas las tablas
              </p>
            </div>
            <Server className="w-8 h-8 text-blue-400" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Con Errores</p>
              <p className="text-2xl font-bold text-red-600">
                {summary.tablesWithErrors}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                requieren atención
              </p>
            </div>
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Sincronizando</p>
              <p className="text-2xl font-bold text-yellow-600">
                {syncTables.filter(t => t.syncStatus === 'syncing').length}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                en proceso
              </p>
            </div>
            <RefreshCw className="w-8 h-8 text-yellow-400 animate-spin" />
          </div>
        </div>
      </div>

      {/* RAMP Tables List */}
      {activeTab === 'ramp' && (
      <div className="bg-white dark:bg-gray-800 rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="w-12 px-4 py-3"></th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tabla
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Registros
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Última Sync
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estadísticas
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {syncTables.map((table) => (
                <React.Fragment key={table.id}>
                  <tr className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-4 py-4">
                      <button
                        onClick={() => setExpandedTable(expandedTable === table.id ? null : table.id)}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                      >
                        {expandedTable === table.id ? (
                          <ChevronUp className="w-5 h-5" />
                        ) : (
                          <ChevronDown className="w-5 h-5" />
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {table.displayName}
                          </span>
                          <span className={`px-2 py-1 text-xs rounded ${getCategoryColor(table.category)}`}>
                            {table.category}
                          </span>
                        </div>
                        <div className="text-sm text-gray-500">
                          {table.tableName}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex items-center gap-1 text-xs leading-5 font-semibold rounded-full ${getStatusColor(table.syncStatus)}`}>
                        {getStatusIcon(table.syncStatus)}
                        {table.syncStatus}
                      </span>
                      {!table.isEnabled && (
                        <span className="ml-2 text-xs text-gray-500">
                          (deshabilitada)
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {table.recordCount.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {table.lastSync ? (
                          <>
                            {new Date(table.lastSync).toLocaleString('es-MX')}
                            <div className="text-xs text-gray-400">
                              Próxima: {table.nextSync ? new Date(table.nextSync).toLocaleString('es-MX') : 'N/A'}
                            </div>
                          </>
                        ) : (
                          'Nunca sincronizada'
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span className="text-xs text-gray-600 dark:text-gray-400">
                            {table.stats?.successRate || 0}%
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <TrendingUp className="w-4 h-4 text-blue-500" />
                          <span className="text-xs text-gray-600 dark:text-gray-400">
                            {table.stats?.totalSyncs || 0} syncs
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggle(table.id, !table.isEnabled)}
                          className={`p-1 rounded ${table.isEnabled ? 'text-green-600 hover:text-green-900' : 'text-gray-400 hover:text-gray-600'}`}
                          title={table.isEnabled ? 'Desactivar' : 'Activar'}
                        >
                          <Shield className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleSync(table.id)}
                          disabled={!table.isEnabled || syncingTable === table.id}
                          className="text-blue-600 hover:text-blue-900 disabled:text-gray-400 dark:text-blue-400 dark:hover:text-blue-300"
                          title="Sincronizar ahora"
                        >
                          {syncingTable === table.id ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <Zap className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => setSelectedTable(table)}
                          className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                          title="Configurar"
                        >
                          <Settings className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleReset(table.id)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          title="Vaciar tabla"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Expanded Logs Section */}
                  {expandedTable === table.id && (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 bg-gray-50 dark:bg-gray-900">
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                              <History className="w-4 h-4" />
                              Historial de Sincronizaciones
                            </h4>
                            <div className="text-xs text-gray-500">
                              Total procesados: {table.stats?.totalRecordsProcessed?.toLocaleString() || 0} registros
                            </div>
                          </div>

                          {table.recentLogs && table.recentLogs.length > 0 ? (
                            <div className="overflow-x-auto">
                              <table className="min-w-full">
                                <thead>
                                  <tr className="text-xs text-gray-500 uppercase">
                                    <th className="px-3 py-2 text-left">Fecha</th>
                                    <th className="px-3 py-2 text-left">Acción</th>
                                    <th className="px-3 py-2 text-left">Estado</th>
                                    <th className="px-3 py-2 text-left">Recibidos</th>
                                    <th className="px-3 py-2 text-left">Insertados</th>
                                    <th className="px-3 py-2 text-left">Actualizados</th>
                                    <th className="px-3 py-2 text-left">Duplicados</th>
                                    <th className="px-3 py-2 text-left">Errores</th>
                                    <th className="px-3 py-2 text-left">Duración</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                  {table.recentLogs.map((log) => (
                                    <tr key={log.id} className="text-sm">
                                      <td className="px-3 py-2 text-gray-600 dark:text-gray-400">
                                        {new Date(log.createdAt).toLocaleString('es-MX')}
                                      </td>
                                      <td className="px-3 py-2 text-gray-600 dark:text-gray-400">
                                        {log.action}
                                      </td>
                                      <td className="px-3 py-2">
                                        <span className={`px-2 py-1 text-xs rounded-full ${
                                          log.status === 'SUCCESS' 
                                            ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
                                            : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
                                        }`}>
                                          {log.status}
                                        </span>
                                      </td>
                                      <td className="px-3 py-2 text-gray-600 dark:text-gray-400">
                                        {log.recordsReceived?.toLocaleString() || 0}
                                      </td>
                                      <td className="px-3 py-2 text-green-600 dark:text-green-400">
                                        {log.recordsInserted?.toLocaleString() || 0}
                                      </td>
                                      <td className="px-3 py-2 text-blue-600 dark:text-blue-400">
                                        {log.recordsUpdated?.toLocaleString() || 0}
                                      </td>
                                      <td className="px-3 py-2 text-yellow-600 dark:text-yellow-400">
                                        {log.recordsDuplicate?.toLocaleString() || 0}
                                      </td>
                                      <td className="px-3 py-2 text-red-600 dark:text-red-400">
                                        {log.recordsErrors?.toLocaleString() || 0}
                                      </td>
                                      <td className="px-3 py-2 text-gray-600 dark:text-gray-400">
                                        {formatDuration(log.duration || 0)}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <div className="text-center py-4 text-gray-500">
                              No hay logs de sincronización disponibles
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {/* VS Control Tables Section */}
      {activeTab === 'vscontrol' && (
        <div className="space-y-4">
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-300 dark:border-green-700 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-green-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-green-800 dark:text-green-200">
                  Tablas de VS Control
                </p>
                <p className="text-green-700 dark:text-green-300 mt-1">
                  Estas tablas se sincronizan desde el sistema VS Control mediante API SOAP.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {vsControlTables.map((table) => (
              <div
                key={table.tableName}
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow"
              >
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{table.icono}</span>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {table.displayName}
                      </h3>
                    </div>
                    <span 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: table.color }}
                    />
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Tabla:</span>
                      <span className="text-gray-700 dark:text-gray-300 font-mono text-xs">
                        {table.tableName}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Prioridad:</span>
                      <span className="text-gray-700 dark:text-gray-300">
                        Nivel {table.priority}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Batch:</span>
                      <span className="text-gray-700 dark:text-gray-300">
                        {table.batchSize?.toLocaleString()} reg.
                      </span>
                    </div>
                    {table.dependencies.length > 0 && (
                      <div>
                        <span className="text-gray-500">Dependencias:</span>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {table.dependencies.map(dep => (
                            <span 
                              key={dep}
                              className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 rounded"
                            >
                              {dep}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex gap-2">
                    <button 
                      className="flex-1 px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                      onClick={() => alert('La sincronización de VS Control se realiza mediante credenciales')}
                    >
                      <Zap className="w-4 h-4 inline mr-1" />
                      Sincronizar
                    </button>
                    <button 
                      className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700"
                      title="Ver en Prisma Studio"
                    >
                      <Table2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-700 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-blue-800 dark:text-blue-200">
                  Configuración de Sincronización
                </p>
                <p className="text-blue-700 dark:text-blue-300 mt-1">
                  Para sincronizar datos de VS Control, necesitas configurar las credenciales:
                </p>
                <ul className="list-disc list-inside mt-1 text-blue-700 dark:text-blue-300">
                  <li>Usuario de VS Control</li>
                  <li>Contraseña</li>
                  <li>Código de Empresa</li>
                </ul>
                <p className="text-blue-700 dark:text-blue-300 mt-2">
                  Las tablas ya han sido creadas en tu base de datos y están listas para recibir datos.
                  Puedes ver su estructura en Prisma Studio ejecutando: <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">npx prisma studio</code>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Table Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
              Agregar Nueva Tabla de Sincronización
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tabla de Ramp Disponible
                </label>
                <select 
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  value={newTableForm.tableName}
                  onChange={(e) => {
                    const selectedTable = rampTables.find(t => t.name === e.target.value);
                    setNewTableForm({
                      ...newTableForm,
                      tableName: e.target.value,
                      displayName: selectedTable?.displayName || e.target.value
                    });
                  }}
                >
                  <option value="">Selecciona una tabla...</option>
                  {rampTables.map(table => (
                    <option key={table.name} value={table.name}>
                      {table.displayName} ({table.recordCount.toLocaleString()} registros)
                    </option>
                  ))}
                </select>
              </div>

              {/* Detalles de la tabla seleccionada */}
              {newTableForm.tableName && (() => {
                const selectedTable = rampTables.find(t => t.name === newTableForm.tableName);
                return selectedTable ? (
                  <React.Fragment>
                    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 space-y-3">
                      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Estructura de la Tabla
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {selectedTable.columns.slice(0, 9).map((col, idx) => (
                          <div key={idx} className="text-xs">
                            <span className="font-medium text-gray-700 dark:text-gray-300">
                              {col.name}
                            </span>
                            <span className="text-gray-500 ml-1">
                              ({col.type})
                            </span>
                            {col.isPrimaryKey && (
                              <span className="ml-1 text-yellow-600">PK</span>
                            )}
                            {col.isForeignKey && (
                              <span className="ml-1 text-blue-600">FK</span>
                            )}
                          </div>
                        ))}
                        {selectedTable.columns.length > 9 && (
                          <div className="text-xs text-gray-500">
                            ... y {selectedTable.columns.length - 9} columnas más
                          </div>
                        )}
                      </div>

                      {selectedTable.possibleRelations.length > 0 && (
                        <>
                          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mt-3">
                            Relaciones Detectadas
                          </h4>
                          <div className="space-y-1">
                            {selectedTable.possibleRelations.map((rel, idx) => (
                              <div key={idx} className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                                <Link className="w-3 h-3" />
                                <span>{rel.column} → {rel.relatedTable} ({rel.type})</span>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>

                    {/* Selección de tablas relacionadas */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Tablas Relacionadas en Prisma
                      </label>
                      <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg p-3">
                        {prismaTables.map(table => (
                          <label key={table.name} className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              className="rounded"
                              checked={newTableForm.relatedTables.includes(table.name)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setNewTableForm({
                                    ...newTableForm,
                                    relatedTables: [...newTableForm.relatedTables, table.name]
                                  });
                                } else {
                                  setNewTableForm({
                                    ...newTableForm,
                                    relatedTables: newTableForm.relatedTables.filter(t => t !== table.name)
                                  });
                                }
                              }}
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">{table.displayName}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Intervalo de Sincronización (minutos)
                      </label>
                      <input
                        type="number"
                        value={newTableForm.intervalMinutes}
                        onChange={(e) => setNewTableForm({...newTableForm, intervalMinutes: parseInt(e.target.value) || 60})}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                      />
                    </div>
                  </React.Fragment>
                ) : null;
              })()}

              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-yellow-800 dark:text-yellow-200">
                      Generación Automática de Tabla
                    </p>
                    <p className="text-yellow-700 dark:text-yellow-300 mt-1">
                      Al agregar esta tabla, el sistema automáticamente:
                    </p>
                    <ul className="list-disc list-inside mt-1 text-yellow-700 dark:text-yellow-300">
                      <li>Creará la tabla en Prisma con la estructura correspondiente</li>
                      <li>Generará las migraciones necesarias</li>
                      <li>Configurará las relaciones con las tablas seleccionadas</li>
                      <li>Iniciará la sincronización inicial de datos</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setNewTableForm({
                    tableName: '',
                    displayName: '',
                    relatedTables: [],
                    intervalMinutes: 60
                  });
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddTable}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                Crear y Sincronizar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Configuration Modal */}
      {selectedTable && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
              Configurar {selectedTable.displayName}
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Intervalo de Sincronización (minutos)
                </label>
                <input
                  type="number"
                  value={selectedTable.intervalMinutes}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Estado
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedTable.isEnabled}
                    className="rounded"
                  />
                  <span>Sincronización automática habilitada</span>
                </div>
              </div>

              {selectedTable.errorMessage && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-lg p-3">
                  <p className="text-sm text-red-700 dark:text-red-300">
                    <strong>Último error:</strong> {selectedTable.errorMessage}
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setSelectedTable(null)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  alert('Configuración guardada');
                  setSelectedTable(null);
                }}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
