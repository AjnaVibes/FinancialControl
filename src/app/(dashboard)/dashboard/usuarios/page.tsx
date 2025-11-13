// src/app/(dashboard)/dashboard/usuarios/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  UserPlus, 
  Shield, 
  Building2, 
  Edit, 
  Check, 
  X,
  Mail,
  Clock,
  ChevronDown
} from 'lucide-react';

interface User {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  isActive: boolean;
  createdAt: string;
  role: {
    id: string;
    name: string;
    displayName: string;
  } | null;
  companies: {
    company: {
      id: string;
      name: string;
      displayName: string;
    };
  }[];
}

interface Role {
  id: string;
  name: string;
  displayName: string;
  description: string;
}

interface Company {
  id: string;
  name: string;
  displayName: string;
  slug: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive' | 'pending'>('all');
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);

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
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user.id);
    setSelectedRole(user.role?.id || '');
    setSelectedCompanies(user.companies.map(c => c.company.id));
  };

  const handleSaveUser = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roleId: selectedRole,
          companyIds: selectedCompanies,
          isActive: true
        })
      });

      if (response.ok) {
        await fetchData();
        setEditingUser(null);
        
        // Enviar notificación por correo
        await fetch('/api/admin/notify-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId })
        });
      }
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
    setSelectedRole('');
    setSelectedCompanies([]);
  };

  const getRoleBadgeColor = (roleName?: string) => {
    switch (roleName) {
      case 'admin': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'direccion': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'finanzas': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'viewer': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
      default: return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    }
  };

  const getStatusBadge = (user: User) => {
    if (!user.role || user.companies.length === 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
          <Clock className="w-3 h-3" />
          Pendiente
        </span>
      );
    }
    if (!user.isActive) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
          <X className="w-3 h-3" />
          Inactivo
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
        <Check className="w-3 h-3" />
        Activo
      </span>
    );
  };

  const filteredUsers = users.filter(user => {
    // Filtro por búsqueda
    if (searchTerm && !user.email.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !user.name?.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }

    // Filtro por rol
    if (filterRole !== 'all' && user.role?.name !== filterRole) {
      return false;
    }

    // Filtro por estado
    if (filterStatus === 'pending' && (user.role || user.companies.length > 0)) {
      return false;
    }
    if (filterStatus === 'active' && (!user.isActive || !user.role)) {
      return false;
    }
    if (filterStatus === 'inactive' && user.isActive) {
      return false;
    }

    return true;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
            Gestión de Usuarios
          </h1>
          <p className="text-sm lg:text-base text-gray-500 dark:text-gray-400 mt-1">
            Administra roles, permisos y acceso a empresas
          </p>
        </div>
        
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <UserPlus className="w-4 h-4" />
          Nuevo Usuario
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="all">Todos los roles</option>
            {roles.map(role => (
              <option key={role.id} value={role.name}>{role.displayName}</option>
            ))}
          </select>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="all">Todos los estados</option>
            <option value="active">Activos</option>
            <option value="inactive">Inactivos</option>
            <option value="pending">Pendientes</option>
          </select>
        </div>
      </div>

      {/* Tabla de usuarios */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Usuario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Rol
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Empresas
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Fecha Registro
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredUsers.map(user => (
                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {user.image ? (
                        <img
                          src={user.image}
                          alt={user.name || 'Usuario'}
                          className="w-10 h-10 rounded-full"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                          <span className="text-gray-600 dark:text-gray-300 font-semibold">
                            {(user.name || user.email)[0].toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {user.name || 'Sin nombre'}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(user)}
                  </td>
                  <td className="px-6 py-4">
                    {editingUser === user.id ? (
                      <select
                        value={selectedRole}
                        onChange={(e) => setSelectedRole(e.target.value)}
                        className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                      >
                        <option value="">Sin rol</option>
                        {roles.map(role => (
                          <option key={role.id} value={role.id}>{role.displayName}</option>
                        ))}
                      </select>
                    ) : user.role ? (
                      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${getRoleBadgeColor(user.role.name)}`}>
                        <Shield className="w-3 h-3" />
                        {user.role.displayName}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-500">Sin rol asignado</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {editingUser === user.id ? (
                      <div className="space-y-1">
                        {companies.map(company => (
                          <label key={company.id} className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={selectedCompanies.includes(company.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedCompanies([...selectedCompanies, company.id]);
                                } else {
                                  setSelectedCompanies(selectedCompanies.filter(id => id !== company.id));
                                }
                              }}
                              className="rounded border-gray-300 dark:border-gray-600"
                            />
                            {company.displayName}
                          </label>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {user.companies.length > 0 ? (
                          user.companies.map(uc => (
                            <span key={uc.company.id} className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                              <Building2 className="w-3 h-3" />
                              {uc.company.displayName}
                            </span>
                          ))
                        ) : (
                          <span className="text-sm text-gray-500">Sin empresas</span>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {new Date(user.createdAt).toLocaleDateString('es-MX')}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {editingUser === user.id ? (
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => handleSaveUser(user.id)}
                          className="p-2 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleEditUser(user)}
                        className="p-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Resumen */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Usuarios</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{users.length}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Activos</p>
            <p className="text-2xl font-bold text-green-600">{users.filter(u => u.isActive && u.role).length}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Pendientes</p>
            <p className="text-2xl font-bold text-yellow-600">{users.filter(u => !u.role || u.companies.length === 0).length}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Inactivos</p>
            <p className="text-2xl font-bold text-red-600">{users.filter(u => !u.isActive).length}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
