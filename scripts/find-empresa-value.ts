import 'dotenv/config';

console.log('📋 INSTRUCCIONES PARA ENCONTRAR EL VALOR CORRECTO DE EMPRESA\n');
console.log('=' .repeat(60));

console.log('\n🔍 PASO 1: Verifica en tu sistema VS Control');
console.log('   Cuando inicias sesión en VS Control:');
console.log('   - ¿Te pide seleccionar una empresa?');
console.log('   - ¿Qué empresa seleccionas normalmente?');
console.log('   - ¿Aparece algún código o ID de empresa?\n');

console.log('🔍 PASO 2: Ejecuta esta consulta en SQL Server de VS Control:\n');
console.log(`   SELECT 
      idEmpresa, 
      Nombre, 
      NombreCorto, 
      BaseDatos 
   FROM Empresas
   WHERE Nombre LIKE '%GOVACASA%' 
      OR NombreCorto LIKE '%GOVACASA%'
      OR BaseDatos LIKE '%GOVACASA%'
      OR Nombre LIKE '%RESPALDO%'`);

console.log('\n   📊 Los resultados te mostrarán:');
console.log('   - idEmpresa: Un número (1, 2, 3, etc.)');
console.log('   - Nombre: Nombre completo de la empresa');
console.log('   - NombreCorto: Abreviación');
console.log('   - BaseDatos: Nombre de la BD\n');

console.log('🔍 PASO 3: Valores comunes a probar:\n');

const valoresComunes = [
  { valor: '1', descripcion: 'Si idEmpresa = 1' },
  { valor: '2', descripcion: 'Si idEmpresa = 2' },
  { valor: '3', descripcion: 'Si idEmpresa = 3' },
  { valor: 'GOVACASA', descripcion: 'Si NombreCorto = GOVACASA' },
  { valor: 'GOV', descripcion: 'Si NombreCorto = GOV' },
  { valor: 'GOVA', descripcion: 'Si NombreCorto = GOVA' },
  { valor: 'VSControl_GOVACASA', descripcion: 'Si BaseDatos = VSControl_GOVACASA' },
  { valor: 'GOVACASA_VSControl', descripcion: 'Si BaseDatos = GOVACASA_VSControl' },
  { valor: 'VSControl', descripcion: 'Si BaseDatos = VSControl' },
  { valor: 'BD_GOVACASA', descripcion: 'Si BaseDatos = BD_GOVACASA' },
];

console.log('   Valores para probar en VSCONTROL_EMPRESA:\n');
valoresComunes.forEach(v => {
  console.log(`   • "${v.valor}" - ${v.descripcion}`);
});

console.log('\n' + '=' .repeat(60));
console.log('\n📝 PRUEBA MANUAL:\n');
console.log('1. Edita tu archivo .env');
console.log('2. Cambia VSCONTROL_EMPRESA= con cada valor de arriba');
console.log('3. Ejecuta: npx tsx scripts/test-vscontrol-sync.ts');
console.log('4. Si funciona, verás un token de sesión\n');

console.log('💡 PISTA IMPORTANTE:');
console.log('   Si en VS Control cuando inicias sesión:');
console.log('   - NO te pide seleccionar empresa → Prueba con "1" o "0"');
console.log('   - SÍ te pide seleccionar empresa → Usa el ID o nombre exacto');
console.log('   - Solo hay una empresa → Podría ser "", "1", o el nombre\n');

console.log('🔧 ALTERNATIVA:');
console.log('   Si tienes acceso al código fuente de VS Control,');
console.log('   busca el archivo donde se valida API_InitSession');
console.log('   y verifica qué espera en el parámetro "empresa"\n');

console.log('❓ PREGUNTAS CLAVE:');
console.log('   1. ¿Cuántas empresas hay en la tabla Empresas?');
console.log('   2. ¿Cuál es el idEmpresa de GOVACASA?');
console.log('   3. ¿El sistema VS Control es multi-empresa?');
console.log('   4. ¿Qué valor aparece cuando revisas los logs de VS Control?\n');

console.log('📧 Si nada funciona:');
console.log('   Contacta al desarrollador original de VS Control');
console.log('   y pregunta: "¿Qué valor debo usar en el parámetro');
console.log('   empresa para el método API_InitSession?"');
