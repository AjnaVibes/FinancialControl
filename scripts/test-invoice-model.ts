// scripts/test-invoice-model.ts
import { PrismaClient } from '@prisma/client';

async function testInvoiceModel() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Verificando modelo Invoice...');
    
    // Intentar crear un registro de prueba
    const testInvoice = await prisma.$executeRaw`
      INSERT INTO invoices (id, uuid, emisorNombre, emisorRfc, receptorNombre, receptorRfc, total, moneda, fecha, estado)
      VALUES (UUID(), 'TEST-UUID-123', 'Test Emisor', 'XAXX010101000', 'Test Receptor', 'XEXX010101000', 100.00, 'MXN', NOW(), 'PENDIENTE')
      ON DUPLICATE KEY UPDATE emisorNombre = emisorNombre
    `;
    
    console.log('✅ Tabla invoices existe y es accesible');
    
    // Limpiar el registro de prueba
    await prisma.$executeRaw`DELETE FROM invoices WHERE uuid = 'TEST-UUID-123'`;
    
    console.log('✅ Limpieza completada');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testInvoiceModel();
