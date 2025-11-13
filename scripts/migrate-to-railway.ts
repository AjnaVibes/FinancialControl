#!/usr/bin/env ts-node

/**
 * Script para migrar datos locales a Railway
 * Ejecutar: npx ts-node scripts/migrate-to-railway.ts
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

const execAsync = promisify(exec);

// Interfaz para preguntas
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query: string): Promise<string> => {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
};

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

// Tablas en orden de dependencias (basado en tu schema.prisma)
const TABLES_ORDER = [
  // Tablas independientes primero
  'users',
  'roles',
  'permissions',
  'companies',
  'marital_statuses',
  'marital_registries',
  'marital_regimen',
  'client_statuses',
  'project_statuses',
  'phase_statuses',
  'quotation_statuses',
  'promise_types',
  'transaction_statuses',
  'operates',
  'credit_types',
  'credit_statuses',
  'financing_types',
  'financial_institutions',
  'credit_stages',
  
  // Tablas con dependencias simples
  'role_permissions',
  'user_companies',
  'accounts',
  'sessions',
  'verification_tokens',
  'sync_logs',
  'sync_config',
  'webhook_configs',
  'webhook_sync_logs',
  
  // Tablas de negocio principales
  'clients',
  'agencies',
  'coordinators',
  'agents',
  'developers',
  'projects',
  
  // Tablas dependientes de proyectos
  'sub_developers',
  'facades',
  'phases',
  'prototipes',
  'sub_prototypes',
  'units',
  'payment_methods',
  'payment_entities',
  'deposits',
  
  // Tablas de transacciones
  'quotations',
  'transactions',
  'movements',
  'promissories',
  'references',
  'movement_methods',
  
  // Tablas de clientes relacionadas
  'beneficiaries',
  'client_references',
  
  // Tablas de créditos y facturas
  'creditos',
  'invoices',
  
  // Tablas de VS Control
  'vsc_empresas',
  'vsc_proyectos',
  'vsc_viviendas',
  'vsc_clientes',
  'vsc_cliente_vivienda',
  'vsc_avances_fisicos',
  'vsc_ordenes_compra',
  'vsc_control_documentos',
];

async function main() {
  console.log(`${colors.cyan}${colors.bright}🚂 Railway Database Migration Tool${colors.reset}`);
  console.log(`${colors.yellow}======================================${colors.reset}\n`);

  // Verificar si el directorio de backups existe
  const backupDir = path.join(process.cwd(), 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir);
    console.log(`${colors.green}✓${colors.reset} Directorio de backups creado`);
  }

  // Configuración de la base de datos local
  console.log(`${colors.bright}📋 Configuración de Base de Datos Local${colors.reset}`);
  const localHost = await question('Host local (default: localhost): ') || 'localhost';
  const localPort = await question('Puerto local (default: 3306): ') || '3306';
  const localUser = await question('Usuario local (default: root): ') || 'root';
  const localPassword = await question('Contraseña local: ');
  const localDatabase = await question('Nombre de la base de datos local: ');

  console.log(`\n${colors.bright}☁️  Configuración de Railway${colors.reset}`);
  console.log(`${colors.yellow}(Encuentra estos valores en Railway Dashboard → MySQL → Variables)${colors.reset}`);
  const railwayHost = await question('Railway Host (ej: containers-us-west-XXX.railway.app): ');
  const railwayPort = await question('Railway Puerto: ');
  const railwayUser = await question('Railway Usuario (default: root): ') || 'root';
  const railwayPassword = await question('Railway Contraseña: ');
  const railwayDatabase = await question('Railway Database (default: railway): ') || 'railway';

  // Menú de opciones
  console.log(`\n${colors.bright}🔧 Opciones de Migración${colors.reset}`);
  console.log('1. Exportar backup completo (estructura + datos)');
  console.log('2. Exportar solo datos (sin estructura)');
  console.log('3. Exportar tablas específicas');
  console.log('4. Importar backup existente a Railway');
  console.log('5. Verificar conexión a Railway');
  console.log('6. Contar registros en ambas bases de datos');
  console.log('7. Salir');

  const option = await question('\nSelecciona una opción (1-7): ');

  switch (option) {
    case '1':
      await exportFullBackup(localHost, localPort, localUser, localPassword, localDatabase);
      break;
    case '2':
      await exportDataOnly(localHost, localPort, localUser, localPassword, localDatabase);
      break;
    case '3':
      await exportSpecificTables(localHost, localPort, localUser, localPassword, localDatabase);
      break;
    case '4':
      await importToRailway(railwayHost, railwayPort, railwayUser, railwayPassword, railwayDatabase);
      break;
    case '5':
      await testRailwayConnection(railwayHost, railwayPort, railwayUser, railwayPassword, railwayDatabase);
      break;
    case '6':
      await compareRecordCounts(
        { host: localHost, port: localPort, user: localUser, password: localPassword, database: localDatabase },
        { host: railwayHost, port: railwayPort, user: railwayUser, password: railwayPassword, database: railwayDatabase }
      );
      break;
    case '7':
      console.log(`${colors.green}👋 ¡Hasta luego!${colors.reset}`);
      break;
    default:
      console.log(`${colors.red}❌ Opción inválida${colors.reset}`);
  }

  rl.close();
}

async function exportFullBackup(host: string, port: string, user: string, password: string, database: string) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `backup_complete_${timestamp}.sql`;
  const filepath = path.join('backups', filename);

  console.log(`\n${colors.cyan}📦 Exportando backup completo...${colors.reset}`);

  const command = `mysqldump -h ${host} -P ${port} -u ${user} ${password ? `-p${password}` : ''} --single-transaction --routines --triggers --events ${database} > ${filepath}`;

  try {
    await execAsync(command);
    const stats = fs.statSync(filepath);
    const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
    
    console.log(`${colors.green}✓ Backup creado exitosamente${colors.reset}`);
    console.log(`  Archivo: ${filepath}`);
    console.log(`  Tamaño: ${sizeInMB} MB`);
    
    // Comprimir el archivo
    console.log(`${colors.cyan}🗜️  Comprimiendo archivo...${colors.reset}`);
    await execAsync(`gzip -c ${filepath} > ${filepath}.gz`);
    const compressedStats = fs.statSync(`${filepath}.gz`);
    const compressedSizeInMB = (compressedStats.size / (1024 * 1024)).toFixed(2);
    console.log(`${colors.green}✓ Archivo comprimido: ${filepath}.gz (${compressedSizeInMB} MB)${colors.reset}`);
  } catch (error) {
    console.error(`${colors.red}❌ Error al crear backup: ${error}${colors.reset}`);
  }
}

async function exportDataOnly(host: string, port: string, user: string, password: string, database: string) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `backup_data_only_${timestamp}.sql`;
  const filepath = path.join('backups', filename);

  console.log(`\n${colors.cyan}📦 Exportando solo datos...${colors.reset}`);

  const command = `mysqldump -h ${host} -P ${port} -u ${user} ${password ? `-p${password}` : ''} --no-create-info --single-transaction ${database} > ${filepath}`;

  try {
    await execAsync(command);
    const stats = fs.statSync(filepath);
    const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
    
    console.log(`${colors.green}✓ Datos exportados exitosamente${colors.reset}`);
    console.log(`  Archivo: ${filepath}`);
    console.log(`  Tamaño: ${sizeInMB} MB`);
  } catch (error) {
    console.error(`${colors.red}❌ Error al exportar datos: ${error}${colors.reset}`);
  }
}

async function exportSpecificTables(host: string, port: string, user: string, password: string, database: string) {
  console.log(`\n${colors.bright}📋 Tablas disponibles:${colors.reset}`);
  
  // Mostrar tablas disponibles
  TABLES_ORDER.forEach((table, index) => {
    if (index % 3 === 0) console.log('');
    process.stdout.write(`${(index + 1).toString().padStart(2)}. ${table.padEnd(25)}`);
  });
  console.log('\n');

  const selection = await question('Ingresa los números de las tablas separados por comas (ej: 1,2,5,10): ');
  const indices = selection.split(',').map(s => parseInt(s.trim()) - 1);
  const selectedTables = indices.map(i => TABLES_ORDER[i]).filter(Boolean);

  if (selectedTables.length === 0) {
    console.log(`${colors.red}❌ No se seleccionaron tablas válidas${colors.reset}`);
    return;
  }

  console.log(`\n${colors.cyan}Tablas seleccionadas: ${selectedTables.join(', ')}${colors.reset}`);

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `backup_selected_${timestamp}.sql`;
  const filepath = path.join('backups', filename);

  const command = `mysqldump -h ${host} -P ${port} -u ${user} ${password ? `-p${password}` : ''} --single-transaction ${database} ${selectedTables.join(' ')} > ${filepath}`;

  try {
    await execAsync(command);
    const stats = fs.statSync(filepath);
    const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
    
    console.log(`${colors.green}✓ Tablas exportadas exitosamente${colors.reset}`);
    console.log(`  Archivo: ${filepath}`);
    console.log(`  Tamaño: ${sizeInMB} MB`);
  } catch (error) {
    console.error(`${colors.red}❌ Error al exportar tablas: ${error}${colors.reset}`);
  }
}

async function importToRailway(host: string, port: string, user: string, password: string, database: string) {
  console.log(`\n${colors.bright}📥 Importar a Railway${colors.reset}`);

  // Listar archivos de backup disponibles
  const backupDir = path.join(process.cwd(), 'backups');
  const files = fs.readdirSync(backupDir).filter(f => f.endsWith('.sql'));

  if (files.length === 0) {
    console.log(`${colors.red}❌ No se encontraron archivos de backup en ./backups${colors.reset}`);
    return;
  }

  console.log(`\n${colors.cyan}Archivos de backup disponibles:${colors.reset}`);
  files.forEach((file, index) => {
    const stats = fs.statSync(path.join(backupDir, file));
    const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
    console.log(`${index + 1}. ${file} (${sizeInMB} MB)`);
  });

  const fileIndex = await question('\nSelecciona el archivo a importar (número): ');
  const selectedFile = files[parseInt(fileIndex) - 1];

  if (!selectedFile) {
    console.log(`${colors.red}❌ Archivo no válido${colors.reset}`);
    return;
  }

  const filepath = path.join(backupDir, selectedFile);

  console.log(`\n${colors.yellow}⚠️  ADVERTENCIA: Esto sobrescribirá los datos en Railway${colors.reset}`);
  const confirm = await question('¿Estás seguro? (yes/no): ');

  if (confirm.toLowerCase() !== 'yes') {
    console.log(`${colors.yellow}Operación cancelada${colors.reset}`);
    return;
  }

  console.log(`\n${colors.cyan}🚀 Importando a Railway...${colors.reset}`);
  console.log(`  Host: ${host}:${port}`);
  console.log(`  Database: ${database}`);

  const command = `mysql -h ${host} -P ${port} -u ${user} ${password ? `-p${password}` : ''} ${database} < ${filepath}`;

  try {
    await execAsync(command);
    console.log(`${colors.green}✓ Datos importados exitosamente a Railway${colors.reset}`);
  } catch (error) {
    console.error(`${colors.red}❌ Error al importar: ${error}${colors.reset}`);
  }
}

async function testRailwayConnection(host: string, port: string, user: string, password: string, database: string) {
  console.log(`\n${colors.cyan}🔍 Probando conexión a Railway...${colors.reset}`);

  const command = `mysql -h ${host} -P ${port} -u ${user} ${password ? `-p${password}` : ''} ${database} -e "SELECT VERSION();"`;

  try {
    const { stdout } = await execAsync(command);
    console.log(`${colors.green}✓ Conexión exitosa${colors.reset}`);
    console.log(`  MySQL Version: ${stdout.trim()}`);
    console.log(`  Host: ${host}:${port}`);
    console.log(`  Database: ${database}`);
  } catch (error) {
    console.error(`${colors.red}❌ Error de conexión: ${error}${colors.reset}`);
  }
}

async function compareRecordCounts(local: any, railway: any) {
  console.log(`\n${colors.cyan}📊 Comparando registros entre bases de datos...${colors.reset}`);

  const getCount = async (config: any, table: string): Promise<number> => {
    try {
      const command = `mysql -h ${config.host} -P ${config.port} -u ${config.user} ${config.password ? `-p${config.password}` : ''} ${config.database} -e "SELECT COUNT(*) FROM ${table};" -s -N`;
      const { stdout } = await execAsync(command);
      return parseInt(stdout.trim()) || 0;
    } catch {
      return -1;
    }
  };

  console.log(`\n${'Tabla'.padEnd(30)} | ${'Local'.padEnd(10)} | ${'Railway'.padEnd(10)} | Estado`);
  console.log('-'.repeat(70));

  for (const table of TABLES_ORDER) {
    const localCount = await getCount(local, table);
    const railwayCount = await getCount(railway, table);

    let status = '';
    let statusColor = '';

    if (localCount === -1 || railwayCount === -1) {
      status = '⚠️  Error/No existe';
      statusColor = colors.yellow;
    } else if (localCount === railwayCount) {
      status = '✓ Sincronizado';
      statusColor = colors.green;
    } else {
      const diff = localCount - railwayCount;
      status = `❌ Diferencia: ${diff > 0 ? '+' : ''}${diff}`;
      statusColor = colors.red;
    }

    console.log(
      `${table.padEnd(30)} | ` +
      `${localCount >= 0 ? localCount.toString() : 'N/A'} | `.padEnd(12) +
      `${railwayCount >= 0 ? railwayCount.toString() : 'N/A'} | `.padEnd(12) +
      `${statusColor}${status}${colors.reset}`
    );
  }
}

// Ejecutar el script
main().catch(console.error);
