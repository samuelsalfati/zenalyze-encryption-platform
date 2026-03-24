/**
 * Configuration for ZenalyzeEncryption
 */
export interface EncryptionConfig {
  /**
   * User's email address (used as salt for key derivation).
   * This ensures each user gets a unique encryption key even with the same password.
   */
  email: string;

  /**
   * User's password (used to derive the encryption key).
   * This is NEVER sent to any server — it stays in memory only during key derivation.
   */
  password: string;

  /**
   * PBKDF2 iteration count. Higher = more secure but slower.
   * @default 100000
   */
  iterations?: number;
}

/**
 * Encrypted data structure.
 * This is what gets sent to/from the server.
 * Matches the server SDK's EncryptedData interface.
 */
export interface EncryptedData {
  /** Format version (for future algorithm changes) */
  version: number;

  /** Base64-encoded ciphertext */
  ciphertext: string;

  /** Base64-encoded initialization vector (12 bytes random) */
  iv: string;

  /** Base64-encoded GCM authentication tag (16 bytes) */
  authTag: string;

  /** Unix timestamp (ms) when the data was encrypted */
  timestamp: number;
}

/**
 * Errors thrown by the encryption SDK
 */
export class ZenalyzeEncryptionError extends Error {
  constructor(
    message: string,
    public readonly code: string
  ) {
    super(message);
    this.name = 'ZenalyzeEncryptionError';
  }
}
