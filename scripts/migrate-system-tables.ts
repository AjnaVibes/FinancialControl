#!/usr/bin/env ts-node

/**
 * Script especializado para migrar SOLO las tablas del sistema propio a Railway
 * (Excluye tablas de RAMP y VSControl que se sincronizan automáticamente)
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as readline from 'readline';

const execAsync = promisify(exec);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query: string): Promise<string> => {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
};

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

// TABLAS DEL SISTEMA PROPIO (No RAMP ni VSControl)
const SYSTEM_TABLES = [
  // Sistema de usuarios y autenticación
  'users',
  'roles',
  'permissions',
  'role_permissions',
  'user_companies',
  'accounts',
  'sessions',
  'verification_tokens',
  
  // Configuración del sistema
  'companies',
  'sync_logs',
  'sync_config',
  'webhook_configs',
  'webhook_sync_logs',
  
  // Catálogos del sistema
  'marital_statuses',
  'marital_registries', 
  'marital_regimen',
  'client_statuses',
  'project_statuses',
  'phase_statuses',
  'quotation_statuses',
  'promise_types',
  'transaction_statuses',
  'credit_types',
  'credit_statuses',
  'financing_types',
  'financial_institutions',
  'credit_stages',
  
  // Datos principales del negocio
  'clients',
  'projects',
  'agencies',
  'coordinators',
  'agents',
  'developers',
  'operates',
  
  // Datos de proyectos
  'sub_developers',
  'facades', 
  'phases',
  'prototipes',
  'sub_prototypes',
  'units',
  'payment_methods',
  'payment_entities',
  'deposits',
  
  // Transacciones y movimientos
  'quotations',
  'transactions', 
  'movements',
  'promissories',
  'references',
  'movement_methods',
  'beneficiaries',
  'client_references',
  
  // Créditos y facturas
  'creditos',
  'invoices'
];

async function main() {
  console.log(`${colors.cyan}${colors.bright}🏦 Migración de Tablas del Sistema Propio${colors.reset}`);
  console.log(`${colors.yellow}===============================================${colors.reset}\n`);

  console.log(`${colors.green}📋 Tablas que se migrarán (${SYSTEM_TABLES.length} tablas):${colors.reset}`);
  SYSTEM_TABLES.forEach((table, index) => {
    if (index % 3 === 0) console.log('');
    process.stdout.write(`${colors.cyan}${table.padEnd(25)}${colors.reset}`);
  });
  console.log('\n');

  console.log(`${colors.yellow}ℹ️  Nota: Las tablas de VSControl (vsc_*) se excluyen porque se sincronizan automáticamente${colors.reset}\n`);

  // Paso 1: Configuración local
  console.log(`${colors.bright}1️⃣ Configuración de tu Base de Datos Local${colors.reset}`);
  const localUser = 'fcs_user'; // Basado en tu DATABASE_URL
  const localPassword = 'fcs_pass_123';
  const localDatabase = 'financial_control';
  
  console.log(`   Usuario: ${localUser}`);
  console.log(`   Base de datos: ${localDatabase}`);
  const confirmLocal = await question('¿Es correcta esta configuración? (y/n): ');
  
  if (confirmLocal.toLowerCase() !== 'y') {
    console.log(`${colors.red}❌ Configuración cancelada. Actualiza el script con tus datos correctos.${colors.reset}`);
    rl.close();
    return;
  }

  // Paso 2: Ejecutar migraciones en Railway
  console.log(`\n${colors.bright}2️⃣ Ejecutar migraciones de Prisma en Railway${colors.reset}`);
  console.log(`${colors.yellow}⚠️  Primero ejecuta: railway run npx prisma migrate deploy${colors.reset}`);
  const migrationsReady = await question('¿Ya ejecutaste las migraciones en Railway? (y/n): ');
  
  if (migrationsReady.toLowerCase() !== 'y') {
    console.log(`${colors.yellow}📝 Ejecuta primero las migraciones:${colors.reset}`);
    console.log('   1. railway login');
    console.log('   2. railway link (selecciona tu proyecto)');
    console.log('   3. railway run npx prisma migrate deploy');
    console.log('   4. Vuelve a ejecutar este script');
    rl.close();
    return;
  }

  // Paso 3: Exportar tablas del sistema
  console.log(`\n${colors.bright}3️⃣ Exportando tablas del sistema propio${colors.reset}`);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `system_tables_${timestamp}.sql`;
  
  const exportCommand = [
    'mysqldump',
    '-h localhost',
    '-P 3306', 
    `-u ${localUser}`,
    `-p${localPassword}`,
    '--single-transaction',
    '--no-create-info', // Solo datos, no estructura
    localDatabase,
    SYSTEM_TABLES.join(' '),
    `> backups/${filename}`
  ].join(' ');

  try {
    console.log(`${colors.cyan}📤 Exportando...${colors.reset}`);
    await execAsync(exportCommand);
    console.log(`${colors.green}✓ Datos exportados: backups/${filename}${colors.reset}`);
  } catch (error) {
    console.error(`${colors.red}❌ Error al exportar: ${error}${colors.reset}`);
    rl.close();
    return;
  }

  // Paso 4: Importar a Railway
  console.log(`\n${colors.bright}4️⃣ Importar a Railway${colors.reset}`);
  console.log(`${colors.yellow}⚠️  Esto agregará los datos a tu base de datos de Railway${colors.reset}`);
  const confirmImport = await question('¿Continuar con la importación? (y/n): ');
  
  if (confirmImport.toLowerCase() === 'y') {
    console.log(`\n${colors.cyan}📥 Importando a Railway...${colors.reset}`);
    console.log('Ejecuta manualmente:');
    console.log(`${colors.bright}railway run mysql < backups/${filename}${colors.reset}`);
    console.log('\nO si Railway CLI no funciona, usa MySQL directamente con los datos de conexión de Railway.');
  }

  // Paso 5: Verificar
  console.log(`\n${colors.bright}5️⃣ Verificación${colors.reset}`);
  console.log('Para verificar que todo se migró correctamente:');
  console.log(`${colors.bright}railway run npx prisma studio${colors.reset}`);
  console.log('O ejecuta el script de comparación:');
  console.log(`${colors.bright}npx ts-node scripts/migrate-to-railway.ts${colors.reset} (opción 6)`);

  console.log(`\n${colors.green}✅ ¡Proceso completado!${colors.reset}`);
  rl.close();
}

main().catch(console.error);
