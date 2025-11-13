// src/app/api/admin/users/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, hasPermission } from '@/lib/auth-helpers';

export async function GET() {
  try {
    // Verificar permisos
    const currentUser = await getCurrentUser();
    if (!hasPermission(currentUser, 'users', 'view')) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      );
    }

    const users = await prisma.user.findMany({
      include: {
        role: true,
        companies: {
          include: {
            company: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Error al obtener usuarios' },
      { status: 500 }
    );
  }
}
