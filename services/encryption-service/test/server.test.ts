import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildServer } from '../src/server';
import type { FastifyInstance } from 'fastify';

const TEST_API_KEY = 'zn_test_key123';
const TEST_CONFIG = {
  port: 0,
  host: '127.0.0.1',
  databaseUrl: process.env.DATABASE_URL || 'postgresql://localhost:5432/test',
  redisUrl: 'redis://localhost:6379',
  logLevel: 'silent',
  apiKeys: {
    [TEST_API_KEY]: {
      customerId: 'cust_001',
      tier: 'starter' as const,
      name: 'Test Customer',
    },
    zn_free_key: {
      customerId: 'cust_free',
      tier: 'free' as const,
      name: 'Free Customer',
    },
  },
};

const AUTH_HEADER = { authorization: `Bearer ${TEST_API_KEY}` };

const SAMPLE_ENCRYPTED_DATA = {
  version: 1,
  ciphertext: 'dGVzdCBjaXBoZXJ0ZXh0',
  iv: 'dGVzdCBpdg==',
  authTag: 'dGVzdCBhdXRoIHRhZw==',
  timestamp: Date.now(),
};

let server: FastifyInstance;

beforeAll(async () => {
  server = await buildServer(TEST_CONFIG);
  await server.ready();
});

afterAll(async () => {
  await server.close();
});

// ============================================
// Health Check
// ============================================

describe('GET /health', () => {
  it('returns healthy status without auth', async () => {
    const response = await server.inject({ method: 'GET', url: '/health' });
    expect(response.statusCode).toBe(200);

    const body = response.json();
    expect(body.status).toBe('healthy');
    expect(body.version).toBe('0.1.0');
    expect(body.timestamp).toBeDefined();
  });

  it('also works at /v1/health', async () => {
    const response = await server.inject({ method: 'GET', url: '/v1/health' });
    expect(response.statusCode).toBe(200);
    expect(response.json().status).toBe('healthy');
  });
});

// ============================================
// Authentication
// ============================================

describe('Authentication', () => {
  it('rejects requests without auth header', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/v1/data/store',
      payload: {},
    });
    expect(response.statusCode).toBe(401);
    expect(response.json().code).toBe('AUTHENTICATION_FAILED');
  });

  it('rejects requests with invalid API key', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/v1/data/store',
      headers: { authorization: 'Bearer invalid_key' },
      payload: {},
    });
    expect(response.statusCode).toBe(401);
  });

  it('rejects requests with malformed auth header', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/v1/data/store',
      headers: { authorization: 'Basic abc123' },
      payload: {},
    });
    expect(response.statusCode).toBe(401);
  });
});

// ============================================
// Store Encrypted Data
// ============================================

describe('POST /v1/data/store', () => {
  it('stores encrypted data and returns dataId', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/v1/data/store',
      headers: AUTH_HEADER,
      payload: {
        userId: 'user_123',
        encryptedData: SAMPLE_ENCRYPTED_DATA,
        metadata: { type: 'journal_entry' },
      },
    });

    expect(response.statusCode).toBe(201);

    const body = response.json();
    expect(body.dataId).toMatch(/^data_[a-f0-9]{24}$/);
    expect(body.storedAt).toBeGreaterThan(0);
    expect(body.status).toBe('success');
  });

  it('rejects missing userId', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/v1/data/store',
      headers: AUTH_HEADER,
      payload: {
        encryptedData: SAMPLE_ENCRYPTED_DATA,
      },
    });
    expect(response.statusCode).toBe(400);
  });

  it('rejects missing encryptedData', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/v1/data/store',
      headers: AUTH_HEADER,
      payload: {
        userId: 'user_123',
      },
    });
    expect(response.statusCode).toBe(400);
  });

  it('rejects empty ciphertext', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/v1/data/store',
      headers: AUTH_HEADER,
      payload: {
        userId: 'user_123',
        encryptedData: { ...SAMPLE_ENCRYPTED_DATA, ciphertext: '' },
      },
    });
    expect(response.statusCode).toBe(400);
  });
});

// ============================================
// Fetch Encrypted Data
// ============================================

describe('GET /v1/data/:dataId', () => {
  let storedDataId: string;

  beforeAll(async () => {
    const storeResponse = await server.inject({
      method: 'POST',
      url: '/v1/data/store',
      headers: AUTH_HEADER,
      payload: {
        userId: 'user_fetch_test',
        encryptedData: SAMPLE_ENCRYPTED_DATA,
        metadata: { type: 'test' },
      },
    });
    storedDataId = storeResponse.json().dataId;
  });

  it('fetches stored data by ID', async () => {
    const response = await server.inject({
      method: 'GET',
      url: `/v1/data/${storedDataId}?userId=user_fetch_test`,
      headers: AUTH_HEADER,
    });

    expect(response.statusCode).toBe(200);

    const body = response.json();
    expect(body.encryptedData.ciphertext).toBe(SAMPLE_ENCRYPTED_DATA.ciphertext);
    expect(body.metadata).toEqual({ type: 'test' });
    expect(body.storedAt).toBeGreaterThan(0);
  });

  it('returns 404 for non-existent data', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/v1/data/data_nonexistent000000000000?userId=user_fetch_test',
      headers: AUTH_HEADER,
    });
    expect(response.statusCode).toBe(404);
  });

  it('returns 403 for wrong userId', async () => {
    const response = await server.inject({
      method: 'GET',
      url: `/v1/data/${storedDataId}?userId=wrong_user`,
      headers: AUTH_HEADER,
    });
    expect(response.statusCode).toBe(403);
  });

  it('returns 400 when userId is missing', async () => {
    const response = await server.inject({
      method: 'GET',
      url: `/v1/data/${storedDataId}`,
      headers: AUTH_HEADER,
    });
    expect(response.statusCode).toBe(400);
  });
});

// ============================================
// Delete Encrypted Data
// ============================================

describe('DELETE /v1/data/:dataId', () => {
  it('deletes stored data', async () => {
    // Store first
    const storeResponse = await server.inject({
      method: 'POST',
      url: '/v1/data/store',
      headers: AUTH_HEADER,
      payload: {
        userId: 'user_delete_test',
        encryptedData: SAMPLE_ENCRYPTED_DATA,
      },
    });
    const dataId = storeResponse.json().dataId;

    // Delete
    const deleteResponse = await server.inject({
      method: 'DELETE',
      url: `/v1/data/${dataId}?userId=user_delete_test`,
      headers: AUTH_HEADER,
    });
    expect(deleteResponse.statusCode).toBe(204);

    // Verify gone
    const fetchResponse = await server.inject({
      method: 'GET',
      url: `/v1/data/${dataId}?userId=user_delete_test`,
      headers: AUTH_HEADER,
    });
    expect(fetchResponse.statusCode).toBe(404);
  });

  it('returns 403 for wrong userId', async () => {
    const storeResponse = await server.inject({
      method: 'POST',
      url: '/v1/data/store',
      headers: AUTH_HEADER,
      payload: {
        userId: 'user_owner',
        encryptedData: SAMPLE_ENCRYPTED_DATA,
      },
    });
    const dataId = storeResponse.json().dataId;

    const deleteResponse = await server.inject({
      method: 'DELETE',
      url: `/v1/data/${dataId}?userId=wrong_user`,
      headers: AUTH_HEADER,
    });
    expect(deleteResponse.statusCode).toBe(403);
  });
});

// ============================================
// AI Analysis
// ============================================

describe('POST /v1/ai/analyze', () => {
  it('returns mock AI analysis response', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/v1/ai/analyze',
      headers: AUTH_HEADER,
      payload: {
        encryptedData: SAMPLE_ENCRYPTED_DATA,
        prompt: 'Analyze this journal entry for mood patterns',
        userId: 'user_123',
        provider: 'openai',
        model: 'gpt-4',
      },
    });

    expect(response.statusCode).toBe(200);

    const body = response.json();
    expect(body.encryptedResponse).toBeDefined();
    expect(body.encryptedResponse.version).toBe(1);
    expect(body.encryptedResponse.ciphertext).toBeTruthy();
    expect(body.encryptedResponse.iv).toBeTruthy();
    expect(body.encryptedResponse.authTag).toBeTruthy();
    expect(body.provider).toBe('openai');
    expect(body.model).toBe('gpt-4');
    expect(body.processingTime).toBeGreaterThan(0);
    expect(body.tokensUsed).toBeGreaterThan(0);
  });

  it('rejects missing prompt', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/v1/ai/analyze',
      headers: AUTH_HEADER,
      payload: {
        encryptedData: SAMPLE_ENCRYPTED_DATA,
        userId: 'user_123',
      },
    });
    expect(response.statusCode).toBe(400);
  });

  it('rejects missing encryptedData', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/v1/ai/analyze',
      headers: AUTH_HEADER,
      payload: {
        prompt: 'Analyze this',
        userId: 'user_123',
      },
    });
    expect(response.statusCode).toBe(400);
  });

  it('defaults provider to openai', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/v1/ai/analyze',
      headers: AUTH_HEADER,
      payload: {
        encryptedData: SAMPLE_ENCRYPTED_DATA,
        prompt: 'Analyze this',
        userId: 'user_123',
      },
    });

    expect(response.json().provider).toBe('openai');
  });
});

// ============================================
// Usage
// ============================================

describe('GET /v1/usage', () => {
  it('returns usage stats', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/v1/usage',
      headers: AUTH_HEADER,
    });

    expect(response.statusCode).toBe(200);

    const body = response.json();
    expect(body.tier).toBe('starter');
    expect(body.tierLimit).toBeGreaterThan(0);
    expect(typeof body.apiCallsThisMonth).toBe('number');
    expect(typeof body.apiCallsToday).toBe('number');
    expect(typeof body.overageCharges).toBe('number');
  });
});

// ============================================
// Full roundtrip
// ============================================

describe('Full roundtrip: store → fetch → delete', () => {
  it('completes a full data lifecycle', async () => {
    // Store
    const storeRes = await server.inject({
      method: 'POST',
      url: '/v1/data/store',
      headers: AUTH_HEADER,
      payload: {
        userId: 'roundtrip_user',
        encryptedData: SAMPLE_ENCRYPTED_DATA,
        metadata: { session: 'therapy-001' },
      },
    });
    expect(storeRes.statusCode).toBe(201);
    const { dataId } = storeRes.json();

    // Fetch
    const fetchRes = await server.inject({
      method: 'GET',
      url: `/v1/data/${dataId}?userId=roundtrip_user`,
      headers: AUTH_HEADER,
    });
    expect(fetchRes.statusCode).toBe(200);
    expect(fetchRes.json().encryptedData).toEqual(SAMPLE_ENCRYPTED_DATA);
    expect(fetchRes.json().metadata).toEqual({ session: 'therapy-001' });

    // Delete
    const deleteRes = await server.inject({
      method: 'DELETE',
      url: `/v1/data/${dataId}?userId=roundtrip_user`,
      headers: AUTH_HEADER,
    });
    expect(deleteRes.statusCode).toBe(204);

    // Verify deleted
    const fetchAgain = await server.inject({
      method: 'GET',
      url: `/v1/data/${dataId}?userId=roundtrip_user`,
      headers: AUTH_HEADER,
    });
    expect(fetchAgain.statusCode).toBe(404);
  });
});
