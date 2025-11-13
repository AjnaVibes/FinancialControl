// src/lib/auth-helpers.ts
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export interface UserWithPermissions {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
  role?: {
    id: string;
    name: string;
    displayName: string;
    permissions: {
      permission: {
        resource: string;
        action: string;
      };
    }[];
  } | null;
  companies: {
    company: {
      id: string;
      slug: string;
      name: string;
      displayName: string;
    };
    canAccess: boolean;
  }[];
  isActive: boolean;
}

export async function getCurrentUser(): Promise<UserWithPermissions | null> {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      role: {
        include: {
          permissions: {
            include: {
              permission: true
            }
          }
        }
      },
      companies: {
        where: { canAccess: true },
        include: {
          company: true
        }
      }
    }
  });

  return user as UserWithPermissions;
}

export function hasPermission(
  user: UserWithPermissions | null,
  resource: string,
  action: string
): boolean {
  if (!user || !user.isActive || !user.role) {
    return false;
  }

  // Admin tiene todos los permisos
  if (user.role.name === 'admin') {
    return true;
  }

  // Verificar permisos específicos
  return user.role.permissions.some(
    p => p.permission.resource === resource && p.permission.action === action
  );
}

export function canAccessCompany(
  user: UserWithPermissions | null,
  companySlug: string
): boolean {
  if (!user || !user.isActive) {
    return false;
  }

  // Admin puede acceder a todas las empresas
  if (user.role?.name === 'admin') {
    return true;
  }

  return user.companies.some(
    uc => uc.company.slug === companySlug && uc.canAccess
  );
}

export function getUserCompanies(user: UserWithPermissions | null) {
  if (!user) return [];
  
  return user.companies
    .filter(uc => uc.canAccess)
    .map(uc => uc.company);
}

// Helper para verificar si el usuario está pendiente de aprobación
export function isPendingApproval(user: UserWithPermissions | null): boolean {
  if (!user) return false;
  
  // Usuario sin rol o sin empresas asignadas está pendiente
  return !user.role || user.companies.length === 0;
}

// Helper para obtener el rol display name
export function getUserRoleDisplay(user: UserWithPermissions | null): string {
  if (!user || !user.role) return 'Sin Rol';
  return user.role.displayName;
}
