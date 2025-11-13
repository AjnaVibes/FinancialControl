// src/app/api/auth/check-status/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        role: true,
        companies: {
          include: {
            company: true
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // Verificar si el usuario está pendiente de aprobación
    const isPending = !user.role || user.companies.length === 0;

    return NextResponse.json({
      isPending,
      hasAccess: !isPending && user.isActive,
      role: user.role?.name || null,
      roleDisplay: user.role?.displayName || null,
      companies: user.companies.map(uc => ({
        id: uc.company.id,
        name: uc.company.name,
        displayName: uc.company.displayName,
        slug: uc.company.slug
      }))
    });
  } catch (error) {
    console.error('Error checking user status:', error);
    return NextResponse.json(
      { error: 'Error al verificar estado' },
      { status: 500 }
    );
  }
}
