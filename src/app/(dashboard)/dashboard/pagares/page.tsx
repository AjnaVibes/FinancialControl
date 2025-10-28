// src/app/dashboard/pagares/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Search, Download, Filter, X } from 'lucide-react';

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

export default function PagaresPage() {
  const [data, setData] = useState<PromissoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>({
    proyecto: '',
    idTransaction: '',
    cliente: '',
    numeroVivienda: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [projects, setProjects] = useState<string[]>([]);

  // Cargar proyectos al montar
  useEffect(() => {
    fetchProjects();
  }, []);

  // Cargar datos iniciales
  useEffect(() => {
    fetchData();
  }, []);

  // Fetch data con filtros
  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Construir query params
      const params = new URLSearchParams();
      if (filters.proyecto) params.append('proyecto', filters.proyecto);
      if (filters.idTransaction) params.append('idTransaction', filters.idTransaction);
      if (filters.cliente) params.append('cliente', filters.cliente);
      if (filters.numeroVivienda) params.append('numeroVivienda', filters.numeroVivienda);

      console.log('🔍 Enviando filtros:', filters);
      console.log('📤 Query params:', params.toString());

      const response = await fetch(`/api/promissories?${params.toString()}`);
      const result = await response.json();

      if (result.success) {
        setData(result.data);
        console.log('✅ Datos cargados:', result.data.length, 'registros');
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

  // Fetch proyectos para el filtro
  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/promissories/projects');
      const result = await response.json();
      if (result.success) {
        setProjects(result.data);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  // Aplicar filtros
  const handleApplyFilters = () => {
    console.log('🎯 Aplicando filtros:', filters);
    fetchData();
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
  };

  // Aplicar filtros después de limpiar
  useEffect(() => {
    if (!filters.proyecto && !filters.idTransaction && !filters.cliente && !filters.numeroVivienda) {
      if (data.length > 0 || !loading) {
        fetchData();
      }
    }
  }, [filters]);

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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Reporte de Pagarés
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Gestión y seguimiento de pagarés por proyecto
          </p>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <Filter className="w-4 h-4" />
            Filtros
          </button>
          
          <button
            onClick={handleExportCSV}
            disabled={loading || data.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Download className="w-4 h-4" />
            Exportar CSV
          </button>
        </div>
      </div>

      {/* Panel de filtros */}
      {showFilters && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Filtros de Búsqueda
            </h3>
            <button
              onClick={() => setShowFilters(false)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Proyecto
              </label>
              <select
                value={filters.proyecto}
                onChange={(e) => setFilters({...filters, proyecto: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option value="">Todos los proyectos</option>
                {projects.map(project => (
                  <option key={project} value={project}>{project}</option>
                ))}
              </select>
            </div>

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
              Limpiar
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

      {/* Tabla */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
          </div>
        ) : data.length === 0 ? (
          <div className="flex flex-col justify-center items-center h-64 text-gray-500">
            <Search className="w-16 h-16 mb-4 opacity-50" />
            <p className="text-lg font-medium">No se encontraron pagarés</p>
            <p className="text-sm">Intenta ajustar los filtros de búsqueda</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Proyecto
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    ID Trans
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Fase
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    F. Operar
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    No. Vivienda
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Pagaré
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Suscripción
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Fecha del P.
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Vencimiento
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Vence en
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Monto
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Abonado
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Pendiente
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
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
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                      {row.PROYECTO}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white font-mono">
                      {row['ID TRANS']}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                      {row.FASE}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                      {row['F. OPERAR']}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                      {row['NO VIVIENDA']}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                      {row.CLIENTE}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        row.PAGARE === 'PAGO APARTADO' 
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                          : row.PAGARE === 'PAGARÉ DE CRÉDITO'
                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                      }`}>
                        {row.PAGARE}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {formatDate(row.SUSCRIPCIÓN)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {formatDate(row['FECHA DEL P.'])}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {formatDate(row.VENCIMIENTO)}
                    </td>
                    <td className="px-4 py-3 text-sm text-center">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        row['VENCE EN'] < 0
                          ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          : row['VENCE EN'] <= 7
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                          : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      }`}>
                        {row['VENCE EN']} días
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-900 dark:text-white font-medium">
                      {formatCurrency(row.MONTO)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-green-600 dark:text-green-400 font-medium">
                      {formatCurrency(row.ABONADO)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-yellow-600 dark:text-yellow-400 font-medium">
                      {formatCurrency(row.PENDIENTE)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-red-600 dark:text-red-400 font-medium">
                      {formatCurrency(row.VENCIDO)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Footer con totales */}
      {!loading && data.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Pagarés</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {data.length}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Monto Total</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(data.reduce((sum, row) => sum + row.MONTO, 0))}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Abonado</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {formatCurrency(data.reduce((sum, row) => sum + row.ABONADO, 0))}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Vencido</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                {formatCurrency(data.reduce((sum, row) => sum + row.VENCIDO, 0))}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}