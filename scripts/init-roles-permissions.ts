// scripts/init-roles-permissions.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Definición de recursos y acciones
const PERMISSIONS = [
  // Dashboard
  { resource: 'dashboard', action: 'view', description: 'Ver dashboard principal' },
  { resource: 'dashboard', action: 'comment', description: 'Comentar en tarjetas del dashboard' },
  
  // Sincronización
  { resource: 'sync', action: 'view', description: 'Ver estado de sincronización' },
  { resource: 'sync', action: 'execute', description: 'Ejecutar sincronización' },
  { resource: 'sync', action: 'configure', description: 'Configurar sincronización' },
  
  // Usuarios
  { resource: 'users', action: 'view', description: 'Ver lista de usuarios' },
  { resource: 'users', action: 'create', description: 'Crear nuevos usuarios' },
  { resource: 'users', action: 'edit', description: 'Editar usuarios' },
  { resource: 'users', action: 'delete', description: 'Eliminar usuarios' },
  { resource: 'users', action: 'assign_roles', description: 'Asignar roles a usuarios' },
  
  // Roles y Permisos
  { resource: 'roles', action: 'view', description: 'Ver roles' },
  { resource: 'roles', action: 'create', description: 'Crear roles' },
  { resource: 'roles', action: 'edit', description: 'Editar roles' },
  { resource: 'roles', action: 'delete', description: 'Eliminar roles' },
  
  // Empresas
  { resource: 'companies', action: 'view', description: 'Ver empresas' },
  { resource: 'companies', action: 'create', description: 'Crear empresas' },
  { resource: 'companies', action: 'edit', description: 'Editar empresas' },
  { resource: 'companies', action: 'delete', description: 'Eliminar empresas' },
  
  // Pagarés
  { resource: 'promissories', action: 'view', description: 'Ver pagarés' },
  { resource: 'promissories', action: 'export', description: 'Exportar pagarés' },
  { resource: 'promissories', action: 'edit', description: 'Editar pagarés' },
  
  // Proyectos
  { resource: 'projects', action: 'view', description: 'Ver proyectos' },
  { resource: 'projects', action: 'create', description: 'Crear proyectos' },
  { resource: 'projects', action: 'edit', description: 'Editar proyectos' },
  { resource: 'projects', action: 'delete', description: 'Eliminar proyectos' },
  
  // Clientes
  { resource: 'clients', action: 'view', description: 'Ver clientes' },
  { resource: 'clients', action: 'create', description: 'Crear clientes' },
  { resource: 'clients', action: 'edit', description: 'Editar clientes' },
  { resource: 'clients', action: 'delete', description: 'Eliminar clientes' },
  
  // Reportes
  { resource: 'reports', action: 'view', description: 'Ver reportes' },
  { resource: 'reports', action: 'generate', description: 'Generar reportes' },
  { resource: 'reports', action: 'export', description: 'Exportar reportes' },
  
  // Configuración
  { resource: 'settings', action: 'view', description: 'Ver configuración' },
  { resource: 'settings', action: 'edit', description: 'Editar configuración' },
];

// Definición de roles y sus permisos
const ROLES = [
  {
    name: 'admin',
    displayName: 'Administrador',
    description: 'Control total del sistema',
    permissions: PERMISSIONS.map(p => `${p.resource}:${p.action}`) // Todos los permisos
  },
  {
    name: 'direccion',
    displayName: 'Dirección',
    description: 'Vista de dashboards y comentarios',
    permissions: [
      'dashboard:view',
      'dashboard:comment',
      'promissories:view',
      'projects:view',
      'clients:view',
      'reports:view',
      'reports:export'
    ]
  },
  {
    name: 'finanzas',
    displayName: 'Finanzas',
    description: 'Gestión financiera y reportes',
    permissions: [
      'dashboard:view',
      'dashboard:comment',
      'promissories:view',
      'promissories:export',
      'promissories:edit',
      'projects:view',
      'projects:edit',
      'clients:view',
      'clients:edit',
      'reports:view',
      'reports:generate',
      'reports:export',
      'settings:view'
    ]
  },
  {
    name: 'viewer',
    displayName: 'Visualizador',
    description: 'Solo lectura',
    permissions: [
      'dashboard:view',
      'promissories:view',
      'projects:view',
      'clients:view',
      'reports:view'
    ]
  }
];

async function initRolesAndPermissions() {
  console.log('🔧 Inicializando roles y permisos...');

  try {
    // 1. Crear todos los permisos
    console.log('\n📝 Creando permisos...');
    for (const perm of PERMISSIONS) {
      const created = await prisma.permission.upsert({
        where: {
          resource_action: {
            resource: perm.resource,
            action: perm.action
          }
        },
        update: {
          description: perm.description
        },
        create: perm
      });
      console.log(`  ✅ ${perm.resource}:${perm.action}`);
    }

    // 2. Crear roles
    console.log('\n👥 Creando roles...');
    for (const roleData of ROLES) {
      // Crear o actualizar el rol
      const role = await prisma.role.upsert({
        where: { name: roleData.name },
        update: {
          displayName: roleData.displayName,
          description: roleData.description
        },
        create: {
          name: roleData.name,
          displayName: roleData.displayName,
          description: roleData.description
        }
      });

      console.log(`\n  📋 Rol: ${roleData.displayName}`);

      // Eliminar permisos existentes
      await prisma.rolePermission.deleteMany({
        where: { roleId: role.id }
      });

      // Asignar permisos al rol
      for (const permString of roleData.permissions) {
        const [resource, action] = permString.split(':');
        const permission = await prisma.permission.findUnique({
          where: {
            resource_action: { resource, action }
          }
        });

        if (permission) {
          await prisma.rolePermission.create({
            data: {
              roleId: role.id,
              permissionId: permission.id
            }
          });
          console.log(`    ✅ ${permString}`);
        }
      }
    }

    // 3. Crear empresas por defecto si no existen
    console.log('\n🏢 Creando empresas...');
    const companies = [
      {
        name: 'govacasa',
        slug: 'govacasa',
        displayName: 'Govacasa',
        primaryColor: '#3B82F6'
      },
      {
        name: 'mabu',
        slug: 'mabu', 
        displayName: 'MABU',
        primaryColor: '#8B5CF6'
      }
    ];

    for (const company of companies) {
      await prisma.company.upsert({
        where: { slug: company.slug },
        update: {
          displayName: company.displayName,
          primaryColor: company.primaryColor
        },
        create: company
      });
      console.log(`  ✅ ${company.displayName}`);
    }

    console.log('\n✅ Inicialización completada exitosamente');

  } catch (error) {
    console.error('❌ Error durante la inicialización:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar
initRolesAndPermissions()
  .catch((error) => {
    console.error('Error fatal:', error);
    process.exit(1);
  });
