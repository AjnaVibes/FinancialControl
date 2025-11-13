import 'dotenv/config';
import axios from 'axios';

async function testDirectMethods() {
  console.log('🔍 Probando conexión directa a tablas de VS Control\n');
  
  const url = 'http://186.96.19.135:83/VSControlTotalWS/VSControlTotalWS.asmx';
  
  console.log('📊 Intentando acceder a diferentes tablas SIN autenticación previa...\n');
  
  // Métodos APP que podrían no requerir autenticación
  const methods = [
    {
      name: 'APP_GetClientesFlashlist',
      desc: 'Lista de Clientes',
      body: `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tem="http://localhost/">
  <soap:Body>
    <tem:APP_GetClientesFlashlist />
  </soap:Body>
</soap:Envelope>`
    },
    {
      name: 'APP_GetFraccionamientos',
      desc: 'Lista de Fraccionamientos',
      body: `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tem="http://localhost/">
  <soap:Body>
    <tem:APP_GetFraccionamientos />
  </soap:Body>
</soap:Envelope>`
    },
    {
      name: 'APP_GetLotesXEstatus',
      desc: 'Lista de Lotes por Estatus',
      body: `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tem="http://localhost/">
  <soap:Body>
    <tem:APP_GetLotesXEstatus />
  </soap:Body>
</soap:Envelope>`
    },
    {
      name: 'APP_GetPromociones',
      desc: 'Lista de Promociones',
      body: `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tem="http://localhost/">
  <soap:Body>
    <tem:APP_GetPromociones />
  </soap:Body>
</soap:Envelope>`
    },
    {
      name: 'APP_FillObras',
      desc: 'Llenar Obras',
      body: `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tem="http://localhost/">
  <soap:Body>
    <tem:APP_FillObras />
  </soap:Body>
</soap:Envelope>`
    },
    {
      name: 'APP_GetUsuarioSesion',
      desc: 'Info de Usuario (prueba sin params)',
      body: `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tem="http://localhost/">
  <soap:Body>
    <tem:APP_GetUsuarioSesion />
  </soap:Body>
</soap:Envelope>`
    },
    {
      name: 'API_GetListaViviendasyEstatus con token vacío',
      desc: 'Viviendas con token vacío',
      body: `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tem="http://localhost/">
  <soap:Body>
    <tem:API_GetListaViviendasyEstatus>
      <tem:token></tem:token>
    </tem:API_GetListaViviendasyEstatus>
  </soap:Body>
</soap:Envelope>`
    },
    {
      name: 'API_GetViviendasDetalles con token dummy',
      desc: 'Viviendas Detalles con token dummy',
      body: `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tem="http://localhost/">
  <soap:Body>
    <tem:API_GetViviendasDetalles>
      <tem:token>test123</tem:token>
    </tem:API_GetViviendasDetalles>
  </soap:Body>
</soap:Envelope>`
    }
  ];
  
  let successCount = 0;
  
  for (const method of methods) {
    console.log(`📍 Probando: ${method.name}`);
    console.log(`   Descripción: ${method.desc}`);
    
    try {
      const response = await axios.post(url, method.body, {
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'SOAPAction': `http://localhost/${method.name.split(' ')[0]}`
        },
        validateStatus: () => true
      });
      
      if (response.status === 200) {
        console.log(`   ✅ ÉXITO! Status: ${response.status}`);
        successCount++;
        
        // Buscar si hay datos en la respuesta
        const hasData = response.data.includes('NewDataSet') || 
                       response.data.includes('Table') ||
                       response.data.includes('Result');
        
        if (hasData) {
          console.log(`   📦 Contiene datos!`);
          
          // Extraer un fragmento de los datos
          const dataMatch = response.data.match(/<.*Result>(.*?)<\/.*Result>/);
          if (dataMatch && dataMatch[1]) {
            const preview = dataMatch[1].substring(0, 100);
            console.log(`   📄 Vista previa: ${preview}...`);
          }
        } else {
          console.log(`   ⚠️ Respuesta exitosa pero sin datos`);
        }
      } else {
        console.log(`   ❌ Error - Status: ${response.status}`);
        
        const faultString = response.data.match(/<faultstring>(.*?)<\/faultstring>/);
        if (faultString) {
          console.log(`   💬 Mensaje: ${faultString[1].substring(0, 80)}...`);
        }
      }
    } catch (error: any) {
      console.log(`   ❌ Error de conexión: ${error.message}`);
    }
    
    console.log();
  }
  
  console.log('=' .repeat(60));
  console.log(`\n📊 Resumen: ${successCount} de ${methods.length} métodos respondieron con éxito\n`);
  
  if (successCount > 0) {
    console.log('✅ ¡Algunos métodos funcionan sin autenticación!');
    console.log('   Esto confirma que la conexión está activa.');
    console.log('   El problema es específicamente con la autenticación.\n');
  }
  
  console.log('💡 Conclusiones:');
  console.log('1. Si algunos métodos funcionan, el servicio está activo');
  console.log('2. El problema está en las credenciales de autenticación');
  console.log('3. Necesitas verificar con el administrador de VS Control:');
  console.log('   - Usuario correcto del SISTEMA (no SQL Server)');
  console.log('   - Password correcto del SISTEMA');
  console.log('   - Valor exacto del campo empresa');
  console.log('\n📝 Alternativa: Si tienes acceso al código de VS Control,');
  console.log('   busca cómo se validan las credenciales en el método API_InitSession');
}

// Ejecutar
testDirectMethods()
  .catch(console.error);
