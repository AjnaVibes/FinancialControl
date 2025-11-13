// src/app/api/financiamientos/creditos/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';

// GET - Obtener todos los créditos
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const empresa = searchParams.get('empresa');
    const proyecto = searchParams.get('proyecto');
    const estado = searchParams.get('estado');
    const tipoCredito = searchParams.get('tipoCredito');

    const where: any = {};
    
    if (empresa) where.empresa = empresa;
    if (proyecto) where.proyecto = { contains: proyecto };
    if (estado) where.estado = { name: estado };
    if (tipoCredito) where.tipoCredito = { name: tipoCredito };

    const credits = await prisma.credit.findMany({
      where,
      include: {
        tipoCredito: true,
        estado: true,
        tipoFinanciamiento: true,
        institucion: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Calcular porcentajes
    const creditsWithCalculations = credits.map((credit: any) => {
      const montoTotal = Number(credit.montoTotal);
      const dispuesto = Number(credit.dispuesto || 0);
      const pagado = Number(credit.pagado || 0);
      
      const porcentajeDispuesto = montoTotal > 0 ? (dispuesto / montoTotal) * 100 : 0;
      const porDisponer = montoTotal - dispuesto;
      const porcentajePorDisponer = montoTotal > 0 ? (porDisponer / montoTotal) * 100 : 0;
      const porcentajePagado = montoTotal > 0 ? (pagado / montoTotal) * 100 : 0;
      const saldo = dispuesto - pagado;
      const porcentajeSaldo = montoTotal > 0 ? (saldo / montoTotal) * 100 : 0;

      return {
        ...credit,
        porcentajeDispuesto,
        porDisponer,
        porcentajePorDisponer,
        porcentajePagado,
        saldo,
        porcentajeSaldo
      };
    });

    return NextResponse.json({ 
      success: true, 
      data: creditsWithCalculations 
    });
  } catch (error) {
    console.error('Error fetching credits:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener créditos' },
      { status: 500 }
    );
  }
}

// POST - Crear nuevo crédito
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const data = await req.json();
    
    // Generar ID único
    const empresa = data.empresa.substring(0, 3).toUpperCase();
    const proyecto = data.proyecto.substring(0, 3).toUpperCase();
    
    // Obtener código del tipo de crédito
    const creditType = await prisma.creditType.findUnique({
      where: { id: data.tipoCreditoId }
    });
    
    const tipoCredito = creditType?.code || 'CRE';
    const etapa = data.etapa || 1;
    
    const id = `${empresa}_${proyecto}_${tipoCredito}_${etapa}`;

    // Calcular campos automáticos
    const montoTotal = parseFloat(data.montoTotal);
    const dispuesto = parseFloat(data.dispuesto || 0);
    const pagado = parseFloat(data.pagado || 0);
    
    const newCredit = await prisma.credit.create({
      data: {
        id,
        empresa: data.empresa,
        proyecto: data.proyecto,
        tipoCreditoId: data.tipoCreditoId,
        etapa: data.etapa,
        estadoId: data.estadoId,
        fechaContrato: data.fechaContrato ? new Date(data.fechaContrato) : null,
        tipoFinanciamientoId: data.tipoFinanciamientoId,
        institucionId: data.institucionId,
        montoTotal,
        divisa: data.divisa || 'MXN',
        dispuesto,
        porcentajeDispuesto: montoTotal > 0 ? (dispuesto / montoTotal) * 100 : 0,
        porDisponer: montoTotal - dispuesto,
        porcentajePorDisponer: montoTotal > 0 ? ((montoTotal - dispuesto) / montoTotal) * 100 : 0,
        pagado,
        porcentajePagado: montoTotal > 0 ? (pagado / montoTotal) * 100 : 0,
        saldo: dispuesto - pagado,
        porcentajeSaldo: montoTotal > 0 ? ((dispuesto - pagado) / montoTotal) * 100 : 0,
        porcentajeAnticipo: data.porcentajeAnticipo,
        tasaInteres: data.tasaInteres,
        porcentajeComisiones: data.porcentajeComisiones,
        plazoMeses: data.plazoMeses,
        ampliacionMeses: data.ampliacionMeses,
        fechaVencimiento: data.fechaVencimiento ? new Date(data.fechaVencimiento) : null,
        aforo: data.aforo,
        numeroViviendas: data.numeroViviendas,
        numeroLocales: data.numeroLocales,
        valorPresentadoBanco: data.valorPresentadoBanco,
        ltv: data.ltv,
        costoPresentadoBanco: data.costoPresentadoBanco,
        ltc: data.ltc,
        obligados: data.obligados,
        garantias: data.garantias,
        notas: data.notas
      },
      include: {
        tipoCredito: true,
        estado: true,
        tipoFinanciamiento: true,
        institucion: true
      }
    });

    return NextResponse.json({ 
      success: true, 
      data: newCredit 
    });
  } catch (error) {
    console.error('Error creating credit:', error);
    return NextResponse.json(
      { success: false, error: 'Error al crear crédito' },
      { status: 500 }
    );
  }
}

// PUT - Actualizar crédito
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const data = await req.json();
    const { id, ...updateData } = data;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID de crédito requerido' },
        { status: 400 }
      );
    }

    // Recalcular porcentajes
    const montoTotal = parseFloat(updateData.montoTotal || 0);
    const dispuesto = parseFloat(updateData.dispuesto || 0);
    const pagado = parseFloat(updateData.pagado || 0);

    const updatedCredit = await prisma.credit.update({
      where: { id },
      data: {
        ...updateData,
        porcentajeDispuesto: montoTotal > 0 ? (dispuesto / montoTotal) * 100 : 0,
        porDisponer: montoTotal - dispuesto,
        porcentajePorDisponer: montoTotal > 0 ? ((montoTotal - dispuesto) / montoTotal) * 100 : 0,
        porcentajePagado: montoTotal > 0 ? (pagado / montoTotal) * 100 : 0,
        saldo: dispuesto - pagado,
        porcentajeSaldo: montoTotal > 0 ? ((dispuesto - pagado) / montoTotal) * 100 : 0,
        fechaContrato: updateData.fechaContrato ? new Date(updateData.fechaContrato) : null,
        fechaVencimiento: updateData.fechaVencimiento ? new Date(updateData.fechaVencimiento) : null,
      },
      include: {
        tipoCredito: true,
        estado: true,
        tipoFinanciamiento: true,
        institucion: true
      }
    });

    return NextResponse.json({ 
      success: true, 
      data: updatedCredit 
    });
  } catch (error) {
    console.error('Error updating credit:', error);
    return NextResponse.json(
      { success: false, error: 'Error al actualizar crédito' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar crédito
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID de crédito requerido' },
        { status: 400 }
      );
    }

    await prisma.credit.delete({
      where: { id }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Crédito eliminado correctamente' 
    });
  } catch (error) {
    console.error('Error deleting credit:', error);
    return NextResponse.json(
      { success: false, error: 'Error al eliminar crédito' },
      { status: 500 }
    );
  }
}
