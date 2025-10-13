// scripts/init-companies.ts
// Ejecutar con: npx tsx scripts/init-companies.ts

import { prisma } from '../src/lib/prisma';

async function initCompanies() {
  try {
    console.log('🏢 Inicializando empresas del sistema...\n');

    // ============================================
    // EMPRESA 1: GOVACASA
    // ============================================
    const govacasa = await prisma.company.upsert({
      where: { slug: 'govacasa' },
      create: {
        name: 'Govacasa',
        slug: 'govacasa',
        displayName: 'Govacasa',
        logo: '/logos/govacasa.png', // Agrega tu logo aquí después
        primaryColor: '#E53E3E',
        filterValue: 'Govacasa', // Filtra projects WHERE business_name = 'Govacasa'
        filterMode: 'equals',
        isActive: true
      },
      update: {
        displayName: 'Govacasa',
        primaryColor: '#E53E3E',
        filterValue: 'Govacasa'
      }
    });

    console.log('✅ Govacasa creada:', {
      id: govacasa.id,
      name: govacasa.name,
      filterValue: govacasa.filterValue
    });

    // ============================================
    // EMPRESA 2: MABU
    // ============================================
    const mabu = await prisma.company.upsert({
      where: { slug: 'mabu' },
      create: {
        name: 'MABU',
        slug: 'mabu',
        displayName: 'MABU',
        logo: '/logos/mabu.png', // Agrega tu logo aquí después
        primaryColor: '#E53E3E',
        filterValue: 'Govacasa', // Muestra todo EXCEPTO Govacasa
        filterMode: 'not_equals', // WHERE business_name != 'Govacasa'
        isActive: true
      },
      update: {
        displayName: 'MABU',
        primaryColor: '#E53E3E',
        filterMode: 'not_equals'
      }
    });

    console.log('✅ MABU creada:', {
      id: mabu.id,
      name: mabu.name,
      filterMode: mabu.filterMode,
      message: 'Muestra todo lo que NO sea Govacasa'
    });

    console.log('\n📋 Resumen:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Govacasa: Filtra projects.business_name = "Govacasa"');
    console.log('✅ MABU: Filtra projects.business_name != "Govacasa" (todo lo demás)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // ============================================
    // ASIGNAR EMPRESAS A USUARIOS EXISTENTES
    // ============================================
    console.log('👥 Verificando usuarios existentes...');
    
    const users = await prisma.user.findMany({
      where: { isActive: true }
    });

    if (users.length > 0) {
      console.log(`\n📌 Encontrados ${users.length} usuarios activos.`);
      console.log('¿Quieres asignarles acceso a ambas empresas automáticamente?');
      console.log('(Por ahora se omite, lo haremos manualmente después)\n');
      
      // OPCIONAL: Descomentar para asignar automáticamente
      /*
      for (const user of users) {
        await prisma.userCompany.createMany({
          data: [
            { userId: user.id, companyId: govacasa.id },
            { userId: user.id, companyId: mabu.id }
          ],
          skipDuplicates: true
        });
        console.log(`✅ Usuario ${user.email} asignado a ambas empresas`);
      }
      */
    } else {
      console.log('⚠️ No hay usuarios en el sistema aún.');
    }

    console.log('\n🎉 ¡Inicialización completada!\n');
    console.log('📋 Próximos pasos:');
    console.log('1. Agrega los logos en /public/logos/govacasa.png y mabu.png');
    console.log('2. Los usuarios podrán seleccionar empresa al iniciar sesión');
    console.log('3. Todas las queries filtrarán automáticamente por empresa\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

initCompanies();