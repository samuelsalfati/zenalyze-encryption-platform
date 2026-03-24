import type { AuditLogEntry, AuditLogHandler } from './types';

/**
 * HIPAA-compliant audit logger
 *
 * Logs all access to encrypted data without logging the data itself.
 * Meets HIPAA §164.312(b) audit controls requirement.
 */
export class AuditLogger {
  private handler: AuditLogHandler;
  private enabled: boolean;

  constructor(handler?: AuditLogHandler, enabled = true) {
    this.enabled = enabled;
    this.handler = handler || this.defaultHandler;
  }

  /**
   * Log an audit event
   */
  async log(entry: Omit<AuditLogEntry, 'timestamp'>): Promise<void> {
    if (!this.enabled) {
      return;
    }

    const fullEntry: AuditLogEntry = {
      ...entry,
      timestamp: Date.now()
    };

    try {
      await this.handler(fullEntry);
    } catch (error) {
      // Don't throw on audit log failures (but log to console)
      console.error('[ZenalyzeServer] Audit log failed:', error);
    }
  }

  /**
   * Default audit log handler (console output)
   * In production, this should write to a secure log storage
   */
  private defaultHandler(entry: AuditLogEntry): void {
    const logLine = JSON.stringify({
      timestamp: new Date(entry.timestamp).toISOString(),
      operation: entry.operation,
      userId: entry.userId,
      dataId: entry.dataId || 'N/A',
      result: entry.result,
      error: entry.error || undefined,
      metadata: entry.metadata || undefined,
      ipAddress: entry.ipAddress || undefined,
      userAgent: entry.userAgent || undefined
    });

    // In production, this should go to CloudWatch, Datadog, etc.
    console.log(`[AUDIT] ${logLine}`);
  }

  /**
   * Create audit log for successful operation
   */
  async logSuccess(
    operation: AuditLogEntry['operation'],
    userId: string,
    dataId?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.log({
      operation,
      userId,
      dataId,
      result: 'success',
      metadata
    });
  }

  /**
   * Create audit log for failed operation
   */
  async logError(
    operation: AuditLogEntry['operation'],
    userId: string,
    error: Error,
    dataId?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.log({
      operation,
      userId,
      dataId,
      result: 'error',
      error: error.message,
      metadata
    });
  }

  /**
   * Set custom audit log handler
   */
  setHandler(handler: AuditLogHandler): void {
    this.handler = handler;
  }

  /**
   * Enable or disable audit logging
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }
}
