// scripts/init-credit-catalogs.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function initCreditCatalogs() {
  console.log('🚀 Iniciando catálogos de créditos...');

  try {
    // Tipos de crédito
    const creditTypes = [
      { name: 'REVOLVENTE', code: 'REV' },
      { name: 'PUENTE', code: 'PUE' },
      { name: 'SIMPLE', code: 'SIM' },
      { name: 'PREPUENTE', code: 'PRE' },
      { name: 'FACTORAJE', code: 'FAC' }
    ];

    for (const type of creditTypes) {
      await prisma.creditType.upsert({
        where: { name: type.name },
        update: {},
        create: type
      });
    }
    console.log('✅ Tipos de crédito creados');

    // Estados de crédito
    const creditStatuses = [
      { name: 'VIGENTE', color: 'green' },
      { name: 'EN TRAMITE', color: 'yellow' },
      { name: 'LIQUIDADO', color: 'blue' }
    ];

    for (const status of creditStatuses) {
      await prisma.creditStatus.upsert({
        where: { name: status.name },
        update: {},
        create: status
      });
    }
    console.log('✅ Estados de crédito creados');

    // Tipos de financiamiento
    const financingTypes = [
      { name: 'CREDITO BANCARIO' },
      { name: 'SOFOM' },
      { name: 'GOVA CAPITAL' },
      { name: 'CAPITAL DE SOCIOS' },
      { name: 'CAPITAL DE INVERSIONISTAS' }
    ];

    for (const type of financingTypes) {
      await prisma.financingType.upsert({
        where: { name: type.name },
        update: {},
        create: type
      });
    }
    console.log('✅ Tipos de financiamiento creados');

    // Instituciones financieras
    const institutions = [
      { name: 'BBVA', type: 'BANCO' },
      { name: 'SANTANDER', type: 'BANCO' },
      { name: 'BANORTE', type: 'BANCO' },
      { name: 'HSBC', type: 'BANCO' },
      { name: 'SCOTIABANK', type: 'BANCO' },
      { name: 'CITIBANAMEX', type: 'BANCO' },
      { name: 'BANCO AZTECA', type: 'BANCO' },
      { name: 'BANREGIO', type: 'BANCO' },
      { name: 'BANBAJIO', type: 'BANCO' },
      { name: 'BANCO DEL BIENESTAR', type: 'BANCO' },
      { name: 'INBURSA', type: 'BANCO' },
      { name: 'MIFEL', type: 'BANCO' },
      { name: 'MONEX', type: 'BANCO' },
      { name: 'MULTIVA', type: 'BANCO' },
      { name: 'AFIRME', type: 'BANCO' },
      { name: 'INVEX', type: 'BANCO' },
      { name: 'BANSI', type: 'BANCO' },
      { name: 'ABC CAPITAL', type: 'SOFOM' },
      { name: 'CREDITO REAL', type: 'SOFOM' },
      { name: 'UNIFIN', type: 'SOFOM' },
      { name: 'ION FINANCIERA', type: 'SOFOM' },
      { name: 'FINANCIERA BAJIO', type: 'SOFOM' },
      { name: 'GOVA CAPITAL', type: 'INTERNO' },
      { name: 'SOCIOS', type: 'INTERNO' },
      { name: 'INVERSIONISTAS PRIVADOS', type: 'INTERNO' }
    ];

    for (const institution of institutions) {
      await prisma.financialInstitution.upsert({
        where: { name: institution.name },
        update: {},
        create: institution
      });
    }
    console.log('✅ Instituciones financieras creadas');

    // Etapas de crédito
    const creditStages = [
      { name: 'ETAPA 1', order: 1 },
      { name: 'ETAPA 2', order: 2 },
      { name: 'ETAPA 3', order: 3 },
      { name: 'ETAPA 4', order: 4 },
      { name: 'ETAPA 5', order: 5 }
    ];

    for (const stage of creditStages) {
      await prisma.creditStage.upsert({
        where: { name: stage.name },
        update: {},
        create: stage
      });
    }
    console.log('✅ Etapas de crédito creadas');

    console.log('🎉 Todos los catálogos de créditos han sido inicializados');
  } catch (error) {
    console.error('❌ Error inicializando catálogos:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar la función
initCreditCatalogs();
