import { Pool } from 'pg';
import type { EncryptedData, StoreEncryptedResponse, FetchEncryptedResponse } from '../types';
import { generateDataId } from '../utils/id-generator';

export class StorageService {
  private pool: Pool;

  constructor(databaseUrl: string) {
    this.pool = new Pool({
      connectionString: databaseUrl,
      ssl: { rejectUnauthorized: false },
      max: 10,
    });
  }

  async storeData(
    userId: string,
    encryptedData: EncryptedData,
    metadata?: Record<string, unknown>,
  ): Promise<StoreEncryptedResponse> {
    const dataId = generateDataId();
    const storedAt = Date.now();

    await this.pool.query(
      `INSERT INTO encrypted_data (data_id, user_id, encrypted_data, metadata, stored_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [dataId, userId, JSON.stringify(encryptedData), metadata ? JSON.stringify(metadata) : null, storedAt],
    );

    return { dataId, storedAt, status: 'success' };
  }

  async fetchData(dataId: string, userId: string): Promise<FetchEncryptedResponse> {
    const result = await this.pool.query(
      `SELECT user_id, encrypted_data, metadata, stored_at FROM encrypted_data WHERE data_id = $1`,
      [dataId],
    );

    if (result.rows.length === 0) {
      throw new ServiceError('Data not found', 'NOT_FOUND', 404);
    }

    const row = result.rows[0];

    if (row.user_id !== userId) {
      throw new ServiceError('Access denied', 'FORBIDDEN', 403);
    }

    return {
      encryptedData: row.encrypted_data,
      metadata: row.metadata ?? undefined,
      storedAt: Number(row.stored_at),
    };
  }

  async deleteData(dataId: string, userId: string): Promise<void> {
    // Check ownership first
    const check = await this.pool.query(
      `SELECT user_id FROM encrypted_data WHERE data_id = $1`,
      [dataId],
    );

    if (check.rows.length === 0) {
      throw new ServiceError('Data not found', 'NOT_FOUND', 404);
    }

    if (check.rows[0].user_id !== userId) {
      throw new ServiceError('Access denied', 'FORBIDDEN', 403);
    }

    await this.pool.query(`DELETE FROM encrypted_data WHERE data_id = $1`, [dataId]);
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}

export class ServiceError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = 'ServiceError';
  }
}
