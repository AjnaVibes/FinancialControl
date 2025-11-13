// src/app/(dashboard)/dashboard/comercial/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { 
  ShoppingCart,
  TrendingUp,
  Users,
  DollarSign,
  Plus,
  Calendar,
  User,
  Building2,
  Phone,
  Mail,
  Target,
  Award
} from 'lucide-react';

interface SalesItem {
  id: string;
  clientName: string;
  project: string;
  unit: string;
  status: 'lead' | 'prospect' | 'negotiation' | 'closed-won' | 'closed-lost';
  value: number;
  assignedTo: string;
  createdAt: string;
  followUpDate: string;
  phone: string;
  email: string;
}

export default function ComercialPage() {
  const [items, setItems] = useState<SalesItem[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  useEffect(() => {
    const mockItems: SalesItem[] = [
      {
        id: '1',
        clientName: 'Roberto Hernández',
        project: 'Albarrada',
        unit: 'Casa 25, Manzana 4',
        status: 'negotiation',
        value: 2500000,
        assignedTo: 'Luis Rodríguez',
        createdAt: '2024-10-25',
        followUpDate: '2024-11-01',
        phone: '229-123-4567',
        email: 'roberto@email.com'
      },
      {
        id: '2',
        clientName: 'Patricia Méndez',
        project: 'Vista Hermosa',
        unit: 'Depto 301, Torre A',
        status: 'closed-won',
        value: 1800000,
        assignedTo: 'Luis Rodríguez',
        createdAt: '2024-10-20',
        followUpDate: '2024-10-28',
        phone: '229-987-6543',
        email: 'patricia@email.com'
      }
    ];
    setItems(mockItems);
  }, []);

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'closed-won': return 'bg-green-100 text-green-800';
      case 'negotiation': return 'bg-blue-100 text-blue-800';
      case 'prospect': return 'bg-purple-100 text-purple-800';
      case 'lead': return 'bg-yellow-100 text-yellow-800';
      case 'closed-lost': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ShoppingCart className="w-8 h-8 text-red-600" />
            Departamento Comercial
          </h1>
          <p className="text-gray-500 mt-1">Gestión de ventas y clientes</p>
        </div>
        
        <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Nuevo Cliente
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Prospectos</p>
              <p className="text-2xl font-bold">50</p>
            </div>
            <Users className="w-8 h-8 text-gray-400" />
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">En Negociación</p>
              <p className="text-2xl font-bold text-blue-600">12</p>
            </div>
            <Target className="w-8 h-8 text-blue-400" />
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Ventas Cerradas</p>
              <p className="text-2xl font-bold text-green-600">30</p>
            </div>
            <Award className="w-8 h-8 text-green-400" />
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Valor Total</p>
              <p className="text-xl font-bold text-green-600">$45M</p>
            </div>
            <DollarSign className="w-8 h-8 text-green-400" />
          </div>
        </div>
      </div>

      {/* Sales Pipeline */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Pipeline de Ventas</h2>
        </div>
        
        <div className="divide-y">
          {items.map(item => (
            <div key={item.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {item.clientName}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {item.project} - {item.unit}
                  </p>
                  
                  <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Phone className="w-4 h-4" />
                      {item.phone}
                    </span>
                    <span className="flex items-center gap-1">
                      <Mail className="w-4 h-4" />
                      {item.email}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Seguimiento: {item.followUpDate}
                    </span>
                  </div>
                  
                  <div className="mt-2">
                    <span className="text-lg font-semibold text-green-600">
                      {formatCurrency(item.value)}
                    </span>
                  </div>
                </div>
                
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                  {item.status === 'lead' ? 'Prospecto' :
                   item.status === 'prospect' ? 'Calificado' :
                   item.status === 'negotiation' ? 'Negociación' :
                   item.status === 'closed-won' ? 'Ganado' :
                   'Perdido'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
