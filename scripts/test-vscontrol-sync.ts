import VSControlSyncService from '../src/services/vscontrol/vsControlSyncService';

async function testVSControlSync() {
  console.log('🔧 Iniciando prueba de sincronización con VS Control...\n');
  
  const syncService = new VSControlSyncService();
  
  try {
    // Configurar credenciales - CAMBIAR POR LAS CREDENCIALES REALES
    const credentials = {
      usuario: process.env.VSCONTROL_USER || 'usuario_prueba',
      password: process.env.VSCONTROL_PASSWORD || 'password_prueba',
      empresa: process.env.VSCONTROL_EMPRESA || 'empresa_prueba'
    };
    
    console.log('📋 Credenciales configuradas:');
    console.log(`   Usuario: ${credentials.usuario}`);
    console.log(`   Empresa: ${credentials.empresa}\n`);
    
    syncService.setCredentials(credentials);
    
    console.log('🚀 Iniciando sincronización...\n');
    
    // Intentar sincronizar todas las tablas
    const resultados = await syncService.syncAll();
    
    console.log('✅ Sincronización completada!\n');
    console.log('📊 Resultados por tabla:');
    console.log('=' .repeat(60));
    
    let totales = {
      registrosSincronizados: 0,
      registrosNuevos: 0,
      registrosActualizados: 0,
      errores: 0
    };
    
    resultados.forEach(resultado => {
      console.log(`\n📁 ${resultado.tabla}`);
      console.log(`   - Sincronizados: ${resultado.registrosSincronizados}`);
      console.log(`   - Nuevos: ${resultado.registrosNuevos}`);
      console.log(`   - Actualizados: ${resultado.registrosActualizados}`);
      console.log(`   - Errores: ${resultado.errores}`);
      if (resultado.mensaje) {
        console.log(`   - Mensaje: ${resultado.mensaje}`);
      }
      
      totales.registrosSincronizados += resultado.registrosSincronizados;
      totales.registrosNuevos += resultado.registrosNuevos;
      totales.registrosActualizados += resultado.registrosActualizados;
      totales.errores += resultado.errores;
    });
    
    console.log('\n' + '=' .repeat(60));
    console.log('📈 TOTALES GENERALES:');
    console.log(`   - Total sincronizados: ${totales.registrosSincronizados}`);
    console.log(`   - Total nuevos: ${totales.registrosNuevos}`);
    console.log(`   - Total actualizados: ${totales.registrosActualizados}`);
    console.log(`   - Total errores: ${totales.errores}`);
    
    if (totales.errores > 0) {
      console.log('\n⚠️ Se encontraron errores durante la sincronización.');
      console.log('   Revisa los logs para más detalles.');
    }
    
  } catch (error) {
    console.error('\n❌ Error durante la sincronización:', error);
    if (error instanceof Error) {
      console.error('   Mensaje:', error.message);
      console.error('   Stack:', error.stack);
    }
  } finally {
    await syncService.disconnect();
    console.log('\n🔌 Conexión cerrada.');
  }
}

// Función para probar tabla específica
async function testTablaEspecifica(tabla: string) {
  console.log(`🔧 Probando sincronización de tabla: ${tabla}\n`);
  
  const syncService = new VSControlSyncService();
  
  try {
    const credentials = {
      usuario: process.env.VSCONTROL_USER || 'usuario_prueba',
      password: process.env.VSCONTROL_PASSWORD || 'password_prueba',
      empresa: process.env.VSCONTROL_EMPRESA || 'empresa_prueba'
    };
    
    syncService.setCredentials(credentials);
    
    let resultado;
    
    switch(tabla) {
      case 'empresas':
        resultado = await syncService.syncEmpresas();
        break;
      case 'viviendas':
        resultado = await syncService.syncViviendas();
        break;
      case 'clientes':
        resultado = await syncService.syncClientes();
        break;
      case 'ordenes':
        resultado = await syncService.syncOrdenesCompra();
        break;
      case 'documentos':
        resultado = await syncService.syncControlDocumentos();
        break;
      default:
        throw new Error(`Tabla '${tabla}' no reconocida`);
    }
    
    console.log('📊 Resultado:');
    console.log(resultado);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await syncService.disconnect();
  }
}

// Ejecutar prueba
const args = process.argv.slice(2);

if (args.length > 0 && args[0] === '--tabla') {
  const tabla = args[1];
  if (!tabla) {
    console.error('❌ Especifica el nombre de la tabla');
    console.log('   Ejemplo: npm run test:vscontrol -- --tabla empresas');
    process.exit(1);
  }
  testTablaEspecifica(tabla);
} else {
  testVSControlSync();
}
