// src/types/next-auth.d.ts
import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      role: string | null;
      roleId?: string | null;
      isActive?: boolean;
      hasCompanies?: boolean;
      isPending?: boolean;
      permissions: Array<{
        resource: string;
        action: string;
      }>;
    };
  }

  interface User {
    id: string;
    role?: string | null;
    roleId?: string | null;
    isActive?: boolean;
    hasCompanies?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    email?: string;
    name?: string | null;
    role: string | null;
    roleId?: string | null;
    isActive?: boolean;
    hasCompanies?: boolean;
    permissions: Array<{
      resource: string;
      action: string;
    }>;
  }
}
