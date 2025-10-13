// src/app/(dashboard)/dashboard/page.tsx
'use client';

import { signOut } from 'next-auth/react';
import { Card } from '@/components/ui/card';
import { DollarSign, TrendingUp, Users, Briefcase, LogOut } from 'lucide-react';

export default function DashboardPage() {
  const handleLogout = () => {
    signOut({ callbackUrl: '/login' });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header con botón de logout */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Bienvenido al sistema de control financiero
          </p>
        </div>
        
        {/* Botón de Logout */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Cerrar Sesión
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Ingresos Totales
              </p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                $2,450,000
              </p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Egresos Totales
              </p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                $1,850,000
              </p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Proyectos Activos
              </p>
              <p className="text-3xl font-bold text-gray-900 mt-2">24</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <Briefcase className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Clientes</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">156</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Contenido adicional */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">
            Proyectos Recientes
          </h3>
          <p className="text-gray-500">
            Los proyectos se mostrarán aquí...
          </p>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">
            Cotizaciones Pendientes
          </h3>
          <p className="text-gray-500">
            Las cotizaciones se mostrarán aquí...
          </p>
        </Card>
      </div>
    </div>
  );
}