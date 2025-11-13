// src/app/(dashboard)/dashboard/operaciones/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { 
  Settings2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  Calendar,
  User,
  Building2,
  Filter,
  Download,
  Edit,
  Trash2,
  ChevronRight
} from 'lucide-react';

interface WorkItem {
  id: string;
  title: string;
  description: string;
  project: string;
  status: 'pending' | 'in-progress' | 'completed' | 'blocked';
  priority: 'high' | 'medium' | 'low';
  assignedTo: string;
  createdAt: string;
  dueDate: string;
  progress: number;
}

export default function OperacionesPage() {
  const [workItems, setWorkItems] = useState<WorkItem[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Datos de ejemplo
  useEffect(() => {
    const mockItems: WorkItem[] = [
      {
        id: '1',
        title: 'Instalación de servicios básicos',
        description: 'Instalación completa de agua, luz y drenaje en el lote 15',
        project: 'Albarrada',
        status: 'in-progress',
        priority: 'high',
        assignedTo: 'Juan Pérez',
        createdAt: '2024-10-28',
        dueDate: '2024-11-05',
        progress: 65
      },
      {
        id: '2',
        title: 'Supervisión de obra civil',
        description: 'Supervisión de cimentación en manzana 3',
        project: 'Amatlán',
        status: 'pending',
        priority: 'medium',
        assignedTo: 'Juan Pérez',
        createdAt: '2024-10-29',
        dueDate: '2024-11-10',
        progress: 0
      },
      {
        id: '3',
        title: 'Revisión de planos arquitectónicos',
        description: 'Validación de planos para fase 2',
        project: 'Vista Hermosa',
        status: 'completed',
        priority: 'low',
        assignedTo: 'María López',
        createdAt: '2024-10-20',
        dueDate: '2024-10-28',
        progress: 100
      }
    ];
    
    setWorkItems(mockItems);
  }, []);

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'blocked': return 'bg-red-100 text-red-800';
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

  const filteredItems = workItems.filter(item => {
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
            <Settings2 className="w-8 h-8 text-blue-600" />
            Departamento de Operaciones
          </h1>
          <p className="text-gray-500 mt-1">Gestión de operaciones y supervisión de obras</p>
        </div>
        
        <button
          onClick={() => setShowAddForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Nueva Operación
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Operaciones</p>
              <p className="text-2xl font-bold">45</p>
            </div>
            <Settings2 className="w-8 h-8 text-gray-400" />
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">En Proceso</p>
              <p className="text-2xl font-bold text-blue-600">12</p>
            </div>
            <Clock className="w-8 h-8 text-blue-400" />
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Completadas</p>
              <p className="text-2xl font-bold text-green-600">28</p>
            </div>
            <CheckCircle2 className="w-8 h-8 text-green-400" />
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pendientes</p>
              <p className="text-2xl font-bold text-yellow-600">5</p>
            </div>
            <AlertCircle className="w-8 h-8 text-yellow-400" />
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
              <option value="in-progress">En Proceso</option>
              <option value="completed">Completado</option>
              <option value="blocked">Bloqueado</option>
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

      {/* Work Items List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Lista de Operaciones</h2>
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
                      
                      <div className="flex items-center gap-4 mt-3">
                        <span className="flex items-center gap-1 text-sm text-gray-500">
                          <Building2 className="w-4 h-4" />
                          {item.project}
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
                      
                      {/* Progress Bar */}
                      <div className="mt-3">
                        <div className="flex justify-between text-xs mb-1">
                          <span>Progreso</span>
                          <span>{item.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full"
                            style={{width: `${item.progress}%`}}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                    {item.status === 'pending' ? 'Pendiente' :
                     item.status === 'in-progress' ? 'En Proceso' :
                     item.status === 'completed' ? 'Completado' :
                     'Bloqueado'}
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
            <h2 className="text-xl font-bold mb-4">Nueva Operación</h2>
            <p className="text-gray-500 mb-4">Formulario para agregar nueva operación</p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg"
              >
                Cancelar
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg">
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
