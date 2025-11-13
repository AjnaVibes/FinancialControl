import 'dotenv/config';
import axios from 'axios';

async function testNewCredentials() {
  console.log('🔐 Probando nuevas credenciales de VS Control\n');
  
  const url = 'http://186.96.19.135:83/VSControlTotalWS/VSControlTotalWS.asmx';
  const usuario = 'VSControl';
  const password = 'vsm1234@';
  
  console.log('📋 Probando con:');
  console.log('   Usuario: ' + usuario);
  console.log('   Password: ' + password.replace(/./g, '*') + '\n');
  
  // Valores de empresa a probar
  const empresaValues = [
    '1',                    // idEmpresa de GOVACASA
    '2',                    // idEmpresa de RESPALDO GOVACASA
    'GOVACASA',            // Nombre de empresa 1
    'RESPALDO GOVACASA',   // Nombre de empresa 2
    '01',                  // idEmpresa con padding
    '02',                  // idEmpresa con padding
    '',                    // Sin empresa (por si es mono-empresa)
  ];
  
  console.log('🧪 Probando diferentes valores de empresa...\n');
  
  for (const empresaValue of empresaValues) {
    const displayValue = empresaValue || '(vacío)';
    console.log(`📍 Probando con empresa: "${displayValue}"`);
    
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
        const resultMatch = response.data.match(/<API_InitSessionResult>(.*?)<\/API_InitSessionResult>/);
        if (resultMatch && resultMatch[1] && resultMatch[1].length > 10) {
          console.log(`   ✅ ¡ÉXITO! Token obtenido: ${resultMatch[1].substring(0, 50)}...`);
          console.log(`\n   ⭐ CREDENCIALES CORRECTAS:`);
          console.log(`      Usuario: ${usuario}`);
          console.log(`      Password: ${password}`);
          console.log(`      Empresa: ${empresaValue}`);
          console.log(`\n   📝 Actualiza tu archivo .env con:`);
          console.log(`      VSCONTROL_USER=${usuario}`);
          console.log(`      VSCONTROL_PASSWORD=${password}`);
          console.log(`      VSCONTROL_EMPRESA=${empresaValue}\n`);
          
          // Probar obtener datos después del login exitoso
          console.log('   🔄 Probando obtener viviendas con el token...');
          const testBody = `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tem="http://localhost/">
  <soap:Body>
    <tem:API_GetListaViviendasyEstatus>
      <tem:token>${resultMatch[1]}</tem:token>
    </tem:API_GetListaViviendasyEstatus>
  </soap:Body>
</soap:Envelope>`;
          
          const testResponse = await axios.post(url, testBody, {
            headers: {
              'Content-Type': 'text/xml; charset=utf-8',
              'SOAPAction': 'http://localhost/API_GetListaViviendasyEstatus'
            },
            validateStatus: () => true
          });
          
          if (testResponse.status === 200) {
            console.log('   ✅ ¡El token funciona! Podemos obtener datos.');
          }
          
          return; // Salir si encontramos las credenciales correctas
        } else {
          console.log(`   ❌ Sin token válido en la respuesta`);
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
  
  console.log('\n💡 Si ninguno funcionó:');
  console.log('   - Verifica que el usuario VSControl tenga permisos de API');
  console.log('   - Confirma que la contraseña sea exactamente: vsm1234@');
  console.log('   - Puede que el usuario necesite un formato específico de empresa');
}

// Ejecutar
testNewCredentials()
  .catch(console.error);
