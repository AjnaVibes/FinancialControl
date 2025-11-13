import { PrismaClient } from '@prisma/client';
import VSControlService from './vsControlService';

interface VSControlCredentials {
  usuario: string;
  password: string;
  empresa: string;
}

interface SyncResult {
  tabla: string;
  registrosSincronizados: number;
  registrosNuevos: number;
  registrosActualizados: number;
  errores: number;
  mensaje?: string;
}

export class VSControlSyncService {
  private prisma: PrismaClient;
  private vsControl: VSControlService;
  private credentials: VSControlCredentials | null = null;

  constructor() {
    this.prisma = new PrismaClient();
    this.vsControl = new VSControlService();
  }

  /**
   * Configura las credenciales de VS Control
   */
  setCredentials(credentials: VSControlCredentials) {
    this.credentials = credentials;
  }

  /**
   * Inicia sesión en VS Control
   */
  private async initSession(): Promise<boolean> {
    if (!this.credentials) {
      throw new Error('Credenciales no configuradas');
    }

    return await this.vsControl.initSession(
      this.credentials.usuario,
      this.credentials.password,
      this.credentials.empresa
    );
  }

  /**
   * Sincroniza todas las tablas de VS Control
   */
  async syncAll(): Promise<SyncResult[]> {
    const results: SyncResult[] = [];
    
    try {
      // Iniciar sesión
      const sessionOk = await this.initSession();
      if (!sessionOk) {
        throw new Error('No se pudo iniciar sesión en VS Control');
      }

      // Sincronizar cada tabla
      results.push(await this.syncEmpresas());
      results.push(await this.syncProyectos());
      results.push(await this.syncClientes());
      results.push(await this.syncViviendas());
      results.push(await this.syncClienteVivienda());
      results.push(await this.syncAvancesFisicos());
      results.push(await this.syncOrdenesCompra());
      results.push(await this.syncControlDocumentos());

      // Cerrar sesión
      await this.vsControl.closeSession();

    } catch (error) {
      console.error('Error en sincronización de VS Control:', error);
      await this.vsControl.closeSession();
      throw error;
    }

    return results;
  }

  /**
   * Sincroniza la tabla de Empresas
   */
  async syncEmpresas(): Promise<SyncResult> {
    const result: SyncResult = {
      tabla: 'VSC_Empresas',
      registrosSincronizados: 0,
      registrosNuevos: 0,
      registrosActualizados: 0,
      errores: 0
    };

    try {
      const empresas = await this.vsControl.getEmpresas();
      
      for (const empresa of empresas) {
        try {
          // Buscar si ya existe
          const existing = await (this.prisma as any).vSC_Empresas.findFirst({
            where: { nombre: empresa.nombre }
          });

          if (!existing) {
            // Crear nuevo
            await (this.prisma as any).vSC_Empresas.create({
              data: {
                nombre: empresa.nombre || '',
                rfc: empresa.rfc,
                direccion: empresa.direccion,
                telefono: empresa.telefono,
                activo: empresa.activo !== false
              }
            });
            result.registrosNuevos++;
          } else {
            // Actualizar existente
            await (this.prisma as any).vSC_Empresas.update({
              where: { id_empresa: existing.id_empresa },
              data: {
                rfc: empresa.rfc,
                direccion: empresa.direccion,
                telefono: empresa.telefono,
                activo: empresa.activo !== false
              }
            });
            result.registrosActualizados++;
          }
          
          result.registrosSincronizados++;
        } catch (error) {
          console.error(`Error sincronizando empresa ${empresa.nombre}:`, error);
          result.errores++;
        }
      }
    } catch (error) {
      console.error('Error obteniendo empresas:', error);
      result.mensaje = 'Error al obtener datos de VS Control';
    }

    return result;
  }

  /**
   * Sincroniza la tabla de Proyectos
   */
  async syncProyectos(): Promise<SyncResult> {
    const result: SyncResult = {
      tabla: 'VSC_Proyectos',
      registrosSincronizados: 0,
      registrosNuevos: 0,
      registrosActualizados: 0,
      errores: 0
    };

    // Por ahora retornamos resultado vacío ya que necesitaríamos
    // implementar el método en VSControlService
    result.mensaje = 'Pendiente de implementación';
    return result;
  }

  /**
   * Sincroniza la tabla de Clientes
   */
  async syncClientes(): Promise<SyncResult> {
    const result: SyncResult = {
      tabla: 'VSC_Clientes',
      registrosSincronizados: 0,
      registrosNuevos: 0,
      registrosActualizados: 0,
      errores: 0
    };

    try {
      // Aquí iría la lógica para obtener clientes desde VS Control
      // Por ahora lo dejamos pendiente
      result.mensaje = 'Pendiente de implementación';
    } catch (error) {
      console.error('Error sincronizando clientes:', error);
      result.mensaje = 'Error al sincronizar clientes';
    }

    return result;
  }

  /**
   * Sincroniza la tabla de Viviendas
   */
  async syncViviendas(): Promise<SyncResult> {
    const result: SyncResult = {
      tabla: 'VSC_Viviendas',
      registrosSincronizados: 0,
      registrosNuevos: 0,
      registrosActualizados: 0,
      errores: 0
    };

    try {
      const viviendas = await this.vsControl.getViviendas();
      
      for (const vivienda of viviendas) {
        try {
          // Buscar si ya existe por número de vivienda
          const existing = await (this.prisma as any).vSC_Viviendas.findFirst({
            where: { 
              numero_vivienda: vivienda.numero_vivienda,
              id_proyecto: vivienda.id_proyecto
            }
          });

          const data = {
            id_proyecto: vivienda.id_proyecto || 0,
            numero_vivienda: vivienda.numero_vivienda || '',
            manzana: vivienda.manzana,
            lote: vivienda.lote,
            prototipo: vivienda.prototipo,
            estatus: vivienda.estatus,
            superficie_terreno: vivienda.superficie_terreno ? parseFloat(vivienda.superficie_terreno) : null,
            superficie_construccion: vivienda.superficie_construccion ? parseFloat(vivienda.superficie_construccion) : null,
            precio_venta: vivienda.precio_venta ? parseFloat(vivienda.precio_venta) : null,
            fecha_inicio: vivienda.fecha_inicio ? new Date(vivienda.fecha_inicio) : null,
            fecha_terminacion: vivienda.fecha_terminacion ? new Date(vivienda.fecha_terminacion) : null,
            observaciones: vivienda.observaciones
          };

          if (!existing) {
            await (this.prisma as any).vSC_Viviendas.create({ data });
            result.registrosNuevos++;
          } else {
            await (this.prisma as any).vSC_Viviendas.update({
              where: { id_vivienda: existing.id_vivienda },
              data
            });
            result.registrosActualizados++;
          }
          
          result.registrosSincronizados++;
        } catch (error) {
          console.error(`Error sincronizando vivienda ${vivienda.numero_vivienda}:`, error);
          result.errores++;
        }
      }
    } catch (error) {
      console.error('Error obteniendo viviendas:', error);
      result.mensaje = 'Error al obtener viviendas de VS Control';
    }

    return result;
  }

  /**
   * Sincroniza la tabla de Cliente-Vivienda
   */
  async syncClienteVivienda(): Promise<SyncResult> {
    const result: SyncResult = {
      tabla: 'VSC_ClienteVivienda',
      registrosSincronizados: 0,
      registrosNuevos: 0,
      registrosActualizados: 0,
      errores: 0
    };

    try {
      const clienteViviendas = await this.vsControl.getClienteVivienda();
      
      for (const cv of clienteViviendas) {
        try {
          // Buscar si ya existe la relación
          const existing = await (this.prisma as any).vSC_ClienteVivienda.findFirst({
            where: { 
              id_cliente: cv.id_cliente,
              id_vivienda: cv.id_vivienda
            }
          });

          const data = {
            id_cliente: cv.id_cliente || 0,
            id_vivienda: cv.id_vivienda || 0,
            fecha_asignacion: cv.fecha_asignacion ? new Date(cv.fecha_asignacion) : new Date(),
            tipo_operacion: cv.tipo_operacion,
            monto_operacion: cv.monto_operacion ? parseFloat(cv.monto_operacion) : null,
            estatus: cv.estatus
          };

          if (!existing) {
            await (this.prisma as any).vSC_ClienteVivienda.create({ data });
            result.registrosNuevos++;
          } else {
            await (this.prisma as any).vSC_ClienteVivienda.update({
              where: { id: existing.id },
              data
            });
            result.registrosActualizados++;
          }
          
          result.registrosSincronizados++;
        } catch (error) {
          console.error(`Error sincronizando cliente-vivienda:`, error);
          result.errores++;
        }
      }
    } catch (error) {
      console.error('Error obteniendo cliente-vivienda:', error);
      result.mensaje = 'Error al obtener relaciones cliente-vivienda';
    }

    return result;
  }

  /**
   * Sincroniza la tabla de Avances Físicos
   */
  async syncAvancesFisicos(): Promise<SyncResult> {
    const result: SyncResult = {
      tabla: 'VSC_AvancesFisicos',
      registrosSincronizados: 0,
      registrosNuevos: 0,
      registrosActualizados: 0,
      errores: 0
    };

    // Por ahora retornamos resultado vacío
    result.mensaje = 'Pendiente de implementación';
    return result;
  }

  /**
   * Sincroniza la tabla de Órdenes de Compra
   */
  async syncOrdenesCompra(): Promise<SyncResult> {
    const result: SyncResult = {
      tabla: 'VSC_OrdenesCompra',
      registrosSincronizados: 0,
      registrosNuevos: 0,
      registrosActualizados: 0,
      errores: 0
    };

    try {
      const ordenes = await this.vsControl.getOrdenesCompra();
      
      for (const orden of ordenes) {
        try {
          // Buscar si ya existe por número de orden
          const existing = await (this.prisma as any).vSC_OrdenesCompra.findFirst({
            where: { numero_orden: orden.numero_orden }
          });

          const data = {
            numero_orden: orden.numero_orden || '',
            fecha_orden: orden.fecha_orden ? new Date(orden.fecha_orden) : new Date(),
            proveedor: orden.proveedor,
            monto_total: orden.monto_total ? parseFloat(orden.monto_total) : null,
            estatus: orden.estatus,
            observaciones: orden.observaciones
          };

          if (!existing) {
            await (this.prisma as any).vSC_OrdenesCompra.create({ data });
            result.registrosNuevos++;
          } else {
            await (this.prisma as any).vSC_OrdenesCompra.update({
              where: { id_orden: existing.id_orden },
              data
            });
            result.registrosActualizados++;
          }
          
          result.registrosSincronizados++;
        } catch (error) {
          console.error(`Error sincronizando orden ${orden.numero_orden}:`, error);
          result.errores++;
        }
      }
    } catch (error) {
      console.error('Error obteniendo órdenes de compra:', error);
      result.mensaje = 'Error al obtener órdenes de compra';
    }

    return result;
  }

  /**
   * Sincroniza la tabla de Control de Documentos
   */
  async syncControlDocumentos(): Promise<SyncResult> {
    const result: SyncResult = {
      tabla: 'VSC_ControlDocumentos',
      registrosSincronizados: 0,
      registrosNuevos: 0,
      registrosActualizados: 0,
      errores: 0
    };

    try {
      const documentos = await this.vsControl.getControlDocumentos();
      
      for (const doc of documentos) {
        try {
          // Buscar si ya existe
          const existing = await (this.prisma as any).vSC_ControlDocumentos.findFirst({
            where: { 
              numero_documento: doc.numero_documento,
              tipo_documento: doc.tipo_documento
            }
          });

          const data = {
            id_vivienda: doc.id_vivienda ? parseInt(doc.id_vivienda) : null,
            id_cliente: doc.id_cliente ? parseInt(doc.id_cliente) : null,
            tipo_documento: doc.tipo_documento || '',
            numero_documento: doc.numero_documento,
            fecha_documento: doc.fecha_documento ? new Date(doc.fecha_documento) : null,
            fecha_vencimiento: doc.fecha_vencimiento ? new Date(doc.fecha_vencimiento) : null,
            estatus: doc.estatus,
            ruta_archivo: doc.ruta_archivo,
            observaciones: doc.observaciones
          };

          if (!existing) {
            await (this.prisma as any).vSC_ControlDocumentos.create({ data });
            result.registrosNuevos++;
          } else {
            await (this.prisma as any).vSC_ControlDocumentos.update({
              where: { id_documento: existing.id_documento },
              data
            });
            result.registrosActualizados++;
          }
          
          result.registrosSincronizados++;
        } catch (error) {
          console.error(`Error sincronizando documento ${doc.numero_documento}:`, error);
          result.errores++;
        }
      }
    } catch (error) {
      console.error('Error obteniendo control de documentos:', error);
      result.mensaje = 'Error al obtener control de documentos';
    }

    return result;
  }

  /**
   * Cierra la conexión con Prisma
   */
  async disconnect() {
    await this.prisma.$disconnect();
  }
}

export default VSControlSyncService;
