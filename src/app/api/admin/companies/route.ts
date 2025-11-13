// src/app/api/admin/companies/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, hasPermission } from '@/lib/auth-helpers';

export async function GET() {
  try {
    // Verificar permisos
    const currentUser = await getCurrentUser();
    if (!hasPermission(currentUser, 'companies', 'view')) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      );
    }

    const companies = await prisma.company.findMany({
      where: {
        isActive: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    return NextResponse.json({
      success: true,
      data: companies
    });
  } catch (error) {
    console.error('Error fetching companies:', error);
    return NextResponse.json(
      { error: 'Error al obtener empresas' },
      { status: 500 }
    );
  }
}
