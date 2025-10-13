// src/services/sync/directSyncService.ts

import { ventasDb } from '@/lib/ventasDb';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

interface SyncConfig {
  tableName: string;
  primaryKey?: string;
  timestampField?: string;
  batchSize?: number;
}

interface SyncResult {
  success: boolean;
  tableName: string;
  recordsProcessed: number;
  recordsInserted: number;
  recordsUpdated: number;
  recordsSkipped: number;
  errors: number;
  duration: number;
  lastSyncTimestamp?: Date;
}

export class DirectSyncService {
  private generateHash(record: any): string {
    const str = JSON.stringify(record);
    return crypto.createHash('sha256').update(str).digest('hex');
  }

  /**
   * Convierte los datos de MySQL a formato Prisma
   */
  private async mapRecordToPrisma(tableName: string, record: any): Promise<any> {
    switch (tableName) {
      case 'clients':
        return {
          id: record.id,
          name: record.name,
          birthday: record.birthday,
          email: record.email,
          address: record.address,
          birthplace: record.birthplace,
          curp: record.curp,
          electorKey: record.elector_key,
          mobile: record.mobile,
          phone: record.phone,
          fLastname: record.f_lastname,
          mLastname: record.m_lastname,
          state: record.state,
          maritalStatus: record.marital_status,
          maritalRegistry: record.marital_registry,
          street: record.street,
          interiorNumber: record.interior_number,
          externalNumber: record.external_number,
          suburb: record.suburb,
          postalCode: record.postal_code,
          municipality: record.municipality,
          near: record.near,
          companyName: record.company_name,
          companyStreet: record.company_street,
          companyExternalNumber: record.company_external_number,
          companyInteriorNumber: record.company_interior_number,
          companySuburb: record.company_suburb,
          companyPostalCode: record.company_postal_code,
          companyPhone: record.company_phone,
          companyMunicipality: record.company_municipality,
          companyState: record.company_state,
          companyNear: record.company_near,
          companyMobile: record.company_mobile,
          job: record.job,
          antiquity: record.antiquity,
          monthlyIncome: record.monthly_income,
          additionalIncome: record.additional_income,
          fixedCosts: record.fixed_costs,
          bank: record.bank,
          gender: record.gender,
          affiliationNumber: record.affiliation_number,
          rfc: record.rfc,
          isRented: record.is_rented,
          timeRented: record.time_rented,
          monthlyRent: record.monthly_rent,
          birthState: record.birth_state,
          isForeign: record.is_foreign === 1,
          createdBy: record.created_by,
          workForeign: record.work_foreign === 1,
          companyRfc: record.company_rfc,
          businessName: record.business_name,
          adquisition: record.adquisition,
          companyBussiness: record.company_bussiness,
          maritalRegimen: record.marital_regimen,
          workingTimeStart: record.working_time_start,
          workingTimeEnd: record.working_time_end,
          location: record.location,
          credit: record.credit,
          creditType: record.credit_type,
          passport: record.passport,
          ineNumber: record.ine_number,
          user: record.user,
          createdAt: record.created_at,
          updatedAt: record.updated_at,
          companyBusiness: record.company_business,
          beneficiary: record.beneficiary,
          completionDate: record.completion_date,
          clientStatus: record.client_status,
          idmex: record.idmex,
          whatsappNumberId: record.whatsapp_number_id,
          whatsappRecipientNumber: record.whatsapp_recipient_number,
          messengerConversationId: record.messenger_conversation_id,
          messengerRecipientId: record.messenger_recipient_id,
          campaing: record.campaing,
          externalId: record.external_id,
          campaignFormDate: record.campaign_form_date,
          instagramId: record.instagram_id,
          lastContact: record.last_contact,
          changePhaseDate: record.change_phase_date,
          lastPhipipelinePhase: record.last_phipeline_phase,
          assignedAt: record.assigned_at,
          movePhaseBy: record.move_phase_by,
          nationality: record.nationality
        };
      
      default:
        // Para otras tablas, retornar tal cual
        return record;
    }
  }

  /**
   * Obtiene el modelo de Prisma según el nombre de la tabla
   */
  private getLocalModel(tableName: string): any {
    const modelMap: Record<string, any> = {
      clients: prisma.client,
      // Agregar más tablas aquí después
    };

    return modelMap[tableName];
  }

  /**
   * Sincroniza solo registros nuevos o modificados (incremental sync)
   */
  async syncTableIncremental(config: SyncConfig): Promise<SyncResult> {
    const { tableName, timestampField, primaryKey = 'id', batchSize = 1000 } = config;

    if (!timestampField) {
      throw new Error('Campo de timestamp requerido para sync incremental');
    }

    const startTime = Date.now();
    const result: SyncResult = {
      success: true,
      tableName,
      recordsProcessed: 0,
      recordsInserted: 0,
      recordsUpdated: 0,
      recordsSkipped: 0,
      errors: 0,
      duration: 0
    };

    try {
      console.log(`[SYNC] Iniciando sincronización incremental de ${tableName}`);

      // Obtener última sincronización exitosa
      const webhookConfig = await prisma.webhookConfig.findUnique({
        where: { tabla: tableName }
      });

      if (!webhookConfig) {
        throw new Error(`Configuración no encontrada para tabla: ${tableName}`);
      }

      const lastSync = webhookConfig.lastSyncAt;
      let sql: string;
      let params: any[];

      if (lastSync) {
        sql = `SELECT * FROM ${tableName} WHERE ${timestampField} > ? ORDER BY ${timestampField} ASC LIMIT ?`;
        params = [lastSync, batchSize];
        console.log(`[SYNC] Buscando registros modificados desde ${lastSync.toISOString()}`);
      } else {
        sql = `SELECT * FROM ${tableName} ORDER BY ${timestampField} ASC LIMIT ?`;
        params = [batchSize];
        console.log(`[SYNC] Primera sincronización - trayendo primeros ${batchSize} registros`);
      }

      const records = await ventasDb.query(sql, params);
      console.log(`[SYNC] Encontrados ${records.length} registros para sincronizar`);

      const localModel = this.getLocalModel(tableName);
      if (!localModel) {
        throw new Error(`Modelo local no encontrado para: ${tableName}`);
      }

      let lastTimestamp: Date | undefined;

      for (const record of records) {
        try {
          const externalId = record[primaryKey]?.toString();
          if (!externalId) {
            console.warn(`[SYNC] Registro sin ID, omitiendo:`, record);
            result.errors++;
            continue;
          }

          // Mapear datos al formato de Prisma
          const mappedData = await this.mapRecordToPrisma(tableName, record);

          // Buscar registro existente
          const existing = await localModel.findUnique({
            where: { id: parseInt(externalId) }
          });

          if (existing) {
            // Calcular hash para verificar cambios
            const existingHash = this.generateHash(existing);
            const newHash = this.generateHash(mappedData);

            if (existingHash !== newHash) {
              await localModel.update({
                where: { id: parseInt(externalId) },
                data: mappedData
              });
              result.recordsUpdated++;
              console.log(`[SYNC] ✓ Actualizado cliente ID: ${externalId}`);
            } else {
              result.recordsSkipped++;
            }
          } else {
            await localModel.create({
              data: mappedData
            });
            result.recordsInserted++;
            console.log(`[SYNC] + Insertado cliente ID: ${externalId}`);
          }

          result.recordsProcessed++;

          // Guardar último timestamp procesado
          if (record[timestampField]) {
            lastTimestamp = new Date(record[timestampField]);
          }

        } catch (error) {
          console.error(`[SYNC] ✗ Error procesando registro ${record[primaryKey]}:`, error);
          result.errors++;
        }
      }

      result.duration = Date.now() - startTime;
      result.lastSyncTimestamp = lastTimestamp;

      // Actualizar configuración
      await prisma.webhookConfig.update({
        where: { tabla: tableName },
        data: {
          lastSyncAt: lastTimestamp || new Date(),
          totalSyncs: { increment: 1 },
          successSyncs: result.errors === 0 ? { increment: 1 } : undefined,
          errorSyncs: result.errors > 0 ? { increment: 1 } : undefined,
          lastError: result.errors > 0 ? `${result.errors} errores durante sincronización` : null
        }
      });

      // Crear log
      await prisma.webhookSyncLog.create({
        data: {
          configId: webhookConfig.id,
          status: result.errors > 0 ? 'warning' : 'success',
          action: result.recordsInserted > 0 ? 'inserted' : 'updated',
          recordsReceived: result.recordsProcessed,
          recordsInserted: result.recordsInserted,
          recordsUpdated: result.recordsUpdated,
          recordsDuplicate: result.recordsSkipped,
          recordsErrors: result.errors,
          duration: result.duration,
          responseData: {
            type: 'incremental_sync',
            lastSyncTimestamp: lastTimestamp?.toISOString(),
            summary: {
              processed: result.recordsProcessed,
              inserted: result.recordsInserted,
              updated: result.recordsUpdated,
              skipped: result.recordsSkipped,
              errors: result.errors
            }
          }
        }
      });

      console.log(`[SYNC] ✓ Completado ${tableName} en ${result.duration}ms`);
      console.log(`[SYNC] Resumen: ${result.recordsInserted} nuevos, ${result.recordsUpdated} actualizados, ${result.recordsSkipped} sin cambios, ${result.errors} errores`);

      return result;

    } catch (error) {
      result.success = false;
      result.duration = Date.now() - startTime;
      
      console.error(`[SYNC] ✗ Error en sincronización incremental de ${tableName}:`, error);
      
      throw error;
    }
  }

  /**
   * Sincroniza una tabla completa (full sync)
   */
  async syncTableFull(config: SyncConfig): Promise<SyncResult> {
    const startTime = Date.now();
    const { tableName, primaryKey = 'id', batchSize = 1000 } = config;

    const result: SyncResult = {
      success: true,
      tableName,
      recordsProcessed: 0,
      recordsInserted: 0,
      recordsUpdated: 0,
      recordsSkipped: 0,
      errors: 0,
      duration: 0
    };

    try {
      console.log(`[SYNC] Iniciando sincronización completa de ${tableName}`);

      const webhookConfig = await prisma.webhookConfig.findUnique({
        where: { tabla: tableName }
      });

      if (!webhookConfig) {
        throw new Error(`Configuración no encontrada para tabla: ${tableName}`);
      }

      const localModel = this.getLocalModel(tableName);
      if (!localModel) {
        throw new Error(`Modelo local no encontrado para: ${tableName}`);
      }

      const totalRecords = await ventasDb.getRecordCount(tableName);
      console.log(`[SYNC] Total de registros en ${tableName}: ${totalRecords}`);

      let offset = 0;
      while (offset < totalRecords) {
        const sql = `SELECT * FROM ${tableName} LIMIT ${batchSize} OFFSET ${offset}`;
        const records = await ventasDb.query(sql);

        for (const record of records) {
          try {
            const externalId = record[primaryKey]?.toString();
            if (!externalId) {
              result.errors++;
              continue;
            }

            const mappedData = await this.mapRecordToPrisma(tableName, record);
            const existing = await localModel.findUnique({
              where: { id: parseInt(externalId) }
            });

            if (existing) {
              const existingHash = this.generateHash(existing);
              const newHash = this.generateHash(mappedData);

              if (existingHash !== newHash) {
                await localModel.update({
                  where: { id: parseInt(externalId) },
                  data: mappedData
                });
                result.recordsUpdated++;
              } else {
                result.recordsSkipped++;
              }
            } else {
              await localModel.create({
                data: mappedData
              });
              result.recordsInserted++;
            }

            result.recordsProcessed++;
          } catch (error) {
            console.error(`Error procesando registro ${record[primaryKey]}:`, error);
            result.errors++;
          }
        }

        offset += batchSize;
        console.log(`[SYNC] Procesados ${offset}/${totalRecords} registros de ${tableName}`);
      }

      result.duration = Date.now() - startTime;

      await prisma.webhookConfig.update({
        where: { tabla: tableName },
        data: {
          lastSyncAt: new Date(),
          totalSyncs: { increment: 1 },
          successSyncs: result.errors === 0 ? { increment: 1 } : undefined,
          errorSyncs: result.errors > 0 ? { increment: 1 } : undefined
        }
      });

      await prisma.webhookSyncLog.create({
        data: {
          configId: webhookConfig.id,
          status: result.errors > 0 ? 'warning' : 'success',
          action: 'inserted',
          recordsReceived: result.recordsProcessed,
          recordsInserted: result.recordsInserted,
          recordsUpdated: result.recordsUpdated,
          recordsDuplicate: result.recordsSkipped,
          recordsErrors: result.errors,
          duration: result.duration
        }
      });

      console.log(`[SYNC] Completado ${tableName} en ${result.duration}ms`);
      return result;

    } catch (error) {
      result.success = false;
      result.duration = Date.now() - startTime;
      throw error;
    }
  }

  async testConnection(): Promise<boolean> {
    return ventasDb.testConnection();
  }

  async getAvailableTables(): Promise<string[]> {
    return ventasDb.getTables();
  }
}

export const directSyncService = new DirectSyncService();