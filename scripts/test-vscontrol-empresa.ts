import 'dotenv/config';
import axios from 'axios';

async function testEmpresaFormats() {
  console.log('🔐 Probando diferentes formatos de empresa en VS Control\n');
  
  const url = 'http://186.96.19.135:83/VSControlTotalWS/VSControlTotalWS.asmx';
  const usuario = process.env.VSCONTROL_USER || 'TI';
  const password = process.env.VSCONTROL_PASSWORD || '1799';
  
  console.log('📋 Información de la tabla de Empresas en VS Control:');
  console.log('   - idEmpresa (número)');
  console.log('   - Nombre');
  console.log('   - NombreCorto');
  console.log('   - BaseDatos\n');
  
  console.log('🔍 Usuario configurado: ' + usuario);
  console.log('🔍 Password configurado: ' + '*'.repeat(password.length) + '\n');
  
  // Diferentes valores de empresa a probar
  const empresaValues = [
    { value: '1', desc: 'idEmpresa = 1' },
    { value: '3', desc: 'idEmpresa = 3' },
    { value: 'GOVACASA S. DE R.L. DE C.V.', desc: 'NombreCorto = GOVA' },
    { value: 'GOVA', desc: 'NombreCorto = GOVA' },
    { value: 'RESPALDO GOVACASA', desc: 'NombreCorto = GOVACASA' },
    { value: 'RESPALDO_GOVACASA', desc: 'BaseDatos = RESPALDO_GOVACASA' },
    { value: 'BD_GOVACASA', desc: 'BaseDatos = BD_GOVACASA' },
    { value: 'GOVACASA_DB', desc: 'BaseDatos = GOVACASA_DB' },
    { value: 'VSControl', desc: 'BaseDatos = VSControl' },
  ];
  
  console.log('🧪 Probando diferentes valores de empresa...\n');
  
  for (const empresa of empresaValues) {
    console.log(`📍 Probando con: ${empresa.desc}`);
    
    const body = `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tem="http://localhost/">
  <soap:Body>
    <tem:API_InitSession>
      <tem:usuario>${usuario}</tem:usuario>
      <tem:password>${password}</tem:password>
      <tem:empresa>${empresa.value}</tem:empresa>
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
        console.log(`   ✅ ÉXITO! Status: ${response.status}`);
        
        // Buscar el token de sesión
        const resultMatch = response.data.match(/<API_InitSessionResult>(.*?)<\/API_InitSessionResult>/);
        if (resultMatch && resultMatch[1]) {
          console.log(`   🎉 Token obtenido: ${resultMatch[1].substring(0, 50)}...`);
          console.log(`\n   ⭐ CREDENCIALES CORRECTAS:`);
          console.log(`      Usuario: ${usuario}`);
          console.log(`      Password: ${password}`);
          console.log(`      Empresa: ${empresa.value}`);
          console.log(`\n   📝 Actualiza tu archivo .env con:`);
          console.log(`      VSCONTROL_EMPRESA=${empresa.value}`);
          return; // Salir si encontramos las credenciales correctas
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
  console.log('1. Verifica en la tabla de Empresas de VS Control:');
  console.log('   - El valor exacto de idEmpresa');
  console.log('   - El valor exacto de NombreCorto');
  console.log('   - El valor exacto de BaseDatos');
  console.log('2. Prueba con esos valores exactos en VSCONTROL_EMPRESA');
  console.log('3. Verifica que el usuario TI y password 1799 sean correctos');
  console.log('\n📊 Puedes verificar los valores en SQL Server con:');
  console.log('   SELECT idEmpresa, Nombre, NombreCorto, BaseDatos FROM Empresas');
}

// Ejecutar
testEmpresaFormats()
  .catch(console.error);
