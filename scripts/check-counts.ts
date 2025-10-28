// scripts/check-counts.ts
import { ventasDb } from '../src/lib/ventasDb';
import { prisma } from '../src/lib/prisma';

async function checkCounts() {
  console.log('📊 Comparando conteos RAMP vs Local\n');
  
  // Mapeo de tabla MySQL a modelo Prisma
  const tables = [
    { mysql: 'promissories', prisma: 'promissory' },
    { mysql: 'movements', prisma: 'movement' },
    { mysql: 'transactions', prisma: 'transaction' },
    { mysql: 'units', prisma: 'unit' },
    { mysql: 'clients', prisma: 'client' },
    { mysql: 'projects', prisma: 'project' },
    { mysql: 'quotations', prisma: 'quotation' },
    { mysql: 'references', prisma: 'reference' }
  ];
  
  console.log('Tabla                | RAMP       | Local      | Diferencia | %');
  console.log('-'.repeat(75));
  
  let totalRamp = 0;
  let totalLocal = 0;
  
  for (const { mysql, prisma: prismaModel } of tables) {
    try {
      const rampCount = await ventasDb.getRecordCount(mysql);
      const localCount = await (prisma as any)[prismaModel].count();
      const diff = rampCount - localCount;
      const percentage = rampCount > 0 ? ((localCount / rampCount) * 100).toFixed(1) : '0';
      
      totalRamp += rampCount;
      totalLocal += localCount;
      
      const status = diff === 0 ? '✅' : diff < 100 ? '⚠️' : '❌';
      
      console.log(
        `${status} ${mysql.padEnd(18)} | ${rampCount.toString().padStart(10)} | ${localCount.toString().padStart(10)} | ${diff.toString().padStart(10)} | ${percentage.padStart(5)}%`
      );
    } catch (error: any) {
      console.log(`❌ ${mysql.padEnd(18)} | Error: ${error.message}`);
    }
  }
  
  console.log('-'.repeat(75));
  const totalPercentage = totalRamp > 0 ? ((totalLocal / totalRamp) * 100).toFixed(1) : '0';
  console.log(`TOTAL                | ${totalRamp.toString().padStart(10)} | ${totalLocal.toString().padStart(10)} | ${(totalRamp - totalLocal).toString().padStart(10)} | ${totalPercentage.padStart(5)}%`);
  
  await prisma.$disconnect();
  await ventasDb.close();
}

checkCounts().catch(console.error);