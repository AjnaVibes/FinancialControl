import 'dotenv/config';

async function testVSControlConnection() {
  console.log('🔍 Verificando conexión con VS Control...\n');
  
  // Verificar variables de entorno
  const requiredVars = ['VSCONTROL_API_URL', 'VSCONTROL_USER', 'VSCONTROL_PASSWORD', 'VSCONTROL_EMPRESA'];
  const missingVars = requiredVars.filter(v => !process.env[v]);
  
  if (missingVars.length > 0) {
    console.log('❌ Faltan las siguientes variables de entorno:');
    missingVars.forEach(v => console.log(`   - ${v}`));
    console.log('\n📝 Por favor, configura estas variables en tu archivo .env:');
    console.log('   VSCONTROL_API_URL=http://186.96.19.135:83/VSControlTotalWS/VSControlTotalWS.asmx');
    console.log('   VSCONTROL_USER=tu_usuario_real');
    console.log('   VSCONTROL_PASSWORD=tu_password_real');
    console.log('   VSCONTROL_EMPRESA=tu_empresa_real');
    console.log('\n💡 Contacta con el administrador de VS Control para obtener las credenciales correctas.');
    return;
  }
  
  console.log('✅ Variables de entorno configuradas:');
  console.log(`   API URL: ${process.env.VSCONTROL_API_URL}`);
  console.log(`   Usuario: ${process.env.VSCONTROL_USER}`);
  console.log(`   Empresa: ${process.env.VSCONTROL_EMPRESA}`);
  console.log(`   Password: ${'*'.repeat(process.env.VSCONTROL_PASSWORD?.length || 0)}`);
  
  // Probar conexión básica
  console.log('\n🔗 Probando conexión HTTP básica...');
  try {
    const response = await fetch(process.env.VSCONTROL_API_URL!);
    if (response.ok) {
      console.log('✅ Servidor VS Control accesible');
      console.log(`   Status: ${response.status} ${response.statusText}`);
    } else {
      console.log(`⚠️ Servidor respondió con status: ${response.status}`);
    }
  } catch (error: any) {
    console.log('❌ Error conectando al servidor:', error.message);
    return;
  }
  
  // Información sobre el API
  console.log('\n📋 Información del API de VS Control:');
  console.log('   Tipo: SOAP Web Service');
  console.log('   Protocolo: HTTP');
  console.log('   Formato: XML');
  
  console.log('\n📊 Tablas disponibles para sincronización:');
  console.log('   1. vsc_empresas - Catálogo de empresas');
  console.log('   2. vsc_proyectos - Proyectos inmobiliarios');
  console.log('   3. vsc_clientes - Base de clientes');
  console.log('   4. vsc_viviendas - Inventario de viviendas');
  console.log('   5. vsc_cliente_vivienda - Asignación cliente-vivienda');
  console.log('   6. vsc_avances_fisicos - Avances de obra');
  console.log('   7. vsc_ordenes_compra - Órdenes de compra');
  console.log('   8. vsc_control_documentos - Control documental');
  
  console.log('\n🚀 Próximos pasos:');
  console.log('1. Asegúrate de tener las credenciales correctas en tu archivo .env');
  console.log('2. Verifica con el administrador de VS Control que tu usuario tenga permisos');
  console.log('3. Ejecuta: npx tsx scripts/test-vscontrol-sync.ts');
  console.log('4. Si la sincronización funciona, puedes usar la API o el panel de administración');
  
  console.log('\n✅ Verificación de configuración completada!');
}

// Ejecutar
testVSControlConnection()
  .catch(console.error);
