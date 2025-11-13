'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  RefreshCw, 
  Database, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  Trash2,
  Download,
  Play,
  Activity,
  TrendingUp,
  Server,
  Zap
} from 'lucide-react'

interface SyncTable {
  id: string
  tabla: string
  nombre: string
  categoria: string
  icono?: string
  color: string
  isEnabled: boolean
  lastSyncAt: string | null
  nextSyncAt: string | null
  intervalMinutes: number
  totalSyncs: number
  successSyncs: number
  errorSyncs: number
  lastError: string | null
  recordCount?: number
  status?: 'idle' | 'syncing' | 'error' | 'success'
}

interface SyncStats {
  totalTables: number
  enabledTables: number
  totalRecords: number
  lastGlobalSync: string | null
  nextGlobalSync: string | null
  syncHealth: number
}

const categoryConfig: Record<string, { icon: any; color: string }> = {
  'Clientes': { icon: Activity, color: 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30' },
  'Proyectos': { icon: Server, color: 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30' },
  'Ventas': { icon: TrendingUp, color: 'text-purple-600 bg-purple-100 dark:text-purple-400 dark:bg-purple-900/30' },
  'Finanzas': { icon: Zap, color: 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/30' },
  'Catálogos': { icon: Database, color: 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-800/30' },
  'Agentes': { icon: Activity, color: 'text-indigo-600 bg-indigo-100 dark:text-indigo-400 dark:bg-indigo-900/30' },
  'Unidades': { icon: Server, color: 'text-cyan-600 bg-cyan-100 dark:text-cyan-400 dark:bg-cyan-900/30' },
  'other': { icon: Database, color: 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-800/30' }
}

export default function SyncDashboard() {
  const [tables, setTables] = useState<SyncTable[]>([])
  const [stats, setStats] = useState<SyncStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  useEffect(() => {
    fetchTables()
    fetchStats()
    const interval = setInterval(() => {
      fetchTables()
      fetchStats()
    }, 30000) // Actualizar cada 30 segundos
    return () => clearInterval(interval)
  }, [])

  const fetchTables = async () => {
    try {
      const response = await fetch('/api/sync/tables')
      if (response.ok) {
        const data = await response.json()
        setTables(data)
      }
    } catch (error) {
      console.error('Error fetching tables:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/sync/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const handleSync = async (tableId: string) => {
    setSyncing(tableId)
    try {
      const response = await fetch(`/api/sync/tables/${tableId}/sync`, {
        method: 'POST',
      })
      
      if (response.ok) {
        await fetchTables()
      }
    } catch (error) {
      console.error('Error syncing:', error)
    } finally {
      setSyncing(null)
    }
  }

  const handleReset = async (tableId: string) => {
    if (!confirm('¿Estás seguro de que deseas resetear esta tabla? Se eliminarán todos los registros locales.')) {
      return
    }
    
    try {
      const response = await fetch(`/api/sync/tables/${tableId}/reset`, {
        method: 'POST',
      })
      
      if (response.ok) {
        await fetchTables()
      }
    } catch (error) {
      console.error('Error resetting:', error)
    }
  }

  const handleLoadFromRamp = async (tableId: string) => {
    setSyncing(tableId)
    try {
      const response = await fetch(`/api/sync/tables/${tableId}/load-from-ramp`, {
        method: 'POST',
      })
      
      if (response.ok) {
        await fetchTables()
      }
    } catch (error) {
      console.error('Error loading from Ramp:', error)
    } finally {
      setSyncing(null)
    }
  }

  const handleToggleTable = async (tableId: string, isEnabled: boolean) => {
    try {
      const response = await fetch(`/api/sync/tables/${tableId}/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isEnabled: !isEnabled }),
      })
      
      if (response.ok) {
        await fetchTables()
      }
    } catch (error) {
      console.error('Error toggling table:', error)
    }
  }

  const handleSyncAll = async () => {
    if (!confirm('¿Deseas sincronizar todas las tablas habilitadas?')) return
    
    setSyncing('all')
    try {
      const response = await fetch('/api/sync/all', {
        method: 'POST',
      })
      
      if (response.ok) {
        await fetchTables()
      }
    } catch (error) {
      console.error('Error in global sync:', error)
    } finally {
      setSyncing(null)
    }
  }

  const handleResetAll = async () => {
    if (!confirm('¿ADVERTENCIA! ¿Estás seguro de que deseas resetear TODAS las tablas? Esta acción no se puede deshacer.')) {
      return
    }
    
    try {
      const response = await fetch('/api/sync/reset-all', {
        method: 'POST',
      })
      
      if (response.ok) {
        await fetchTables()
      }
    } catch (error) {
      console.error('Error resetting all tables:', error)
    }
  }

  const getStatusColor = (table: SyncTable) => {
    if (table.status === 'syncing') return 'text-blue-600 dark:text-blue-400'
    if (table.status === 'error' || table.lastError) return 'text-red-600 dark:text-red-400'
    if (table.status === 'success' || table.successSyncs > 0) return 'text-green-600 dark:text-green-400'
    return 'text-gray-400 dark:text-gray-500'
  }

  const getStatusIcon = (table: SyncTable) => {
    if (table.status === 'syncing') return <RefreshCw className="w-4 h-4 animate-spin" />
    if (table.status === 'error' || table.lastError) return <AlertCircle className="w-4 h-4" />
    if (table.status === 'success' || table.successSyncs > 0) return <CheckCircle className="w-4 h-4" />
    return <Clock className="w-4 h-4" />
  }

  const filteredTables = selectedCategory === 'all' 
    ? tables 
    : tables.filter(t => t.categoria === selectedCategory)

  const categories = ['all', ...Array.from(new Set(tables.map(t => t.categoria)))]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Centro de Sincronización</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Gestiona la sincronización de datos desde Ramp
          </p>
        </div>
        
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={handleResetAll}
            className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Resetear Todo
          </Button>
          
          <Button 
            onClick={handleSyncAll}
            disabled={syncing === 'all'}
          >
            {syncing === 'all' ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Sincronizar Todo
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium dark:text-gray-200">Total Tablas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold dark:text-white">{stats.totalTables}</div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {stats.enabledTables} habilitadas
              </p>
            </CardContent>
          </Card>
          
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium dark:text-gray-200">Total Registros</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold dark:text-white">
                {stats.totalRecords.toLocaleString()}
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                En base de datos local
              </p>
            </CardContent>
          </Card>
          
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium dark:text-gray-200">Última Sincronización</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold dark:text-white">
                {stats.lastGlobalSync 
                  ? new Date(stats.lastGlobalSync).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
                  : 'Nunca'}
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {stats.lastGlobalSync 
                  ? new Date(stats.lastGlobalSync).toLocaleDateString('es-MX')
                  : 'Sin sincronización'}
              </p>
            </CardContent>
          </Card>
          
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium dark:text-gray-200">Salud del Sistema</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-500 dark:bg-green-400 transition-all duration-300"
                    style={{ width: `${stats.syncHealth}%` }}
                  />
                </div>
                <span className="text-sm font-medium dark:text-white">{stats.syncHealth}%</span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Estado general
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Category Filters */}
      <div className="flex gap-2 flex-wrap">
        {categories.map(cat => (
          <Button
            key={cat}
            variant={selectedCategory === cat ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(cat)}
          >
            {cat === 'all' ? 'Todas' : cat}
          </Button>
        ))}
      </div>

      {/* Tables Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredTables.map((table) => {
          const config = categoryConfig[table.categoria] || categoryConfig['Catálogos']
          const Icon = config.icon
          
          return (
            <Card key={table.id} className="relative overflow-hidden dark:bg-gray-800 dark:border-gray-700">
              <div className={`absolute top-0 right-0 w-32 h-32 ${config.color.split(' ').filter(c => !c.includes('dark:')).join(' ')} dark:opacity-5 opacity-10 rounded-full -mr-16 -mt-16`} />
              
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${config.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{table.nombre}</CardTitle>
                      <CardDescription className="text-xs">
                        Tabla: {table.tabla}
                      </CardDescription>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className={`flex items-center gap-1 ${getStatusColor(table)}`}>
                      {getStatusIcon(table)}
                      <span className="text-xs">
                        {table.status === 'syncing' ? 'Sincronizando' : 
                         table.lastError ? 'Error' :
                         table.successSyncs > 0 ? 'Sincronizado' : 'Sin sincronizar'}
                      </span>
                    </div>
                    
                    <Button
                      size="sm"
                      variant={table.isEnabled ? "outline" : "ghost"}
                      onClick={() => handleToggleTable(table.id, table.isEnabled)}
                    >
                      {table.isEnabled ? 'Habilitado' : 'Deshabilitado'}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Registros</p>
                    <p className="font-semibold dark:text-gray-200">
                      {table.recordCount?.toLocaleString() || '0'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Exitosas</p>
                    <p className="font-semibold text-green-600 dark:text-green-400">
                      {table.successSyncs}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Errores</p>
                    <p className="font-semibold text-red-600 dark:text-red-400">
                      {table.errorSyncs}
                    </p>
                  </div>
                </div>

                {/* Sync Info */}
                <div className="space-y-2 text-sm">
                  {table.lastSyncAt && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Última sincronización:</span>
                      <span className="dark:text-gray-200">{new Date(table.lastSyncAt).toLocaleString('es-MX')}</span>
                    </div>
                  )}
                  {table.nextSyncAt && table.isEnabled && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Próxima sincronización:</span>
                      <span className="dark:text-gray-200">{new Date(table.nextSyncAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Frecuencia:</span>
                    <span className="dark:text-gray-200">{table.intervalMinutes} minutos</span>
                  </div>
                </div>

                {/* Error Alert */}
                {table.lastError && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                    <div className="flex gap-2">
                      <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-red-600 dark:text-red-400">
                        {table.lastError}
                      </p>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleReset(table.id)}
                    disabled={syncing === table.id}
                    className="flex-1 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-600 dark:hover:text-white"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Resetear
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleLoadFromRamp(table.id)}
                    disabled={syncing === table.id || !table.isEnabled}
                    className="flex-1 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-600 dark:hover:text-white disabled:dark:bg-gray-800 disabled:dark:text-gray-500"
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Cargar Ramp
                  </Button>
                  
                  <Button
                    size="sm"
                    onClick={() => handleSync(table.id)}
                    disabled={syncing === table.id || !table.isEnabled}
                    className="flex-1 dark:hover:bg-blue-700 dark:hover:text-white"
                  >
                    {syncing === table.id ? (
                      <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                    ) : (
                      <Play className="w-4 h-4 mr-1" />
                    )}
                    Sincronizar
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
