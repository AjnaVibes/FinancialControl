import 'dotenv/config';
import axios from 'axios';

async function testAuth() {
  console.log('🔐 Probando autenticación con VS Control\n');
  
  const url = 'http://186.96.19.135:83/VSControlTotalWS/VSControlTotalWS.asmx';
  const usuario = process.env.VSCONTROL_USER || 'TI';
  const password = process.env.VSCONTROL_PASSWORD || '1799';
  const empresa = process.env.VSCONTROL_EMPRESA || 'GOVACASA';
  
  console.log('📋 Credenciales configuradas:');
  console.log(`   Usuario: ${usuario}`);
  console.log(`   Password: ${'*'.repeat(password.length)}`);
  console.log(`   Empresa: ${empresa}\n`);
  
  // Diferentes combinaciones a probar
  const tests = [
    {
      name: 'API_InitSession con namespace localhost',
      soapAction: 'http://localhost/API_InitSession',
      body: `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tem="http://localhost/">
  <soap:Body>
    <tem:API_InitSession>
      <tem:usuario>${usuario}</tem:usuario>
      <tem:password>${password}</tem:password>
      <tem:empresa>${empresa}</tem:empresa>
    </tem:API_InitSession>
  </soap:Body>
</soap:Envelope>`
    },
    {
      name: 'APP_InitSession con namespace localhost',
      soapAction: 'http://localhost/APP_InitSession',
      body: `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tem="http://localhost/">
  <soap:Body>
    <tem:APP_InitSession>
      <tem:usuario>${usuario}</tem:usuario>
      <tem:password>${password}</tem:password>
      <tem:empresa>${empresa}</tem:empresa>
    </tem:APP_InitSession>
  </soap:Body>
</soap:Envelope>`
    },
    {
      name: 'API_InitSession sin namespace en parámetros',
      soapAction: 'http://localhost/API_InitSession',
      body: `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <API_InitSession xmlns="http://localhost/">
      <usuario>${usuario}</usuario>
      <password>${password}</password>
      <empresa>${empresa}</empresa>
    </API_InitSession>
  </soap:Body>
</soap:Envelope>`
    },
    {
      name: 'APP_LoadEmpresas (sin autenticación)',
      soapAction: 'http://localhost/APP_LoadEmpresas',
      body: `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tem="http://localhost/">
  <soap:Body>
    <tem:APP_LoadEmpresas />
  </soap:Body>
</soap:Envelope>`
    }
  ];
  
  // Probar empresa sin espacios
  const empresaSinEspacios = empresa.replace(/\s+/g, '');
  tests.push({
    name: `API_InitSession con empresa sin espacios: "${empresaSinEspacios}"`,
    soapAction: 'http://localhost/API_InitSession',
    body: `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tem="http://localhost/">
  <soap:Body>
    <tem:API_InitSession>
      <tem:usuario>${usuario}</tem:usuario>
      <tem:password>${password}</tem:password>
      <tem:empresa>${empresaSinEspacios}</tem:empresa>
    </tem:API_InitSession>
  </soap:Body>
</soap:Envelope>`
  });
  
  console.log('🧪 Ejecutando pruebas...\n');
  
  for (const test of tests) {
    console.log(`📍 ${test.name}`);
    
    try {
      const response = await axios.post(url, test.body, {
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'SOAPAction': test.soapAction
        },
        validateStatus: () => true // Aceptar cualquier status
      });
      
      if (response.status === 200) {
        console.log(`   ✅ Éxito! Status: ${response.status}`);
        
        // Buscar el resultado en la respuesta
        const resultMatch = response.data.match(/<.*Result>(.*?)<\/.*Result>/);
        if (resultMatch && resultMatch[1]) {
          console.log(`   📦 Resultado: ${resultMatch[1].substring(0, 100)}...`);
        }
      } else {
        console.log(`   ❌ Error - Status: ${response.status}`);
        
        // Buscar mensaje de error
        const faultString = response.data.match(/<faultstring>(.*?)<\/faultstring>/);
        if (faultString) {
          console.log(`   💬 Mensaje: ${faultString[1]}`);
        }
      }
    } catch (error: any) {
      console.log(`   ❌ Error de conexión: ${error.message}`);
    }
    
    console.log();
  }
  
  console.log('💡 Sugerencias:');
  console.log('1. Si todos fallan con "Referencia a objeto", las credenciales son incorrectas');
  console.log('2. Si APP_LoadEmpresas funciona, el servicio está activo');
  console.log('3. Verifica con el administrador:');
  console.log('   - Usuario exacto para API (puede ser diferente de SQL Server)');
  console.log('   - Password correcto');
  console.log('   - Nombre exacto de la empresa en el sistema VS Control');
  console.log('4. El usuario podría necesitar permisos específicos de API');
}

// Ejecutar
testAuth()
  .catch(console.error);
