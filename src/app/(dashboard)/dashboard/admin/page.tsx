// src/app/(dashboard)/dashboard/admin/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { 
  Users, 
  Shield, 
  Settings, 
  Key, 
  Plus, 
  Edit, 
  Trash2,
  Save,
  X,
  Check,
  ChevronRight,
  Building2,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  UserPlus,
  FolderTree,
  FileText,
  BarChart3,
  DollarSign,
  TrendingUp,
  Receipt,
  Database,
  Layout
} from 'lucide-react';

// Definición de todos los módulos del sistema
const SYSTEM_MODULES = [
  {
    id: 'dashboard',
    name: 'Dashboard',
    icon: Layout,
    description: 'Panel principal con KPIs y métricas',
    actions: ['view', 'comment'],
    category: 'general'
  },
  {
    id: 'pagares',
    name: 'Pagarés',
    icon: Receipt,
    description: 'Gestión de pagarés y créditos',
    actions: ['view', 'create', 'edit', 'delete', 'export'],
    category: 'finanzas'
  },
  {
    id: 'proyectos',
    name: 'Proyectos',
    icon: FolderTree,
    description: 'Administración de proyectos inmobiliarios',
    actions: ['view', 'create', 'edit', 'delete'],
    category: 'operaciones'
  },
  {
    id: 'clientes',
    name: 'Clientes',
    icon: Users,
    description: 'Base de datos de clientes',
    actions: ['view', 'create', 'edit', 'delete', 'export'],
    category: 'ventas'
  },
  {
    id: 'ingresos',
    name: 'Ingresos',
    icon: TrendingUp,
    description: 'Control de ingresos',
    actions: ['view', 'create', 'edit'],
    category: 'finanzas'
  },
  {
    id: 'egresos',
    name: 'Egresos',
    icon: DollarSign,
    description: 'Control de egresos',
    actions: ['view', 'create', 'edit'],
    category: 'finanzas'
  },
  {
    id: 'reportes',
    name: 'Reportes',
    icon: FileText,
    description: 'Generación de reportes',
    actions: ['view', 'generate', 'export'],
    category: 'analytics'
  },
  {
    id: 'metricas',
    name: 'Métricas',
    icon: BarChart3,
    description: 'Análisis y métricas avanzadas',
    actions: ['view'],
    category: 'analytics'
  },
  {
    id: 'sync',
    name: 'Sincronización',
    icon: Database,
    description: 'Control de sincronización con RAMP',
    actions: ['view', 'execute', 'configure'],
    category: 'sistema'
  },
  {
    id: 'usuarios',
    name: 'Usuarios',
    icon: Users,
    description: 'Gestión de usuarios',
    actions: ['view', 'create', 'edit', 'delete', 'assign_roles'],
    category: 'sistema'
  },
  {
    id: 'configuracion',
    name: 'Configuración',
    icon: Settings,
    description: 'Configuración del sistema',
    actions: ['view', 'edit'],
    category: 'sistema'
  }
];

const ACTION_LABELS: { [key: string]: string } = {
  'view': 'Ver',
  'create': 'Crear',
  'edit': 'Editar',
  'delete': 'Eliminar',
  'export': 'Exportar',
  'generate': 'Generar',
  'comment': 'Comentar',
  'execute': 'Ejecutar',
  'configure': 'Configurar',
  'assign_roles': 'Asignar Roles'
};

const CATEGORY_LABELS: { [key: string]: string } = {
  'general': 'General',
  'finanzas': 'Finanzas',
  'operaciones': 'Operaciones',
  'ventas': 'Ventas',
  'analytics': 'Analytics',
  'sistema': 'Sistema'
};

interface User {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  isActive: boolean;
  createdAt: string;
  role: Role | null;
  companies: Company[];
}

interface Role {
  id: string;
  name: string;
  displayName: string;
  description: string;
  permissions: Permission[];
  userCount?: number;
}

interface Permission {
  module: string;
  actions: string[];
}

interface Company {
  id: string;
  name: string;
  displayName: string;
  slug: string;
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'users' | 'roles' | 'permissions'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados para edición
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [newRole, setNewRole] = useState({ name: '', displayName: '', description: '' });
  const [selectedPermissions, setSelectedPermissions] = useState<{ [module: string]: string[] }>({});
  const [showNewRoleModal, setShowNewRoleModal] = useState(false);

  // Estados para asignación de usuarios
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [selectedUserRole, setSelectedUserRole] = useState<string>('');
  const [selectedUserCompanies, setSelectedUserCompanies] = useState<string[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersRes, rolesRes, companiesRes] = await Promise.all([
        fetch('/api/admin/users'),
        fetch('/api/admin/roles'), 
        fetch('/api/admin/companies')
      ]);

      const usersData = await usersRes.json();
      const rolesData = await rolesRes.json();
      const companiesData = await companiesRes.json();

      setUsers(usersData.data || []);
      setRoles(rolesData.data || []);
      setCompanies(companiesData.data || []);

      // Contar usuarios por rol
      const rolesWithCount = rolesData.data?.map((role: Role) => ({
        ...role,
        userCount: usersData.data?.filter((user: User) => user.role?.id === role.id).length || 0
      })) || [];
      setRoles(rolesWithCount);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePermission = (module: string, action: string) => {
    setSelectedPermissions(prev => {
      const moduleActions = prev[module] || [];
      if (moduleActions.includes(action)) {
        return {
          ...prev,
          [module]: moduleActions.filter(a => a !== action)
        };
      } else {
        return {
          ...prev,
          [module]: [...moduleActions, action]
        };
      }
    });
  };

  const handleCreateRole = async () => {
    // Aquí iría la lógica para crear un nuevo rol
    console.log('Creating role:', newRole, selectedPermissions);
    setShowNewRoleModal(false);
    setNewRole({ name: '', displayName: '', description: '' });
    setSelectedPermissions({});
    fetchData();
  };

  const handleUpdateUser = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roleId: selectedUserRole,
          companyIds: selectedUserCompanies,
          isActive: true
        })
      });

      if (response.ok) {
        await fetchData();
        setEditingUser(null);
      }
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  const getRoleColor = (roleName?: string) => {
    switch (roleName) {
      case 'admin': return 'bg-red-500';
      case 'direccion': return 'bg-purple-500';
      case 'finanzas': return 'bg-green-500';
      case 'viewer': return 'bg-gray-500';
      default: return 'bg-blue-500';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Panel de Administración
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          Gestiona usuarios, roles y permisos del sistema
        </p>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex space-x-8 px-6">
          <button
            onClick={() => setActiveTab('users')}
            className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'users'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <Users className="w-4 h-4 inline mr-2" />
            Usuarios
          </button>
          <button
            onClick={() => setActiveTab('roles')}
            className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'roles'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <Shield className="w-4 h-4 inline mr-2" />
            Grupos / Roles
          </button>
          <button
            onClick={() => setActiveTab('permissions')}
            className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'permissions'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <Key className="w-4 h-4 inline mr-2" />
            Permisos del Sistema
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {/* Tab: Usuarios */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Usuarios Registrados</h2>
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                <UserPlus className="w-4 h-4" />
                Invitar Usuario
              </button>
            </div>

            <div className="grid gap-4">
              {users.map(user => (
                <div key={user.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {user.image ? (
                        <img src={user.image} alt={user.name || ''} className="w-12 h-12 rounded-full" />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                          <span className="text-gray-600 dark:text-gray-300 font-semibold">
                            {(user.name || user.email)[0].toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {user.name || 'Sin nombre'}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {user.email}
                        </div>
                      </div>
                    </div>

                    {editingUser === user.id ? (
                      <div className="flex items-center gap-4">
                        <select
                          value={selectedUserRole}
                          onChange={(e) => setSelectedUserRole(e.target.value)}
                          className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg"
                        >
                          <option value="">Sin rol</option>
                          {roles.map(role => (
                            <option key={role.id} value={role.id}>{role.displayName}</option>
                          ))}
                        </select>
                        
                        <div className="flex gap-2">
                          {companies.map(company => (
                            <label key={company.id} className="flex items-center gap-1">
                              <input
                                type="checkbox"
                                checked={selectedUserCompanies.includes(company.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedUserCompanies([...selectedUserCompanies, company.id]);
                                  } else {
                                    setSelectedUserCompanies(selectedUserCompanies.filter(id => id !== company.id));
                                  }
                                }}
                                className="rounded"
                              />
                              <span className="text-sm">{company.displayName}</span>
                            </label>
                          ))}
                        </div>

                        <button
                          onClick={() => handleUpdateUser(user.id)}
                          className="p-2 text-green-600 hover:bg-green-100 rounded"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditingUser(null)}
                          className="p-2 text-red-600 hover:bg-red-100 rounded"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-4">
                        {user.role && (
                          <span className={`px-3 py-1 rounded-full text-white text-sm ${getRoleColor(user.role.name)}`}>
                            {user.role.displayName}
                          </span>
                        )}
                        <div className="flex gap-1">
                          {user.companies.map(company => (
                            <span key={company.id} className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded text-xs">
                              {company.displayName}
                            </span>
                          ))}
                        </div>
                        <button
                          onClick={() => {
                            setEditingUser(user.id);
                            setSelectedUserRole(user.role?.id || '');
                            setSelectedUserCompanies(user.companies.map(c => c.id));
                          }}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab: Roles */}
        {activeTab === 'roles' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Grupos de Usuarios (Roles)</h2>
              <button 
                onClick={() => setShowNewRoleModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" />
                Crear Grupo
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {roles.map(role => (
                <div key={role.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className={`w-12 h-12 rounded-lg ${getRoleColor(role.name)} bg-opacity-20 flex items-center justify-center`}>
                      <Shield className={`w-6 h-6 ${getRoleColor(role.name).replace('bg-', 'text-')}`} />
                    </div>
                    <button className="text-gray-400 hover:text-gray-600">
                      <Edit className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <h3 className="font-semibold text-lg mb-1">{role.displayName}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{role.description}</p>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      {role.userCount} usuario(s)
                    </span>
                    <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                      Ver permisos
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab: Permisos */}
        {activeTab === 'permissions' && (
          <div className="space-y-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2">Matriz de Permisos</h2>
              <p className="text-gray-500 dark:text-gray-400">
                Configura qué puede hacer cada grupo en cada módulo del sistema
              </p>
            </div>

            {Object.entries(
              SYSTEM_MODULES.reduce((acc, module) => {
                if (!acc[module.category]) acc[module.category] = [];
                acc[module.category].push(module);
                return acc;
              }, {} as { [key: string]: typeof SYSTEM_MODULES })
            ).map(([category, modules]) => (
              <div key={category} className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 capitalize">
                  {CATEGORY_LABELS[category] || category}
                </h3>
                
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-gray-700">
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                          Módulo
                        </th>
                        {roles.map(role => (
                          <th key={role.id} className="px-4 py-3 text-center text-sm font-medium">
                            <span className={`px-2 py-1 rounded text-white text-xs ${getRoleColor(role.name)}`}>
                              {role.displayName}
                            </span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {modules.map(module => {
                        const Icon = module.icon;
                        return (
                          <tr key={module.id}>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <Icon className="w-5 h-5 text-gray-400" />
                                <div>
                                  <div className="font-medium text-gray-900 dark:text-white">
                                    {module.name}
                                  </div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    {module.description}
                                  </div>
                                </div>
                              </div>
                            </td>
                            {roles.map(role => (
                              <td key={role.id} className="px-4 py-3 text-center">
                                <div className="flex justify-center gap-1">
                                  {module.actions.map(action => {
                                    const hasPermission = role.permissions?.some(
                                      p => p.module === module.id && p.actions.includes(action)
                                    );
                                    return (
                                      <button
                                        key={action}
                                        title={ACTION_LABELS[action] || action}
                                        className={`w-8 h-8 rounded flex items-center justify-center transition-colors ${
                                          hasPermission
                                            ? 'bg-green-100 text-green-600 hover:bg-green-200'
                                            : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                                        }`}
                                      >
                                        {hasPermission ? (
                                          <Eye className="w-4 h-4" />
                                        ) : (
                                          <EyeOff className="w-4 h-4" />
                                        )}
                                      </button>
                                    );
                                  })}
                                </div>
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal para crear nuevo rol */}
      {showNewRoleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Crear Nuevo Grupo</h2>
              <button
                onClick={() => setShowNewRoleModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium mb-1">Nombre del Grupo</label>
                <input
                  type="text"
                  value={newRole.displayName}
                  onChange={(e) => setNewRole({...newRole, displayName: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Ej: Gerentes"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Descripción</label>
                <textarea
                  value={newRole.description}
                  onChange={(e) => setNewRole({...newRole, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows={3}
                  placeholder="Describe las responsabilidades de este grupo"
                />
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4">Permisos del Grupo</h3>
              
              {Object.entries(
                SYSTEM_MODULES.reduce((acc, module) => {
                  if (!acc[module.category]) acc[module.category] = [];
                  acc[module.category].push(module);
                  return acc;
                }, {} as { [key: string]: typeof SYSTEM_MODULES })
              ).map(([category, modules]) => (
                <div key={category} className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3 uppercase">
                    {CATEGORY_LABELS[category] || category}
                  </h4>
                  <div className="space-y-3">
                    {modules.map(module => {
                      const Icon = module.icon;
                      const modulePermissions = selectedPermissions[module.id] || [];
                      return (
                        <div key={module.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                              <Icon className="w-5 h-5 text-gray-400 mt-1" />
                              <div>
                                <div className="font-medium">{module.name}</div>
                                <div className="text-sm text-gray-500">{module.description}</div>
                                <div className="flex flex-wrap gap-2 mt-3">
                                  {module.actions.map(action => (
                                    <button
                                      key={action}
                                      onClick={() => handleTogglePermission(module.id, action)}
                                      className={`px-3 py-1 rounded-full text-sm transition-colors ${
                                        modulePermissions.includes(action)
                                          ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                      }`}
                                    >
                                      {modulePermissions.includes(action) && (
                                        <Check className="w-3 h-3 inline mr-1" />
                                      )}
                                      {ACTION_LABELS[action] || action}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowNewRoleModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateRole}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Crear Grupo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
