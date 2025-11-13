import axios from 'axios';
import * as xml2js from 'xml2js';

const VS_CONTROL_URL = 'http://186.96.19.135:83/VSControlTotalWS/VSControlTotalWS.asmx';
const VS_CONTROL_NAMESPACE = 'http://localhost/';

export class VSControlService {
  private parser: xml2js.Parser;
  private builder: xml2js.Builder;
  private sessionToken: string | null = null;

  constructor() {
    this.parser = new xml2js.Parser({
      explicitArray: false,
      ignoreAttrs: true
    });
    this.builder = new xml2js.Builder();
  }

  /**
   * Construye el envelope SOAP
   */
  private buildSoapEnvelope(method: string, params: Record<string, any> = {}): string {
    const envelope = {
      'soap:Envelope': {
        $: {
          'xmlns:soap': 'http://schemas.xmlsoap.org/soap/envelope/',
          'xmlns:tem': VS_CONTROL_NAMESPACE
        },
        'soap:Body': {
          [`tem:${method}`]: params
        }
      }
    };
    return this.builder.buildObject(envelope);
  }

  /**
   * Ejecuta una llamada SOAP
   */
  private async executeSoapCall(method: string, params: Record<string, any> = {}): Promise<any> {
    try {
      const soapBody = this.buildSoapEnvelope(method, params);
      
      const response = await axios.post(VS_CONTROL_URL, soapBody, {
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'SOAPAction': `${VS_CONTROL_NAMESPACE}${method}`
        }
      });

      const result = await this.parser.parseStringPromise(response.data);
      const body = result['soap:Envelope']?.['soap:Body'] || result['Envelope']?.['Body'];
      
      if (!body) {
        throw new Error('Invalid SOAP response structure');
      }

      const responseKey = `${method}Response`;
      const resultKey = `${method}Result`;
      
      const methodResponse = body[responseKey];
      if (!methodResponse) {
        throw new Error(`Method ${method} response not found in SOAP response`);
      }

      return methodResponse[resultKey];
    } catch (error) {
      console.error(`Error executing SOAP call ${method}:`, error);
      throw error;
    }
  }

  /**
   * Inicia sesión en VS Control
   */
  async initSession(user: string, password: string, empresa: string): Promise<boolean> {
    try {
      const result = await this.executeSoapCall('API_InitSession', {
        'tem:usuario': user,
        'tem:password': password,
        'tem:empresa': empresa
      });

      if (result && result !== 'ERROR') {
        this.sessionToken = result;
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error initializing VS Control session:', error);
      return false;
    }
  }

  /**
   * Cierra la sesión
   */
  async closeSession(): Promise<void> {
    if (this.sessionToken) {
      await this.executeSoapCall('APP_CloseSession', {
        'tem:token': this.sessionToken
      });
      this.sessionToken = null;
    }
  }

  /**
   * Obtiene la lista de empresas
   */
  async getEmpresas(): Promise<any[]> {
    try {
      const result = await this.executeSoapCall('APP_LoadEmpresas');
      
      if (!result) return [];
      
      // Parsear el resultado XML si viene como string
      if (typeof result === 'string') {
        const parsed = await this.parser.parseStringPromise(result);
        return this.extractTableData(parsed);
      }
      
      return result;
    } catch (error) {
      console.error('Error getting empresas:', error);
      return [];
    }
  }

  /**
   * Obtiene lista de viviendas y estatus
   */
  async getViviendas(): Promise<any[]> {
    try {
      if (!this.sessionToken) {
        throw new Error('No active session');
      }

      const result = await this.executeSoapCall('API_GetListaViviendasyEstatus', {
        'tem:token': this.sessionToken
      });

      if (!result) return [];
      
      if (typeof result === 'string') {
        const parsed = await this.parser.parseStringPromise(result);
        return this.extractTableData(parsed);
      }
      
      return result;
    } catch (error) {
      console.error('Error getting viviendas:', error);
      return [];
    }
  }

  /**
   * Obtiene detalles de viviendas
   */
  async getViviendasDetalles(): Promise<any[]> {
    try {
      if (!this.sessionToken) {
        throw new Error('No active session');
      }

      const result = await this.executeSoapCall('API_GetViviendasDetalles', {
        'tem:token': this.sessionToken
      });

      if (!result) return [];
      
      if (typeof result === 'string') {
        const parsed = await this.parser.parseStringPromise(result);
        return this.extractTableData(parsed);
      }
      
      return result;
    } catch (error) {
      console.error('Error getting viviendas detalles:', error);
      return [];
    }
  }

  /**
   * Obtiene órdenes de compra
   */
  async getOrdenesCompra(): Promise<any[]> {
    try {
      if (!this.sessionToken) {
        throw new Error('No active session');
      }

      const result = await this.executeSoapCall('API_GetOrdenesDeCompra', {
        'tem:token': this.sessionToken
      });

      if (!result) return [];
      
      if (typeof result === 'string') {
        const parsed = await this.parser.parseStringPromise(result);
        return this.extractTableData(parsed);
      }
      
      return result;
    } catch (error) {
      console.error('Error getting órdenes de compra:', error);
      return [];
    }
  }

  /**
   * Obtiene control de documentos
   */
  async getControlDocumentos(): Promise<any[]> {
    try {
      if (!this.sessionToken) {
        throw new Error('No active session');
      }

      const result = await this.executeSoapCall('API_GetControlDocumentos', {
        'tem:token': this.sessionToken
      });

      if (!result) return [];
      
      if (typeof result === 'string') {
        const parsed = await this.parser.parseStringPromise(result);
        return this.extractTableData(parsed);
      }
      
      return result;
    } catch (error) {
      console.error('Error getting control documentos:', error);
      return [];
    }
  }

  /**
   * Obtiene información de clientes y viviendas
   */
  async getClienteVivienda(): Promise<any[]> {
    try {
      if (!this.sessionToken) {
        throw new Error('No active session');
      }

      const result = await this.executeSoapCall('APP_Get_ClienteVivienda', {
        'tem:token': this.sessionToken
      });

      if (!result) return [];
      
      if (typeof result === 'string') {
        const parsed = await this.parser.parseStringPromise(result);
        return this.extractTableData(parsed);
      }
      
      return result;
    } catch (error) {
      console.error('Error getting cliente vivienda:', error);
      return [];
    }
  }

  /**
   * Extrae datos de tabla desde XML parseado
   */
  private extractTableData(parsed: any): any[] {
    try {
      // Buscar la estructura de NewDataSet o Table
      if (parsed.NewDataSet) {
        const table = parsed.NewDataSet.Table;
        return Array.isArray(table) ? table : [table].filter(Boolean);
      }
      
      if (parsed.DocumentElement) {
        const data = parsed.DocumentElement.Table || parsed.DocumentElement;
        return Array.isArray(data) ? data : [data].filter(Boolean);
      }
      
      // Si es un array directo
      if (Array.isArray(parsed)) {
        return parsed;
      }
      
      // Si es un objeto con Table
      if (parsed.Table) {
        return Array.isArray(parsed.Table) ? parsed.Table : [parsed.Table].filter(Boolean);
      }
      
      return [];
    } catch (error) {
      console.error('Error extracting table data:', error);
      return [];
    }
  }

  /**
   * Obtiene el esquema de todas las tablas disponibles
   */
  async getAllTablesSchema(): Promise<Record<string, any[]>> {
    const schema: Record<string, any[]> = {};
    
    try {
      // Intentar obtener datos de cada tabla principal
      console.log('Obteniendo esquema de tablas de VS Control...');
      
      // Empresas (no requiere sesión)
      const empresas = await this.getEmpresas();
      if (empresas.length > 0) {
        schema['Empresas'] = this.extractSchema(empresas[0]);
      }
      
      // Iniciar sesión para obtener el resto de tablas
      // Necesitaríamos credenciales reales aquí
      // Por ahora, documentamos la estructura esperada
      
      return schema;
    } catch (error) {
      console.error('Error getting tables schema:', error);
      return schema;
    }
  }

  /**
   * Extrae el esquema de un objeto
   */
  private extractSchema(obj: any): any[] {
    if (!obj) return [];
    
    return Object.keys(obj).map(key => ({
      column: key,
      type: this.inferType(obj[key]),
      nullable: obj[key] === null || obj[key] === undefined,
      value: obj[key]
    }));
  }

  /**
   * Infiere el tipo de dato
   */
  private inferType(value: any): string {
    if (value === null || value === undefined) return 'unknown';
    if (typeof value === 'number') return 'number';
    if (typeof value === 'boolean') return 'boolean';
    if (typeof value === 'string') {
      if (/^\d{4}-\d{2}-\d{2}/.test(value)) return 'datetime';
      if (/^\d+$/.test(value)) return 'number';
      return 'string';
    }
    return 'unknown';
  }
}

export default VSControlService;
