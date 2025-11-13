// src/app/api/pagos/invoices/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const invoices = await prisma.$queryRaw`
      SELECT 
        id,
        uuid,
        emisorNombre,
        emisorRfc,
        receptorNombre,
        receptorRfc,
        total,
        subtotal,
        iva,
        moneda,
        fecha,
        fecha_timbrado as fechaTimbrado,
        folio,
        serie,
        metodo_pago as metodoPago,
        forma_pago as formaPago,
        estado,
        fecha_programada as fechaProgramada,
        fecha_pago as fechaPago,
        referencia_pago as referenciaPago,
        observaciones
      FROM invoices
      ORDER BY fecha DESC
    `;

    // Convertir BigInt a Number si es necesario
    const processedInvoices = (invoices as any[]).map(inv => ({
      ...inv,
      total: inv.total ? Number(inv.total) : 0,
      subtotal: inv.subtotal ? Number(inv.subtotal) : 0,
      iva: inv.iva ? Number(inv.iva) : 0
    }));

    return NextResponse.json({
      success: true,
      data: processedInvoices
    });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener facturas' },
      { status: 500 }
    );
  }
}
