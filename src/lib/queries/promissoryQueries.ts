// src/lib/queries/promissoryQueries.ts
import { prisma } from '@/lib/prisma';

export interface PromissoryReport {
  PROYECTO: string;
  'ID TRANS': string;
  FASE: string;
  'F. OPERAR': string;
  'NO VIVIENDA': string;
  CLIENTE: string;
  PAGARE: string;
  SUSCRIPCIÓN: Date | null;
  'FECHA DEL P.': Date | null;
  VENCIMIENTO: Date | null;
  'VENCE EN': number;
  MONTO: number;
  ABONADO: number;
  PENDIENTE: number;
  VENCIDO: number;
}

export interface PromissoryFilters {
  proyecto?: string;
  idTransaction?: string;
  cliente?: string;
  numeroVivienda?: string;
}

/**
 * Obtiene el reporte completo de pagarés
 * Incluye cálculos de abonado, pendiente y vencido
 */
export async function getPromissoryReport(filters?: PromissoryFilters): Promise<PromissoryReport[]> {
  try {
    // Query base con CTEs (Common Table Expressions)
    let query = `
      WITH promissories_labeled AS (
        SELECT
          id,
          transaction,
          promissories,
          created_at,
          updated_at,
          amount,
          number,
          due_date,
          signature_date,
          isPaid,
          spei_payment_id,
          voucher_url,
          status_payment_online,
          clabe_spei,
          amount_spei,
          expiration_spei,
          is_credit_promisse,
          type,
          ROW_NUMBER() OVER (PARTITION BY transaction ORDER BY due_date) AS promissory_rank,
          CASE 
            WHEN is_credit_promisse = 1 THEN 'PAGARÉ DE CRÉDITO'
            ELSE CONCAT('PAGARÉ ', ROW_NUMBER() OVER (PARTITION BY transaction ORDER BY due_date))
          END AS ETIQUETA
        FROM promissories
      ),
      payments_ranked AS (
        SELECT
          m.transaction,
          m.amount,
          m.payment_date,
          m.payment_status,
          ROW_NUMBER() OVER (PARTITION BY m.transaction ORDER BY m.payment_date) AS payment_rank
        FROM movements m
        WHERE m.payment_status = 'Pagado' OR m.payment_status = 'pagado'
      ),
      promissories_with_payment AS (
        SELECT
          prl.*,
          p.payment_date AS fecha_pago
        FROM promissories_labeled prl
        LEFT JOIN payments_ranked p 
          ON prl.transaction = p.transaction
         AND prl.promissory_rank = p.payment_rank
      ),
      apartado AS (
        SELECT
          m.transaction,
          m.amount,
          m.payment_date,
          m.created_at
        FROM movements m
        INNER JOIN (
          SELECT transaction, MIN(payment_date) AS first_payment
          FROM movements
          WHERE payment_status = 'Pagado' OR payment_status = 'pagado'
          GROUP BY transaction
        ) sub ON m.transaction = sub.transaction AND m.payment_date = sub.first_payment
      ),
      main_query AS (
        SELECT
          p.name AS PROYECTO,
          t.transaction_id AS \`ID TRANS\`,
          ts.name AS FASE,
          COALESCE(o.name, 'ENTREGADO') AS \`F. OPERAR\`,
          u.housing_number AS \`NO VIVIENDA\`,
          CONCAT(COALESCE(c.name, ''), ' ', COALESCE(c.f_lastname, ''), ' ', COALESCE(c.m_lastname, '')) AS CLIENTE,
          prl.ETIQUETA AS PAGARE,
          prl.signature_date AS SUSCRIPCIÓN,
          prl.fecha_pago AS \`FECHA DEL P.\`,
          prl.due_date AS VENCIMIENTO,
          CASE 
            WHEN prl.isPaid = 1 AND prl.fecha_pago > prl.due_date 
              THEN DATEDIFF(prl.fecha_pago, prl.due_date)
            ELSE DATEDIFF(prl.due_date, CURDATE())
          END AS \`VENCE EN\`,
          prl.amount AS MONTO,
          CASE
            WHEN prl.isPaid = 1 THEN prl.amount
            ELSE 0
          END AS ABONADO,
          CASE
            WHEN prl.isPaid = 0 AND prl.due_date >= CURDATE() THEN prl.amount
            ELSE 0
          END AS PENDIENTE,
          CASE
            WHEN prl.fecha_pago IS NULL AND prl.isPaid = 0 AND prl.due_date < CURDATE()
              THEN prl.amount
            ELSE 0
          END AS VENCIDO
        FROM promissories_with_payment prl
        JOIN transactions t ON prl.transaction = t.id
        JOIN projects p ON t.project = p.id
        JOIN units u ON t.unit = u.id
        JOIN clients c ON t.client = c.id
        LEFT JOIN transaction_statuses ts ON t.transaction_status = ts.id
        LEFT JOIN phases ph ON u.phase = ph.id
        LEFT JOIN operates o ON t.operate = o.id
        
        UNION ALL
        
        SELECT
          p.name AS PROYECTO,
          t.transaction_id AS \`ID TRANS\`,
          ts.name AS FASE,
          COALESCE(o.name, 'ENTREGADO') AS \`F. OPERAR\`,
          u.housing_number AS \`NO VIVIENDA\`,
          CONCAT(COALESCE(c.name, ''), ' ', COALESCE(c.f_lastname, ''), ' ', COALESCE(c.m_lastname, '')) AS CLIENTE,
          'PAGO APARTADO' AS PAGARE,
          a.created_at AS SUSCRIPCIÓN,
          a.payment_date AS \`FECHA DEL P.\`,
          a.payment_date AS VENCIMIENTO,
          DATEDIFF(a.payment_date, CURDATE()) AS \`VENCE EN\`,
          a.amount AS MONTO,
          a.amount AS ABONADO,
          0 AS PENDIENTE,
          0 AS VENCIDO
        FROM apartado a
        JOIN transactions t ON a.transaction = t.id
        JOIN projects p ON t.project = p.id
        JOIN units u ON t.unit = u.id
        JOIN clients c ON t.client = c.id
        LEFT JOIN transaction_statuses ts ON t.transaction_status = ts.id
        LEFT JOIN phases ph ON u.phase = ph.id
        LEFT JOIN operates o ON t.operate = o.id
      )
      SELECT *
      FROM main_query
    `;

    // Construir cláusula WHERE para filtros
    const whereConditions: string[] = [];
    const queryParams: any[] = [];

    if (filters?.proyecto) {
      whereConditions.push(`PROYECTO LIKE ?`);
      queryParams.push(`%${filters.proyecto}%`);
    }

    if (filters?.idTransaction) {
      whereConditions.push(`\`ID TRANS\` LIKE ?`);
      queryParams.push(`%${filters.idTransaction}%`);
    }

    if (filters?.cliente) {
      whereConditions.push(`CLIENTE LIKE ?`);
      queryParams.push(`%${filters.cliente}%`);
    }

    if (filters?.numeroVivienda) {
      whereConditions.push(`\`NO VIVIENDA\` LIKE ?`);
      queryParams.push(`%${filters.numeroVivienda}%`);
    }

    // Agregar WHERE si hay filtros
    if (whereConditions.length > 0) {
      query += ` WHERE ${whereConditions.join(' AND ')}`;
    }

    // Agregar ORDER BY
    query += `
      ORDER BY PROYECTO, \`ID TRANS\`,
        CASE 
          WHEN PAGARE = 'PAGO APARTADO' THEN 0
          WHEN PAGARE = 'PAGARÉ DE CRÉDITO' THEN 999
          ELSE CAST(REPLACE(PAGARE, 'PAGARÉ ', '') AS UNSIGNED)
        END
    `;

    // Ejecutar query con Prisma Raw
    const results = await prisma.$queryRawUnsafe<PromissoryReport[]>(query, ...queryParams);

    return results;
  } catch (error) {
    console.error('Error obteniendo reporte de pagarés:', error);
    throw new Error('Error al generar el reporte de pagarés');
  }
}

/**
 * Obtiene resumen de estadísticas de pagarés
 */
export async function getPromissoryStats() {
  try {
    const stats = await prisma.$queryRaw<any[]>`
      SELECT 
        COUNT(*) as total_pagares,
        SUM(CASE WHEN isPaid = 1 THEN 1 ELSE 0 END) as pagados,
        SUM(CASE WHEN isPaid = 0 AND due_date >= CURDATE() THEN 1 ELSE 0 END) as pendientes,
        SUM(CASE WHEN isPaid = 0 AND due_date < CURDATE() THEN 1 ELSE 0 END) as vencidos,
        SUM(amount) as monto_total,
        SUM(CASE WHEN isPaid = 1 THEN amount ELSE 0 END) as monto_pagado,
        SUM(CASE WHEN isPaid = 0 THEN amount ELSE 0 END) as monto_pendiente
      FROM promissories
    `;

    return stats[0] || {
      total_pagares: 0,
      pagados: 0,
      pendientes: 0,
      vencidos: 0,
      monto_total: 0,
      monto_pagado: 0,
      monto_pendiente: 0
    };
  } catch (error) {
    console.error('Error obteniendo estadísticas de pagarés:', error);
    throw new Error('Error al obtener estadísticas de pagarés');
  }
}

/**
 * Obtiene lista de proyectos únicos para filtro
 */
export async function getProjectsForFilter(): Promise<string[]> {
  try {
    const projects = await prisma.project.findMany({
      select: {
        name: true
      },
      orderBy: {
        name: 'asc'
      },
      distinct: ['name']
    });

    return projects.map(p => p.name || '').filter(Boolean);
  } catch (error) {
    console.error('Error obteniendo proyectos:', error);
    return [];
  }
}