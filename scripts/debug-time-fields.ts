// scripts/debug-time-fields.ts
// Script para debuggear los campos TIME


import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { ventasDb } from '../src/lib/ventasDb';

async function debugTimeFields() {
  console.log('🔍 DEBUG: Campos TIME en tabla clients\n');
  console.log('='.repeat(60));
  
  // Verificar que tenemos las credenciales
  console.log('📌 Verificando conexión a RAMP...');
  console.log('   Host:', process.env.VENTAS_DB_HOST || 'NO DEFINIDO');
  console.log('   User:', process.env.VENTAS_DB_USER || 'NO DEFINIDO');
  console.log('   DB:', process.env.VENTAS_DB_NAME || 'NO DEFINIDO');
  console.log('');
  
  try {
    // Obtener algunos registros con problemas conocidos
    const problemIds = [19, 72, 83, 107, 125];
    
    for (const id of problemIds) {
      console.log(`\n📋 Cliente ID: ${id}`);
      console.log('-'.repeat(60));
      
      const result = await ventasDb.query(
        'SELECT id, name, working_time_start, working_time_end FROM clients WHERE id = ?',
        [id]
      );
      
      if (result.length > 0) {
        const record = result[0];
        console.log('Nombre:', record.name);
        console.log('working_time_start (raw):', record.working_time_start);
        console.log('working_time_start (tipo):', typeof record.working_time_start);
        console.log('working_time_start (constructor):', record.working_time_start?.constructor?.name);
        
        if (record.working_time_start) {
          // Intentar extraer manualmente
          const value = record.working_time_start;
          
          // Método 1: Si es string con regex
          if (typeof value === 'string') {
            const match = value.match(/(\d{2}:\d{2}:\d{2})/);
            if (match) {
              console.log('✅ Extracción con regex:', match[1]);
            } else {
              console.log('❌ No se pudo extraer con regex');
            }
          }
          
          // Método 2: Si es Date
          if (value instanceof Date) {
            const hours = value.getHours().toString().padStart(2, '0');
            const minutes = value.getMinutes().toString().padStart(2, '0');
            const seconds = value.getSeconds().toString().padStart(2, '0');
            console.log('✅ Extracción como Date:', `${hours}:${minutes}:${seconds}`);
          }
          
          // Método 3: Convertir a string y extraer
          const strValue = String(value);
          console.log('working_time_start (toString):', strValue);
          const match2 = strValue.match(/(\d{2}:\d{2}:\d{2})/);
          if (match2) {
            console.log('✅ Extracción de toString:', match2[1]);
          }
        }
      } else {
        console.log('⚠️  Registro no encontrado');
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('🔬 ANÁLISIS DE TIPOS DE DATOS');
    console.log('='.repeat(60));
    
    // Obtener la estructura de la tabla
    const describe = await ventasDb.query('DESCRIBE clients');
    const timeFields = describe.filter((f: any) => 
      f.Field === 'working_time_start' || f.Field === 'working_time_end'
    );
    
    console.log('\nTipo de datos en MySQL:');
    timeFields.forEach((field: any) => {
      console.log(`  ${field.Field}: ${field.Type}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await ventasDb.close();
    process.exit(0);
  }
}

debugTimeFields();