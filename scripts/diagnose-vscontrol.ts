import 'dotenv/config';
import axios from 'axios';

async function diagnoseVSControl() {
  console.log('🔍 Diagnóstico detallado de VS Control\n');
  
  const apiUrl = process.env.VSCONTROL_API_URL || 'http://186.96.19.135:83/VSControlTotalWS/VSControlTotalWS.asmx';
  const usuario = process.env.VSCONTROL_USER || '';
  const password = process.env.VSCONTROL_PASSWORD || '';
  const empresa = process.env.VSCONTROL_EMPRESA || '';
  
  console.log('📋 Configuración actual:');
  console.log(`   URL: ${apiUrl}`);
  console.log(`   Usuario: ${usuario}`);
  console.log(`   Empresa: ${empresa}`);
  console.log(`   Password: ${'*'.repeat(password.length)}\n`);
  
  // Probar obtener el WSDL
  console.log('📄 Obteniendo WSDL del servicio...');
  try {
    const wsdlResponse = await axios.get(`${apiUrl}?wsdl`);
    console.log('✅ WSDL obtenido correctamente');
    
    // Buscar métodos disponibles
    const wsdlContent = wsdlResponse.data;
    const methods = wsdlContent.match(/<operation name="([^"]+)"/g) || [];
    
    console.log('\n📊 Métodos SOAP disponibles:');
    methods.forEach((method: string) => {
      const name = method.match(/name="([^"]+)"/)?.[1];
      console.log(`   - ${name}`);
    });
    
    // Buscar métodos de autenticación
    console.log('\n🔐 Posibles métodos de autenticación:');
    const authMethods = methods.filter((m: string) => 
      m.toLowerCase().includes('login') || 
      m.toLowerCase().includes('auth') || 
      m.toLowerCase().includes('init') ||
      m.toLowerCase().includes('session')
    );
    
    if (authMethods.length > 0) {
      authMethods.forEach((method: string) => {
        const name = method.match(/name="([^"]+)"/)?.[1];
        console.log(`   ✓ ${name}`);
      });
    } else {
      console.log('   ⚠️ No se encontraron métodos de autenticación obvios');
      console.log('   Puede que no requiera autenticación previa');
    }
    
  } catch (error: any) {
    console.log('⚠️ No se pudo obtener el WSDL');
    console.log(`   Error: ${error.message}`);
  }
  
  // Probar diferentes formatos de empresa
  console.log('\n🏢 Probando diferentes formatos para el nombre de empresa:');
  const empresaVariants = [
    empresa,
    empresa.toUpperCase(),
    empresa.toLowerCase(),
    empresa.replace(/\s+/g, ''),
    empresa.replace(/\s+/g, '_'),
  ];
  
  console.log('   Variantes a considerar:');
  empresaVariants.forEach(v => console.log(`   - "${v}"`));
  
  // Métodos alternativos que podrían funcionar sin autenticación
  console.log('\n🔧 Métodos que podrían funcionar sin autenticación:');
  const testMethods = [
    'APP_LoadEmpresas',
    'API_GetListaViviendasyEstatus',
    'API_GetViviendasDetalles'
  ];
  
  for (const method of testMethods) {
    console.log(`\n   Probando ${method}...`);
    try {
      const soapEnvelope = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tem="http://tempuri.org/">
  <soap:Body>
    <tem:${method}/>
  </soap:Body>
</soap:Envelope>`;

      const response = await axios.post(apiUrl, soapEnvelope, {
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'SOAPAction': `http://tempuri.org/${method}`
        },
        validateStatus: () => true // Aceptar cualquier status
      });
      
      if (response.status === 200) {
        console.log(`   ✅ ${method} - Respuesta exitosa`);
      } else if (response.status === 500) {
        const errorMsg = response.data.match(/<faultstring>([^<]+)<\/faultstring>/)?.[1];
        console.log(`   ⚠️ ${method} - Error: ${errorMsg || 'Error desconocido'}`);
      } else {
        console.log(`   ❌ ${method} - Status: ${response.status}`);
      }
    } catch (error: any) {
      console.log(`   ❌ ${method} - Error de conexión: ${error.message}`);
    }
  }
  
  console.log('\n💡 Recomendaciones:');
  console.log('1. Si los métodos requieren autenticación diferente, contacta al administrador');
  console.log('2. Verifica que el nombre de empresa sea exacto (mayúsculas/minúsculas)');
  console.log('3. Confirma que el usuario tenga permisos de API');
  console.log('4. Es posible que necesites un token o método de autenticación diferente');
  
  console.log('\n📝 Información adicional:');
  console.log('- VS Control usa SOAP 1.1 sobre HTTP');
  console.log('- La API está en: http://186.96.19.135:83');
  console.log('- Es un servicio .NET/IIS');
}

// Ejecutar
diagnoseVSControl()
  .catch(console.error);
