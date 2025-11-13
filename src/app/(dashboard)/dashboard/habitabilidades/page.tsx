// src/app/(dashboard)/dashboard/habitabilidades/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { 
  Home,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Plus,
  Calendar,
  User,
  Building2,
  FileCheck,
  Download,
  Edit,
  ChevronRight,
  Shield,
  FileText
} from 'lucide-react';

interface HabitabilityItem {
  id: string;
  title: string;
  description: string;
  project: string;
  unit: string;
  status: 'pending' | 'in-review' | 'approved' | 'rejected';
  priority: 'high' | 'medium' | 'low';
  assignedTo: string;
  createdAt: string;
  dueDate: string;
  documents: string[];
  observations: string;
}

export default function HabitabilidadesPage() {
  const [items, setItems] = useState<HabitabilityItem[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Datos de ejemplo
  useEffect(() => {
    const mockItems: HabitabilityItem[] = [
      {
        id: '1',
        title: 'Certificado de habitabilidad Casa 15',
        description: 'Inspección y certificación de habitabilidad para entrega',
        project: 'Albarrada',
        unit: 'Casa 15, Manzana 3',
        status: 'in-review',
        priority: 'high',
        assignedTo: 'María García',
        createdAt: '2024-10-28',
        dueDate: '2024-11-05',
        documents: ['Planos', 'Permisos', 'Inspección'],
        observations: 'Pendiente revisión de instalaciones eléctricas'
      },
      {
        id: '2',
        title: 'Inspección final Lote 22',
        description: 'Verificación de cumplimiento de normas de habitabilidad',
        project: 'Amatlán',
        unit: 'Lote 22, Fase 2',
        status: 'approved',
        priority: 'medium',
        assignedTo: 'María García',
        createdAt: '2024-10-25',
        dueDate: '2024-10-30',
        documents: ['Certificados', 'Fotos'],
        observations: 'Aprobado sin observaciones'
      },
      {
        id: '3',
        title: 'Revisión de servicios básicos',
        description: 'Verificar agua, luz y drenaje funcionando correctamente',
        project: 'Vista Hermosa',
        unit: 'Edificio A, Depto 301',
        status: 'pending',
        priority: 'high',
        assignedTo: 'Carlos Mendoza',
        createdAt: '2024-10-29',
        dueDate: '2024-11-02',
        documents: ['Contratos CFE', 'Toma de agua'],
        observations: 'Programada para mañana'
      }
    ];
    
    setItems(mockItems);
  }, []);

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'in-review': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch(priority) {
      case 'high': return '🔴';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return '⚪';
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
            <Home className="w-8 h-8 text-green-600" />
            Departamento de Habitabilidades
          </h1>
          <p className="text-gray-500 mt-1">Certificación y verificación de habitabilidad</p>
        </div>
        
        <button
          onClick={() => setShowAddForm(true)}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Nueva Inspección
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Inspecciones</p>
              <p className="text-2xl font-bold">30</p>
            </div>
            <Home className="w-8 h-8 text-gray-400" />
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">En Revisión</p>
              <p className="text-2xl font-bold text-blue-600">8</p>
            </div>
            <FileCheck className="w-8 h-8 text-blue-400" />
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Aprobadas</p>
              <p className="text-2xl font-bold text-green-600">20</p>
            </div>
            <CheckCircle2 className="w-8 h-8 text-green-400" />
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pendientes</p>
              <p className="text-2xl font-bold text-yellow-600">2</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-yellow-400" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">Proyecto</label>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700"
            >
              <option value="all">Todos los proyectos</option>
              <option value="Albarrada">Albarrada</option>
              <option value="Amatlán">Amatlán</option>
              <option value="Vista Hermosa">Vista Hermosa</option>
            </select>
          </div>
          
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">Estado</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700"
            >
              <option value="all">Todos los estados</option>
              <option value="pending">Pendiente</option>
              <option value="in-review">En Revisión</option>
              <option value="approved">Aprobado</option>
              <option value="rejected">Rechazado</option>
            </select>
          </div>
          
          <div className="flex items-end">
            <button className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 flex items-center gap-2">
              <Download className="w-5 h-5" />
              Exportar
            </button>
          </div>
        </div>
      </div>

      {/* Habitability Items List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Lista de Habitabilidades</h2>
        </div>
        
        <div className="divide-y">
          {filteredItems.map(item => (
            <div key={item.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{getPriorityIcon(item.priority)}</span>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {item.title}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">{item.description}</p>
                      
                      <div className="flex flex-wrap items-center gap-4 mt-3">
                        <span className="flex items-center gap-1 text-sm text-gray-500">
                          <Building2 className="w-4 h-4" />
                          {item.project}
                        </span>
                        <span className="flex items-center gap-1 text-sm text-gray-500">
                          <Home className="w-4 h-4" />
                          {item.unit}
                        </span>
                        <span className="flex items-center gap-1 text-sm text-gray-500">
                          <User className="w-4 h-4" />
                          {item.assignedTo}
                        </span>
                        <span className="flex items-center gap-1 text-sm text-gray-500">
                          <Calendar className="w-4 h-4" />
                          {item.dueDate}
                        </span>
                      </div>
                      
                      {/* Documents */}
                      <div className="mt-3">
                        <p className="text-xs text-gray-500 mb-1">Documentos:</p>
                        <div className="flex flex-wrap gap-2">
                          {item.documents.map(doc => (
                            <span key={doc} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                              <FileText className="w-3 h-3 inline mr-1" />
                              {doc}
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      {/* Observations */}
                      {item.observations && (
                        <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded text-sm">
                          <Shield className="w-4 h-4 inline text-yellow-600 mr-1" />
                          {item.observations}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                    {item.status === 'pending' ? 'Pendiente' :
                     item.status === 'in-review' ? 'En Revisión' :
                     item.status === 'approved' ? 'Aprobado' :
                     'Rechazado'}
                  </span>
                  
                  <div className="flex gap-1">
                    <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Form Modal (placeholder) */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Nueva Inspección de Habitabilidad</h2>
            <p className="text-gray-500 mb-4">Formulario para programar nueva inspección</p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg"
              >
                Cancelar
              </button>
              <button className="px-4 py-2 bg-green-600 text-white rounded-lg">
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
