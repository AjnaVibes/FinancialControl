// src/app/dashboard/pagares/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Search, Download, Filter, X, Building2, ChevronDown } from 'lucide-react';

interface PromissoryData {
  PROYECTO: string;
  'ID TRANS': string;
  FASE: string;
  'F. OPERAR': string;
  'NO VIVIENDA': string;
  CLIENTE: string;
  PAGARE: string;
  SUSCRIPCIÓN: string | null;
  'FECHA DEL P.': string | null;
  VENCIMIENTO: string | null;
  'VENCE EN': number;
  MONTO: number;
  ABONADO: number;
  PENDIENTE: number;
  VENCIDO: number;
}

interface Filters {
  proyecto: string;
  idTransaction: string;
  cliente: string;
  numeroVivienda: string;
}

interface Project {
  name: string;
  company: string; // 'govacasa' o 'mabu' 
}

export default function PagaresPage() {
  const [data, setData] = useState<PromissoryData[]>([]);
  const [loading, setLoading] = useState(false); // No cargar inicialmente
  const [hasSearched, setHasSearched] = useState(false); // Para saber si se ha buscado
  const [filters, setFilters] = useState<Filters>({
    proyecto: '',
    idTransaction: '',
    cliente: '',
    numeroVivienda: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]); // Proyectos de la BD
  const [selectedCompany, setSelectedCompany] = useState<'all' | 'govacasa' | 'mabu'>('all');
  const [selectedProject, setSelectedProject] = useState<string>(''); // Vacío por defecto
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const [recordLimit, setRecordLimit] = useState<number>(500); // Límite de registros por defecto

  // Obtener proyectos filtrados por empresa
  const getFilteredProjects = () => {
    if (selectedCompany === 'all') {
      return projects;
    }
    return projects.filter(p => p.company === selectedCompany);
  };

  // Solo cargar proyectos al montar, NO datos
  useEffect(() => {
    fetchProjects();
  }, []);

  // NO cargar datos automáticamente
  // Solo cuando el usuario selecciona un proyecto específico o hace clic en "Ver todo"

  // Fetch data con filtros - Solo cuando se solicita explícitamente
  const fetchData = async (loadAll: boolean = false) => {
    try {
      // Si no hay proyecto seleccionado y no es "ver todo", no hacer nada
      if (!selectedProject && !loadAll) {
        return;
      }

      setLoading(true);
      setHasSearched(true);
      
      // Construir query params
      const params = new URLSearchParams();
      
      // Si es "ver todo" o hay un proyecto específico
      if (loadAll || selectedProject === 'todos') {
        // Si hay empresa seleccionada, filtrar por proyectos de esa empresa
        if (selectedCompany !== 'all') {
          const companyProjects = getFilteredProjects().map(p => p.name);
          if (companyProjects.length > 0) {
            params.append('proyectos', companyProjects.join(','));
          }
        }
        // Si es "ver todo", no agregar filtro de proyecto específico
      } else if (selectedProject) {
        // Proyecto específico seleccionado
        params.append('proyecto', selectedProject);
        params.append('limit', recordLimit.toString()); // Usar límite seleccionado por el usuario
      }
      
      // Agregar filtros adicionales
      if (filters.idTransaction) params.append('idTransaction', filters.idTransaction);
      if (filters.cliente) params.append('cliente', filters.cliente);
      if (filters.numeroVivienda) params.append('numeroVivienda', filters.numeroVivienda);

      console.log('🔍 Buscando datos:', { 
        selectedProject: selectedProject || 'todos', 
        selectedCompany, 
        loadAll,
        filters 
      });

      const response = await fetch(`/api/promissories?${params.toString()}`);
      const result = await response.json();

      if (result.success) {
        // Filtrar localmente por empresa si es necesario
        let filteredData = result.data;
        if (selectedCompany !== 'all' && !loadAll) {
          const companyProjectNames = getFilteredProjects().map(p => p.name);
          filteredData = result.data.filter((item: PromissoryData) => 
            companyProjectNames.includes(item.PROYECTO)
          );
        }
        
        setData(filteredData);
        console.log('✅ Datos cargados:', filteredData.length, 'registros');
      } else {
        console.error('Error:', result.error);
        alert('Error al cargar los datos');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  // Función para cargar datos de un proyecto específico
  const handleProjectSelect = async (projectName: string) => {
    setShowProjectDropdown(false);
    setSelectedProject(projectName);
    
    // Si es un proyecto específico (no "todos"), cargar sus datos inmediatamente
    if (projectName && projectName !== 'todos') {
      // Hacer la llamada directamente con el proyecto seleccionado
      try {
        setLoading(true);
        setHasSearched(true);
        
        const params = new URLSearchParams();
        params.append('proyecto', projectName);
        params.append('limit', recordLimit.toString());
        
        // Agregar filtros adicionales si existen
        if (filters.idTransaction) params.append('idTransaction', filters.idTransaction);
        if (filters.cliente) params.append('cliente', filters.cliente);
        if (filters.numeroVivienda) params.append('numeroVivienda', filters.numeroVivienda);

        console.log('🔍 Buscando datos del proyecto:', projectName);

        const response = await fetch(`/api/promissories?${params.toString()}`);
        const result = await response.json();

        if (result.success) {
          let filteredData = result.data;
          if (selectedCompany !== 'all') {
            const companyProjectNames = getFilteredProjects().map(p => p.name);
            filteredData = result.data.filter((item: PromissoryData) => 
              companyProjectNames.includes(item.PROYECTO)
            );
          }
          
          setData(filteredData);
          console.log('✅ Datos cargados:', filteredData.length, 'registros');
        } else {
          console.error('Error:', result.error);
          alert('Error al cargar los datos');
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        alert('Error al cargar los datos');
      } finally {
        setLoading(false);
      }
    }
  };

  // Función para ver todos los datos
  const handleViewAll = () => {
    setSelectedProject('todos');
    fetchData(true); // Cargar todos los datos
  };

  // Fetch proyectos para el filtro - ahora con información de empresa
  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/promissories/projects');
      const result = await response.json();
      if (result.success) {
        // result.data ahora es un array de {name: string, company: string}
        setProjects(result.data);
        console.log('✅ Proyectos cargados:', result.data.length, 'proyectos');
        console.log('📊 Distribución:', {
          govacasa: result.data.filter((p: Project) => p.company === 'govacasa').length,
          mabu: result.data.filter((p: Project) => p.company === 'mabu').length
        });
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  // Aplicar filtros
  const handleApplyFilters = () => {
    console.log('🎯 Aplicando filtros:', filters);
    if (selectedProject || hasSearched) {
      fetchData(selectedProject === 'todos');
    }
    setShowFilters(false);
  };

  // Limpiar filtros
  const handleClearFilters = () => {
    setFilters({
      proyecto: '',
      idTransaction: '',
      cliente: '',
      numeroVivienda: ''
    });
    setSelectedProject('');
    setSelectedCompany('all');
    setData([]);
    setHasSearched(false);
  };

  // Exportar a CSV
  const handleExportCSV = () => {
    if (data.length === 0) {
      alert('No hay datos para exportar');
      return;
    }

    const headers = [
      'PROYECTO', 'ID TRANS', 'FASE', 'F. OPERAR', 'NO VIVIENDA', 'CLIENTE', 
      'PAGARE', 'SUSCRIPCIÓN', 'FECHA DEL P.', 'VENCIMIENTO', 'VENCE EN', 
      'MONTO', 'ABONADO', 'PENDIENTE', 'VENCIDO'
    ];

    const csvContent = [
      headers.join(','),
      ...data.map(row => [
        `"${row.PROYECTO}"`,
        `"${row['ID TRANS']}"`,
        `"${row.FASE}"`,
        `"${row['F. OPERAR']}"`,
        `"${row['NO VIVIENDA']}"`,
        `"${row.CLIENTE}"`,
        `"${row.PAGARE}"`,
        row.SUSCRIPCIÓN || '',
        row['FECHA DEL P.'] || '',
        row.VENCIMIENTO || '',
        row['VENCE EN'],
        row.MONTO,
        row.ABONADO,
        row.PENDIENTE,
        row.VENCIDO
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `pagares_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Formatear moneda
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(value);
  };

  // Formatear fecha
  const formatDate = (date: string | null) => {
    if (!date) return '-';
    
    try {
      const parsedDate = new Date(date);
      
      if (isNaN(parsedDate.getTime())) {
        return '-';
      }
      
      return parsedDate.toLocaleDateString('es-MX', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch (error) {
      console.error('Error parsing date:', date, error);
      return '-';
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] p-4 lg:p-6 gap-4">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
            Reporte de Pagarés
          </h1>
          <p className="text-sm lg:text-base text-gray-500 dark:text-gray-400 mt-1">
            Gestión y seguimiento de pagarés por proyecto
          </p>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <Filter className="w-4 h-4" />
            <span className="hidden sm:inline">Filtros</span>
          </button>
          
          <button
            onClick={handleExportCSV}
            disabled={loading || data.length === 0}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Exportar</span>
          </button>
        </div>
      </div>

      {/* Selector de Empresa, Proyecto y Límite de Registros */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Selector de Empresa */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Empresa
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setSelectedCompany('all');
                  setSelectedProject(''); // Resetear proyecto
                  setData([]); // Limpiar datos
                  setHasSearched(false);
                }}
                className={`flex-1 px-4 py-2 text-sm rounded-lg border transition-colors ${
                  selectedCompany === 'all'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                }`}
              >
                Todas
              </button>
              <button
                onClick={() => {
                  setSelectedCompany('govacasa');
                  setSelectedProject(''); // Resetear proyecto
                  setData([]); // Limpiar datos
                  setHasSearched(false);
                }}
                className={`flex-1 px-4 py-2 text-sm rounded-lg border transition-colors ${
                  selectedCompany === 'govacasa'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                }`}
              >
                Govacasa
              </button>
              <button
                onClick={() => {
                  setSelectedCompany('mabu');
                  setSelectedProject(''); // Resetear proyecto
                  setData([]); // Limpiar datos
                  setHasSearched(false);
                }}
                className={`flex-1 px-4 py-2 text-sm rounded-lg border transition-colors ${
                  selectedCompany === 'mabu'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                }`}
              >
                MABU
              </button>
            </div>
          </div>

          {/* Selector de Proyecto */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Proyecto
            </label>
            <div className="relative">
              <button
                onClick={() => setShowProjectDropdown(!showProjectDropdown)}
                className="w-full px-4 py-2 text-left bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors flex items-center justify-between"
              >
                <span className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-gray-500" />
                  {selectedProject === 'todos' 
                    ? 'Todos los proyectos' 
                    : selectedProject || 'Seleccionar proyecto...'}
                </span>
                <ChevronDown className="w-4 h-4 text-gray-500" />
              </button>
              
              {showProjectDropdown && (
                <div className="absolute z-20 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-auto">
                  <button
                    onClick={handleViewAll}
                    className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-semibold text-blue-600 dark:text-blue-400"
                  >
                    📊 Ver todos los proyectos
                  </button>
                  <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                  {getFilteredProjects().length > 0 ? (
                    getFilteredProjects().map((project, index) => (
                      <button
                        key={`${project.name}-${index}`}
                        onClick={() => handleProjectSelect(project.name)}
                        className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-between"
                      >
                        <span className="truncate">{project.name}</span>
                        <span className={`text-xs px-2 py-1 rounded-full ml-2 flex-shrink-0 ${
                          project.company === 'govacasa'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                            : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                        }`}>
                          {project.company === 'govacasa' ? 'GOV' : 'MABU'}
                        </span>
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 text-center">
                      {projects.length === 0 
                        ? 'Cargando proyectos...' 
                        : 'No hay proyectos disponibles para esta empresa'}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Selector de Límite de Registros */}
          <div className="flex-1 lg:flex-none lg:w-40">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Registros
            </label>
            <select
              value={recordLimit}
              onChange={(e) => setRecordLimit(Number(e.target.value))}
              className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value={100}>100</option>
              <option value={500}>500</option>
              <option value={1000}>1,000</option>
              <option value={5000}>5,000</option>
              <option value={10000}>10,000</option>
              <option value={50000}>Todo</option>
            </select>
          </div>
        </div>
      </div>

      {/* Panel de filtros adicionales */}
      {showFilters && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 lg:p-6 space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Filtros Adicionales
            </h3>
            <button
              onClick={() => setShowFilters(false)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ID Transacción
              </label>
              <input
                type="text"
                value={filters.idTransaction}
                onChange={(e) => setFilters({...filters, idTransaction: e.target.value})}
                placeholder="Ej: T-2024-001"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Cliente
              </label>
              <input
                type="text"
                value={filters.cliente}
                onChange={(e) => setFilters({...filters, cliente: e.target.value})}
                placeholder="Nombre del cliente"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                No. Vivienda
              </label>
              <input
                type="text"
                value={filters.numeroVivienda}
                onChange={(e) => setFilters({...filters, numeroVivienda: e.target.value})}
                placeholder="Ej: 101"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <button
              onClick={handleClearFilters}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Limpiar Todo
            </button>
            <button
              onClick={handleApplyFilters}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              Aplicar Filtros
            </button>
          </div>
        </div>
      )}

      {/* Tabla con scroll propio - flex-1 y min-h-0 para ocupar espacio disponible */}
      <div className="flex-1 min-h-0 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
          </div>
        ) : !hasSearched ? (
          // Estado inicial - No se ha seleccionado proyecto
          <div className="flex flex-col justify-center items-center h-64 text-gray-500 dark:text-gray-400">
            <Building2 className="w-16 h-16 mb-4 opacity-50" />
            <p className="text-lg font-medium">Selecciona un proyecto</p>
            <p className="text-sm mt-2 text-center max-w-md">
              Elige un proyecto específico del menú desplegable arriba para ver sus pagarés, 
              o usa "Ver todos los proyectos" para cargar toda la información.
            </p>
            <div className="mt-3">
              {selectedCompany !== 'all' && (
                <p className="text-xs text-blue-600 dark:text-blue-400">
                  Mostrando proyectos de: {selectedCompany === 'govacasa' ? 'Govacasa' : 'MABU'}
                </p>
              )}
              {projects.length > 0 && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {getFilteredProjects().length} proyectos disponibles
                </p>
              )}
            </div>
          </div>
        ) : data.length === 0 ? (
          <div className="flex flex-col justify-center items-center h-64 text-gray-500 dark:text-gray-400">
            <Search className="w-16 h-16 mb-4 opacity-50" />
            <p className="text-lg font-medium">No se encontraron pagarés</p>
            <p className="text-sm">
              {selectedProject && selectedProject !== 'todos' 
                ? `No hay pagarés para el proyecto: ${selectedProject}`
                : 'Intenta ajustar los filtros de búsqueda'}
            </p>
          </div>
        ) : (
          <div className="flex-1 overflow-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0 z-10">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">
                    Proyecto
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">
                    ID Trans
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">
                    Fase
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">
                    F. Operar
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">
                    No. Viv
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">
                    Cliente
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">
                    Pagaré
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">
                    Suscripción
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">
                    Fecha P.
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">
                    Vencimiento
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">
                    Vence en
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">
                    Monto
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">
                    Abonado
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">
                    Pendiente
                  </th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">
                    Vencido
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {data.map((row, index) => (
                  <tr 
                    key={index}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <td className="px-3 py-2 text-sm text-gray-900 dark:text-white whitespace-nowrap">
                      {row.PROYECTO}
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-900 dark:text-white font-mono whitespace-nowrap">
                      {row['ID TRANS']}
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-900 dark:text-white whitespace-nowrap">
                      {row.FASE}
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-900 dark:text-white whitespace-nowrap">
                      {row['F. OPERAR']}
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-900 dark:text-white whitespace-nowrap">
                      {row['NO VIVIENDA']}
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-900 dark:text-white">
                      <div className="max-w-xs truncate" title={row.CLIENTE}>
                        {row.CLIENTE}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-sm whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        row.PAGARE === 'PAGO APARTADO' 
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300'
                          : row.PAGARE === 'PAGARÉ DE CRÉDITO'
                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                      }`}>
                        {row.PAGARE}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                      {formatDate(row.SUSCRIPCIÓN)}
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                      {formatDate(row['FECHA DEL P.'])}
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                      {formatDate(row.VENCIMIENTO)}
                    </td>
                    <td className="px-3 py-2 text-sm text-center whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        row['VENCE EN'] < 0
                          ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
                          : row['VENCE EN'] <= 7
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300'
                          : 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
                      }`}>
                        {row['VENCE EN']}d
                      </span>
                    </td>
                    <td className="px-3 py-2 text-sm text-right text-gray-900 dark:text-white font-medium whitespace-nowrap">
                      {formatCurrency(row.MONTO)}
                    </td>
                    <td className="px-3 py-2 text-sm text-right text-green-600 dark:text-green-400 font-medium whitespace-nowrap">
                      {formatCurrency(row.ABONADO)}
                    </td>
                    <td className="px-3 py-2 text-sm text-right text-yellow-600 dark:text-yellow-400 font-medium whitespace-nowrap">
                      {formatCurrency(row.PENDIENTE)}
                    </td>
                    <td className="px-3 py-2 text-sm text-right text-red-600 dark:text-red-400 font-medium whitespace-nowrap">
                      {formatCurrency(row.VENCIDO)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Footer con totales - siempre visible con flex-shrink-0 */}
      {!loading && data.length > 0 && (
        <div className="flex-shrink-0 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex justify-between items-center mb-3">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {selectedProject === 'todos' 
                ? 'Mostrando todos los proyectos' 
                : selectedProject 
                ? `Proyecto: ${selectedProject}`
                : 'Resumen de datos'}
            </p>
            {data.length > 100 && (
              <span className="text-xs text-amber-600 dark:text-amber-400">
                ⚠️ Mostrando {data.length} registros
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Pagarés</p>
              <p className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">
                {data.length}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Monto Total</p>
              <p className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(data.reduce((sum, row) => sum + row.MONTO, 0))}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Abonado</p>
              <p className="text-xl lg:text-2xl font-bold text-green-600 dark:text-green-400">
                {formatCurrency(data.reduce((sum, row) => sum + row.ABONADO, 0))}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Vencido</p>
              <p className="text-xl lg:text-2xl font-bold text-red-600 dark:text-red-400">
                {formatCurrency(data.reduce((sum, row) => sum + row.VENCIDO, 0))}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
