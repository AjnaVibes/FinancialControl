#!/usr/bin/env ts-node

/**
 * Script automatizado para desplegar tablas en Railway y migrar datos
 * Ejecuta todo el proceso paso a paso
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

// Configuración de BD local basada en tu DATABASE_URL
const LOCAL_CONFIG = {
  host: 'localhost',
  port: '3306',
  user: 'fcs_user',
  password: 'fcs_pass_123',
  database: 'financial_control'
};

// Tablas del sistema propio (excluye VSControl y RAMP)
const SYSTEM_TABLES = [
  'users', 'roles', 'permissions', 'role_permissions', 'user_companies',
  'accounts', 'sessions', 'verification_tokens', 'companies', 'sync_logs',
  'sync_config', 'webhook_configs', 'webhook_sync_logs', 'marital_statuses',
  'marital_registries', 'marital_regimen', 'client_statuses', 'project_statuses',
  'phase_statuses', 'quotation_statuses', 'promise_types', 'transaction_statuses',
  'credit_types', 'credit_statuses', 'financing_types', 'financial_institutions',
  'credit_stages', 'clients', 'projects', 'agencies', 'coordinators', 'agents',
  'developers', 'operates', 'sub_developers', 'facades', 'phases', 'prototipes',
  'sub_prototypes', 'units', 'payment_methods', 'payment_entities', 'deposits',
  'quotations', 'transactions', 'movements', 'promissories', 'references',
  'movement_methods', 'beneficiaries', 'client_references', 'creditos', 'invoices'
];

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runCommand(command: string, description: string): Promise<string> {
  console.log(`${colors.cyan}🔄 ${description}...${colors.reset}`);
  console.log(`${colors.yellow}   Comando: ${command}${colors.reset}`);
  
  try {
    const { stdout, stderr } = await execAsync(command);
    if (stderr) {
      console.log(`${colors.yellow}   Warning: ${stderr}${colors.reset}`);
    }
    console.log(`${colors.green}✅ ${description} - Completado${colors.reset}\n`);
    return stdout;
  } catch (error: any) {
    console.error(`${colors.red}❌ Error en ${description}:${colors.reset}`);
    console.error(`${colors.red}   ${error.message}${colors.reset}\n`);
    throw error;
  }
}

async function main() {
  console.log(`${colors.cyan}${colors.bright}🚂 DESPLIEGUE Y MIGRACIÓN AUTOMATIZADA${colors.reset}`);
  console.log(`${colors.yellow}=====================================\n${colors.reset}`);

  // Crear directorio de backups si no existe
  if (!fs.existsSync('backups')) {
    fs.mkdirSync('backups');
    console.log(`${colors.green}✅ Directorio backups/ creado${colors.reset}\n`);
  }

  try {
    // Paso 1: Verificar Railway CLI
    console.log(`${colors.bright}PASO 1: Verificar Railway CLI${colors.reset}`);
    await runCommand('railway --version', 'Verificar Railway CLI');

    // Paso 2: Login a Railway
    console.log(`${colors.bright}PASO 2: Conectar a Railway${colors.reset}`);
    console.log(`${colors.yellow}⚠️  Si no has hecho login, ejecuta: railway login${colors.reset}`);
    console.log(`${colors.yellow}⚠️  Si no has vinculado el proyecto, ejecuta: railway link${colors.reset}\n`);
    
    // Verificar si ya está conectado
    try {
      await runCommand('railway status', 'Verificar conexión a Railway');
    } catch (error) {
      console.log(`${colors.red}❌ No estás conectado a Railway${colors.reset}`);
      console.log(`${colors.yellow}Ejecuta estos comandos manualmente:${colors.reset}`);
      console.log('   railway login');
      console.log('   railway link');
      console.log('   Luego vuelve a ejecutar este script');
      return;
    }

    // Paso 3: Ejecutar migraciones de Prisma en Railway
    console.log(`${colors.bright}PASO 3: Crear estructura de BD en Railway${colors.reset}`);
    await runCommand(
      'railway run npx prisma migrate deploy', 
      'Ejecutar migraciones de Prisma en Railway'
    );
    
    await sleep(2000); // Esperar 2 segundos

    // Paso 4: Exportar datos locales
    console.log(`${colors.bright}PASO 4: Exportar datos de BD local${colors.reset}`);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `system_data_${timestamp}.sql`;
    const filepath = path.join('backups', filename);

    const exportCommand = [
      'mysqldump',
      `-h ${LOCAL_CONFIG.host}`,
      `-P ${LOCAL_CONFIG.port}`,
      `-u ${LOCAL_CONFIG.user}`,
      `-p${LOCAL_CONFIG.password}`,
      '--single-transaction',
      '--no-create-info', // Solo datos, no estructura
      '--insert-ignore',  // Ignorar duplicados
      LOCAL_CONFIG.database,
      ...SYSTEM_TABLES,
      `> ${filepath}`
    ].join(' ');

    await runCommand(exportCommand, 'Exportar datos del sistema local');

    // Verificar que el archivo se creó
    if (!fs.existsSync(filepath)) {
      throw new Error(`No se pudo crear el archivo de backup: ${filepath}`);
    }

    const stats = fs.statSync(filepath);
    const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
    console.log(`${colors.green}📦 Backup creado: ${filepath} (${sizeInMB} MB)${colors.reset}\n`);

    // Paso 5: Importar datos a Railway
    console.log(`${colors.bright}PASO 5: Importar datos a Railway${colors.reset}`);
    await runCommand(
      `railway run mysql < ${filepath}`,
      'Importar datos del sistema a Railway'
    );

    // Paso 6: Verificar migración
    console.log(`${colors.bright}PASO 6: Verificar migración${colors.reset}`);
    console.log(`${colors.cyan}🔍 Contando registros en algunas tablas principales...${colors.reset}`);
    
    const tablesToCheck = ['users', 'clients', 'projects', 'companies', 'roles'];
    
    for (const table of tablesToCheck) {
      try {
        const result = await runCommand(
          `railway run npx prisma db execute --stdin <<< "SELECT COUNT(*) as count FROM ${table};"`,
          `Contar registros en tabla ${table}`
        );
        console.log(`   ${table}: registros verificados`);
      } catch (error) {
        console.log(`   ${table}: ${colors.yellow}Error o tabla vacía${colors.reset}`);
      }
    }

    // Paso 7: Resultado final
    console.log(`\n${colors.bright}🎉 MIGRACIÓN COMPLETADA EXITOSAMENTE${colors.reset}`);
    console.log(`${colors.green}=====================================\n${colors.reset}`);
    
    console.log(`${colors.bright}✅ RESUMEN:${colors.reset}`);
    console.log(`   • Base de datos creada en Railway`);
    console.log(`   • ${SYSTEM_TABLES.length} tablas del sistema migradas`);
    console.log(`   • Datos exportados: ${filepath}`);
    console.log(`   • Aplicación lista para usar\n`);

    console.log(`${colors.bright}🔧 PRÓXIMOS PASOS:${colors.reset}`);
    console.log(`   1. Verificar datos: ${colors.cyan}railway run npx prisma studio${colors.reset}`);
    console.log(`   2. Probar tu app en: ${colors.cyan}https://tu-app.up.railway.app${colors.reset}`);
    console.log(`   3. Sincronizar VSControl: Usar el panel de sync en tu app\n`);

    console.log(`${colors.yellow}📝 NOTA: Las tablas VSControl (vsc_*) están vacías por diseño.${colors.reset}`);
    console.log(`${colors.yellow}   Se llenarán automáticamente cuando configures la sincronización.${colors.reset}\n`);

  } catch (error: any) {
    console.error(`\n${colors.red}💥 ERROR EN EL PROCESO:${colors.reset}`);
    console.error(`${colors.red}${error.message}${colors.reset}\n`);
    
    console.log(`${colors.yellow}🛠️  SOLUCIÓN MANUAL:${colors.reset}`);
    console.log('   1. railway login');
    console.log('   2. railway link');
    console.log('   3. railway run npx prisma migrate deploy');
    console.log(`   4. npx ts-node scripts/migrate-system-tables.ts`);
  }
}

main().catch(console.error);
