// src/app/(dashboard)/dashboard/page.tsx
// VERSION ULTRA CORREGIDA - Sin iconColor, solo props básicas

'use client';

import { useEffect, useState } from 'react';
import { 
  Users, 
  Building2, 
  Home, 
  TrendingUp, 
  DollarSign,
  FileText,
  ArrowUpRight,
  RefreshCw,
  BarChart3
} from 'lucide-react';
import { StatCard } from '@/components/molecules/StatCard';
import Link from 'next/link';

interface DashboardData {
  kpis: {
    totalClients: number;
    activeProjects: number;
    totalUnits: number;
    availableUnits: number;
    totalQuotations: number;
    totalTransactions: number;
    totalRevenue: number;
    averageTicket: number;
    conversionRate: number;
    topDevelopers: Array<{
      id: number;
      name: string;
      projectsCount: number;
      unitsCount: number;
    }>;
    salesByMonth: Array<{
      month: string;
      count: number;
      revenue: number;
    }>;
    unitsByStatus: Array<{
      status: string;
      count: number;
      percentage: number;
    }>;
  };
  trends: any;
  timestamp: string;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/analytics/kpis?trends=true&trendsMonths=6');
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
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
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
        <p className="text-red-500">Error al cargar datos del dashboard</p>
      </div>
    );
  }

  const { kpis } = data;

  const occupancyRate = kpis.totalUnits > 0 
    ? ((kpis.totalUnits - kpis.availableUnits) / kpis.totalUnits) * 100 
    : 0;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Dashboard Financiero
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Vista general del sistema RAMP
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/dashboard/sync"
            className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white transition-colors"
          >
            <BarChart3 className="w-4 h-4" />
            Sincronización
          </Link>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>
      </div>

      {/* KPIs Principales - 🔧 SIN iconColor */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total de Clientes"
          value={kpis.totalClients.toLocaleString()}
          icon={Users}
        />

        <StatCard
          title="Proyectos Activos"
          value={kpis.activeProjects.toString()}
          icon={Building2}
        />

        <StatCard
          title="Unidades Totales"
          value={kpis.totalUnits.toLocaleString()}
          icon={Home}
        />

        <StatCard
          title="Tasa de Ocupación"
          value={`${occupancyRate.toFixed(1)}%`}
          icon={TrendingUp}
        />
      </div>

      {/* KPIs Financieros - 🔧 SIN iconColor */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title="Revenue Total"
          value={new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN',
            minimumFractionDigits: 0
          }).format(kpis.totalRevenue)}
          icon={DollarSign}
        />

        <StatCard
          title="Ticket Promedio"
          value={new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN',
            minimumFractionDigits: 0
          }).format(kpis.averageTicket)}
          icon={FileText}
        />

        <StatCard
          title="Tasa de Conversión"
          value={`${kpis.conversionRate.toFixed(1)}%`}
          icon={TrendingUp}
        />
      </div>

      {/* Top Desarrolladores */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
          Top 5 Desarrolladores
        </h2>
        <div className="space-y-3">
          {kpis.topDevelopers && kpis.topDevelopers.length > 0 ? (
            kpis.topDevelopers.map((dev, idx) => (
              <div
                key={dev.id}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">
                    {idx + 1}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{dev.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {dev.projectsCount} proyectos • {dev.unitsCount} unidades
                    </p>
                  </div>
                </div>
                <ArrowUpRight className="w-5 h-5 text-green-500" />
              </div>
            ))
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">
              No hay desarrolladores disponibles
            </p>
          )}
        </div>
      </div>

      {/* Ventas por Mes y Distribución */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ventas */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
            Ventas Últimos 6 Meses
          </h2>
          <div className="space-y-2">
            {kpis.salesByMonth && kpis.salesByMonth.length > 0 ? (
              kpis.salesByMonth.map((month) => (
                <div key={month.month} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded">
                  <span className="font-medium text-gray-900 dark:text-white">{month.month}</span>
                  <div className="text-right">
                    <p className="font-bold text-gray-900 dark:text-white">
                      {month.revenue.toLocaleString('es-MX', {
                        style: 'currency',
                        currency: 'MXN',
                        minimumFractionDigits: 0
                      })}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{month.count} ventas</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                No hay datos de ventas
              </p>
            )}
          </div>
        </div>

        {/* Distribución */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
            Distribución de Unidades
          </h2>
          <div className="space-y-3">
            {kpis.unitsByStatus && kpis.unitsByStatus.length > 0 ? (
              kpis.unitsByStatus.map((status) => (
                <div key={status.status}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-900 dark:text-white">{status.status}</span>
                    <span className="text-gray-500 dark:text-gray-400">
                      {status.count} ({status.percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all"
                      style={{ width: `${status.percentage}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                No hay datos de distribución
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-sm text-gray-500 dark:text-gray-400">
        Última actualización: {new Date(data.timestamp).toLocaleString('es-MX')}
      </div>
    </div>
  );
}