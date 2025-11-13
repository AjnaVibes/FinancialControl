// src/app/(dashboard)/dashboard/tramites/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { 
  FileCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  Calendar,
  User,
  Building2,
  FileText,
  Download,
  Edit,
  ChevronRight,
  Stamp,
  Briefcase
} from 'lucide-react';

interface ProcedureItem {
  id: string;
  title: string;
  description: string;
  project: string;
  type: string;
  status: 'pending' | 'in-process' | 'completed' | 'on-hold';
  priority: 'high' | 'medium' | 'low';
  assignedTo: string;
  createdAt: string;
  dueDate: string;
  institution: string;
  documentNumber: string;
}

export default function TramitesPage() {
  const [items, setItems] = useState<ProcedureItem[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showAddForm, setShowAddForm] = useState(false);
  
  useEffect(() => {
    const mockItems: ProcedureItem[] = [
      {
        id: '1',
        title: 'Permiso de construcción Fase 3',
        description: 'Gestión de permiso municipal para nueva fase',
        project: 'Albarrada',
        type: 'Permiso Municipal',
        status: 'in-process',
        priority: 'high',
        assignedTo: 'Carlos López',
        createdAt: '2024-10-28',
        dueDate: '2024-11-15',
        institution: 'Ayuntamiento de Veracruz',
        documentNumber: 'PM-2024-0456'
      },
      {
        id: '2',
        title: 'Licencia ambiental',
        description: 'Renovación de licencia ambiental anual',
        project: 'Amatlán',
        type: 'Licencia Ambiental',
        status: 'completed',
        priority: 'medium',
        assignedTo: 'Carlos López',
        createdAt: '2024-10-15',
        dueDate: '2024-10-30',
        institution: 'SEMARNAT',
        documentNumber: 'LA-2024-789'
      }
    ];
    
    setItems(mockItems);
  }, []);

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in-process': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'on-hold': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredItems = items.filter(item => {
    if (selectedProject !== 'all' && item.project !== selectedProject) return false;
    if (filterStatus !== 'all' && item.status !== filterStatus) return false;
    return true;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FileCheck className="w-8 h-8 text-purple-600" />
            Departamento de Trámites
          </h1>
          <p className="text-gray-500 mt-1">Gestión de permisos y licencias</p>
        </div>
        
        <button
          onClick={() => setShowAddForm(true)}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Nuevo Trámite
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Trámites</p>
              <p className="text-2xl font-bold">25</p>
            </div>
            <FileCheck className="w-8 h-8 text-gray-400" />
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">En Proceso</p>
              <p className="text-2xl font-bold text-blue-600">10</p>
            </div>
            <Clock className="w-8 h-8 text-blue-400" />
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Completados</p>
              <p className="text-2xl font-bold text-green-600">12</p>
            </div>
            <CheckCircle2 className="w-8 h-8 text-green-400" />
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pendientes</p>
              <p className="text-2xl font-bold text-yellow-600">3</p>
            </div>
            <AlertCircle className="w-8 h-8 text-yellow-400" />
          </div>
        </div>
      </div>

      {/* Procedures List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Lista de Trámites</h2>
        </div>
        
        <div className="divide-y">
          {filteredItems.map(item => (
            <div key={item.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {item.title}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">{item.description}</p>
                  
                  <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Building2 className="w-4 h-4" />
                      {item.project}
                    </span>
                    <span className="flex items-center gap-1">
                      <Briefcase className="w-4 h-4" />
                      {item.institution}
                    </span>
                    <span className="flex items-center gap-1">
                      <Stamp className="w-4 h-4" />
                      {item.documentNumber}
                    </span>
                  </div>
                </div>
                
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                  {item.status === 'pending' ? 'Pendiente' :
                   item.status === 'in-process' ? 'En Proceso' :
                   item.status === 'completed' ? 'Completado' :
                   'En Espera'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
