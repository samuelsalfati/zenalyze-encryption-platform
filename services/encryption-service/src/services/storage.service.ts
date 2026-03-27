import type { EncryptedData, StoredRecord, StoreEncryptedResponse, FetchEncryptedResponse } from '../types';
import { generateDataId } from '../utils/id-generator';

export class StorageService {
  private store = new Map<string, StoredRecord>();

  async storeData(
    userId: string,
    encryptedData: EncryptedData,
    metadata?: Record<string, unknown>,
  ): Promise<StoreEncryptedResponse> {
    const dataId = generateDataId();
    const storedAt = Date.now();

    this.store.set(dataId, {
      dataId,
      userId,
      encryptedData,
      metadata,
      storedAt,
    });

    return { dataId, storedAt, status: 'success' };
  }

  async fetchData(dataId: string, userId: string): Promise<FetchEncryptedResponse> {
    const record = this.store.get(dataId);

    if (!record) {
      throw new ServiceError('Data not found', 'NOT_FOUND', 404);
    }

    if (record.userId !== userId) {
      throw new ServiceError('Access denied', 'FORBIDDEN', 403);
    }

    return {
      encryptedData: record.encryptedData,
      metadata: record.metadata,
      storedAt: record.storedAt,
    };
  }

  async deleteData(dataId: string, userId: string): Promise<void> {
    const record = this.store.get(dataId);

    if (!record) {
      throw new ServiceError('Data not found', 'NOT_FOUND', 404);
    }

    if (record.userId !== userId) {
      throw new ServiceError('Access denied', 'FORBIDDEN', 403);
    }

    this.store.delete(dataId);
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
