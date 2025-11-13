import 'dotenv/config';
import axios from 'axios';
import { writeFileSync } from 'fs';

async function getWSDLMethods() {
  console.log('📄 Obteniendo WSDL de VS Control...\n');
  
  const apiUrl = process.env.VSCONTROL_API_URL || 'http://186.96.19.135:83/VSControlTotalWS/VSControlTotalWS.asmx';
  
  try {
    // Descargar WSDL
    const response = await axios.get(`${apiUrl}?wsdl`);
    const wsdl = response.data;
    
    // Guardar WSDL para análisis
    writeFileSync('vscontrol.wsdl', wsdl);
    console.log('✅ WSDL guardado en vscontrol.wsdl\n');
    
    // Buscar namespace
    const namespaceMatch = wsdl.match(/targetNamespace="([^"]+)"/);
    const namespace = namespaceMatch ? namespaceMatch[1] : 'http://tempuri.org/';
    console.log(`📦 Namespace: ${namespace}\n`);
    
    // Buscar todas las operaciones
    const operationRegex = /<wsdl:operation name="([^"]+)"/g;
    const operations: string[] = [];
    let match;
    
    while ((match = operationRegex.exec(wsdl)) !== null) {
      operations.push(match[1]);
    }
    
    console.log(`📊 Se encontraron ${operations.length} métodos:\n`);
    
    // Categorizar métodos
    const authMethods: string[] = [];
    const apiMethods: string[] = [];
    const appMethods: string[] = [];
    const otherMethods: string[] = [];
    
    operations.forEach(op => {
      if (op.toLowerCase().includes('login') || 
          op.toLowerCase().includes('auth') || 
          op.toLowerCase().includes('session') ||
          op.toLowerCase().includes('init')) {
        authMethods.push(op);
      } else if (op.startsWith('API_')) {
        apiMethods.push(op);
      } else if (op.startsWith('APP_')) {
        appMethods.push(op);
      } else {
        otherMethods.push(op);
      }
    });
    
    if (authMethods.length > 0) {
      console.log('🔐 Métodos de Autenticación:');
      authMethods.forEach(m => console.log(`   - ${m}`));
      console.log();
    }
    
    if (apiMethods.length > 0) {
      console.log('📡 Métodos API (probablemente requieren auth):');
      apiMethods.forEach(m => console.log(`   - ${m}`));
      console.log();
    }
    
    if (appMethods.length > 0) {
      console.log('📱 Métodos APP:');
      appMethods.forEach(m => console.log(`   - ${m}`));
      console.log();
    }
    
    if (otherMethods.length > 0) {
      console.log('📌 Otros Métodos:');
      otherMethods.forEach(m => console.log(`   - ${m}`));
      console.log();
    }
    
    // Buscar el formato correcto del SOAPAction
    const soapActionMatch = wsdl.match(/soapAction="([^"]+)"/);
    if (soapActionMatch) {
      console.log(`🔧 Formato SOAPAction: ${soapActionMatch[1]}`);
      console.log('   Usa este formato para las llamadas SOAP\n');
    }
    
    // Analizar si hay métodos que parecen no requerir autenticación
    console.log('💡 Análisis:');
    if (authMethods.length === 0) {
      console.log('   - No se encontraron métodos obvios de autenticación');
      console.log('   - Posiblemente la API use autenticación por parámetros en cada llamada');
      console.log('   - O podría usar un método con nombre diferente\n');
    } else {
      console.log(`   - Método de autenticación probable: ${authMethods[0]}`);
      console.log('   - Intenta autenticarte primero con este método\n');
    }
    
    // Buscar parámetros de los métodos principales
    console.log('📝 Buscando parámetros de métodos clave...\n');
    
    const keyMethods = [...authMethods.slice(0, 2), ...apiMethods.slice(0, 2)];
    
    for (const method of keyMethods) {
      const messageRegex = new RegExp(`<wsdl:message name="${method}SoapIn">([\\s\\S]*?)</wsdl:message>`, 'i');
      const messageMatch = wsdl.match(messageRegex);
      
      if (messageMatch) {
        console.log(`   ${method}:`);
        const params = messageMatch[1].match(/name="([^"]+)"/g);
        if (params) {
          params.forEach((p: string) => {
            const paramName = p.match(/name="([^"]+)"/)?.[1];
            if (paramName && paramName !== 'parameters') {
              console.log(`      - ${paramName}`);
            }
          });
        } else {
          console.log('      (sin parámetros)');
        }
        console.log();
      }
    }
    
    console.log('✅ Análisis completado. Revisa vscontrol.wsdl para más detalles.');
    
  } catch (error: any) {
    console.error('❌ Error obteniendo WSDL:', error.message);
  }
}

// Ejecutar
getWSDLMethods()
  .catch(console.error);
