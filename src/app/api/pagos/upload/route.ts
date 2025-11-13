// src/app/api/pagos/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseString } from 'xml2js';
import { promisify } from 'util';

const parseXML = promisify(parseString);

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const files = formData.getAll('xmlFiles') as File[];
    
    if (files.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No se recibieron archivos' },
        { status: 400 }
      );
    }

    const progress = {
      total: files.length,
      processed: 0,
      errors: [] as string[],
      duplicates: [] as string[],
      created: [] as string[]
    };

    for (const file of files) {
      try {
        const text = await file.text();
        const result: any = await parseXML(text);
        
        // Extraer datos del XML CFDI
        const comprobante = result['cfdi:Comprobante'] || result['Comprobante'];
        if (!comprobante) {
          progress.errors.push(`${file.name}: No es un XML CFDI válido`);
          progress.processed++;
          continue;
        }

        // Extraer UUID del timbre fiscal
        const complemento = comprobante['cfdi:Complemento'] || comprobante['Complemento'];
        let uuid = '';
        
        if (complemento && complemento[0]) {
          const timbreFiscal = complemento[0]['tfd:TimbreFiscalDigital'] || 
                               complemento[0]['TimbreFiscalDigital'];
          if (timbreFiscal && timbreFiscal[0] && timbreFiscal[0].$) {
            uuid = timbreFiscal[0].$.UUID;
          }
        }

        if (!uuid) {
          progress.errors.push(`${file.name}: No se encontró UUID`);
          progress.processed++;
          continue;
        }

        // Verificar si ya existe
        const existingInvoice = await prisma.$queryRaw`
          SELECT id FROM invoices WHERE uuid = ${uuid}
        `;

        if ((existingInvoice as any[]).length > 0) {
          progress.duplicates.push(uuid);
          progress.processed++;
          continue;
        }

        // Extraer datos del emisor
        const emisor = comprobante['cfdi:Emisor'] || comprobante['Emisor'];
        const emisorData = emisor && emisor[0] && emisor[0].$ ? {
          emisorRfc: emisor[0].$.Rfc || '',
          emisorNombre: emisor[0].$.Nombre || ''
        } : {
          emisorRfc: '',
          emisorNombre: ''
        };

        // Extraer datos del receptor
        const receptor = comprobante['cfdi:Receptor'] || comprobante['Receptor'];
        const receptorData = receptor && receptor[0] && receptor[0].$ ? {
          receptorRfc: receptor[0].$.Rfc || '',
          receptorNombre: receptor[0].$.Nombre || ''
        } : {
          receptorRfc: '',
          receptorNombre: ''
        };

        // Extraer impuestos
        const impuestos = comprobante['cfdi:Impuestos'] || comprobante['Impuestos'];
        let iva = 0;
        
        if (impuestos && impuestos[0] && impuestos[0].$) {
          const totalImpuestosTrasladados = impuestos[0].$.TotalImpuestosTrasladados;
          if (totalImpuestosTrasladados) {
            iva = parseFloat(totalImpuestosTrasladados);
          }
        }

        // Datos principales del comprobante
        const attrs = comprobante.$ || {};
        const subtotal = parseFloat(attrs.SubTotal || '0');
        const total = parseFloat(attrs.Total || '0');
        const moneda = attrs.Moneda || 'MXN';
        const tipoCambio = attrs.TipoCambio ? parseFloat(attrs.TipoCambio) : null;
        const fecha = new Date(attrs.Fecha || new Date());
        const folio = attrs.Folio || null;
        const serie = attrs.Serie || null;
        const metodoPago = attrs.MetodoPago || null;
        const formaPago = attrs.FormaPago || null;
        const usoCfdi = attrs.UsoCFDI || null;
        const tipoComprobante = attrs.TipoDeComprobante || null;

        // Fecha de timbrado
        let fechaTimbrado = null;
        if (complemento && complemento[0]) {
          const timbreFiscal = complemento[0]['tfd:TimbreFiscalDigital'] || 
                               complemento[0]['TimbreFiscalDigital'];
          if (timbreFiscal && timbreFiscal[0] && timbreFiscal[0].$) {
            fechaTimbrado = new Date(timbreFiscal[0].$.FechaTimbrado);
          }
        }

        // Crear registro en la base de datos usando SQL directo
        await prisma.$executeRaw`
          INSERT INTO invoices (
            id, uuid, emisorNombre, emisorRfc, receptorNombre, receptorRfc,
            total, subtotal, iva, moneda, tipo_cambio, fecha, fecha_timbrado,
            folio, serie, metodo_pago, forma_pago, uso_cfdi, tipo_comprobante,
            estado, xml_content, created_at, updated_at
          ) VALUES (
            UUID(), ${uuid}, ${emisorData.emisorNombre}, ${emisorData.emisorRfc},
            ${receptorData.receptorNombre}, ${receptorData.receptorRfc},
            ${total}, ${subtotal}, ${iva}, ${moneda}, ${tipoCambio}, ${fecha},
            ${fechaTimbrado}, ${folio}, ${serie}, ${metodoPago}, ${formaPago},
            ${usoCfdi}, ${tipoComprobante}, 'PENDIENTE', ${text}, NOW(), NOW()
          )
        `;

        progress.created.push(uuid);
        progress.processed++;

      } catch (error) {
        console.error(`Error procesando ${file.name}:`, error);
        progress.errors.push(`${file.name}: Error al procesar`);
        progress.processed++;
      }
    }

    return NextResponse.json({
      success: true,
      progress,
      message: `Procesados ${progress.processed} de ${progress.total} archivos`
    });

  } catch (error) {
    console.error('Error en upload:', error);
    return NextResponse.json(
      { success: false, error: 'Error al procesar archivos' },
      { status: 500 }
    );
  }
}
