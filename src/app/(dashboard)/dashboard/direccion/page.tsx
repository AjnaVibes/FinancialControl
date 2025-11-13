// src/app/(dashboard)/dashboard/direccion/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { 
  Building2, 
  TrendingUp, 
  DollarSign, 
  Calendar,
  Target,
  Activity,
  ArrowUp,
  ArrowDown,
  Percent,
  Settings2,
  Home,
  FileCheck,
  Scale,
  ShoppingCart,
  MessageSquare,
  Send,
  CheckCircle,
  AlertCircle,
  Clock,
  User,
  ChevronRight,
  Users,
  Trophy,
  Banknote,
  Package,
  BarChart3,
  TrendingDown
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface Project {
  id: string;
  name: string;
  displayName: string;
  budget: number;
  totalSales: number;
  totalIncome: number;
  startDate: string;
  endDate?: string;
  status: 'active' | 'completed' | 'paused';
}

interface SalesData {
  date: string;
  sales: number;
  income: number;
  accumulated: number;
  goal: number;
}

interface Department {
  id: string;
  name: string;
  icon: any;
  color: string;
  planned: number;
  completed: number;
  pending: number;
  assignedTo: string;
  tasks: Task[];
  previousPending?: number; // Tareas pendientes de la semana anterior
  weeklyPlanned?: number; // Tareas planeadas para esta semana
}

interface Task {
  id: string;
  text: string;
  priority: 'high' | 'medium' | 'low';
  createdBy: string;
  createdAt: string;
  status: 'pending' | 'in-progress' | 'completed';
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

// Función para formatear moneda
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

// Función para formatear porcentaje
const formatPercentage = (value: number) => {
  return `${(value * 100).toFixed(1)}%`;
};

export default function DireccionGeneralDashboard() {
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | '1y' | 'all'>('30d');
  
  // Estados adicionales para datos reales
  const [unitsData, setUnitsData] = useState<any>({ total: 0 });
  const [movementsData, setMovementsData] = useState<any>({ totalCobrado: 0 });
  const [operatesData, setOperatesData] = useState<any>({ pieData: [] });
  
  // Nuevos estados para análisis adicionales
  const [pipelineData, setPipelineData] = useState<any>({ pipeline: {}, conversion: {} });
  const [performanceData, setPerformanceData] = useState<any>({ topAgents: [], topAgencies: [] });
  const [clientsData, setClientsData] = useState<any>({ summary: {}, demographics: {} });
  const [cashflowData, setCashflowData] = useState<any>({ overdue: {}, projection: [] });
  const [inventoryData, setInventoryData] = useState<any>({ summary: {} });
  const [kpisData, setKpisData] = useState<any>({ salesMetrics: {}, financialMetrics: {} });
  
  // Estados para departamentos
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [taskPriority, setTaskPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [weekOffset, setWeekOffset] = useState(0); // 0 = semana actual, -1 = semana pasada

  // Cargar proyectos reales de la API
  useEffect(() => {
    async function loadProjects() {
      try {
        const response = await fetch('/api/projects');
        const result = await response.json();
        
        if (result.success && result.data.length > 0) {
          const projectsData = result.data.map((p: any) => ({
            id: p.id,
            name: p.name,
            displayName: p.displayName,
            budget: p.totalSales * 1.5, // Estimación del presupuesto
            totalSales: p.totalSales,
            totalIncome: p.totalIncome,
            startDate: p.createdAt,
            status: p.status as 'active' | 'completed' | 'paused'
          }));
          
          setProjects(projectsData);
          setSelectedProject(projectsData[0].id);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error loading projects:', error);
        // Si hay error, usar datos de ejemplo
        loadMockData();
      }
    }
    
    loadProjects();
  }, []);

  // Cargar datos reales del proyecto seleccionado
  useEffect(() => {
    async function loadProjectData() {
      if (!selectedProject) return;
      
      const currentProj = projects.find(p => p.id === selectedProject);
      if (!currentProj) return;

      try {
        // Cargar unidades
        const unitsResponse = await fetch(`/api/direccion/units?projectName=${currentProj.name}`);
        const unitsResult = await unitsResponse.json();
        if (unitsResult.success) {
          setUnitsData(unitsResult.data);
        }

        // Cargar movimientos
        const movementsResponse = await fetch(`/api/direccion/movements?projectName=${currentProj.name}`);
        const movementsResult = await movementsResponse.json();
        if (movementsResult.success) {
          setMovementsData(movementsResult.data);
        }

        // Cargar operates
        const operatesResponse = await fetch(`/api/direccion/operates?projectName=${currentProj.name}`);
        const operatesResult = await operatesResponse.json();
        if (operatesResult.success) {
          setOperatesData(operatesResult.data);
        }

        // Cargar pipeline de ventas
        const pipelineResponse = await fetch(`/api/direccion/pipeline?projectName=${currentProj.name}`);
        const pipelineResult = await pipelineResponse.json();
        if (pipelineResult.success) {
          setPipelineData(pipelineResult.data);
        }

        // Cargar performance
        const performanceResponse = await fetch(`/api/direccion/performance?projectName=${currentProj.name}`);
        const performanceResult = await performanceResponse.json();
        if (performanceResult.success) {
          setPerformanceData(performanceResult.data);
        }

        // Cargar análisis de clientes
        const clientsResponse = await fetch(`/api/direccion/clients?projectName=${currentProj.name}`);
        const clientsResult = await clientsResponse.json();
        if (clientsResult.success) {
          setClientsData(clientsResult.data);
        }

        // Cargar flujo de caja
        const cashflowResponse = await fetch(`/api/direccion/cashflow?projectName=${currentProj.name}`);
        const cashflowResult = await cashflowResponse.json();
        if (cashflowResult.success) {
          setCashflowData(cashflowResult.data);
        }

        // Cargar inventario
        const inventoryResponse = await fetch(`/api/direccion/inventory?projectName=${currentProj.name}`);
        const inventoryResult = await inventoryResponse.json();
        if (inventoryResult.success) {
          setInventoryData(inventoryResult.data);
        }

        // Cargar KPIs
        const kpisResponse = await fetch(`/api/direccion/kpis?projectName=${currentProj.name}`);
        const kpisResult = await kpisResponse.json();
        if (kpisResult.success) {
          setKpisData(kpisResult.data);
        }

        // Cargar datos de ventas reales
        const salesResponse = await fetch(`/api/direccion/sales-timeline?projectName=${currentProj.name}&range=${dateRange}`);
        const salesResult = await salesResponse.json();
        
        if (salesResult.success) {
          setSalesData(salesResult.data.salesData);
          
          // Actualizar proyecto con datos reales
          setProjects(prev => prev.map(p => 
            p.id === selectedProject 
              ? {
                  ...p,
                  totalSales: salesResult.data.summary.totalSales,
                  totalIncome: salesResult.data.summary.totalIncome,
                  budget: salesResult.data.summary.totalSales * 1.5 || 150000000, // Estimación del presupuesto
                  status: 'active' // Estado real basado en datos
                }
              : p
          ));
        } else {
          generateSalesData();
        }
      } catch (error) {
        console.error('Error loading project data:', error);
        generateSalesData();
      }
    }
    
    if (selectedProject) {
      loadProjectData();
    }
  }, [selectedProject, dateRange]);

  // Función para cargar datos de ejemplo si falla la API
  const loadMockData = () => {
    const mockProjects: Project[] = [
      {
        id: 'albarrada',
        name: 'albarrada',
        displayName: 'Albarrada',
        budget: 150000000,
        totalSales: 89500000,
        totalIncome: 67125000,
        startDate: '2023-01-01',
        status: 'active'
      },
      {
        id: 'amatlan',
        name: 'amatlan',
        displayName: 'Amatlán',
        budget: 120000000,
        totalSales: 102000000,
        totalIncome: 76500000,
        startDate: '2023-03-15',
        status: 'active'
      },
      {
        id: 'vista-hermosa',
        name: 'vista-hermosa',
        displayName: 'Vista Hermosa',
        budget: 200000000,
        totalSales: 45000000,
        totalIncome: 33750000,
        startDate: '2024-01-01',
        status: 'active'
      },
      {
        id: 'los-fresnos',
        name: 'los-fresnos',
        displayName: 'Los Fresnos',
        budget: 180000000,
        totalSales: 156000000,
        totalIncome: 117000000,
        startDate: '2022-06-01',
        endDate: '2024-06-01',
        status: 'completed'
      }
    ];

    setProjects(mockProjects);
    setSelectedProject(mockProjects[0].id);
    generateSalesData();
    setLoading(false);
  };

  // Función para obtener rango de fechas de la semana
  const getWeekDateRange = (offset: number = 0) => {
    const today = new Date();
    const currentDay = today.getDay();
    const diff = currentDay === 0 ? -6 : 1 - currentDay; // Si es domingo, retroceder 6 días, si no, al lunes
    
    const monday = new Date(today);
    monday.setDate(today.getDate() + diff + (offset * 7));
    
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    
    return {
      start: monday,
      end: sunday,
      weekLabel: offset === 0 ? 'Semana Actual' : offset === -1 ? 'Semana Pasada' : `Hace ${Math.abs(offset)} semanas`
    };
  };

  // Inicializar departamentos con datos de la semana
  useEffect(() => {
    const weekData = getWeekDateRange(weekOffset);
    
    // Simular datos diferentes por semana
    const baseData = [
      {
        id: 'operaciones',
        name: 'Operaciones',
        icon: Settings2,
        color: 'blue',
        assignedTo: 'Juan Pérez',
        baseWeekly: 10, // Meta semanal base
        completionRate: 0.85
      },
      {
        id: 'habitabilidades',
        name: 'Habitabilidades',
        icon: Home,
        color: 'green',
        assignedTo: 'María García',
        baseWeekly: 7,
        completionRate: 0.93
      },
      {
        id: 'tramites',
        name: 'Trámites',
        icon: FileCheck,
        color: 'purple',
        assignedTo: 'Carlos López',
        baseWeekly: 6,
        completionRate: 0.80
      },
      {
        id: 'juridico',
        name: 'Jurídico',
        icon: Scale,
        color: 'yellow',
        assignedTo: 'Ana Martínez',
        baseWeekly: 4,
        completionRate: 1.0
      },
      {
        id: 'comercial',
        name: 'Comercial',
        icon: ShoppingCart,
        color: 'red',
        assignedTo: 'Luis Rodríguez',
        baseWeekly: 12,
        completionRate: 0.84
      }
    ];

    const mockDepartments: Department[] = baseData.map(dept => {
      // Calcular pendientes de semanas anteriores (si es semana actual)
      const previousPending = weekOffset === 0 ? Math.floor(Math.random() * 3) : 0;
      
      // Tareas planeadas para esta semana
      const weeklyPlanned = dept.baseWeekly;
      
      // Total planeado (semana actual + pendientes anteriores)
      const totalPlanned = weeklyPlanned + previousPending;
      
      // Calcular completadas basado en el progreso de la semana
      const completed = Math.floor(totalPlanned * dept.completionRate);
      const pending = totalPlanned - completed;

      return {
        ...dept,
        planned: totalPlanned,
        completed: completed,
        pending: pending,
        previousPending: previousPending, // Pendientes acumulados
        weeklyPlanned: weeklyPlanned, // Planeadas esta semana
        tasks: []
      };
    });
    
    setDepartments(mockDepartments);
  }, [weekOffset]);

  const handleSendTask = (departmentId: string) => {
    if (newComment.trim()) {
      const newTask: Task = {
        id: Date.now().toString(),
        text: newComment,
        priority: taskPriority,
        createdBy: 'Eduardo Arriaga',
        createdAt: new Date().toISOString(),
        status: 'pending'
      };

      setDepartments(prevDepts => 
        prevDepts.map(dept => 
          dept.id === departmentId 
            ? { ...dept, tasks: [...dept.tasks, newTask] }
            : dept
        )
      );

      setNewComment('');
      setSelectedDepartment(null);
    }
  };

  const getDepartmentColorClass = (color: string) => {
    const colors: { [key: string]: string } = {
      blue: 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400',
      green: 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400',
      purple: 'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400',
      yellow: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-400',
      red: 'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400'
    };
    return colors[color] || colors.blue;
  };

  const getPriorityColor = (priority: string) => {
    switch(priority) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const generateSalesData = () => {
    // Generar datos de ventas de los últimos 90 días
    const data: SalesData[] = [];
    const today = new Date();
    const daysToShow = dateRange === '7d' ? 7 : 
                      dateRange === '30d' ? 30 : 
                      dateRange === '90d' ? 90 : 
                      dateRange === '1y' ? 365 : 500;
    
    let accumulated = 0;
    const dailyGoal = 150000000 / 365; // Meta anual dividida por días

    for (let i = daysToShow; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // Simular ventas variables
      const dailySales = Math.floor(Math.random() * 5000000) + 1000000;
      const dailyIncome = dailySales * 0.75; // 75% de las ventas se convierten en ingresos
      accumulated += dailySales;

      data.push({
        date: date.toISOString().split('T')[0],
        sales: dailySales,
        income: dailyIncome,
        accumulated: accumulated,
        goal: dailyGoal * (daysToShow - i)
      });
    }

    setSalesData(data);
  };

  // Este useEffect se movió arriba para cargar datos de la API

  const currentProject = projects.find(p => p.id === selectedProject);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const salesProgress = currentProject ? currentProject.totalSales / currentProject.budget : 0;
  const incomeProgress = currentProject ? currentProject.totalIncome / currentProject.totalSales : 0;

  // Datos para el gráfico de distribución
  const distributionData = currentProject ? [
    { name: 'Vendido', value: currentProject.totalSales },
    { name: 'Disponible', value: currentProject.budget - currentProject.totalSales }
  ] : [];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
            Dashboard Dirección General
          </h1>
          <p className="text-sm lg:text-base text-gray-500 dark:text-gray-400 mt-1">
            Análisis de ventas e ingresos por proyecto
          </p>
        </div>

        {/* Selector de Proyecto y Rango de Fecha */}
        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Seleccionar proyecto...</option>
            {projects.map(project => (
              <option key={project.id} value={project.id}>
                {project.displayName}
              </option>
            ))}
          </select>

          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="7d">Últimos 7 días</option>
            <option value="30d">Últimos 30 días</option>
            <option value="90d">Últimos 90 días</option>
            <option value="1y">Último año</option>
            <option value="all">Todo el período</option>
          </select>
        </div>
      </div>

      {/* Sección de Departamentos - MOVIDO AL PRINCIPIO */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Estado de Departamentos</h2>
          
          {/* Selector de Semana */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setWeekOffset(weekOffset - 1)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Semana anterior"
            >
              <ChevronRight className="w-5 h-5 rotate-180" />
            </button>
            
            <div className="px-4 py-2 bg-white dark:bg-gray-800 rounded-lg border">
              <div className="text-sm font-medium">
                {getWeekDateRange(weekOffset).weekLabel}
              </div>
              <div className="text-xs text-gray-500">
                {getWeekDateRange(weekOffset).start.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })} - 
                {getWeekDateRange(weekOffset).end.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}
              </div>
            </div>
            
            <button
              onClick={() => setWeekOffset(weekOffset + 1)}
              disabled={weekOffset >= 0}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Semana siguiente"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            
            {weekOffset !== 0 && (
              <button
                onClick={() => setWeekOffset(0)}
                className="ml-2 px-3 py-1 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
              >
                Semana Actual
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {departments.map(dept => {
            const Icon = dept.icon;
            const progress = dept.planned > 0 ? (dept.completed / dept.planned) * 100 : 0;
            
            return (
              <div key={dept.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                {/* Header del Departamento */}
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getDepartmentColorClass(dept.color)}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => window.location.href = `/dashboard/${dept.id}`}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      title="Ver departamento"
                    >
                      <ChevronRight className="w-4 h-4 text-gray-500" />
                    </button>
                    <button
                      onClick={() => setSelectedDepartment(dept.id === selectedDepartment ? null : dept.id)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      title="Asignar tarea"
                    >
                      <MessageSquare className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                </div>

                {/* Nombre y Responsable */}
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                      {dept.name}
                    </h3>
                    <div className="flex items-center text-xs text-gray-500 mb-3">
                      <User className="w-3 h-3 mr-1" />
                      {dept.assignedTo}
                    </div>

                    {/* Métricas */}
                    <div className="space-y-2 mb-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Planeadas</span>
                        <span className="font-semibold">
                          {dept.planned}
                          {dept.previousPending && dept.previousPending > 0 && weekOffset === 0 && (
                            <span className="text-xs text-orange-600 ml-1">
                              (+{dept.previousPending})
                            </span>
                          )}
                        </span>
                      </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Realizadas</span>
                    <span className="font-semibold text-green-600">{dept.completed}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Pendientes</span>
                    <span className="font-semibold text-yellow-600">{dept.pending}</span>
                  </div>
                </div>

                {/* Barra de Progreso */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-500">Avance</span>
                    <span className="font-semibold">{progress.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all ${
                        progress >= 90 ? 'bg-green-600' :
                        progress >= 70 ? 'bg-blue-600' :
                        progress >= 50 ? 'bg-yellow-600' :
                        'bg-red-600'
                      }`}
                      style={{width: `${progress}%`}}
                    />
                  </div>
                </div>

                    {/* Indicador de pendientes acumulados */}
                    {dept.previousPending && dept.previousPending > 0 && weekOffset === 0 && (
                      <div className="mb-2 p-2 bg-orange-50 dark:bg-orange-900/20 rounded text-xs">
                        <AlertCircle className="w-3 h-3 inline text-orange-600 mr-1" />
                        {dept.previousPending} pendientes de semana anterior
                      </div>
                    )}

                    {/* Estado Visual */}
                    <div className="flex items-center justify-center gap-2 text-sm">
                  {progress >= 100 ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-green-600 font-medium">Completado</span>
                    </>
                  ) : progress >= 90 ? (
                    <>
                      <Clock className="w-4 h-4 text-blue-600" />
                      <span className="text-blue-600 font-medium">Por completar</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-4 h-4 text-yellow-600" />
                      <span className="text-yellow-600 font-medium">En proceso</span>
                    </>
                  )}
                </div>

                {/* Sección de Comentarios/Tareas (expandible) */}
                {selectedDepartment === dept.id && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="space-y-2 mb-3">
                      <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Asignar tarea o comentario..."
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 resize-none"
                        rows={3}
                      />
                      <div className="flex gap-2">
                        <select
                          value={taskPriority}
                          onChange={(e) => setTaskPriority(e.target.value as any)}
                          className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                        >
                          <option value="high">Alta prioridad</option>
                          <option value="medium">Media prioridad</option>
                          <option value="low">Baja prioridad</option>
                        </select>
                        <button
                          onClick={() => handleSendTask(dept.id)}
                          className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                        >
                          <Send className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Lista de tareas */}
                    {dept.tasks.length > 0 && (
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {dept.tasks.map(task => (
                          <div key={task.id} className="text-xs p-2 bg-gray-50 dark:bg-gray-700 rounded">
                            <div className="flex items-start justify-between">
                              <p className="flex-1">{task.text}</p>
                              <span className={`ml-2 ${getPriorityColor(task.priority)}`}>
                                {task.priority === 'high' ? '!' : 
                                 task.priority === 'medium' ? '!!' : '!!!'}
                              </span>
                            </div>
                            <p className="text-gray-500 mt-1">
                              {new Date(task.createdAt).toLocaleDateString('es-MX')}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {currentProject && (
        <>
          {/* KPIs Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Número de Unidades */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Número de Unidades</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {unitsData.total}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Unidades totales del desarrollo
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </div>

            {/* Total Cobrado */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total Cobrado</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {formatCurrency(Number(movementsData.totalCobrado || 0))}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-gray-500">
                      Ingresos recibidos
                    </span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </div>

            {/* Ventas Totales */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Ventas Totales</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {formatCurrency(currentProject.totalSales)}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-gray-500">
                      {formatPercentage(salesProgress)} del presupuesto
                    </span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>
            </div>

            {/* Unidades Vendidas */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Unidades Vendidas</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {inventoryData.summary?.sold || 0}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Restantes: {inventoryData.summary?.available || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                  <Home className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Gráficas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gráfica de Ventas en el Tiempo */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold mb-4">Evolución de Ventas</h2>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={salesData}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => new Date(value).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}
                  />
                  <YAxis tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`} />
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    labelFormatter={(label) => new Date(label).toLocaleDateString('es-MX')}
                  />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="sales" 
                    stroke="#3b82f6" 
                    fillOpacity={1} 
                    fill="url(#colorSales)" 
                    name="Ventas"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="income" 
                    stroke="#10b981" 
                    fillOpacity={1} 
                    fill="url(#colorIncome)" 
                    name="Ingresos"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Gráfica de Ventas Acumuladas vs Meta */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold mb-4">Ventas Acumuladas vs Meta</h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => new Date(value).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}
                  />
                  <YAxis tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`} />
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    labelFormatter={(label) => new Date(label).toLocaleDateString('es-MX')}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="accumulated" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    name="Ventas Acumuladas"
                    dot={false}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="goal" 
                    stroke="#ef4444" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    name="Meta"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Gráfica de Estados de Operación */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold mb-4">Estados de Operación</h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={operatesData.pieData || []}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {(operatesData.pieData || []).map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `${value} transacciones`} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Tabla de Métricas Clave */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold mb-4">Métricas Clave</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Avance de Ventas</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{width: `${salesProgress * 100}%`}}
                      />
                    </div>
                    <span className="text-sm font-semibold">
                      {formatPercentage(salesProgress)}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center pb-3 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Conversión a Ingresos</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full" 
                        style={{width: `${incomeProgress * 100}%`}}
                      />
                    </div>
                    <span className="text-sm font-semibold">
                      {formatPercentage(incomeProgress)}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center pb-3 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Venta Promedio Diaria</span>
                  <span className="text-sm font-semibold">
                    {formatCurrency(salesData.length > 0 ? 
                      salesData.reduce((acc, d) => acc + d.sales, 0) / salesData.length : 0
                    )}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Días para Completar</span>
                  <span className="text-sm font-semibold">
                    {Math.ceil((currentProject.budget - currentProject.totalSales) / 
                      (currentProject.totalSales / 365))} días
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Nueva Sección: Pipeline de Ventas */}
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">Pipeline de Ventas</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-500">Cotizaciones</span>
                  <FileCheck className="w-4 h-4 text-blue-600" />
                </div>
                <p className="text-2xl font-bold">{pipelineData.pipeline?.cotizaciones || 0}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {formatCurrency(pipelineData.pipeline?.totalValue || 0)}
                </p>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-500">Apartados</span>
                  <Home className="w-4 h-4 text-yellow-600" />
                </div>
                <p className="text-2xl font-bold">{pipelineData.pipeline?.apartados || 0}</p>
                <p className="text-xs text-green-600 mt-1">
                  Conv: {(pipelineData.conversion?.cotizacionVenta || 0).toFixed(1)}%
                </p>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-500">Escriturados</span>
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </div>
                <p className="text-2xl font-bold">{pipelineData.pipeline?.escriturados || 0}</p>
                <p className="text-xs text-green-600 mt-1">
                  Conv: {(pipelineData.conversion?.ventaEscritura || 0).toFixed(1)}%
                </p>
              </div>
            </div>
          </div>

          {/* Nueva Sección: Top Performance */}
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">Top Performers</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Agentes */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-600" />
                  Top Agentes
                </h3>
                <div className="space-y-3">
                  {(performanceData.topAgents || []).slice(0, 5).map((agent: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          idx === 0 ? 'bg-yellow-100 text-yellow-800' :
                          idx === 1 ? 'bg-gray-100 text-gray-800' :
                          idx === 2 ? 'bg-orange-100 text-orange-800' :
                          'bg-gray-50 text-gray-600'
                        }`}>
                          {idx + 1}
                        </span>
                        <div>
                          <p className="font-medium">{agent.agentName}</p>
                          <p className="text-xs text-gray-500">
                            {agent.cotizaciones} cot. | {agent.transacciones} ventas
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(agent.montoTotal)}</p>
                        <p className="text-xs text-green-600">
                          Conv: {agent.conversionRate.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Agencias */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-blue-600" />
                  Top Agencias
                </h3>
                <div className="space-y-3">
                  {(performanceData.topAgencies || []).map((agency: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          idx === 0 ? 'bg-blue-100 text-blue-800' :
                          idx === 1 ? 'bg-indigo-100 text-indigo-800' :
                          'bg-purple-100 text-purple-800'
                        }`}>
                          {idx + 1}
                        </span>
                        <div>
                          <p className="font-medium">{agency.agencyName}</p>
                          <p className="text-xs text-gray-500">
                            {agency.cotizaciones} cotizaciones
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(agency.montoTotal)}</p>
                        <p className="text-xs text-blue-600">
                          {agency.transacciones} ventas
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Nueva Sección: Análisis de Clientes y Flujo de Caja */}
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Análisis de Clientes */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" />
                Análisis de Clientes
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total Clientes</p>
                  <p className="text-xl font-bold">{clientsData.summary?.total || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Nuevos (30d)</p>
                  <p className="text-xl font-bold text-green-600">{clientsData.summary?.newClients || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Activos</p>
                  <p className="text-xl font-bold">{clientsData.summary?.activeClients || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Tasa Conversión</p>
                  <p className="text-xl font-bold">{(clientsData.summary?.conversionRate || 0).toFixed(1)}%</p>
                </div>
              </div>
              {/* Top estados de clientes */}
              {clientsData.demographics?.topStates && clientsData.demographics.topStates.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Top Estados</p>
                  <div className="space-y-1">
                    {clientsData.demographics.topStates.slice(0, 3).map((state: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center">
                        <span className="text-xs text-gray-600 dark:text-gray-300">{state.state}</span>
                        <span className="text-xs font-semibold">{state.count} clientes</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Flujo de Caja */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Banknote className="w-5 h-5 text-green-600" />
                Flujo de Caja
              </h3>
              <div className="space-y-3">
                <div className={`p-3 rounded-lg ${cashflowData.overdue?.amount > 0 ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800' : 'bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700'}`}>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Vencidos</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{cashflowData.overdue?.count || 0} pagarés</p>
                    </div>
                    <p className={`text-xl font-bold ${cashflowData.overdue?.amount > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'}`}>
                      {formatCurrency(cashflowData.overdue?.amount || 0)}
                    </p>
                  </div>
                </div>
                
                <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Próx. 30 días</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{cashflowData.upcoming?.next30Days?.count || 0} pagarés</p>
                    </div>
                    <p className="text-xl font-bold text-yellow-700 dark:text-yellow-400">
                      {formatCurrency(cashflowData.upcoming?.next30Days?.amount || 0)}
                    </p>
                  </div>
                </div>
                
                <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Próx. 90 días</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{cashflowData.upcoming?.next90Days?.count || 0} pagarés</p>
                    </div>
                    <p className="text-xl font-bold text-blue-700 dark:text-blue-400">
                      {formatCurrency(cashflowData.upcoming?.next90Days?.amount || 0)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Nueva Sección: Inventario y KPIs */}
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Inventario */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Package className="w-5 h-5 text-purple-600" />
                Análisis de Inventario
              </h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center">
                  <p className="text-2xl font-bold">{inventoryData.summary?.total || 0}</p>
                  <p className="text-xs text-gray-500">Total</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-600">{inventoryData.summary?.sold || 0}</p>
                  <p className="text-xs text-gray-500">Vendidas</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{inventoryData.summary?.available || 0}</p>
                  <p className="text-xs text-gray-500">Disponibles</p>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-500">Absorción</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-purple-600 h-2 rounded-full" 
                        style={{width: `${inventoryData.summary?.absorptionRate || 0}%`}}
                      />
                    </div>
                    <span className="text-sm font-semibold">
                      {(inventoryData.summary?.absorptionRate || 0).toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Meses para completar</span>
                  <span className="font-semibold">{inventoryData.summary?.monthsToComplete || 0}</span>
                </div>
              </div>
            </div>

            {/* KPIs Ejecutivos */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-cyan-600" />
                KPIs Ejecutivos
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Ticket Promedio</span>
                  <span className="font-semibold">{formatCurrency(kpisData.salesMetrics?.avgTicket || 0)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Conversión Ventas</span>
                  <span className="font-semibold">{(kpisData.salesMetrics?.conversionRate || 0).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Tasa Cobranza</span>
                  <span className="font-semibold text-green-600">{(kpisData.financialMetrics?.collectionRate || 0).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Tasa Cancelación</span>
                  <span className="font-semibold text-red-600">{(kpisData.riskMetrics?.cancellationRate || 0).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Morosidad</span>
                  <span className={`font-semibold ${(kpisData.riskMetrics?.delinquencyRate || 0) > 10 ? 'text-red-600' : 'text-green-600'}`}>
                    {(kpisData.riskMetrics?.delinquencyRate || 0).toFixed(1)}%
                  </span>
                </div>
                <div className="mt-3 pt-3 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Salud del Proyecto</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      kpisData.efficiency?.projectHealth === 'excellent' ? 'bg-green-100 text-green-800' :
                      kpisData.efficiency?.projectHealth === 'good' ? 'bg-blue-100 text-blue-800' :
                      kpisData.efficiency?.projectHealth === 'regular' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {kpisData.efficiency?.projectHealth === 'excellent' ? 'Excelente' :
                       kpisData.efficiency?.projectHealth === 'good' ? 'Bueno' :
                       kpisData.efficiency?.projectHealth === 'regular' ? 'Regular' :
                       'Crítico'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </>
      )}
    </div>
  );
}
