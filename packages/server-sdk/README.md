# @zenalyze/server-sdk

Server-side SDK for Zenalyze Encryption Platform. Integrate HIPAA-compliant zero-knowledge encryption + AI privacy into your Node.js backend.

## Features

- **Zero-Knowledge Storage** - Store encrypted data you can't read
- **AI Privacy** - Analyze encrypted data with AI (Nitro Enclave)
- **HIPAA Audit Logs** - Automatic compliance logging
- **Retry Logic** - Exponential backoff for failed requests
- **TypeScript** - Full type safety
- **Error Handling** - Typed errors with detailed messages

## Installation

```bash
npm install @zenalyze/server-sdk
```

## Quick Start

```typescript
import { ZenalyzeServer } from '@zenalyze/server-sdk';

// Initialize with API key
const server = new ZenalyzeServer({
  apiKey: process.env.ZENALYZE_API_KEY
});

// Store encrypted data (you can't decrypt it!)
const stored = await server.storeEncrypted({
  userId: 'user123',
  encryptedData: clientEncryptedData // From @zenalyze/client-sdk
});

// Analyze with AI (happens in secure Nitro Enclave)
const aiResponse = await server.analyzeWithAI({
  encryptedData: clientEncryptedData,
  prompt: 'Analyze this mental health assessment',
  userId: 'user123'
});

// Send encrypted AI response back to client
res.json(aiResponse.encryptedResponse);
```

## Table of Contents

- [Configuration](#configuration)
- [API Reference](#api-reference)
  - [storeEncrypted](#storeencrypted)
  - [fetchEncrypted](#fetchencrypted)
  - [analyzeWithAI](#analyzewith ai)
  - [deleteEncrypted](#deleteencrypted)
  - [getUsage](#getusage)
  - [healthCheck](#healthcheck)
- [Audit Logging](#audit-logging)
- [Error Handling](#error-handling)
- [Examples](#examples)
- [Best Practices](#best-practices)

---

## Configuration

### Basic Configuration

```typescript
const server = new ZenalyzeServer({
  apiKey: 'your-api-key'
});
```

### Advanced Configuration

```typescript
const server = new ZenalyzeServer({
  // Required
  apiKey: process.env.ZENALYZE_API_KEY,

  // Optional
  baseUrl: 'https://api.zenalyze.com',  // Default
  timeout: 30000,                         // 30 seconds (default)
  maxRetries: 3,                          // Retry failed requests (default)
  enableAuditLog: true,                   // HIPAA audit logging (default)
  auditLogHandler: async (entry) => {    // Custom audit handler
    await sendToCloudWatch(entry);
  }
});
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `apiKey` | `string` | **Required** | API key from Zenalyze dashboard |
| `baseUrl` | `string` | `https://api.zenalyze.com` | API base URL |
| `timeout` | `number` | `30000` | Request timeout (milliseconds) |
| `maxRetries` | `number` | `3` | Number of retry attempts |
| `enableAuditLog` | `boolean` | `true` | Enable HIPAA audit logging |
| `auditLogHandler` | `function` | `console.log` | Custom audit log handler |

---

## API Reference

### storeEncrypted

Store encrypted data that the server cannot decrypt.

**Signature:**
```typescript
storeEncrypted(request: StoreEncryptedRequest): Promise<StoreEncryptedResponse>
```

**Parameters:**
```typescript
interface StoreEncryptedRequest {
  userId: string;                 // User who owns the data
  encryptedData: EncryptedData;  // From client SDK
  metadata?: Record<string, any>; // Optional metadata (NOT encrypted)
}
```

**Returns:**
```typescript
interface StoreEncryptedResponse {
  dataId: string;     // Unique ID for retrieval
  storedAt: number;   // Timestamp
  status: 'success' | 'error';
}
```

**Example:**
```typescript
const response = await server.storeEncrypted({
  userId: 'user123',
  encryptedData: {
    version: 1,
    ciphertext: 'aB3xK2mP...',
    iv: 'rT2vN5kL...',
    authTag: 'mZ9wP6fR...',
    timestamp: 1704115200000
  },
  metadata: {
    type: 'journal_entry',
    tags: ['anxiety', 'mood']
  }
});

console.log(response.dataId); // 'data_abc123xyz'
```

---

### fetchEncrypted

Fetch encrypted data by ID. Server returns encrypted data (still can't decrypt it).

**Signature:**
```typescript
fetchEncrypted(request: FetchEncryptedRequest): Promise<FetchEncryptedResponse>
```

**Parameters:**
```typescript
interface FetchEncryptedRequest {
  dataId: string;   // ID from storeEncrypted
  userId: string;   // For access control
}
```

**Returns:**
```typescript
interface FetchEncryptedResponse {
  encryptedData: EncryptedData;
  metadata?: Record<string, any>;
  storedAt: number;
}
```

**Example:**
```typescript
const response = await server.fetchEncrypted({
  dataId: 'data_abc123xyz',
  userId: 'user123'
});

// Send to client for decryption
res.json(response.encryptedData);
```

---

### analyzeWithAI

Send encrypted data to AI Privacy Service for analysis. Data is temporarily decrypted in AWS Nitro Enclave (<100ms), sent to AI, response re-encrypted, and plaintext destroyed.

**Signature:**
```typescript
analyzeWithAI(request: AnalyzeWithAIRequest): Promise<AnalyzeWithAIResponse>
```

**Parameters:**
```typescript
interface AnalyzeWithAIRequest {
  encryptedData: EncryptedData;         // Data to analyze
  prompt: string;                       // AI instructions
  userId: string;                       // For audit logging
  provider?: 'openai' | 'anthropic';   // AI provider (default: 'openai')
  model?: string;                       // Model name (default: provider default)
  options?: {
    temperature?: number;
    maxTokens?: number;
    [key: string]: any;
  };
}
```

**Returns:**
```typescript
interface AnalyzeWithAIResponse {
  encryptedResponse: EncryptedData;  // Encrypted AI response
  provider: string;                  // AI provider used
  model: string;                     // Model used
  tokensUsed?: number;              // For billing
  processingTime: number;           // Milliseconds
}
```

**Example:**
```typescript
const response = await server.analyzeWithAI({
  encryptedData: clientEncryptedData,
  prompt: 'Analyze this journal entry for signs of depression or anxiety',
  userId: 'user123',
  provider: 'openai',
  model: 'gpt-4',
  options: {
    temperature: 0.7,
    maxTokens: 500
  }
});

// Send encrypted AI response to client
res.json(response.encryptedResponse);

// Log usage
console.log(`Tokens used: ${response.tokensUsed}`);
console.log(`Processing time: ${response.processingTime}ms`);
```

**Security Guarantee:**
- Plaintext exists <100ms in Nitro Enclave
- Hardware-isolated memory
- No disk writes
- Memory scrubbed after AI call
- Cryptographically attestable

---

### deleteEncrypted

Permanently delete encrypted data.

**Signature:**
```typescript
deleteEncrypted(dataId: string, userId: string): Promise<void>
```

**Example:**
```typescript
await server.deleteEncrypted('data_abc123xyz', 'user123');
```

---

### getUsage

Get API usage statistics for billing and monitoring.

**Signature:**
```typescript
getUsage(): Promise<UsageStats>
```

**Returns:**
```typescript
interface UsageStats {
  apiCallsThisMonth: number;
  apiCallsToday: number;
  tierLimit: number;
  tier: 'free' | 'starter' | 'professional' | 'business' | 'enterprise';
  overageCharges: number;
}
```

**Example:**
```typescript
const stats = await server.getUsage();
console.log(`Used ${stats.apiCallsThisMonth} of ${stats.tierLimit} calls this month`);

if (stats.apiCallsThisMonth > stats.tierLimit * 0.9) {
  console.warn('Approaching tier limit!');
}
```

---

### healthCheck

Verify API key is valid and service is reachable.

**Signature:**
```typescript
healthCheck(): Promise<boolean>
```

**Example:**
```typescript
const isHealthy = await server.healthCheck();

if (!isHealthy) {
  console.error('Zenalyze API is down!');
  // Fallback to cached data or show error to user
}
```

---

## Audit Logging

All operations are automatically logged for HIPAA compliance (§164.312(b) audit controls requirement).

### Default Audit Logging

By default, audit logs are written to console (suitable for CloudWatch, etc.):

```typescript
const server = new ZenalyzeServer({
  apiKey: 'your-key',
  enableAuditLog: true  // Default
});
```

### Custom Audit Handler

Integrate with your logging system:

```typescript
import { CloudWatchLogs } from 'aws-sdk';

const cloudwatch = new CloudWatchLogs();

const server = new ZenalyzeServer({
  apiKey: 'your-key',
  auditLogHandler: async (entry) => {
    await cloudwatch.putLogEvents({
      logGroupName: '/zenalyze/audit',
      logStreamName: 'production',
      logEvents: [{
        timestamp: entry.timestamp,
        message: JSON.stringify(entry)
      }]
    }).promise();
  }
});
```

### Audit Log Entry Format

```typescript
interface AuditLogEntry {
  timestamp: number;                              // Unix timestamp
  operation: 'store' | 'fetch' | 'analyze' | 'delete';
  userId: string;                                 // Who performed operation
  dataId?: string;                                // Data ID (if applicable)
  result: 'success' | 'error';
  error?: string;                                 // Error message (if failed)
  metadata?: Record<string, any>;                 // Additional context
  ipAddress?: string;                             // Client IP (if available)
  userAgent?: string;                             // User agent (if available)
}
```

### Example Audit Log

```json
{
  "timestamp": 1704115200000,
  "operation": "analyze",
  "userId": "user123",
  "result": "success",
  "metadata": {
    "provider": "openai",
    "model": "gpt-4",
    "tokensUsed": 234,
    "processingTime": 1523
  }
}
```

### Disabling Audit Logs

```typescript
const server = new ZenalyzeServer({
  apiKey: 'your-key',
  enableAuditLog: false  // Not recommended for HIPAA compliance!
});

// Or dynamically
server.setAuditLogEnabled(false);
```

---

## Error Handling

All errors are typed and include detailed information.

### Error Types

```typescript
import {
  ZenalyzeServerError,   // Base error
  RateLimitError,         // 429 Too Many Requests
  AuthenticationError,    // 401 Invalid API key
  ValidationError         // 400 Bad Request
} from '@zenalyze/server-sdk';
```

### Handling Errors

```typescript
try {
  await server.storeEncrypted({...});
} catch (error) {
  if (error instanceof RateLimitError) {
    console.error(`Rate limited! Retry after ${error.retryAfter} seconds`);
    // Wait and retry
    await sleep(error.retryAfter * 1000);
    // Retry logic happens automatically within SDK!
  } else if (error instanceof AuthenticationError) {
    console.error('Invalid API key');
    // Check your environment variables
  } else if (error instanceof ValidationError) {
    console.error('Invalid request:', error.details);
    // Fix the request parameters
  } else if (error instanceof ZenalyzeServerError) {
    console.error(`Server error (${error.statusCode}):`, error.message);
    // Log to error tracking service
  }
}
```

### Automatic Retries

The SDK automatically retries failed requests with exponential backoff:

- **Rate limits (429):** Respects `Retry-After` header
- **Server errors (5xx):** Exponential backoff (1s, 2s, 4s...)
- **Client errors (4xx):** No retry (fix the request)

**Configuration:**
```typescript
const server = new ZenalyzeServer({
  apiKey: 'your-key',
  maxRetries: 5,  // Default: 3
  timeout: 60000  // Default: 30000 (30 seconds)
});
```

---

## Examples

### Express.js Integration

```typescript
import express from 'express';
import { ZenalyzeServer } from '@zenalyze/server-sdk';

const app = express();
const server = new ZenalyzeServer({
  apiKey: process.env.ZENALYZE_API_KEY
});

// Store encrypted journal entry
app.post('/api/journal', async (req, res) => {
  try {
    const { encryptedData } = req.body;
    const userId = req.user.id; // From auth middleware

    const response = await server.storeEncrypted({
      userId,
      encryptedData,
      metadata: {
        type: 'journal_entry',
        timestamp: Date.now()
      }
    });

    res.json({ dataId: response.dataId });
  } catch (error) {
    console.error('Store failed:', error);
    res.status(500).json({ error: 'Failed to store data' });
  }
});

// Analyze with AI
app.post('/api/analyze', async (req, res) => {
  try {
    const { encryptedData, prompt } = req.body;
    const userId = req.user.id;

    const response = await server.analyzeWithAI({
      encryptedData,
      prompt,
      userId,
      provider: 'openai',
      model: 'gpt-4'
    });

    res.json({
      encryptedResponse: response.encryptedResponse,
      tokensUsed: response.tokensUsed
    });
  } catch (error) {
    console.error('AI analysis failed:', error);
    res.status(500).json({ error: 'Failed to analyze data' });
  }
});

app.listen(3000);
```

### Fastify Integration

```typescript
import Fastify from 'fastify';
import { ZenalyzeServer } from '@zenalyze/server-sdk';

const fastify = Fastify();
const server = new ZenalyzeServer({
  apiKey: process.env.ZENALYZE_API_KEY
});

fastify.post('/api/journal', async (request, reply) => {
  const { encryptedData } = request.body;
  const userId = request.user.id;

  const response = await server.storeEncrypted({
    userId,
    encryptedData
  });

  return { dataId: response.dataId };
});

fastify.listen({ port: 3000 });
```

### NestJS Integration

```typescript
import { Injectable } from '@nestjs/common';
import { ZenalyzeServer } from '@zenalyze/server-sdk';

@Injectable()
export class EncryptionService {
  private server: ZenalyzeServer;

  constructor() {
    this.server = new ZenalyzeServer({
      apiKey: process.env.ZENALYZE_API_KEY
    });
  }

  async storeEncrypted(userId: string, encryptedData: any) {
    return this.server.storeEncrypted({
      userId,
      encryptedData
    });
  }

  async analyzeWithAI(userId: string, encryptedData: any, prompt: string) {
    return this.server.analyzeWithAI({
      userId,
      encryptedData,
      prompt
    });
  }
}
```

### Custom Audit Logging (Datadog)

```typescript
import { ZenalyzeServer } from '@zenalyze/server-sdk';
import { StatsD } from 'node-dogstatsd';

const statsd = new StatsD();

const server = new ZenalyzeServer({
  apiKey: process.env.ZENALYZE_API_KEY,
  auditLogHandler: async (entry) => {
    // Send to Datadog
    statsd.increment('zenalyze.audit.operations', 1, [
      `operation:${entry.operation}`,
      `result:${entry.result}`,
      `user:${entry.userId}`
    ]);

    // Also log to file
    await fs.appendFile(
      '/var/log/zenalyze/audit.log',
      JSON.stringify(entry) + '\n'
    );
  }
});
```

---

## Best Practices

### 1. Environment Variables

Store API key securely:

```typescript
// ✅ Good
const server = new ZenalyzeServer({
  apiKey: process.env.ZENALYZE_API_KEY
});

// ❌ Bad (never hardcode!)
const server = new ZenalyzeServer({
  apiKey: 'zenalyze_abc123'
});
```

### 2. Error Handling

Always handle errors:

```typescript
// ✅ Good
try {
  const response = await server.storeEncrypted({...});
  return response;
} catch (error) {
  logger.error('Zenalyze error:', error);
  // Fallback or user-friendly error
  throw new HttpException('Failed to store data', 500);
}

// ❌ Bad (unhandled errors)
const response = await server.storeEncrypted({...});
```

### 3. Reuse SDK Instance

Create once, reuse everywhere:

```typescript
// ✅ Good (singleton)
export const zenalyzeServer = new ZenalyzeServer({
  apiKey: process.env.ZENALYZE_API_KEY
});

// ❌ Bad (creates new instance each time)
function handler() {
  const server = new ZenalyzeServer({...});
}
```

### 4. Metadata for Searchability

Use metadata for searchable fields (NOT encrypted):

```typescript
// ✅ Good
await server.storeEncrypted({
  userId: 'user123',
  encryptedData: clientData,
  metadata: {
    type: 'journal_entry',
    tags: ['anxiety', 'mood'],
    createdAt: new Date().toISOString()
  }
});

// Can later search by metadata
const entries = await db.find({ 'metadata.type': 'journal_entry' });
```

### 5. Health Checks

Monitor API availability:

```typescript
// Run periodically (e.g., every 5 minutes)
setInterval(async () => {
  const isHealthy = await server.healthCheck();
  if (!isHealthy) {
    alertPagerDuty('Zenalyze API is down!');
  }
}, 5 * 60 * 1000);
```

### 6. Usage Monitoring

Track API usage:

```typescript
// Check usage before expensive operations
const stats = await server.getUsage();

if (stats.apiCallsThisMonth > stats.tierLimit * 0.9) {
  // Warn user or upgrade tier
  console.warn('Approaching API limit');
}
```

---

## TypeScript

Full TypeScript support included:

```typescript
import {
  ZenalyzeServer,
  type ServerConfig,
  type EncryptedData,
  type StoreEncryptedRequest,
  type AnalyzeWithAIResponse,
  ZenalyzeServerError
} from '@zenalyze/server-sdk';

const config: ServerConfig = {
  apiKey: 'your-key'
};

const server = new ZenalyzeServer(config);

const response: AnalyzeWithAIResponse = await server.analyzeWithAI({...});
```

---

## FAQ

### Can the server decrypt the data?

**No.** The server only stores encrypted blobs. Decryption keys are derived client-side and never sent to the server.

### How does AI work on encrypted data?

Data is sent to AWS Nitro Enclave, temporarily decrypted (<100ms) in hardware-isolated memory, sent to AI, response re-encrypted, and plaintext destroyed. See [HOW_WE_RE_DIFFERENT.md](../../HOW_WE_RE_DIFFERENT.md) for details.

### Is this HIPAA compliant?

Yes. The SDK includes automatic audit logging (§164.312(b)), encryption at rest/transit, and zero-knowledge architecture. See docs for full compliance checklist.

### What happens if I lose my API key?

Generate a new one from the Zenalyze dashboard. Old key will be revoked immediately.

### Can I use this with React/Vue/Angular?

No, this is the **server-side** SDK for Node.js. Use [@zenalyze/client-sdk](../client-sdk) for browser/frontend.

### How much does it cost?

See [PITCH_DECK.md](../../PITCH_DECK.md) for pricing. Free tier: 100 calls/day. Starter: $99/month for 10K calls.

---

## License

MIT

## Support

- Documentation: https://docs.zenalyze.com
- Issues: https://github.com/samuelsalfati/zenalyze-encryption-platform/issues
- Email: support@zenalyze.com

---

Built with ❤️ for healthcare developers
