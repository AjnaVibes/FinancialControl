// src/app/api/admin/users/[userId]/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, hasPermission } from '@/lib/auth-helpers';

export async function PUT(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    // Verificar permisos
    const currentUser = await getCurrentUser();
    if (!hasPermission(currentUser, 'users', 'assign_roles')) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      );
    }

    const { roleId, companyIds, isActive } = await request.json();

    // Actualizar usuario
    const updatedUser = await prisma.user.update({
      where: { id: params.userId },
      data: {
        roleId: roleId || null,
        isActive: isActive ?? true
      }
    });

    // Actualizar empresas
    if (companyIds && Array.isArray(companyIds)) {
      // Eliminar asociaciones existentes
      await prisma.userCompany.deleteMany({
        where: { userId: params.userId }
      });

      // Crear nuevas asociaciones
      if (companyIds.length > 0) {
        await prisma.userCompany.createMany({
          data: companyIds.map(companyId => ({
            userId: params.userId,
            companyId,
            roleId: roleId || null,
            canAccess: true
          }))
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: updatedUser
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Error al actualizar usuario' },
      { status: 500 }
    );
  }
}
