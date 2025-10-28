// src/components/organisms/SyncStatusCard/SyncStatusCard.tsx
'use client';

import { useState } from 'react';
import { 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Database,
  TrendingUp,
  RefreshCw,
  Play
} from 'lucide-react';

interface SyncStatusCardProps {
  table: {
    id: string;
    tabla: string;
    displayName: string;
    categoria: string;
    icono: string;
    color: string;
    recordCount: number;
    totalSyncs: number;
    successSyncs: number;
    errorSyncs: number;
    lastSyncAt: string | null;
    lastError: string | null;
    status: 'success' | 'warning' | 'error' | 'pending';
    healthScore: number;
  };
  onSync?: (tableName: string, type: 'incremental' | 'full' | 'complete') => void;
}

export default function SyncStatusCard({ table, onSync }: SyncStatusCardProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSync = async (type: 'incremental' | 'full' | 'complete') => {
    setIsLoading(true);
    try {
      if (onSync) {
        await onSync(table.tabla, type);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = () => {
    switch (table.status) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400 dark:text-gray-500" />;
    }
  };

  const getStatusColor = () => {
    switch (table.status) {
      case 'success':
        return 'border-green-500/20 bg-green-500/5 dark:bg-green-500/10';
      case 'warning':
        return 'border-yellow-500/20 bg-yellow-500/5 dark:bg-yellow-500/10';
      case 'error':
        return 'border-red-500/20 bg-red-500/5 dark:bg-red-500/10';
      default:
        return 'border-gray-500/20 bg-gray-500/5 dark:bg-gray-500/10';
    }
  };

  const getHealthColor = () => {
    if (table.healthScore >= 80) return 'text-green-500';
    if (table.healthScore >= 60) return 'text-yellow-500';
    if (table.healthScore >= 40) return 'text-orange-500';
    return 'text-red-500';
  };

  return (
    <div
      className={`rounded-lg border-2 p-4 transition-all hover:shadow-lg ${getStatusColor()}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{table.icono}</span>
          <div>
            <h3 className="font-semibold text-sm text-gray-900 dark:text-white">
              {table.displayName}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {table.tabla}
            </p>
          </div>
        </div>
        {getStatusIcon()}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-gray-400 dark:text-gray-500" />
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Registros</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {table.recordCount.toLocaleString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-gray-400 dark:text-gray-500" />
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Salud</p>
            <p className={`text-lg font-bold ${getHealthColor()}`}>
              {table.healthScore}%
            </p>
          </div>
        </div>
      </div>

      {/* Sync Info */}
      <div className="text-xs space-y-1 mb-3 border-t dark:border-gray-700 pt-2">
        <div className="flex justify-between">
          <span className="text-gray-500 dark:text-gray-400">Sincronizaciones:</span>
          <span className="font-medium text-gray-900 dark:text-white">{table.totalSyncs}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500 dark:text-gray-400">Exitosas:</span>
          <span className="font-medium text-green-600 dark:text-green-500">{table.successSyncs}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500 dark:text-gray-400">Con errores:</span>
          <span className="font-medium text-red-600 dark:text-red-500">{table.errorSyncs}</span>
        </div>
        {table.lastSyncAt && (
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">Última sync:</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {new Date(table.lastSyncAt).toLocaleDateString('es-MX', {
                day: '2-digit',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          </div>
        )}
      </div>

      {/* Error Message */}
      {table.lastError && (
        <div className="text-xs bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-2 rounded mb-3">
          {table.lastError}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => handleSync('incremental')}
          disabled={isLoading}
          className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-medium bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? (
            <RefreshCw className="w-3 h-3 animate-spin" />
          ) : (
            <RefreshCw className="w-3 h-3" />
          )}
          Incremental
        </button>
        <button
          onClick={() => handleSync('complete')}
          disabled={isLoading}
          className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-medium bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? (
            <RefreshCw className="w-3 h-3 animate-spin" />
          ) : (
            <Play className="w-3 h-3" />
          )}
          Completa
        </button>
      </div>
    </div>
  );
}