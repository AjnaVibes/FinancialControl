import 'dotenv/config';
import axios from 'axios';

async function testFinalAuth() {
  console.log('🔐 Probando autenticación con VS Control - Valores Exactos\n');
  
  const url = 'http://186.96.19.135:83/VSControlTotalWS/VSControlTotalWS.asmx';
  const usuario = process.env.VSCONTROL_USER || 'TI';
  const password = process.env.VSCONTROL_PASSWORD || '1799';
  
  console.log('📋 Información de la tabla de Empresas:');
  console.log('   idEmpresa = 2');
  console.log('   Nombre = RESPALDO GOVACASA');
  console.log('   Usuario = ' + usuario);
  console.log('   Password = ' + '*'.repeat(password.length) + '\n');
  
  // Valores exactos a probar basados en la tabla
  const empresaValues = [
    '2',                    // idEmpresa como string
    'RESPALDO GOVACASA',    // Nombre exacto
    '02',                   // idEmpresa con padding
    'Respaldo Govacasa',    // Variación de mayúsculas
    'respaldo govacasa',    // Todo minúsculas
  ];
  
  console.log('🧪 Probando valores...\n');
  
  for (const empresaValue of empresaValues) {
    console.log(`📍 Probando con empresa: "${empresaValue}"`);
    
    const body = `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tem="http://localhost/">
  <soap:Body>
    <tem:API_InitSession>
      <tem:usuario>${usuario}</tem:usuario>
      <tem:password>${password}</tem:password>
      <tem:empresa>${empresaValue}</tem:empresa>
    </tem:API_InitSession>
  </soap:Body>
</soap:Envelope>`;
    
    try {
      const response = await axios.post(url, body, {
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'SOAPAction': 'http://localhost/API_InitSession'
        },
        validateStatus: () => true
      });
      
      if (response.status === 200) {
        // Buscar el token de sesión
        const resultMatch = response.data.match(/<API_InitSessionResult>(.*?)<\/API_InitSessionResult>/);
        if (resultMatch && resultMatch[1] && resultMatch[1] !== 'ERROR') {
          console.log(`   ✅ ¡ÉXITO! Token obtenido: ${resultMatch[1].substring(0, 50)}...`);
          console.log(`\n   ⭐ CREDENCIALES CORRECTAS:`);
          console.log(`      Usuario: ${usuario}`);
          console.log(`      Password: ${password}`);
          console.log(`      Empresa: ${empresaValue}`);
          console.log(`\n   📝 Actualiza tu archivo .env con:`);
          console.log(`      VSCONTROL_USER=${usuario}`);
          console.log(`      VSCONTROL_PASSWORD=${password}`);
          console.log(`      VSCONTROL_EMPRESA=${empresaValue}\n`);
          
          // Probar también con APP_InitSession
          console.log('   🔄 Probando también con APP_InitSession...');
          const appBody = body.replace('API_InitSession', 'APP_InitSession');
          const appResponse = await axios.post(url, appBody, {
            headers: {
              'Content-Type': 'text/xml; charset=utf-8',
              'SOAPAction': 'http://localhost/APP_InitSession'
            },
            validateStatus: () => true
          });
          
          const appResultMatch = appResponse.data.match(/<APP_InitSessionResult>(.*?)<\/APP_InitSessionResult>/);
          if (appResultMatch && appResultMatch[1] && appResultMatch[1] !== 'ERROR') {
            console.log(`   ✅ APP_InitSession también funciona!`);
          }
          
          return; // Salir si encontramos las credenciales correctas
        } else {
          console.log(`   ❌ Respuesta con ERROR o sin token`);
        }
      } else {
        const faultString = response.data.match(/<faultstring>(.*?)<\/faultstring>/);
        if (faultString) {
          console.log(`   ❌ Error: ${faultString[1].substring(0, 100)}...`);
        } else {
          console.log(`   ❌ Error - Status: ${response.status}`);
        }
      }
    } catch (error: any) {
      console.log(`   ❌ Error de conexión: ${error.message}`);
    }
  }
  
  console.log('\n💡 Si ninguno funcionó, verifica:');
  console.log('1. Que el usuario "TI" existe en VS Control (no SQL Server)');
  console.log('2. Que el password "1799" es correcto para VS Control');
  console.log('3. Que el usuario tenga permisos de API en VS Control');
  console.log('\n📊 Según la tabla de empresas:');
  console.log('   - La empresa "RESPALDO GOVACASA" tiene idEmpresa = 2');
  console.log('   - Cuando inicias sesión, seleccionas el nombre de la columna "Nombre"');
}

// Ejecutar
testFinalAuth()
  .catch(console.error);
