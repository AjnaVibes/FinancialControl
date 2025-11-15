#!/usr/bin/env ts-node

/**
 * Script completo para deployar a Railway con migración de datos del sistema
 * Excluye tablas de RAMP y VSControl que se sincronizan automáticamente
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { existsSync, mkdirSync } from 'fs';
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
  blue: '\x1b[34m',
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

function showHeader() {
  console.log(`${colors.blue}${colors.bright}🚀 DEPLOY COMPLETO A RAILWAY${colors.reset}`);
  console.log(`${colors.blue}================================${colors.reset}\n`);
}

async function checkPrerequisites() {
  console.log(`${colors.bright}📋 Verificando prerrequisitos...${colors.reset}`);
  
  try {
    // Verificar Railway CLI
    await execAsync('railway --version');
    console.log(`${colors.green}✓ Railway CLI instalado${colors.reset}`);
  } catch (error) {
    console.log(`${colors.red}❌ Railway CLI no encontrado. Instálalo con: npm install -g @railway/cli${colors.reset}`);
    return false;
  }

  try {
    // Verificar conexión a Railway
    await execAsync('railway status');
    console.log(`${colors.green}✓ Conectado a Railway${colors.reset}`);
  } catch (error) {
    console.log(`${colors.yellow}⚠️  No conectado a Railway. Ejecutando railway login...${colors.reset}`);
    try {
      await execAsync('railway login');
      console.log(`${colors.green}✓ Login exitoso${colors.reset}`);
    } catch (loginError) {
      console.log(`${colors.red}❌ Error al conectar con Railway${colors.reset}`);
      return false;
    }
  }

  // Crear directorio de backups si no existe
  if (!existsSync('backups')) {
    mkdirSync('backups');
  }

  return true;
}

async function exportSystemData() {
  console.log(`\n${colors.bright}📤 Exportando datos del sistema local...${colors.reset}`);
  
  // Configuración de BD local (basada en tu DATABASE_URL)
  const localConfig = {
    user: 'fcs_user',
    password: 'fcs_pass_123',
    database: 'financial_control',
    host: 'localhost',
    port: '3306'
  };

  console.log(`   Base de datos: ${localConfig.database}`);
  console.log(`   Usuario: ${localConfig.user}`);
  
  const confirmLocal = await question('¿Son correctos estos datos? (y/n): ');
  if (confirmLocal.toLowerCase() !== 'y') {
    console.log(`${colors.yellow}💡 Actualiza la configuración en el script si es necesaria${colors.reset}`);
    return false;
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `system_data_${timestamp}.sql`;
  
  const exportCommand = [
    'mysqldump',
    `-h ${localConfig.host}`,
    `-P ${localConfig.port}`,
    `-u ${localConfig.user}`,
    `-p${localConfig.password}`,
    '--single-transaction',
    '--no-create-info', // Solo datos, no estructura
    '--complete-insert', // INSERT completos para mejor compatibilidad
    localConfig.database,
    SYSTEM_TABLES.join(' ')
  ].join(' ');

  try {
    console.log(`${colors.cyan}📤 Exportando ${SYSTEM_TABLES.length} tablas del sistema...${colors.reset}`);
    await execAsync(`${exportCommand} > backups/${filename}`);
    console.log(`${colors.green}✓ Datos exportados: backups/${filename}${colors.reset}`);
    return filename;
  } catch (error) {
    console.error(`${colors.red}❌ Error al exportar datos: ${error}${colors.reset}`);
    return false;
  }
}

async function deployToRailway() {
  console.log(`\n${colors.bright}🚀 Desplegando a Railway...${colors.reset}`);
  
  try {
    console.log(`${colors.cyan}📦 Construyendo y desplegando aplicación...${colors.reset}`);
    await execAsync('railway up --detach');
    console.log(`${colors.green}✓ Deploy iniciado correctamente${colors.reset}`);
    
    console.log(`${colors.cyan}⏳ Esperando que el deploy esté listo...${colors.reset}`);
    // Esperar un poco para que el deploy se complete
    await new Promise(resolve => setTimeout(resolve, 30000)); // 30 segundos
    
    return true;
  } catch (error) {
    console.error(`${colors.red}❌ Error en el deploy: ${error}${colors.reset}`);
    return false;
  }
}

async function importSystemData(filename: string) {
  console.log(`\n${colors.bright}📥 Importando datos del sistema a Railway...${colors.reset}`);
  
  const confirmImport = await question('¿Continuar con la importación de datos? (y/n): ');
  if (confirmImport.toLowerCase() !== 'y') {
    console.log(`${colors.yellow}⏭️  Saltando importación de datos${colors.reset}`);
    return true;
  }

  try {
    console.log(`${colors.cyan}📥 Importando archivo: backups/${filename}${colors.reset}`);
    
    // Usar railway run para ejecutar mysql con el archivo
    await execAsync(`railway run mysql -e "source backups/${filename}"`);
    console.log(`${colors.green}✓ Datos importados exitosamente${colors.reset}`);
    
    return true;
  } catch (error) {
    console.log(`${colors.yellow}⚠️  La importación automática falló. Importa manualmente:${colors.reset}`);
    console.log(`${colors.bright}railway run mysql < backups/${filename}${colors.reset}`);
    console.log(`\nO descarga el archivo y importa usando un cliente MySQL con los datos de conexión de Railway.`);
    return true;
  }
}

async function showFinalInstructions() {
  console.log(`\n${colors.bright}🎉 ¡Deploy completado!${colors.reset}`);
  console.log(`${colors.green}================================${colors.reset}\n`);
  
  console.log(`${colors.cyan}🔗 Comandos útiles:${colors.reset}`);
  console.log(`   ${colors.bright}railway open${colors.reset}                    - Abrir la aplicación`);
  console.log(`   ${colors.bright}railway logs${colors.reset}                    - Ver logs en tiempo real`);
  console.log(`   ${colors.bright}railway run npx prisma studio${colors.reset}   - Abrir Prisma Studio`);
  console.log(`   ${colors.bright}railway variables${colors.reset}               - Ver variables de entorno`);
  
  console.log(`\n${colors.cyan}🔍 Verificación:${colors.reset}`);
  console.log(`   1. Verifica que la aplicación esté funcionando`);
  console.log(`   2. Comprueba que puedes hacer login`);
  console.log(`   3. Revisa que los datos se importaron correctamente`);
  
  console.log(`\n${colors.yellow}⚠️  Recordatorios:${colors.reset}`);
  console.log(`   • Las tablas de VSControl se sincronizarán automáticamente`);
  console.log(`   • Las tablas de RAMP se cargan vía webhooks`);
  console.log(`   • Configura las variables de entorno necesarias en Railway`);
}

async function main() {
  showHeader();

  // Verificar prerrequisitos
  const prereqsOk = await checkPrerequisites();
  if (!prereqsOk) {
    rl.close();
    return;
  }

  console.log(`\n${colors.green}✓ Prerrequisitos verificados${colors.reset}`);

  // Mostrar plan de deployment
  console.log(`\n${colors.bright}📋 Plan de deployment:${colors.reset}`);
  console.log(`   1. 📤 Exportar datos del sistema local`);
  console.log(`   2. 🚀 Deploy aplicación a Railway`); 
  console.log(`   3. 📥 Importar datos del sistema`);
  console.log(`   4. ✅ Verificación final`);

  const proceed = await question('\n¿Continuar con el deployment? (y/n): ');
  if (proceed.toLowerCase() !== 'y') {
    console.log(`${colors.yellow}🛑 Deployment cancelado${colors.reset}`);
    rl.close();
    return;
  }

  // Paso 1: Exportar datos
  const filename = await exportSystemData();
  if (!filename) {
    rl.close();
    return;
  }

  // Paso 2: Deploy a Railway
  const deployOk = await deployToRailway();
  if (!deployOk) {
    rl.close();
    return;
  }

  // Paso 3: Importar datos
  const importOk = await importSystemData(filename);
  if (!importOk) {
    rl.close();
    return;
  }

  // Paso 4: Instrucciones finales
  await showFinalInstructions();

  rl.close();
}

main().catch((error) => {
  console.error(`${colors.red}❌ Error inesperado: ${error}${colors.reset}`);
  rl.close();
});
