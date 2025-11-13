import { PrismaClient } from '@prisma/client';
import { VSCONTROL_TABLES_CONFIG } from '../src/config/sync-tables.config';

const prisma = new PrismaClient() as any; // Temporal para evitar errores de tipos

async function initVSControlTables() {
  console.log('🚀 Inicializando tablas de VS Control...\n');
  
  try {
    // Verificar que las tablas existan en la base de datos
    console.log('📋 Verificando tablas de VS Control:');
    console.log('=' .repeat(60));
    
    for (const table of VSCONTROL_TABLES_CONFIG) {
      console.log(`\n📁 ${table.displayName} (${table.tableName})`);
      
      try {
        // Verificar si la tabla existe haciendo un count
        let count = 0;
        
        // Accedemos a las tablas dinámicamente
        switch(table.tableName) {
          case 'vsc_empresas':
            count = await prisma.VSC_Empresas?.count() || 0;
            break;
          case 'vsc_proyectos':
            count = await prisma.VSC_Proyectos?.count() || 0;
            break;
          case 'vsc_clientes':
            count = await prisma.VSC_Clientes?.count() || 0;
            break;
          case 'vsc_viviendas':
            count = await prisma.VSC_Viviendas?.count() || 0;
            break;
          case 'vsc_cliente_vivienda':
            count = await prisma.VSC_ClienteVivienda?.count() || 0;
            break;
          case 'vsc_avances_fisicos':
            count = await prisma.VSC_AvancesFisicos?.count() || 0;
            break;
          case 'vsc_ordenes_compra':
            count = await prisma.VSC_OrdenesCompra?.count() || 0;
            break;
          case 'vsc_control_documentos':
            count = await prisma.VSC_ControlDocumentos?.count() || 0;
            break;
        }
        
        console.log(`   ✅ Tabla existe - ${count} registros`);
        console.log(`   📊 Prioridad: ${table.priority}`);
        console.log(`   📦 Batch size: ${table.batchSize?.toLocaleString()}`);
        
        if (table.dependencies.length > 0) {
          console.log(`   🔗 Dependencias: ${table.dependencies.join(', ')}`);
        }
        
      } catch (error: any) {
        console.log(`   ❌ Error al verificar tabla: ${error.message || error}`);
      }
    }
    
    console.log('\n' + '=' .repeat(60));
    console.log('✅ Verificación completada!');
    console.log('\n📝 PRÓXIMOS PASOS:');
    console.log('1. Ejecuta "npx prisma studio" para ver las tablas en el navegador');
    console.log('2. Configura las credenciales de VS Control en tu archivo .env:');
    console.log('   VSCONTROL_USER=tu_usuario');
    console.log('   VSCONTROL_PASSWORD=tu_password');
    console.log('   VSCONTROL_EMPRESA=tu_empresa');
    console.log('3. Ejecuta el script de sincronización:');
    console.log('   npx tsx scripts/test-vscontrol-sync.ts');
    console.log('\n💡 Las tablas ya están listas para recibir datos desde VS Control.');
    
  } catch (error) {
    console.error('❌ Error al inicializar tablas:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar
initVSControlTables()
  .catch(console.error);
