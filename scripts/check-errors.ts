import { prisma } from '../src/lib/prisma';

async function checkErrors() {
  const logs = await prisma.webhookSyncLog.findMany({
    where: { 
      config: { tabla: 'clients' },
      recordsErrors: { gt: 0 }
    },
    orderBy: { createdAt: 'desc' },
    take: 1
  });
  
  console.log('📋 Último log con errores:');
  console.log(JSON.stringify(logs[0], null, 2));
  
  await prisma.$disconnect();
}

checkErrors();