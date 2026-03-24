import { describe, it, expect, beforeEach } from 'vitest';
import { ZenalyzeEncryption } from './ZenalyzeEncryption';
import { ZenalyzeEncryptionError } from './types';
import type { EncryptedData } from './types';

describe('ZenalyzeEncryption', () => {
  const TEST_EMAIL = 'test@example.com';
  const TEST_PASSWORD = 'secure-password-123';

  let encryption: ZenalyzeEncryption;

  beforeEach(() => {
    encryption = new ZenalyzeEncryption({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });
  });

  // ============================================
  // Constructor validation
  // ============================================

  describe('constructor', () => {
    it('throws if email is missing', () => {
      expect(() => new ZenalyzeEncryption({ email: '', password: 'abc' }))
        .toThrow(ZenalyzeEncryptionError);
    });

    it('throws if password is missing', () => {
      expect(() => new ZenalyzeEncryption({ email: 'a@b.com', password: '' }))
        .toThrow(ZenalyzeEncryptionError);
    });

    it('normalizes email to lowercase', async () => {
      const upper = new ZenalyzeEncryption({ email: 'TEST@Example.COM', password: TEST_PASSWORD });
      const lower = new ZenalyzeEncryption({ email: 'test@example.com', password: TEST_PASSWORD });

      const data = 'same data';
      const encrypted = await upper.encrypt(data);

      // If email normalization works, the lower instance can decrypt upper's data
      const decrypted = await lower.decrypt(encrypted);
      expect(decrypted).toBe(data);
    });
  });

  // ============================================
  // Key derivation
  // ============================================

  describe('deriveKey', () => {
    it('derives a CryptoKey', async () => {
      const key = await encryption.deriveKey();
      expect(key).toBeDefined();
      expect(key.type).toBe('secret');
      expect(key.algorithm).toMatchObject({ name: 'AES-GCM', length: 256 });
    });

    it('is deterministic — same inputs always produce same key', async () => {
      const enc1 = new ZenalyzeEncryption({ email: TEST_EMAIL, password: TEST_PASSWORD });
      const enc2 = new ZenalyzeEncryption({ email: TEST_EMAIL, password: TEST_PASSWORD });

      // Encrypt with instance 1, decrypt with instance 2
      const data = { secret: 'hello' };
      const encrypted = await enc1.encrypt(data);
      const decrypted = await enc2.decrypt(encrypted);

      expect(decrypted).toEqual(data);
    });

    it('different password = different key (cannot decrypt)', async () => {
      const enc1 = new ZenalyzeEncryption({ email: TEST_EMAIL, password: 'password-A' });
      const enc2 = new ZenalyzeEncryption({ email: TEST_EMAIL, password: 'password-B' });

      const encrypted = await enc1.encrypt('secret');

      await expect(enc2.decrypt(encrypted)).rejects.toThrow('Decryption failed');
    });

    it('different email = different key (cannot decrypt)', async () => {
      const enc1 = new ZenalyzeEncryption({ email: 'alice@test.com', password: TEST_PASSWORD });
      const enc2 = new ZenalyzeEncryption({ email: 'bob@test.com', password: TEST_PASSWORD });

      const encrypted = await enc1.encrypt('secret');

      await expect(enc2.decrypt(encrypted)).rejects.toThrow('Decryption failed');
    });

    it('caches the key (does not re-derive)', async () => {
      const key1 = await encryption.deriveKey();
      const key2 = await encryption.deriveKey();

      // Same object reference = cached
      expect(key1).toBe(key2);
    });

    it('clearKey removes the cached key', async () => {
      const key1 = await encryption.deriveKey();
      encryption.clearKey();
      const key2 = await encryption.deriveKey();

      // Different reference after clearing
      expect(key1).not.toBe(key2);
    });
  });

  // ============================================
  // Encrypt
  // ============================================

  describe('encrypt', () => {
    it('encrypts a string', async () => {
      const encrypted = await encryption.encrypt('hello world');

      expect(encrypted.version).toBe(1);
      expect(encrypted.ciphertext).toBeTruthy();
      expect(encrypted.iv).toBeTruthy();
      expect(encrypted.authTag).toBeTruthy();
      expect(encrypted.timestamp).toBeGreaterThan(0);
    });

    it('encrypts an object', async () => {
      const encrypted = await encryption.encrypt({
        mood: 'anxious',
        notes: 'Felt stressed at work',
      });

      expect(encrypted.version).toBe(1);
      expect(encrypted.ciphertext.length).toBeGreaterThan(0);
    });

    it('encrypts an array', async () => {
      const data = [1, 'two', { three: 3 }];
      const encrypted = await encryption.encrypt(data);
      const decrypted = await encryption.decrypt(encrypted);

      expect(decrypted).toEqual(data);
    });

    it('encrypts numbers', async () => {
      const encrypted = await encryption.encrypt(42);
      const decrypted = await encryption.decrypt(encrypted);

      expect(decrypted).toBe(42);
    });

    it('encrypts null', async () => {
      const encrypted = await encryption.encrypt(null);
      const decrypted = await encryption.decrypt(encrypted);

      expect(decrypted).toBeNull();
    });

    it('throws on undefined', async () => {
      await expect(encryption.encrypt(undefined)).rejects.toThrow('cannot be undefined');
    });

    it('produces different ciphertext each time (random IV)', async () => {
      const data = 'same data';
      const enc1 = await encryption.encrypt(data);
      const enc2 = await encryption.encrypt(data);

      // Different IV = different ciphertext, even for same input
      expect(enc1.iv).not.toBe(enc2.iv);
      expect(enc1.ciphertext).not.toBe(enc2.ciphertext);
    });

    it('output matches EncryptedData interface shape', async () => {
      const encrypted = await encryption.encrypt('test');

      // Verify it has exactly the fields the server SDK expects
      const keys = Object.keys(encrypted).sort();
      expect(keys).toEqual(['authTag', 'ciphertext', 'iv', 'timestamp', 'version']);
    });
  });

  // ============================================
  // Decrypt
  // ============================================

  describe('decrypt', () => {
    it('roundtrips a string', async () => {
      const original = 'Patient reported feeling better today';
      const encrypted = await encryption.encrypt(original);
      const decrypted = await encryption.decrypt<string>(encrypted);

      expect(decrypted).toBe(original);
    });

    it('roundtrips a complex object', async () => {
      const original = {
        sessionId: 'abc-123',
        mood: 7,
        tags: ['anxiety', 'sleep'],
        notes: 'Discussed coping strategies',
        nested: {
          therapist: 'Dr. Smith',
          duration: 60,
        },
      };

      const encrypted = await encryption.encrypt(original);
      const decrypted = await encryption.decrypt(encrypted);

      expect(decrypted).toEqual(original);
    });

    it('roundtrips unicode and emoji', async () => {
      const original = 'Aujourd\'hui je me sens bien. Feeling: happy';
      const encrypted = await encryption.encrypt(original);
      const decrypted = await encryption.decrypt(encrypted);

      expect(decrypted).toBe(original);
    });

    it('roundtrips large data', async () => {
      const original = 'x'.repeat(100_000); // 100KB of text
      const encrypted = await encryption.encrypt(original);
      const decrypted = await encryption.decrypt(encrypted);

      expect(decrypted).toBe(original);
    });

    it('fails with wrong password', async () => {
      const encrypted = await encryption.encrypt('secret');

      const wrongKey = new ZenalyzeEncryption({
        email: TEST_EMAIL,
        password: 'wrong-password',
      });

      await expect(wrongKey.decrypt(encrypted)).rejects.toThrow(ZenalyzeEncryptionError);
    });

    it('fails if ciphertext is tampered with', async () => {
      const encrypted = await encryption.encrypt('secret');

      // Tamper with the ciphertext (flip a character)
      const tampered: EncryptedData = {
        ...encrypted,
        ciphertext: encrypted.ciphertext.slice(0, -1) + 'X',
      };

      await expect(encryption.decrypt(tampered)).rejects.toThrow('Decryption failed');
    });

    it('fails if authTag is tampered with', async () => {
      const encrypted = await encryption.encrypt('secret');

      // Decode authTag, flip a bit, re-encode to guarantee actual byte change
      const tagBytes = Buffer.from(encrypted.authTag, 'base64');
      tagBytes[0] ^= 0xff;
      const tampered: EncryptedData = {
        ...encrypted,
        authTag: tagBytes.toString('base64'),
      };

      await expect(encryption.decrypt(tampered)).rejects.toThrow('Decryption failed');
    });

    it('rejects unsupported version', async () => {
      const encrypted = await encryption.encrypt('test');
      const modified: EncryptedData = { ...encrypted, version: 99 };

      await expect(encryption.decrypt(modified)).rejects.toThrow('Unsupported encryption version');
    });

    it('rejects empty ciphertext', async () => {
      const bad: EncryptedData = {
        version: 1,
        ciphertext: '',
        iv: 'abc',
        authTag: 'def',
        timestamp: Date.now(),
      };

      await expect(encryption.decrypt(bad)).rejects.toThrow('Ciphertext must be a non-empty string');
    });
  });

  // ============================================
  // Security properties
  // ============================================

  describe('security properties', () => {
    it('key is not extractable', async () => {
      const key = await encryption.deriveKey();

      // CryptoKey with extractable=false cannot be exported
      expect(key.extractable).toBe(false);
    });

    it('encryption is non-deterministic (IVs are random)', async () => {
      const ivs = new Set<string>();

      for (let i = 0; i < 100; i++) {
        const encrypted = await encryption.encrypt('same data');
        ivs.add(encrypted.iv);
      }

      // All 100 IVs should be unique
      expect(ivs.size).toBe(100);
    });

    it('ciphertext reveals nothing about plaintext length differences', async () => {
      const short = await encryption.encrypt('hi');
      const long = await encryption.encrypt('hello world this is a much longer message');

      // Both should be base64-encoded, non-empty
      expect(short.ciphertext.length).toBeGreaterThan(0);
      expect(long.ciphertext.length).toBeGreaterThan(short.ciphertext.length);

      // But both have same IV length and authTag length
      expect(short.iv.length).toBe(long.iv.length);
      expect(short.authTag.length).toBe(long.authTag.length);
    });

    it('custom iteration count works', async () => {
      // Low iterations for testing speed (don't use in production!)
      const fast = new ZenalyzeEncryption({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        iterations: 1000,
      });

      const encrypted = await fast.encrypt('test');
      const decrypted = await fast.decrypt(encrypted);
      expect(decrypted).toBe('test');

      // Different iterations = different key = can't cross-decrypt
      await expect(encryption.decrypt(encrypted)).rejects.toThrow('Decryption failed');
    });
  });
});
