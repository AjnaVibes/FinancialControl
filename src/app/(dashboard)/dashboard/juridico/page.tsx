// src/app/(dashboard)/dashboard/juridico/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { 
  Scale,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Calendar,
  User,
  Building2,
  Gavel,
  Shield,
  Download
} from 'lucide-react';

interface LegalItem {
  id: string;
  title: string;
  description: string;
  project: string;
  type: 'contract' | 'litigation' | 'compliance' | 'advisory';
  status: 'pending' | 'in-review' | 'resolved' | 'critical';
  priority: 'high' | 'medium' | 'low';
  assignedTo: string;
  createdAt: string;
  dueDate: string;
  caseNumber: string;
}

export default function JuridicoPage() {
  const [items, setItems] = useState<LegalItem[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  useEffect(() => {
    const mockItems: LegalItem[] = [
      {
        id: '1',
        title: 'Contrato de compraventa Lote 15',
        description: 'Revisión y elaboración de contrato de compraventa',
        project: 'Albarrada',
        type: 'contract',
        status: 'in-review',
        priority: 'high',
        assignedTo: 'Ana Martínez',
        createdAt: '2024-10-28',
        dueDate: '2024-11-02',
        caseNumber: 'LEG-2024-001'
      },
      {
        id: '2',
        title: 'Resolución de disputa vecinal',
        description: 'Mediación por límites de propiedad',
        project: 'Vista Hermosa',
        type: 'litigation',
        status: 'resolved',
        priority: 'medium',
        assignedTo: 'Ana Martínez',
        createdAt: '2024-10-20',
        dueDate: '2024-10-28',
        caseNumber: 'LEG-2024-002'
      }
    ];
    setItems(mockItems);
  }, []);

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'in-review': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Scale className="w-8 h-8 text-yellow-600" />
            Departamento Jurídico
          </h1>
          <p className="text-gray-500 mt-1">Gestión legal y contratos</p>
        </div>
        
        <button className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Nuevo Caso
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Casos</p>
              <p className="text-2xl font-bold">15</p>
            </div>
            <Scale className="w-8 h-8 text-gray-400" />
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">En Revisión</p>
              <p className="text-2xl font-bold text-blue-600">5</p>
            </div>
            <FileText className="w-8 h-8 text-blue-400" />
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Resueltos</p>
              <p className="text-2xl font-bold text-green-600">10</p>
            </div>
            <CheckCircle2 className="w-8 h-8 text-green-400" />
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Críticos</p>
              <p className="text-2xl font-bold text-red-600">0</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-400" />
          </div>
        </div>
      </div>

      {/* Legal Items List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Casos Legales</h2>
        </div>
        
        <div className="divide-y">
          {items.map(item => (
            <div key={item.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {item.title}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">{item.description}</p>
                  
                  <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Gavel className="w-4 h-4" />
                      {item.caseNumber}
                    </span>
                    <span className="flex items-center gap-1">
                      <Building2 className="w-4 h-4" />
                      {item.project}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {item.dueDate}
                    </span>
                  </div>
                </div>
                
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                  {item.status === 'pending' ? 'Pendiente' :
                   item.status === 'in-review' ? 'En Revisión' :
                   item.status === 'resolved' ? 'Resuelto' :
                   'Crítico'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
