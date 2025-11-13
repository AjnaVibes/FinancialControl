import { prisma } from '@/lib/prisma';

async function addClientsTable() {
  try {
    // Verificar si ya existe
    const existing = await prisma.webhookConfig.findFirst({
      where: { tabla: 'clients' }
    });

    if (existing) {
      console.log('ℹ️ La tabla "clients" ya existe en webhook_configs');
    } else {
      // Crear la configuración para clients
      await prisma.webhookConfig.create({
        data: {
          tabla: 'clients',
          nombre: 'Clientes',
          categoria: 'Clientes',
          url: '/api/sync/clients',
          method: 'POST',
          isEnabled: true,
          intervalMinutes: 60,
          successSyncs: 0,
          errorSyncs: 0,
          totalSyncs: 0,
          createdBy: 'system',
          updatedBy: 'system'
        }
      });
      console.log('✅ Tabla "clients" agregada a webhook_configs');
    }
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error);
    await prisma.$disconnect();
  }
}

addClientsTable();
