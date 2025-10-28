// src/lib/ventasDb.ts
import mysql from 'mysql2/promise';

class VentasDBClient {
  private pool: mysql.Pool | null = null;

  private getConfig(): mysql.PoolOptions {
    return {
      host: process.env.VENTAS_DB_HOST || 'localhost',
      port: parseInt(process.env.VENTAS_DB_PORT || '3306'),
      user: process.env.VENTAS_DB_USER || 'root',
      password: process.env.VENTAS_DB_PASSWORD || '',
      database: process.env.VENTAS_DB_NAME || 'ventas',
      ssl: process.env.VENTAS_DB_SSL === 'true' ? {
        rejectUnauthorized: false
      } : undefined,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
      timezone: 'Z'
    };
  }

  getPool(): mysql.Pool {
    if (!this.pool) {
      this.pool = mysql.createPool(this.getConfig());
    }
    return this.pool;
  }

  async query<T = any>(sql: string, params?: any[]): Promise<T[]> {
    try {
      const pool = this.getPool();
      const [rows] = await pool.execute(sql, params);
      return rows as T[];
    } catch (error) {
      console.error('[VentasDB] Error en query:', error);
      throw error;
    }
  }

  async queryOne<T = any>(sql: string, params?: any[]): Promise<T | null> {
    const results = await this.query<T>(sql, params);
    return results[0] || null;
  }

  async testConnection(): Promise<boolean> {
    try {
      const pool = this.getPool();
      const connection = await pool.getConnection();
      await connection.ping();
      connection.release();
      console.log('[VentasDB] ✓ Conexión exitosa');
      return true;
    } catch (error) {
      console.error('[VentasDB] ✗ Error al conectar:', error);
      return false;
    }
  }

 async getRecordCount(tableName: string): Promise<number> {
  const sql = `SELECT COUNT(*) as count FROM \`${tableName}\``;
  const result = await this.queryOne<{ count: number }>(sql);
  return result?.count || 0;
}

  async getTables(): Promise<string[]> {
    const sql = `
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = ?
      ORDER BY TABLE_NAME
    `;
    
    const results = await this.query<{ TABLE_NAME: string }>(
      sql, 
      [process.env.VENTAS_DB_NAME]
    );
    
    return results.map(r => r.TABLE_NAME);
  }

  async close() {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
    }
  }
}

export const ventasDb = new VentasDBClient();