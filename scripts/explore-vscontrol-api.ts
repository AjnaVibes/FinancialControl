import VSControlService from '../src/services/vscontrol/vsControlService';
import * as fs from 'fs';
import * as path from 'path';

async function exploreVSControlAPI() {
  const service = new VSControlService();
  const schema: Record<string, any> = {};
  
  console.log('🔍 Explorando API de VS Control...\n');
  
  try {
    // 1. Obtener lista de empresas (no requiere sesión)
    console.log('📊 Obteniendo lista de empresas...');
    const empresas = await service.getEmpresas();
    
    if (empresas.length > 0) {
      console.log(`✅ Encontradas ${empresas.length} empresas`);
      console.log('Estructura de datos de Empresa:', JSON.stringify(empresas[0], null, 2));
      schema.Empresas = extractSchemaFromData(empresas);
    } else {
      console.log('⚠️ No se encontraron empresas');
    }
    
    // Para obtener más tablas necesitamos credenciales
    // Aquí documentamos la estructura esperada basada en los métodos disponibles
    
    console.log('\n📋 Métodos disponibles en la API que requieren autenticación:');
    const availableMethods = [
      { method: 'API_GetListaViviendasyEstatus', description: 'Lista de viviendas y estatus' },
      { method: 'API_GetViviendasDetalles', description: 'Detalles completos de viviendas' },
      { method: 'API_GetOrdenesDeCompra', description: 'Órdenes de compra' },
      { method: 'API_GetControlDocumentos', description: 'Control de documentos' },
      { method: 'APP_Get_ClienteVivienda', description: 'Información de clientes y viviendas' },
      { method: 'APP_GetAvancesFisicos', description: 'Avances físicos de obra' },
      { method: 'APP_GetPresupuestosObra', description: 'Presupuestos de obra' },
      { method: 'APP_GetPromociones', description: 'Promociones' },
      { method: 'APP_GetPromotor', description: 'Información de promotores' }
    ];
    
    availableMethods.forEach(m => {
      console.log(`  - ${m.method}: ${m.description}`);
    });
    
    // Generar esquema basado en los métodos conocidos
    const expectedSchema = generateExpectedSchema();
    
    // Guardar el esquema en un archivo
    const outputPath = path.join(process.cwd(), 'vscontrol-schema.json');
    fs.writeFileSync(outputPath, JSON.stringify({
      discovered: schema,
      expected: expectedSchema,
      apiMethods: availableMethods
    }, null, 2));
    
    console.log(`\n✅ Esquema guardado en: ${outputPath}`);
    
    // Generar prisma schema
    console.log('\n📝 Generando Prisma Schema para VS Control...');
    const prismaSchema = generatePrismaSchema(expectedSchema);
    
    const prismaPath = path.join(process.cwd(), 'vscontrol-prisma-schema.txt');
    fs.writeFileSync(prismaPath, prismaSchema);
    
    console.log(`✅ Prisma Schema guardado en: ${prismaPath}`);
    
  } catch (error) {
    console.error('❌ Error explorando API:', error);
  }
}

function extractSchemaFromData(data: any[]): any {
  if (!data || data.length === 0) return {};
  
  const sample = data[0];
  const schema: any = {};
  
  for (const [key, value] of Object.entries(sample)) {
    schema[key] = {
      type: inferType(value),
      nullable: value === null,
      sampleValue: value
    };
  }
  
  return schema;
}

function inferType(value: any): string {
  if (value === null || value === undefined) return 'String?';
  if (typeof value === 'number') {
    return Number.isInteger(value) ? 'Int' : 'Float';
  }
  if (typeof value === 'boolean') return 'Boolean';
  if (typeof value === 'string') {
    if (/^\d{4}-\d{2}-\d{2}/.test(value)) return 'DateTime';
    if (/^\d+$/.test(value)) return 'String'; // IDs como strings
    return 'String';
  }
  return 'String';
}

function generateExpectedSchema(): Record<string, any> {
  return {
    // Tabla de Empresas
    VSC_Empresas: {
      id_empresa: { type: 'Int', nullable: false, isPrimary: true },
      nombre: { type: 'String', nullable: false },
      rfc: { type: 'String', nullable: true },
      direccion: { type: 'String', nullable: true },
      telefono: { type: 'String', nullable: true },
      activo: { type: 'Boolean', nullable: false, default: true }
    },
    
    // Tabla de Viviendas
    VSC_Viviendas: {
      id_vivienda: { type: 'Int', nullable: false, isPrimary: true },
      id_proyecto: { type: 'Int', nullable: false },
      numero_vivienda: { type: 'String', nullable: false },
      manzana: { type: 'String', nullable: true },
      lote: { type: 'String', nullable: true },
      prototipo: { type: 'String', nullable: true },
      estatus: { type: 'String', nullable: true },
      superficie_terreno: { type: 'Float', nullable: true },
      superficie_construccion: { type: 'Float', nullable: true },
      precio_venta: { type: 'Float', nullable: true },
      fecha_inicio: { type: 'DateTime', nullable: true },
      fecha_terminacion: { type: 'DateTime', nullable: true },
      observaciones: { type: 'String', nullable: true }
    },
    
    // Tabla de Clientes
    VSC_Clientes: {
      id_cliente: { type: 'Int', nullable: false, isPrimary: true },
      nombre: { type: 'String', nullable: false },
      apellido_paterno: { type: 'String', nullable: true },
      apellido_materno: { type: 'String', nullable: true },
      rfc: { type: 'String', nullable: true },
      curp: { type: 'String', nullable: true },
      telefono: { type: 'String', nullable: true },
      celular: { type: 'String', nullable: true },
      email: { type: 'String', nullable: true },
      direccion: { type: 'String', nullable: true },
      fecha_registro: { type: 'DateTime', nullable: false, default: 'now()' }
    },
    
    // Tabla de Cliente-Vivienda (relación)
    VSC_ClienteVivienda: {
      id: { type: 'Int', nullable: false, isPrimary: true },
      id_cliente: { type: 'Int', nullable: false },
      id_vivienda: { type: 'Int', nullable: false },
      fecha_asignacion: { type: 'DateTime', nullable: false },
      tipo_operacion: { type: 'String', nullable: true },
      monto_operacion: { type: 'Float', nullable: true },
      estatus: { type: 'String', nullable: true }
    },
    
    // Tabla de Avances Físicos
    VSC_AvancesFisicos: {
      id_avance: { type: 'Int', nullable: false, isPrimary: true },
      id_vivienda: { type: 'Int', nullable: false },
      fecha_avance: { type: 'DateTime', nullable: false },
      porcentaje_avance: { type: 'Float', nullable: false },
      descripcion: { type: 'String', nullable: true },
      observaciones: { type: 'String', nullable: true },
      usuario_registro: { type: 'String', nullable: true }
    },
    
    // Tabla de Órdenes de Compra
    VSC_OrdenesCompra: {
      id_orden: { type: 'Int', nullable: false, isPrimary: true },
      numero_orden: { type: 'String', nullable: false },
      fecha_orden: { type: 'DateTime', nullable: false },
      proveedor: { type: 'String', nullable: true },
      monto_total: { type: 'Float', nullable: true },
      estatus: { type: 'String', nullable: true },
      observaciones: { type: 'String', nullable: true }
    },
    
    // Tabla de Control de Documentos
    VSC_ControlDocumentos: {
      id_documento: { type: 'Int', nullable: false, isPrimary: true },
      id_vivienda: { type: 'Int', nullable: true },
      id_cliente: { type: 'Int', nullable: true },
      tipo_documento: { type: 'String', nullable: false },
      numero_documento: { type: 'String', nullable: true },
      fecha_documento: { type: 'DateTime', nullable: true },
      fecha_vencimiento: { type: 'DateTime', nullable: true },
      estatus: { type: 'String', nullable: true },
      ruta_archivo: { type: 'String', nullable: true },
      observaciones: { type: 'String', nullable: true }
    },
    
    // Tabla de Proyectos/Desarrollos
    VSC_Proyectos: {
      id_proyecto: { type: 'Int', nullable: false, isPrimary: true },
      nombre: { type: 'String', nullable: false },
      descripcion: { type: 'String', nullable: true },
      ubicacion: { type: 'String', nullable: true },
      fecha_inicio: { type: 'DateTime', nullable: true },
      fecha_fin_estimada: { type: 'DateTime', nullable: true },
      total_viviendas: { type: 'Int', nullable: true },
      estatus: { type: 'String', nullable: true }
    }
  };
}

function generatePrismaSchema(schema: Record<string, any>): string {
  let prismaSchema = `// Esquema de Prisma para VS Control
// Generado automáticamente desde la API de VS Control

`;

  for (const [tableName, fields] of Object.entries(schema)) {
    const modelName = tableName.replace('VSC_', '');
    prismaSchema += `model ${tableName} {\n`;
    
    for (const [fieldName, fieldConfig] of Object.entries(fields as any)) {
      const config = fieldConfig as any;
      let fieldLine = `  ${fieldName} `;
      
      // Tipo de dato
      fieldLine += config.type;
      if (config.nullable && !config.isPrimary) {
        fieldLine += '?';
      }
      
      // Atributos especiales
      if (config.isPrimary) {
        fieldLine += ' @id';
        if (config.type === 'Int') {
          fieldLine += ' @default(autoincrement())';
        }
      }
      
      if (config.default === 'now()') {
        fieldLine += ' @default(now())';
      } else if (config.default !== undefined && config.default !== null) {
        fieldLine += ` @default(${config.default})`;
      }
      
      // Mapeo de columnas si es necesario
      if (fieldName.includes('_')) {
        fieldLine += ` @map("${fieldName}")`;
      }
      
      prismaSchema += fieldLine + '\n';
    }
    
    // Agregar metadata de la tabla
    prismaSchema += '\n';
    prismaSchema += `  @@map("${tableName}")\n`;
    prismaSchema += '}\n\n';
  }
  
  return prismaSchema;
}

// Ejecutar el script
exploreVSControlAPI().catch(console.error);
