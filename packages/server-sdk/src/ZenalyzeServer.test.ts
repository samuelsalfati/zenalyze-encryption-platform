import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ZenalyzeServer } from './ZenalyzeServer';
import type { EncryptedData, AuditLogEntry } from './types';
import { ValidationError, AuthenticationError } from './types';

// Mock axios
vi.mock('axios', () => {
  return {
    default: {
      create: vi.fn(() => ({
        request: vi.fn(),
        interceptors: {
          response: {
            use: vi.fn()
          }
        }
      }))
    }
  };
});

describe('ZenalyzeServer', () => {
  let server: ZenalyzeServer;
  let mockEncryptedData: EncryptedData;

  beforeEach(() => {
    server = new ZenalyzeServer({
      apiKey: 'test-api-key',
      enableAuditLog: false // Disable for tests
    });

    mockEncryptedData = {
      version: 1,
      ciphertext: 'aB3xK2mP9zT',
      iv: 'rT2vN5kL8pQ',
      authTag: 'mZ9wP6fR4tY',
      timestamp: Date.now()
    };
  });

  describe('Constructor', () => {
    it('should throw error if API key is missing', () => {
      expect(() => {
        new ZenalyzeServer({ apiKey: '' });
      }).toThrow(ValidationError);
    });

    it('should use default configuration', () => {
      const server = new ZenalyzeServer({
        apiKey: 'test-key'
      });
      expect(server).toBeDefined();
    });

    it('should accept custom configuration', () => {
      const server = new ZenalyzeServer({
        apiKey: 'test-key',
        baseUrl: 'https://custom.api.com',
        timeout: 60000,
        maxRetries: 5,
        enableAuditLog: true
      });
      expect(server).toBeDefined();
    });
  });

  describe('storeEncrypted', () => {
    it('should validate encrypted data', async () => {
      await expect(
        server.storeEncrypted({
          userId: 'user123',
          encryptedData: {} as EncryptedData
        })
      ).rejects.toThrow(ValidationError);
    });

    it('should require version field', async () => {
      const invalid = { ...mockEncryptedData, version: undefined as any };
      await expect(
        server.storeEncrypted({
          userId: 'user123',
          encryptedData: invalid
        })
      ).rejects.toThrow('version must be a number');
    });

    it('should require ciphertext field', async () => {
      const invalid = { ...mockEncryptedData, ciphertext: '' };
      await expect(
        server.storeEncrypted({
          userId: 'user123',
          encryptedData: invalid
        })
      ).rejects.toThrow('ciphertext must be a non-empty string');
    });

    it('should require iv field', async () => {
      const invalid = { ...mockEncryptedData, iv: '' };
      await expect(
        server.storeEncrypted({
          userId: 'user123',
          encryptedData: invalid
        })
      ).rejects.toThrow('IV must be a non-empty string');
    });

    it('should require authTag field', async () => {
      const invalid = { ...mockEncryptedData, authTag: '' };
      await expect(
        server.storeEncrypted({
          userId: 'user123',
          encryptedData: invalid
        })
      ).rejects.toThrow('authTag must be a non-empty string');
    });

    it('should require timestamp field', async () => {
      const invalid = { ...mockEncryptedData, timestamp: undefined as any };
      await expect(
        server.storeEncrypted({
          userId: 'user123',
          encryptedData: invalid
        })
      ).rejects.toThrow('timestamp must be a number');
    });
  });

  describe('analyzeWithAI', () => {
    it('should validate encrypted data', async () => {
      await expect(
        server.analyzeWithAI({
          encryptedData: {} as EncryptedData,
          prompt: 'Analyze this',
          userId: 'user123'
        })
      ).rejects.toThrow(ValidationError);
    });

    it('should require prompt', async () => {
      await expect(
        server.analyzeWithAI({
          encryptedData: mockEncryptedData,
          prompt: '',
          userId: 'user123'
        })
      ).rejects.toThrow('AI prompt is required');
    });

    it('should reject whitespace-only prompt', async () => {
      await expect(
        server.analyzeWithAI({
          encryptedData: mockEncryptedData,
          prompt: '   ',
          userId: 'user123'
        })
      ).rejects.toThrow('AI prompt is required');
    });
  });

  describe('Audit Logging', () => {
    it('should call custom audit handler', async () => {
      const auditHandler = vi.fn();
      const server = new ZenalyzeServer({
        apiKey: 'test-key',
        auditLogHandler: auditHandler
      });

      // Mock successful API call
      const mockClient = (server as any).client;
      mockClient.post = vi.fn().mockResolvedValue({
        dataId: 'data123',
        storedAt: Date.now(),
        status: 'success'
      });

      await server.storeEncrypted({
        userId: 'user123',
        encryptedData: mockEncryptedData
      });

      expect(auditHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          operation: 'store',
          userId: 'user123',
          dataId: 'data123',
          result: 'success'
        })
      );
    });

    it('should log errors to audit', async () => {
      const auditHandler = vi.fn();
      const server = new ZenalyzeServer({
        apiKey: 'test-key',
        auditLogHandler: auditHandler
      });

      // Mock failed API call
      const mockClient = (server as any).client;
      mockClient.post = vi.fn().mockRejectedValue(new Error('API Error'));

      await expect(
        server.storeEncrypted({
          userId: 'user123',
          encryptedData: mockEncryptedData
        })
      ).rejects.toThrow();

      expect(auditHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          operation: 'store',
          userId: 'user123',
          result: 'error',
          error: 'API Error'
        })
      );
    });

    it('should allow disabling audit logs', () => {
      const server = new ZenalyzeServer({
        apiKey: 'test-key',
        enableAuditLog: false
      });

      expect(server).toBeDefined();
    });

    it('should allow changing audit handler after construction', () => {
      const newHandler = vi.fn();
      server.setAuditLogHandler(newHandler);
      expect(server).toBeDefined();
    });

    it('should allow enabling/disabling audit logs dynamically', () => {
      server.setAuditLogEnabled(false);
      server.setAuditLogEnabled(true);
      expect(server).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid encrypted data gracefully', async () => {
      const invalid = {
        version: '1',  // Should be number
        ciphertext: 'test',
        iv: 'test',
        authTag: 'test',
        timestamp: Date.now()
      } as any;

      await expect(
        server.storeEncrypted({
          userId: 'user123',
          encryptedData: invalid
        })
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('healthCheck', () => {
    it('should return true when API is healthy', async () => {
      const mockClient = (server as any).client;
      mockClient.get = vi.fn().mockResolvedValue({});

      const isHealthy = await server.healthCheck();
      expect(isHealthy).toBe(true);
    });

    it('should return false when API is down', async () => {
      const mockClient = (server as any).client;
      mockClient.get = vi.fn().mockRejectedValue(new Error('Connection failed'));

      const isHealthy = await server.healthCheck();
      expect(isHealthy).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle null encrypted data', async () => {
      await expect(
        server.storeEncrypted({
          userId: 'user123',
          encryptedData: null as any
        })
      ).rejects.toThrow(ValidationError);
    });

    it('should handle undefined encrypted data', async () => {
      await expect(
        server.storeEncrypted({
          userId: 'user123',
          encryptedData: undefined as any
        })
      ).rejects.toThrow(ValidationError);
    });

    it('should handle encrypted data with extra fields', async () => {
      const withExtra = {
        ...mockEncryptedData,
        extraField: 'should be ignored'
      } as any;

      // Should not throw - extra fields are okay
      const mockClient = (server as any).client;
      mockClient.post = vi.fn().mockResolvedValue({
        dataId: 'data123',
        storedAt: Date.now(),
        status: 'success'
      });

      await expect(
        server.storeEncrypted({
          userId: 'user123',
          encryptedData: withExtra
        })
      ).resolves.toBeDefined();
    });
  });

  describe('Configuration', () => {
    it('should use custom base URL', () => {
      const server = new ZenalyzeServer({
        apiKey: 'test-key',
        baseUrl: 'https://custom.api.com'
      });

      const config = (server as any).config;
      expect(config.baseUrl).toBe('https://custom.api.com');
    });

    it('should use custom timeout', () => {
      const server = new ZenalyzeServer({
        apiKey: 'test-key',
        timeout: 60000
      });

      const config = (server as any).config;
      expect(config.timeout).toBe(60000);
    });

    it('should use custom max retries', () => {
      const server = new ZenalyzeServer({
        apiKey: 'test-key',
        maxRetries: 5
      });

      const config = (server as any).config;
      expect(config.maxRetries).toBe(5);
    });
  });
});
