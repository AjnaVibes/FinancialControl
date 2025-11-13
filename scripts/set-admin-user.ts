// scripts/set-admin-user.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function setAdminUser(email: string) {
  console.log('🔧 Configurando usuario como administrador...');
  console.log(`📧 Email: ${email}`);

  try {
    // Buscar el usuario
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        role: true,
        companies: true
      }
    });

    if (!user) {
      console.error(`❌ Usuario con email ${email} no encontrado`);
      console.log('💡 Asegúrate de haber iniciado sesión al menos una vez');
      return;
    }

    console.log(`✅ Usuario encontrado: ${user.name || user.email}`);

    // Buscar el rol de administrador
    const adminRole = await prisma.role.findUnique({
      where: { name: 'admin' }
    });

    if (!adminRole) {
      console.error('❌ Rol de administrador no encontrado');
      console.log('💡 Ejecuta primero: npx tsx scripts/init-roles-permissions.ts');
      return;
    }

    // Asignar el rol de administrador
    await prisma.user.update({
      where: { id: user.id },
      data: {
        roleId: adminRole.id,
        isActive: true
      }
    });

    console.log('✅ Rol de administrador asignado');

    // Obtener todas las empresas
    const companies = await prisma.company.findMany();

    // Eliminar asociaciones existentes
    await prisma.userCompany.deleteMany({
      where: { userId: user.id }
    });

    // Asignar acceso a todas las empresas
    for (const company of companies) {
      await prisma.userCompany.create({
        data: {
          userId: user.id,
          companyId: company.id,
          roleId: adminRole.id,
          canAccess: true
        }
      });
      console.log(`  ✅ Acceso otorgado a: ${company.displayName}`);
    }

    console.log('\n🎉 ¡Configuración completada!');
    console.log('📌 El usuario ahora tiene:');
    console.log('   • Rol de Administrador');
    console.log('   • Acceso a todas las empresas');
    console.log('   • Todos los permisos del sistema');
    console.log('\n🔄 Recarga la página para ver los cambios');

  } catch (error) {
    console.error('❌ Error al configurar el usuario:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Obtener el email del argumento de línea de comandos
const email = process.argv[2];

if (!email) {
  console.log('❌ Debes proporcionar un email como argumento');
  console.log('📝 Uso: npx tsx scripts/set-admin-user.ts tu-email@tudominio.com');
  process.exit(1);
}

setAdminUser(email);
