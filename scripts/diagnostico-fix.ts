// scripts/diagnostico-fix.ts
// Script para diagnosticar el estado de la corrección

import * as fs from 'fs';
import * as path from 'path';

console.log('🔍 DIAGNÓSTICO DE CORRECCIÓN - CLIENTS\n');
console.log('='.repeat(60));

// 1. Verificar que el schema tiene String y no DateTime
console.log('\n1️⃣ VERIFICANDO SCHEMA.PRISMA...');
const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
const schemaContent = fs.readFileSync(schemaPath, 'utf-8');

const workingTimeStartMatch = schemaContent.match(/workingTimeStart\s+(\w+\??)\s+@map\("working_time_start"\)/);
const workingTimeEndMatch = schemaContent.match(/workingTimeEnd\s+(\w+\??)\s+@map\("working_time_end"\)/);

if (workingTimeStartMatch) {
  const type = workingTimeStartMatch[1];
  if (type === 'String?') {
    console.log('✅ workingTimeStart: String? (CORRECTO)');
  } else {
    console.log(`❌ workingTimeStart: ${type} (INCORRECTO - Debe ser String?)`);
  }
} else {
  console.log('⚠️  workingTimeStart: No encontrado en schema');
}

if (workingTimeEndMatch) {
  const type = workingTimeEndMatch[1];
  if (type === 'String?') {
    console.log('✅ workingTimeEnd: String? (CORRECTO)');
  } else {
    console.log(`❌ workingTimeEnd: ${type} (INCORRECTO - Debe ser String?)`);
  }
} else {
  console.log('⚠️  workingTimeEnd: No encontrado en schema');
}

// 2. Verificar que directSyncService tiene las funciones nuevas
console.log('\n2️⃣ VERIFICANDO DIRECTSYNCSERVICE.TS...');
const servicePath = path.join(process.cwd(), 'src', 'services', 'sync', 'directSyncService.ts');
const serviceContent = fs.readFileSync(servicePath, 'utf-8');

if (serviceContent.includes('extractTimeString')) {
  console.log('✅ Función extractTimeString() encontrada');
} else {
  console.log('❌ Función extractTimeString() NO encontrada - Archivo no actualizado');
}

if (serviceContent.includes('convertToString')) {
  console.log('✅ Función convertToString() encontrada');
} else {
  console.log('❌ Función convertToString() NO encontrada - Archivo no actualizado');
}

// Verificar que los campos TIME se manejan correctamente
if (serviceContent.includes('timeFields.includes(key)')) {
  console.log('✅ Validación de campos TIME encontrada');
} else {
  console.log('❌ Validación de campos TIME NO encontrada');
}

// 3. Verificar que el cliente de Prisma fue regenerado recientemente
console.log('\n3️⃣ VERIFICANDO CLIENTE PRISMA...');
const prismaClientPath = path.join(process.cwd(), 'node_modules', '.prisma', 'client', 'index.d.ts');
if (fs.existsSync(prismaClientPath)) {
  const stats = fs.statSync(prismaClientPath);
  const lastModified = stats.mtime;
  const minutesAgo = Math.floor((Date.now() - lastModified.getTime()) / 60000);
  
  if (minutesAgo < 10) {
    console.log(`✅ Prisma Client regenerado hace ${minutesAgo} minutos (RECIENTE)`);
  } else if (minutesAgo < 60) {
    console.log(`⚠️  Prisma Client regenerado hace ${minutesAgo} minutos (Considera regenerar)`);
  } else {
    console.log(`❌ Prisma Client regenerado hace ${Math.floor(minutesAgo / 60)} horas (DEBE REGENERAR)`);
  }
} else {
  console.log('❌ Cliente Prisma no encontrado');
}

// 4. Resumen y recomendaciones
console.log('\n' + '='.repeat(60));
console.log('📊 RESUMEN Y ACCIONES NECESARIAS:\n');

const needsSchemaFix = !workingTimeStartMatch || workingTimeStartMatch[1] !== 'String?';
const needsServiceUpdate = !serviceContent.includes('extractTimeString');
const needsPrismaRegen = true; // Siempre recomendar por si acaso

if (!needsSchemaFix && !needsServiceUpdate) {
  console.log('✅ Todos los archivos están correctos');
  console.log('\n🔄 EJECUTAR PARA APLICAR:');
  console.log('   npx prisma generate');
  console.log('   npx tsx scripts/resync-single-table.ts clients');
} else {
  if (needsSchemaFix) {
    console.log('❌ 1. ACTUALIZAR SCHEMA.PRISMA:');
    console.log('   Editar prisma/schema.prisma');
    console.log('   Cambiar: workingTimeStart DateTime? a String?');
    console.log('   Cambiar: workingTimeEnd DateTime? a String?');
    console.log('');
  }
  
  if (needsServiceUpdate) {
    console.log('❌ 2. ACTUALIZAR DIRECTSYNCSERVICE.TS:');
    console.log('   Reemplazar: src/services/sync/directSyncService.ts');
    console.log('   Con el archivo corregido de /mnt/user-data/outputs/');
    console.log('');
  }
  
  console.log('❌ 3. REGENERAR PRISMA:');
  console.log('   npx prisma generate');
  console.log('');
  
  console.log('❌ 4. RESINCRONIZAR:');
  console.log('   npx tsx scripts/resync-single-table.ts clients');
}

console.log('\n' + '='.repeat(60));