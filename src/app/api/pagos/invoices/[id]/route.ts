// src/app/api/pagos/invoices/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json();
    
    const updateData: any = {
      estado: body.estado,
      updated_at: new Date()
    };

    if (body.fechaPago) {
      updateData.fecha_pago = new Date(body.fechaPago);
    }

    if (body.fechaProgramada) {
      updateData.fecha_programada = new Date(body.fechaProgramada);
    }

    if (body.referenciaPago) {
      updateData.referencia_pago = body.referenciaPago;
    }

    if (body.observaciones) {
      updateData.observaciones = body.observaciones;
    }

    await prisma.$executeRaw`
      UPDATE invoices
      SET 
        estado = ${updateData.estado},
        fecha_pago = ${updateData.fecha_pago || null},
        fecha_programada = ${updateData.fecha_programada || null},
        referencia_pago = ${updateData.referencia_pago || null},
        observaciones = ${updateData.observaciones || null},
        updated_at = NOW()
      WHERE id = ${id}
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating invoice:', error);
    return NextResponse.json(
      { success: false, error: 'Error al actualizar factura' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    // Eliminar la factura
    await prisma.$executeRaw`
      DELETE FROM invoices
      WHERE id = ${id}
    `;

    return NextResponse.json({ 
      success: true,
      message: 'Factura eliminada exitosamente' 
    });
  } catch (error) {
    console.error('Error deleting invoice:', error);
    return NextResponse.json(
      { success: false, error: 'Error al eliminar factura' },
      { status: 500 }
    );
  }
}
