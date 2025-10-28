// scripts/init-webhook-configs.ts

import { prisma } from '@/lib/prisma';
import { RAMP_TABLES_CONFIG } from '@/config/sync-tables.config';

async function initWebhookConfigs() {
  console.log('🚀 Iniciando configuración de webhook_configs...\n');

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const config of RAMP_TABLES_CONFIG) {
    try {
      // Verificar si ya existe
      const existing = await prisma.webhookConfig.findUnique({
        where: { tabla: config.tableName }
      });

      if (existing) {
        // Si ya existe pero queremos actualizar algunos campos
        if (existing.nombre !== config.displayName || 
            existing.categoria !== config.categoria ||
            existing.icono !== config.icono ||
            existing.color !== config.color) {
          
          await prisma.webhookConfig.update({
            where: { tabla: config.tableName },
            data: {
              nombre: config.displayName,
              categoria: config.categoria,
              icono: config.icono,
              color: config.color,
              intervalMinutes: 30,
              metadata: {
                primaryKey: config.primaryKey,
                timestampField: config.timestampField,
                dependencies: config.dependencies,
                priority: config.priority,
                batchSize: config.batchSize,
                prismaModel: config.prismaModel
              }
            }
          });
          
          console.log(`✏️  Actualizado: ${config.tableName} (${config.displayName})`);
          updated++;
        } else {
          console.log(`⏭️  Omitido: ${config.tableName} (ya existe)`);
          skipped++;
        }
      } else {
        // Crear nueva configuración
        await prisma.webhookConfig.create({
          data: {
            tabla: config.tableName,
            nombre: config.displayName,
            categoria: config.categoria,
            icono: config.icono,
            color: config.color,
            isEnabled: config.enabled,
            intervalMinutes: 30,
            totalSyncs: 0,
            successSyncs: 0,
            errorSyncs: 0,
            metadata: {
              primaryKey: config.primaryKey,
              timestampField: config.timestampField,
              dependencies: config.dependencies,
              priority: config.priority,
              batchSize: config.batchSize,
              prismaModel: config.prismaModel
            }
          }
        });
        
        console.log(`✅ Creado: ${config.tableName} (${config.displayName})`);
        created++;
      }
    } catch (error) {
      console.error(`❌ Error con ${config.tableName}:`, error);
    }
  }

  console.log('\n📊 Resumen:');
  console.log(`   ✅ Creados: ${created}`);
  console.log(`   ✏️  Actualizados: ${updated}`);
  console.log(`   ⏭️  Omitidos: ${skipped}`);
  console.log(`   📋 Total procesados: ${created + updated + skipped}`);

  // Mostrar estado actual por categorías
  const allConfigs = await prisma.webhookConfig.findMany({
    orderBy: { categoria: 'asc' }
  });

  const categorias = new Map<string, number>();
  allConfigs.forEach(config => {
    categorias.set(config.categoria, (categorias.get(config.categoria) || 0) + 1);
  });

  console.log('\n📂 Tablas por categoría:');
  categorias.forEach((count, categoria) => {
    console.log(`   ${categoria}: ${count} tablas`);
  });

  console.log('\n✨ Configuración completada!');
}

// Función para verificar el estado de sincronización
async function checkSyncStatus() {
  console.log('\n🔍 Verificando estado de sincronización...\n');

  const configs = await prisma.webhookConfig.findMany({
    orderBy: [
      { categoria: 'asc' },
      { tabla: 'asc' }
    ]
  });

  // Agrupar por categoría
  const byCategory = new Map<string, typeof configs>();
  configs.forEach(config => {
    if (!byCategory.has(config.categoria)) {
      byCategory.set(config.categoria, []);
    }
    byCategory.get(config.categoria)!.push(config);
  });

  // Mostrar estado por categoría
  byCategory.forEach((categoryConfigs, categoria) => {
    console.log(`\n📁 ${categoria}:`);
    categoryConfigs.forEach(config => {
      const status = config.lastSyncAt 
        ? `✅ Sincronizado (${config.lastSyncAt.toLocaleDateString()})`
        : '⏳ Pendiente';
      const syncs = `${config.successSyncs}/${config.totalSyncs} exitosos`;
      console.log(`   ${config.icono} ${config.nombre}: ${status} - ${syncs}`);
    });
  });
}

// Función para resetear una tabla específica
async function resetTable(tableName: string) {
  const config = await prisma.webhookConfig.findUnique({
    where: { tabla: tableName }
  });

  if (!config) {
    console.error(`❌ Tabla ${tableName} no encontrada`);
    return;
  }

  await prisma.webhookConfig.update({
    where: { tabla: tableName },
    data: {
      lastSyncAt: null,
      totalSyncs: 0,
      successSyncs: 0,
      errorSyncs: 0,
      lastError: null
    }
  });

  console.log(`🔄 Reset completado para ${tableName}`);
}

// Función principal con CLI básico
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  try {
    switch (command) {
      case 'init':
        await initWebhookConfigs();
        break;
      
      case 'status':
        await checkSyncStatus();
        break;
      
      case 'reset':
        const tableName = args[1];
        if (tableName) {
          await resetTable(tableName);
        } else {
          console.error('❌ Especifica el nombre de la tabla: npm run init-webhooks reset [tabla]');
        }
        break;
      
      default:
        console.log('📚 Uso:');
        console.log('   npm run init-webhooks init    - Inicializar todas las configuraciones');
        console.log('   npm run init-webhooks status  - Ver estado de sincronización');
        console.log('   npm run init-webhooks reset [tabla] - Resetear una tabla específica');
        
        if (!command) {
          // Si no hay comando, ejecutar init por defecto
          await initWebhookConfigs();
        }
    }
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar si es llamado directamente
main();