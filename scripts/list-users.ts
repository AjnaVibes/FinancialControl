// scripts/list-users.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function listUsers() {
  console.log('📋 Listando todos los usuarios en el sistema...\n');

  try {
    const users = await prisma.user.findMany({
      include: {
        role: true,
        companies: {
          include: {
            company: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (users.length === 0) {
      console.log('❌ No hay usuarios registrados en el sistema');
      console.log('💡 Los usuarios se crean automáticamente al iniciar sesión con Google\n');
      console.log('📝 Pasos para configurar tu primer usuario administrador:');
      console.log('   1. Inicia la aplicación: npm run dev');
      console.log('   2. Ve a http://localhost:3000');
      console.log('   3. Inicia sesión con tu cuenta de Google (@govacasa.com)');
      console.log('   4. Ejecuta: npx tsx scripts/set-admin-user.ts tu-email@govacasa.com');
      return;
    }

    console.log(`✅ Encontrados ${users.length} usuario(s):\n`);

    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email}`);
      console.log(`   • Nombre: ${user.name || 'Sin nombre'}`);
      console.log(`   • Rol: ${user.role?.displayName || '❌ Sin rol (pendiente)'}`);
      console.log(`   • Estado: ${user.isActive ? '✅ Activo' : '❌ Inactivo'}`);
      console.log(`   • Empresas: ${user.companies.length > 0 
        ? user.companies.map(uc => uc.company.displayName).join(', ')
        : '❌ Sin empresas asignadas'}`);
      console.log(`   • Registrado: ${user.createdAt.toLocaleDateString('es-MX')}`);
      console.log('');
    });

    // Mostrar usuarios sin rol (pendientes de aprobación)
    const pendingUsers = users.filter(u => !u.role || u.companies.length === 0);
    if (pendingUsers.length > 0) {
      console.log('⚠️  Usuarios pendientes de aprobación:');
      pendingUsers.forEach(user => {
        console.log(`   • ${user.email}`);
      });
      console.log('\n💡 Para asignar rol de administrador:');
      console.log(`   npx tsx scripts/set-admin-user.ts ${pendingUsers[0].email}`);
    }

  } catch (error) {
    console.error('❌ Error al listar usuarios:', error);
  } finally {
    await prisma.$disconnect();
  }
}

listUsers();
