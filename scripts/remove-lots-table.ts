import { prisma } from '@/lib/prisma';

async function removeLots() {
  try {
    const deleted = await prisma.webhookConfig.deleteMany({
      where: {
        tabla: 'lots'
      }
    });
    
    if (deleted.count > 0) {
      console.log('✅ Tabla "lots" eliminada de webhook_configs');
    } else {
      console.log('ℹ️ La tabla "lots" no existe en webhook_configs');
    }
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error);
    await prisma.$disconnect();
  }
}

removeLots();
