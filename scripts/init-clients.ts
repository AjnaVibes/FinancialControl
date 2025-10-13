// scripts/init-clients.ts
import { prisma } from '../src/lib/prisma';

async function initClientsConfig() {
  try {
    console.log('🔄 Inicializando configuración de clients...');

    const config = await prisma.webhookConfig.upsert({
      where: { tabla: 'clients' },
      create: {
        tabla: 'clients',
        nombre: 'Clientes',
        categoria: 'ventas',
        icono: '👥',
        color: 'green',
        isEnabled: true,
        webhookUrl: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/sync/clients`,
        intervalMinutes: 30
      },
      update: {
        nombre: 'Clientes',
        icono: '👥',
        color: 'green'
      }
    });

    console.log('✅ Configuración creada:', config);
    console.log('\n📋 Próximos pasos:');
    console.log('1. Verifica conexión: http://localhost:3000/api/sync/direct/test');
    console.log('2. Sincroniza clients:  POST http://localhost:3000/api/sync/clients');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

initClientsConfig();