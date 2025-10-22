'use client';

import { StatCard } from '@/components/molecules/StatCard';
import { Breadcrumbs } from '@/components/organisms/Breadcrumbs';
import { 
  DollarSign, 
  TrendingUp, 
  Building2, 
  Users,
  ArrowUpRight
} from 'lucide-react';

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <Breadcrumbs items={[]} />

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Bienvenido al sistema de control financiero
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Ingresos Totales"
          value="$2,450,000"
          change="+12.5%"
          trend="up"
          icon={DollarSign}
          color="blue"
          description="vs mes anterior"
        />

        <StatCard
          title="Egresos Totales"
          value="$1,850,000"
          change="+8.2%"
          trend="up"
          icon={TrendingUp}
          color="green"
          description="vs mes anterior"
        />

        <StatCard
          title="Proyectos Activos"
          value="24"
          change="+3"
          trend="up"
          icon={Building2}
          color="purple"
          description="nuevos este mes"
        />

        <StatCard
          title="Clientes"
          value="156"
          change="+15"
          trend="up"
          icon={Users}
          color="orange"
          description="este mes"
        />
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Proyectos Recientes */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Proyectos Recientes
            </h2>
            <button className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
              Ver todos
            </button>
          </div>
          
          <div className="space-y-3">
            {[
              { name: 'Proyecto Aurora', status: 'En progreso', amount: '$450,000', change: '+12%' },
              { name: 'Residencial Vista', status: 'En progreso', amount: '$320,000', change: '+8%' },
              { name: 'Plaza Central', status: 'Completado', amount: '$180,000', change: '+5%' },
            ].map((project, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {project.name}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {project.status}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {project.amount}
                  </p>
                  <div className="flex items-center text-green-600 dark:text-green-400 text-sm">
                    <ArrowUpRight className="w-4 h-4" />
                    <span>{project.change}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Transacciones Recientes */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Transacciones Recientes
            </h2>
            <button className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
              Ver todas
            </button>
          </div>
          
          <div className="space-y-3">
            {[
              { type: 'Ingreso', client: 'Cliente A', amount: '+$50,000', date: 'Hoy' },
              { type: 'Egreso', client: 'Proveedor B', amount: '-$25,000', date: 'Ayer' },
              { type: 'Ingreso', client: 'Cliente C', amount: '+$35,000', date: '2 días' },
            ].map((transaction, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {transaction.client}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {transaction.type} • {transaction.date}
                  </p>
                </div>
                <div
                  className={`font-semibold ${
                    transaction.amount.startsWith('+')
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {transaction.amount}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Acciones Rápidas
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Nuevo Ingreso', icon: DollarSign, color: 'blue' },
            { label: 'Nuevo Egreso', icon: TrendingUp, color: 'red' },
            { label: 'Nuevo Proyecto', icon: Building2, color: 'purple' },
            { label: 'Nuevo Cliente', icon: Users, color: 'green' },
          ].map((action, index) => {
            const Icon = action.icon;
            return (
              <button
                key={index}
                className="flex flex-col items-center gap-3 p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all group"
              >
                <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-gray-100 dark:bg-gray-700 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/40 transition-colors">
                  <Icon className="w-6 h-6 text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {action.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}