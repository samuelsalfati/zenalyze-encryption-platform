import type { EncryptionConfig, EncryptedData } from './types';
import { ZenalyzeEncryptionError } from './types';

// Constants
const CURRENT_VERSION = 1;
const IV_LENGTH = 12; // 12 bytes for AES-GCM (recommended by NIST)
const AUTH_TAG_LENGTH = 128; // 128 bits = 16 bytes
const AUTH_TAG_BYTES = AUTH_TAG_LENGTH / 8;
const DEFAULT_ITERATIONS = 100_000;
const KEY_LENGTH = 256; // AES-256

/**
 * Get the Web Crypto API, works in both browser and Node.js 18+
 */
function getCrypto(): Crypto {
  if (typeof globalThis.crypto !== 'undefined' && globalThis.crypto.subtle) {
    return globalThis.crypto;
  }
  throw new ZenalyzeEncryptionError(
    'Web Crypto API not available. Requires a modern browser or Node.js 18+.',
    'CRYPTO_UNAVAILABLE'
  );
}

/**
 * Encode a Uint8Array to base64 string
 */
function toBase64(buffer: Uint8Array): string {
  // Works in both browser and Node.js
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(buffer).toString('base64');
  }
  // Browser fallback
  let binary = '';
  for (let i = 0; i < buffer.length; i++) {
    binary += String.fromCharCode(buffer[i]);
  }
  return btoa(binary);
}

/**
 * Decode a base64 string to Uint8Array
 */
function fromBase64(base64: string): Uint8Array {
  if (typeof Buffer !== 'undefined') {
    return new Uint8Array(Buffer.from(base64, 'base64'));
  }
  // Browser fallback
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Client-side zero-knowledge encryption SDK.
 *
 * How it works:
 * 1. Your password + email are used to derive an AES-256 encryption key (PBKDF2)
 * 2. The key NEVER leaves the client — no server ever sees it
 * 3. Data is encrypted with AES-GCM (authenticated encryption)
 * 4. Only someone with the same email+password can decrypt
 *
 * @example
 * ```typescript
 * const enc = new ZenalyzeEncryption({
 *   email: 'user@example.com',
 *   password: 'secure-password'
 * });
 *
 * // Encrypt anything (strings, objects, arrays)
 * const encrypted = await enc.encrypt({ mood: 'anxious', notes: 'Felt stressed at work' });
 *
 * // Decrypt back to original
 * const decrypted = await enc.decrypt(encrypted);
 * // => { mood: 'anxious', notes: 'Felt stressed at work' }
 * ```
 */
export class ZenalyzeEncryption {
  private readonly email: string;
  private readonly password: string;
  private readonly iterations: number;
  private cachedKey: CryptoKey | null = null;

  constructor(config: EncryptionConfig) {
    if (!config.email || typeof config.email !== 'string') {
      throw new ZenalyzeEncryptionError('Email is required', 'INVALID_CONFIG');
    }
    if (!config.password || typeof config.password !== 'string') {
      throw new ZenalyzeEncryptionError('Password is required', 'INVALID_CONFIG');
    }

    this.email = config.email.toLowerCase().trim();
    this.password = config.password;
    this.iterations = config.iterations ?? DEFAULT_ITERATIONS;
  }

  /**
   * Derive the encryption key from email + password using PBKDF2.
   *
   * How PBKDF2 works:
   * - Takes your password and a salt (your email, hashed)
   * - Runs it through SHA-256 100,000 times
   * - Each round makes brute-forcing exponentially harder
   * - Same inputs ALWAYS produce the same key (deterministic)
   * - Output: a 256-bit AES key
   */
  async deriveKey(): Promise<CryptoKey> {
    // Return cached key if available (avoid re-deriving)
    if (this.cachedKey) {
      return this.cachedKey;
    }

    const crypto = getCrypto();

    // Step 1: Create a deterministic salt from the email
    // Why email? Each user gets a unique salt, preventing rainbow table attacks
    const saltBuffer = await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(this.email)
    );

    // Step 2: Import the password as raw key material
    // This doesn't create the final key — it prepares it for PBKDF2
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(this.password),
      'PBKDF2',
      false, // not extractable — you can't export this key
      ['deriveKey']
    );

    // Step 3: Derive the actual AES-256-GCM key
    // PBKDF2 runs SHA-256 100,000 times — this is slow ON PURPOSE
    // It means an attacker trying every password takes 100,000x longer
    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: new Uint8Array(saltBuffer),
        iterations: this.iterations,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: KEY_LENGTH },
      false, // not extractable
      ['encrypt', 'decrypt']
    );

    this.cachedKey = key;
    return key;
  }

  /**
   * Encrypt data. Accepts strings, objects, arrays, numbers — anything JSON-serializable.
   *
   * What happens inside:
   * 1. Your data is JSON-serialized to a string
   * 2. A random 12-byte IV (initialization vector) is generated
   *    - This ensures encrypting the same data twice produces different output
   * 3. AES-256-GCM encrypts the data
   *    - AES = the encryption algorithm (military-grade)
   *    - 256 = key size in bits (very strong)
   *    - GCM = mode that also creates an auth tag (tamper detection)
   * 4. The output contains: version + IV + ciphertext + authTag + timestamp
   *
   * @param data - Any JSON-serializable value
   * @returns EncryptedData object ready to send to server
   */
  async encrypt(data: unknown): Promise<EncryptedData> {
    if (data === undefined) {
      throw new ZenalyzeEncryptionError('Data to encrypt cannot be undefined', 'INVALID_DATA');
    }

    const crypto = getCrypto();
    const key = await this.deriveKey();

    // Serialize to JSON bytes
    const plaintext = new TextEncoder().encode(JSON.stringify(data));

    // Generate random IV — CRITICAL for security
    // Using the same IV twice with the same key would be catastrophic
    // 12 bytes of randomness = 2^96 possible values = effectively impossible to repeat
    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

    // Encrypt with AES-GCM
    // GCM mode gives us two things:
    //   1. Ciphertext (the encrypted data — unreadable without the key)
    //   2. Auth tag (a 16-byte "fingerprint" that detects tampering)
    // Web Crypto appends the auth tag to the ciphertext
    const encryptedBuffer = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv, tagLength: AUTH_TAG_LENGTH },
      key,
      plaintext
    );

    const encryptedBytes = new Uint8Array(encryptedBuffer);

    // Split ciphertext and auth tag
    // Web Crypto concatenates them: [ciphertext | authTag(16 bytes)]
    const ciphertext = encryptedBytes.slice(0, encryptedBytes.length - AUTH_TAG_BYTES);
    const authTag = encryptedBytes.slice(encryptedBytes.length - AUTH_TAG_BYTES);

    return {
      version: CURRENT_VERSION,
      ciphertext: toBase64(ciphertext),
      iv: toBase64(iv),
      authTag: toBase64(authTag),
      timestamp: Date.now(),
    };
  }

  /**
   * Decrypt data back to its original form.
   *
   * What happens inside:
   * 1. Validates the encrypted data structure
   * 2. Decodes base64 back to raw bytes
   * 3. Recombines ciphertext + authTag (Web Crypto expects them together)
   * 4. AES-GCM decrypts AND verifies the auth tag
   *    - If someone tampered with the data, decryption FAILS (integrity check)
   * 5. JSON-parses the result back to original data type
   *
   * @param encryptedData - EncryptedData from encrypt() or from the server
   * @returns Original data in its original type
   */
  async decrypt<T = unknown>(encryptedData: EncryptedData): Promise<T> {
    this.validateEncryptedData(encryptedData);

    const crypto = getCrypto();
    const key = await this.deriveKey();

    // Decode from base64
    const iv = fromBase64(encryptedData.iv);
    const ciphertext = fromBase64(encryptedData.ciphertext);
    const authTag = fromBase64(encryptedData.authTag);

    // Recombine ciphertext + authTag (Web Crypto expects them concatenated)
    const combined = new Uint8Array(ciphertext.length + authTag.length);
    combined.set(ciphertext);
    combined.set(authTag, ciphertext.length);

    try {
      // Decrypt with AES-GCM
      // This will FAIL if:
      //   - The key is wrong (wrong password/email)
      //   - The data was tampered with (auth tag mismatch)
      //   - The IV doesn't match
      const decryptedBuffer = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv, tagLength: AUTH_TAG_LENGTH },
        key,
        combined.buffer as ArrayBuffer
      );

      // Parse JSON back to original type
      const jsonString = new TextDecoder().decode(decryptedBuffer);
      return JSON.parse(jsonString) as T;
    } catch (error) {
      // Web Crypto throws a generic "OperationError" for all decryption failures
      // We provide a more helpful message
      if (error instanceof DOMException || (error as Error).name === 'OperationError') {
        throw new ZenalyzeEncryptionError(
          'Decryption failed. Wrong password/email or data has been tampered with.',
          'DECRYPTION_FAILED'
        );
      }
      throw error;
    }
  }

  /**
   * Clear the cached key from memory.
   * Call this when the user logs out to prevent key reuse.
   */
  clearKey(): void {
    this.cachedKey = null;
  }

  /**
   * Validate the structure of encrypted data before attempting decryption.
   */
  private validateEncryptedData(data: EncryptedData): void {
    if (!data || typeof data !== 'object') {
      throw new ZenalyzeEncryptionError('Encrypted data must be an object', 'INVALID_DATA');
    }

    if (data.version !== CURRENT_VERSION) {
      throw new ZenalyzeEncryptionError(
        `Unsupported encryption version: ${data.version}. Expected: ${CURRENT_VERSION}`,
        'UNSUPPORTED_VERSION'
      );
    }

    if (typeof data.ciphertext !== 'string' || data.ciphertext.length === 0) {
      throw new ZenalyzeEncryptionError('Ciphertext must be a non-empty string', 'INVALID_DATA');
    }

    if (typeof data.iv !== 'string' || data.iv.length === 0) {
      throw new ZenalyzeEncryptionError('IV must be a non-empty string', 'INVALID_DATA');
    }

    if (typeof data.authTag !== 'string' || data.authTag.length === 0) {
      throw new ZenalyzeEncryptionError('Auth tag must be a non-empty string', 'INVALID_DATA');
    }
  }
}
