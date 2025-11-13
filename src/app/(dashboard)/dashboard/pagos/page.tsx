// src/app/(dashboard)/dashboard/pagos/page.tsx
'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Upload,
  FileText,
  DollarSign,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Trash2,
  Edit,
  Download,
  Search,
  Filter,
  X,
  FileX,
  CheckCheck
} from 'lucide-react';

interface Invoice {
  id: string;
  uuid: string;
  emisorNombre: string;
  emisorRfc: string;
  receptorNombre: string;
  receptorRfc: string;
  total: number;
  subtotal: number;
  iva: number;
  moneda: string;
  fecha: string;
  fechaTimbrado: string | null;
  folio: string | null;
  serie: string | null;
  metodoPago: string | null;
  formaPago: string | null;
  estado: 'PENDIENTE' | 'PROGRAMADO' | 'PAGADO';
  fechaProgramada: string | null;
  fechaPago: string | null;
  referenciaPago: string | null;
  observaciones: string | null;
}

export default function PagosPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState<{
    total: number;
    processed: number;
    errors: string[];
    duplicates: string[];
  }>({ total: 0, processed: 0, errors: [], duplicates: [] });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cargar facturas al montar el componente
  useEffect(() => {
    loadInvoices();
  }, []);

  const formatCurrency = (value: number, currency: string = 'MXN') => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAGADO':
        return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300';
      case 'PROGRAMADO':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300';
      case 'PENDIENTE':
        return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PAGADO':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'PROGRAMADO':
        return <Clock className="w-4 h-4" />;
      case 'PENDIENTE':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    setUploadProgress({
      total: files.length,
      processed: 0,
      errors: [],
      duplicates: []
    });

    const formData = new FormData();
    Array.from(files).forEach(file => {
      formData.append('xmlFiles', file);
    });

    try {
      const response = await fetch('/api/pagos/upload', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      
      if (result.success) {
        setUploadProgress(result.progress);
        await loadInvoices(); // Recargar facturas
      }
    } catch (error) {
      console.error('Error uploading files:', error);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const loadInvoices = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/pagos/invoices');
      const result = await response.json();
      if (result.success) {
        setInvoices(result.data);
      }
    } catch (error) {
      console.error('Error loading invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateInvoiceStatus = async (invoiceId: string, status: string, additionalData?: any) => {
    try {
      const response = await fetch(`/api/pagos/invoices/${invoiceId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          estado: status,
          ...additionalData
        })
      });

      if (response.ok) {
        await loadInvoices();
      }
    } catch (error) {
      console.error('Error updating invoice:', error);
    }
  };

  const handleBulkStatusUpdate = async (status: string) => {
    if (selectedInvoices.length === 0) return;

    try {
      await Promise.all(
        selectedInvoices.map(id => updateInvoiceStatus(id, status))
      );
      setSelectedInvoices([]);
    } catch (error) {
      console.error('Error bulk updating:', error);
    }
  };

  const deleteInvoice = async (invoiceId: string) => {
    if (!confirm('¿Estás seguro de eliminar esta factura?')) return;

    try {
      const response = await fetch(`/api/pagos/invoices/${invoiceId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await loadInvoices();
      }
    } catch (error) {
      console.error('Error deleting invoice:', error);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedInvoices.length === 0) return;
    
    if (!confirm(`¿Estás seguro de eliminar ${selectedInvoices.length} facturas?`)) return;

    try {
      await Promise.all(
        selectedInvoices.map(id => 
          fetch(`/api/pagos/invoices/${id}`, { method: 'DELETE' })
        )
      );
      setSelectedInvoices([]);
      await loadInvoices();
    } catch (error) {
      console.error('Error bulk deleting:', error);
    }
  };

  const filteredInvoices = invoices.filter(invoice => {
    if (filterStatus !== 'all' && invoice.estado !== filterStatus) return false;
    if (searchTerm && 
        !invoice.emisorNombre.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !invoice.emisorRfc.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !invoice.uuid.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  // Calcular totales
  const totales = {
    total: filteredInvoices.reduce((sum, inv) => sum + inv.total, 0),
    pendiente: filteredInvoices.filter(inv => inv.estado === 'PENDIENTE').reduce((sum, inv) => sum + inv.total, 0),
    programado: filteredInvoices.filter(inv => inv.estado === 'PROGRAMADO').reduce((sum, inv) => sum + inv.total, 0),
    pagado: filteredInvoices.filter(inv => inv.estado === 'PAGADO').reduce((sum, inv) => sum + inv.total, 0),
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FileText className="w-8 h-8 text-blue-600" />
            Gestión de Pagos y Facturas
          </h1>
          <p className="text-gray-500 mt-1">Carga y administración de facturas CFDI XML</p>
        </div>
      </div>

      {/* Upload Area */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className="bg-white dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 p-8 text-center hover:border-blue-500 transition-colors"
      >
        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Cargar Archivos XML</h3>
        <p className="text-sm text-gray-500 mb-4">
          Arrastra archivos XML aquí o haz clic para seleccionar
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xml"
          multiple
          className="hidden"
          onChange={(e) => handleFileUpload(e.target.files)}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
        >
          {uploading ? 'Procesando...' : 'Seleccionar Archivos XML'}
        </button>

        {/* Upload Progress */}
        {uploadProgress.total > 0 && (
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="text-sm space-y-2">
              <div className="flex justify-between">
                <span>Procesados:</span>
                <span className="font-semibold">
                  {uploadProgress.processed} de {uploadProgress.total}
                </span>
              </div>
              {uploadProgress.duplicates.length > 0 && (
                <div className="text-yellow-600">
                  <span className="font-semibold">Duplicados:</span> {uploadProgress.duplicates.length}
                  <div className="text-xs mt-1">
                    {uploadProgress.duplicates.slice(0, 3).map((uuid, i) => (
                      <div key={i}>{uuid}</div>
                    ))}
                    {uploadProgress.duplicates.length > 3 && (
                      <div>... y {uploadProgress.duplicates.length - 3} más</div>
                    )}
                  </div>
                </div>
              )}
              {uploadProgress.errors.length > 0 && (
                <div className="text-red-600">
                  <span className="font-semibold">Errores:</span> {uploadProgress.errors.length}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Facturas</p>
              <p className="text-2xl font-bold">{formatCurrency(totales.total)}</p>
              <p className="text-xs text-gray-400 mt-1">{filteredInvoices.length} facturas</p>
            </div>
            <DollarSign className="w-8 h-8 text-gray-400" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pendientes</p>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(totales.pendiente)}</p>
              <p className="text-xs text-gray-400 mt-1">
                {filteredInvoices.filter(i => i.estado === 'PENDIENTE').length} facturas
              </p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-400" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Programadas</p>
              <p className="text-2xl font-bold text-yellow-600">{formatCurrency(totales.programado)}</p>
              <p className="text-xs text-gray-400 mt-1">
                {filteredInvoices.filter(i => i.estado === 'PROGRAMADO').length} facturas
              </p>
            </div>
            <Clock className="w-8 h-8 text-yellow-400" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pagadas</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(totales.pagado)}</p>
              <p className="text-xs text-gray-400 mt-1">
                {filteredInvoices.filter(i => i.estado === 'PAGADO').length} facturas
              </p>
            </div>
            <CheckCircle2 className="w-8 h-8 text-green-400" />
          </div>
        </div>
      </div>

      {/* Filters & Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border p-4">
        <div className="flex flex-wrap gap-4 justify-between">
          <div className="flex flex-wrap gap-2 flex-1">
            <div className="relative flex-1 min-w-[250px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por empresa, RFC o UUID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
              />
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
            >
              <option value="all">Todos los estados</option>
              <option value="PENDIENTE">Pendientes</option>
              <option value="PROGRAMADO">Programadas</option>
              <option value="PAGADO">Pagadas</option>
            </select>
          </div>

          {selectedInvoices.length > 0 && (
            <div className="flex gap-2">
              <button
                onClick={() => handleBulkStatusUpdate('PAGADO')}
                className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-1"
              >
                <CheckCheck className="w-4 h-4" />
                Marcar como Pagadas
              </button>
              <button
                onClick={() => handleBulkStatusUpdate('PROGRAMADO')}
                className="px-3 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 flex items-center gap-1"
              >
                <Clock className="w-4 h-4" />
                Programar
              </button>
              <button
                onClick={handleBulkDelete}
                className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-1"
              >
                <Trash2 className="w-4 h-4" />
                Eliminar
              </button>
              <button
                onClick={() => setSelectedInvoices([])}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="w-12 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedInvoices.length === filteredInvoices.length && filteredInvoices.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedInvoices(filteredInvoices.map(i => i.id));
                      } else {
                        setSelectedInvoices([]);
                      }
                    }}
                    className="rounded border-gray-300"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  UUID / Folio
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Emisor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Receptor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
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
              {filteredInvoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-4 py-4">
                    <input
                      type="checkbox"
                      checked={selectedInvoices.includes(invoice.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedInvoices([...selectedInvoices, invoice.id]);
                        } else {
                          setSelectedInvoices(selectedInvoices.filter(id => id !== invoice.id));
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-xs font-mono text-gray-900 dark:text-white">
                        {invoice.uuid.substring(0, 8)}...
                      </div>
                      {invoice.serie && invoice.folio && (
                        <div className="text-xs text-gray-500">
                          {invoice.serie}-{invoice.folio}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {invoice.emisorNombre.substring(0, 30)}
                        {invoice.emisorNombre.length > 30 && '...'}
                      </div>
                      <div className="text-xs text-gray-500">
                        RFC: {invoice.emisorRfc}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm text-gray-900 dark:text-white">
                        {invoice.receptorNombre.substring(0, 30)}
                        {invoice.receptorNombre.length > 30 && '...'}
                      </div>
                      <div className="text-xs text-gray-500">
                        RFC: {invoice.receptorRfc}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {new Date(invoice.fecha).toLocaleDateString('es-MX')}
                    </div>
                    {invoice.fechaPago && (
                      <div className="text-xs text-green-600">
                        Pagado: {new Date(invoice.fechaPago).toLocaleDateString('es-MX')}
                      </div>
                    )}
                    {invoice.fechaProgramada && (
                      <div className="text-xs text-yellow-600">
                        Prog: {new Date(invoice.fechaProgramada).toLocaleDateString('es-MX')}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatCurrency(invoice.total, invoice.moneda)}
                      </div>
                      <div className="text-xs text-gray-500">
                        IVA: {formatCurrency(invoice.iva, invoice.moneda)}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex items-center gap-1 text-xs leading-5 font-semibold rounded-full ${getStatusColor(invoice.estado)}`}>
                      {getStatusIcon(invoice.estado)}
                      {invoice.estado}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateInvoiceStatus(invoice.id, 'PAGADO', { fechaPago: new Date() })}
                        className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                        title="Marcar como pagada"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {/* Abrir modal de programación */}}
                        className="text-yellow-600 hover:text-yellow-900 dark:text-yellow-400 dark:hover:text-yellow-300"
                        title="Programar pago"
                      >
                        <Calendar className="w-4 h-4" />
                      </button>
                      <button
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        title="Descargar XML"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteInvoice(invoice.id)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        title="Eliminar factura"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
