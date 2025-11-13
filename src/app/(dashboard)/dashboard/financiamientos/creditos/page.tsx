// src/app/(dashboard)/dashboard/financiamientos/creditos/page.tsx
'use client';

import { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  DollarSign,
  Building2,
  Calendar,
  CreditCard,
  TrendingUp,
  FileText,
  ChevronRight,
  Filter,
  Download,
  AlertCircle,
  CheckCircle2,
  Clock,
  Wallet
} from 'lucide-react';

interface Credit {
  id: string;
  empresa: string;
  proyecto: string;
  tipoCredito: string;
  etapa: number;
  estado: string;
  fechaContrato: string | null;
  tipoFinanciamiento: string;
  institucion: string;
  montoTotal: number;
  divisa: string;
  dispuesto: number;
  porcentajeDispuesto: number;
  porDisponer: number;
  porcentajePorDisponer: number;
  pagado: number;
  porcentajePagado: number;
  saldo: number;
  porcentajeSaldo: number;
  tasaInteres: number;
  plazoMeses: number;
  fechaVencimiento: string | null;
  numeroViviendas: number | null;
  ltv: number | null;
  ltc: number | null;
  notas: string | null;
}

export default function CreditosPage() {
  const [credits, setCredits] = useState<Credit[]>([]);
  const [selectedCredit, setSelectedCredit] = useState<Credit | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Datos de ejemplo por ahora
  useEffect(() => {
    const mockCredits: Credit[] = [
      {
        id: 'GOV_ALB_REV_1',
        empresa: 'GOVA',
        proyecto: 'Albarrada',
        tipoCredito: 'REVOLVENTE',
        etapa: 1,
        estado: 'VIGENTE',
        fechaContrato: '2024-01-15',
        tipoFinanciamiento: 'CREDITO BANCARIO',
        institucion: 'BBVA',
        montoTotal: 50000000,
        divisa: 'MXN',
        dispuesto: 30000000,
        porcentajeDispuesto: 60,
        porDisponer: 20000000,
        porcentajePorDisponer: 40,
        pagado: 10000000,
        porcentajePagado: 20,
        saldo: 40000000,
        porcentajeSaldo: 80,
        tasaInteres: 12.5,
        plazoMeses: 24,
        fechaVencimiento: '2026-01-15',
        numeroViviendas: 120,
        ltv: 70,
        ltc: 65,
        notas: 'Crédito para desarrollo habitacional fase 1'
      },
      {
        id: 'GOV_VIS_PUE_1',
        empresa: 'GOVA',
        proyecto: 'Vista Hermosa',
        tipoCredito: 'PUENTE',
        etapa: 1,
        estado: 'EN TRAMITE',
        fechaContrato: null,
        tipoFinanciamiento: 'SOFOM',
        institucion: 'ABC CAPITAL',
        montoTotal: 30000000,
        divisa: 'MXN',
        dispuesto: 0,
        porcentajeDispuesto: 0,
        porDisponer: 30000000,
        porcentajePorDisponer: 100,
        pagado: 0,
        porcentajePagado: 0,
        saldo: 30000000,
        porcentajeSaldo: 100,
        tasaInteres: 14,
        plazoMeses: 18,
        fechaVencimiento: null,
        numeroViviendas: 80,
        ltv: 75,
        ltc: 70,
        notas: 'En proceso de autorización'
      }
    ];
    setCredits(mockCredits);
    setLoading(false);
  }, []);

  const formatCurrency = (value: number, currency: string = 'MXN') => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'VIGENTE':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'EN TRAMITE':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'LIQUIDADO':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'VIGENTE':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'EN TRAMITE':
        return <Clock className="w-4 h-4" />;
      case 'LIQUIDADO':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const filteredCredits = credits.filter(credit => {
    if (filterStatus !== 'all' && credit.estado !== filterStatus) return false;
    if (searchTerm && !credit.proyecto.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !credit.institucion.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  // Calcular totales
  const totales = {
    montoTotal: credits.reduce((sum, c) => sum + c.montoTotal, 0),
    dispuesto: credits.reduce((sum, c) => sum + c.dispuesto, 0),
    porDisponer: credits.reduce((sum, c) => sum + c.porDisponer, 0),
    saldo: credits.reduce((sum, c) => sum + c.saldo, 0),
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Wallet className="w-8 h-8 text-indigo-600" />
            Gestión de Créditos
          </h1>
          <p className="text-gray-500 mt-1">Administración de financiamientos y créditos bancarios</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => {
              alert('Función de Nuevo Crédito en desarrollo. Próximamente disponible.');
              // TODO: Implementar modal de nuevo crédito
              setShowModal(true);
            }}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Nuevo Crédito
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Autorizado</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(totales.montoTotal)}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-gray-400" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Dispuesto</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(totales.dispuesto)}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-400" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Por Disponer</p>
              <p className="text-2xl font-bold text-yellow-600">
                {formatCurrency(totales.porDisponer)}
              </p>
            </div>
            <Clock className="w-8 h-8 text-yellow-400" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Saldo</p>
              <p className="text-2xl font-bold text-blue-600">
                {formatCurrency(totales.saldo)}
              </p>
            </div>
            <CreditCard className="w-8 h-8 text-blue-400" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por proyecto o institución..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              />
            </div>
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
          >
            <option value="all">Todos los estados</option>
            <option value="VIGENTE">Vigente</option>
            <option value="EN TRAMITE">En Trámite</option>
            <option value="LIQUIDADO">Liquidado</option>
          </select>

          <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Más filtros
          </button>

          <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2">
            <Download className="w-5 h-5" />
            Exportar
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID / Proyecto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo / Etapa
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Institución
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Monto Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dispuesto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Saldo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredCredits.map((credit) => (
                <tr key={credit.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {credit.id}
                      </div>
                      <div className="text-sm text-gray-500">
                        {credit.proyecto}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm text-gray-900 dark:text-white">
                        {credit.tipoCredito}
                      </div>
                      <div className="text-sm text-gray-500">
                        Etapa {credit.etapa}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm text-gray-900 dark:text-white">
                        {credit.institucion}
                      </div>
                      <div className="text-sm text-gray-500">
                        {credit.tipoFinanciamiento}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatCurrency(credit.montoTotal, credit.divisa)}
                      </div>
                      <div className="text-sm text-gray-500">
                        Tasa: {credit.tasaInteres}%
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-green-600">
                        {formatCurrency(credit.dispuesto, credit.divisa)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {credit.porcentajeDispuesto}%
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-blue-600">
                        {formatCurrency(credit.saldo, credit.divisa)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {credit.porcentajeSaldo}%
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex items-center gap-1 text-xs leading-5 font-semibold rounded-full ${getStatusColor(credit.estado)}`}>
                      {getStatusIcon(credit.estado)}
                      {credit.estado}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedCredit(credit)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="text-red-600 hover:text-red-900">
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button className="text-gray-600 hover:text-gray-900">
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-700 dark:text-gray-300">
          Mostrando 1 a {filteredCredits.length} de {credits.length} créditos
        </div>
        <div className="flex gap-2">
          <button className="px-3 py-1 border rounded hover:bg-gray-50 dark:hover:bg-gray-700">
            Anterior
          </button>
          <button className="px-3 py-1 bg-blue-600 text-white rounded">
            1
          </button>
          <button className="px-3 py-1 border rounded hover:bg-gray-50 dark:hover:bg-gray-700">
            Siguiente
          </button>
        </div>
      </div>
    </div>
  );
}
