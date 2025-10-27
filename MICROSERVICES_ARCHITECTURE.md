# Microservices Architecture

## 🏗️ Platform Overview

The Zenalyze Encryption Platform is built as a distributed microservices architecture optimized for healthcare AI applications requiring HIPAA compliance and zero-knowledge encryption.

---

## 📦 Core Components

### 1. Client SDK (`packages/client-sdk`)

**Purpose:** Browser-side encryption library for web applications

**Responsibilities:**
- Derive encryption keys from user credentials (PBKDF2)
- Encrypt/decrypt data in browser before sending to server
- Manage local key material securely
- Zero server-side key exposure

**Tech Stack:**
- TypeScript
- Web Crypto API
- Tree-shakeable ES modules
- Zero dependencies (security)

**API Design:**
```typescript
import { ZenalyzeEncryption } from '@zenalyze/client-sdk';

// Initialize with user credentials
const encryption = new ZenalyzeEncryption({
  email: 'user@example.com',
  password: 'user-password' // Never sent to server
});

// Encrypt data
const encrypted = await encryption.encrypt({
  message: 'Sensitive health data'
});

// Decrypt data
const decrypted = await encryption.decrypt(encrypted);
```

**Key Features:**
- ✅ Deterministic key derivation (same creds = same key)
- ✅ No server can ever see the key
- ✅ Works entirely offline after initial setup
- ✅ Supports binary data (images, PDFs, etc.)

---

### 2. Server SDK (`packages/server-sdk`)

**Purpose:** Node.js integration helpers for backend applications

**Responsibilities:**
- Store encrypted data (can't read it)
- Proxy encrypted data to AI Privacy Service
- HIPAA audit logging
- User authentication (but not encryption key management)

**Tech Stack:**
- TypeScript
- Node.js 18+
- Minimal dependencies

**API Design:**
```typescript
import { ZenalyzeServer } from '@zenalyze/server-sdk';

const server = new ZenalyzeServer({
  apiKey: process.env.ZENALYZE_API_KEY
});

// Store encrypted data (server can't read it)
await server.storeEncrypted({
  userId: 'user123',
  encryptedData: clientEncryptedData
});

// Send to AI Privacy Service for analysis
const response = await server.analyzeWithAI({
  encryptedData: clientEncryptedData,
  prompt: 'Analyze this therapy session'
});
```

**Key Features:**
- ✅ Never handles plaintext
- ✅ Automatic audit logs for HIPAA
- ✅ Rate limiting and authentication
- ✅ Webhook support for async operations

---

### 3. AI Privacy Service (`services/ai-privacy-service`)

**Purpose:** Secure AI processing using AWS Nitro Enclaves

**Architecture:**
```
┌─────────────────────────────────────────┐
│         Client Application              │
│  (Data encrypted with user's key)       │
└──────────────┬──────────────────────────┘
               │ Encrypted Data
               ▼
┌─────────────────────────────────────────┐
│        Server SDK / API Gateway          │
│    (Can't decrypt - just proxies)       │
└──────────────┬──────────────────────────┘
               │ Still Encrypted
               ▼
┌─────────────────────────────────────────┐
│      AWS Nitro Enclave (Isolated)       │
│  ┌───────────────────────────────────┐  │
│  │ 1. Decrypt data (in secure HW)    │  │
│  │ 2. Send plaintext to AI           │  │
│  │ 3. Receive AI response            │  │
│  │ 4. Re-encrypt response            │  │
│  │ 5. Destroy plaintext from memory  │  │
│  └───────────────────────────────────┘  │
│         (All in <100ms)                 │
└──────────────┬──────────────────────────┘
               │ Encrypted Response
               ▼
┌─────────────────────────────────────────┐
│         Client Application              │
│  (Decrypts response with user's key)    │
└─────────────────────────────────────────┘
```

**Why Nitro Enclaves:**
- ✅ Hardware-isolated compute environment
- ✅ No SSH access, even for root
- ✅ Cryptographically attestable (prove code hasn't changed)
- ✅ Memory is scrubbed immediately after use
- ✅ Compliance requirement for HIPAA + AI

**Tech Stack:**
- AWS Nitro Enclaves
- Python 3.11 (enclave runtime)
- OpenAI/Anthropic SDKs
- KMS for key retrieval

**Data Flow:**
1. Receive encrypted data via vsock (secure channel)
2. Retrieve decryption key from KMS (attestation required)
3. Decrypt data in enclave memory
4. Send plaintext to AI API
5. Receive AI response
6. Re-encrypt response
7. Scrub all plaintext from memory
8. Return encrypted response

**Security Guarantees:**
- Plaintext exists for <100ms
- No disk writes ever
- No network access except AI APIs (whitelist)
- Auditable via AWS CloudWatch

---

### 4. Key Management Service (`services/key-management-service`)

**Purpose:** Secure key derivation and rotation (NOT storage of user keys!)

**Responsibilities:**
- Manage platform-level encryption keys (for metadata)
- Key rotation automation
- Access control policies
- Integration with AWS KMS

**Tech Stack:**
- Node.js/TypeScript
- AWS KMS
- Redis for caching
- PostgreSQL for audit logs

**Important:** This does NOT manage user encryption keys (those are derived client-side). This manages platform keys for encrypting metadata like usernames, email addresses, etc.

**API Design:**
```typescript
// Platform keys only (not user keys!)
const platformKey = await kms.getMetadataKey({
  purpose: 'encrypt-username',
  version: 'v1'
});

// User keys are NEVER managed server-side
// They're derived client-side from credentials
```

---

### 5. Encryption Service (`services/encryption-service`)

**Purpose:** REST API gateway for encryption operations

**Responsibilities:**
- Authentication/authorization
- Rate limiting
- Usage tracking for billing
- Load balancing across Nitro Enclaves
- API documentation

**Tech Stack:**
- Node.js/Fastify
- Redis for rate limiting
- PostgreSQL for usage metrics
- AWS ALB for load balancing

**API Endpoints:**
```
POST /v1/encrypt
POST /v1/decrypt
POST /v1/ai/analyze (proxies to Nitro Enclave)
GET  /v1/health
GET  /v1/usage (for customer dashboards)
```

**Rate Limits (by tier):**
- Free: 100 req/day
- Starter ($99/mo): 10,000 req/month
- Pro ($499/mo): 100,000 req/month
- Enterprise ($999/mo): Unlimited

---

## 🔄 Data Flow Diagrams

### Scenario 1: User Creates Encrypted Journal Entry

```
┌─────────┐
│ Browser │
└────┬────┘
     │ 1. User types journal entry
     │
     ▼
┌─────────────────────────────┐
│   Client SDK (Browser)       │
│  - Derives key from password │
│  - Encrypts entry locally    │
└────┬────────────────────────┘
     │ 2. POST /api/journal (encrypted)
     ▼
┌─────────────────────────────┐
│   Zenalyze API Server        │
│  - Can't read entry          │
│  - Stores encrypted blob     │
└────┬────────────────────────┘
     │ 3. INSERT encrypted_data
     ▼
┌─────────────────────────────┐
│      PostgreSQL              │
│  (Stores encrypted data)     │
└─────────────────────────────┘
```

**Key Points:**
- Server never sees plaintext
- Database stores only encrypted blobs
- User's key never leaves browser

---

### Scenario 2: AI Analyzes Encrypted Journal Entry

```
┌─────────┐
│ Browser │
└────┬────┘
     │ 1. "Analyze my journal"
     │
     ▼
┌─────────────────────────────┐
│   Zenalyze API Server        │
│  - Fetches encrypted entry   │
│  - Proxies to AI Privacy Svc │
└────┬────────────────────────┘
     │ 2. POST /ai/analyze (still encrypted)
     ▼
┌─────────────────────────────────┐
│   AI Privacy Service             │
│   (AWS Nitro Enclave)            │
│  ┌───────────────────────────┐  │
│  │ 3. Decrypt in enclave     │  │
│  │ 4. POST to OpenAI API     │  │
│  │ 5. Receive AI response    │  │
│  │ 6. Re-encrypt response    │  │
│  │ 7. Scrub memory           │  │
│  └───────────────────────────┘  │
└────┬────────────────────────────┘
     │ 8. Return encrypted AI response
     ▼
┌─────────────────────────────┐
│   Zenalyze API Server        │
│  - Proxies encrypted response│
└────┬────────────────────────┘
     │ 9. Encrypted response
     ▼
┌─────────────────────────────┐
│   Client SDK (Browser)       │
│  - Decrypts AI response      │
│  - Shows to user             │
└─────────────────────────────┘
```

**Key Points:**
- Plaintext exists only in Nitro Enclave (hardware-isolated)
- Exists for <100ms
- No disk writes, immediate memory scrub
- Cryptographically attestable

---

## 🔐 Security Architecture

### Key Derivation (Client-Side Only)

```typescript
// In browser (Client SDK)
function deriveKey(email: string, password: string): CryptoKey {
  // 1. Create deterministic salt from email
  const salt = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(email)
  );

  // 2. Derive key using PBKDF2
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  // 3. Derive AES-GCM key (100,000 iterations)
  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );

  return key;
}
```

**Security Properties:**
- ✅ Same credentials always produce same key (deterministic)
- ✅ Password never sent to server
- ✅ Server can't derive key (doesn't have password)
- ✅ 100,000 iterations (slow enough to prevent brute force)
- ✅ Email as salt (unique per user)

---

### Encryption Format

```
┌─────────────────────────────────────────┐
│         Encrypted Data Blob              │
├─────────────────────────────────────────┤
│  Version (1 byte)      │ 0x01            │
│  IV (12 bytes)         │ Random nonce    │
│  Auth Tag (16 bytes)   │ GCM tag         │
│  Ciphertext (variable) │ Encrypted data  │
└─────────────────────────────────────────┘
```

**Format:**
- Version byte for future algorithm changes
- Random IV for each encryption
- GCM authentication tag (integrity)
- Base64-encoded for transport

---

## 🚀 Deployment Architecture

### Development Environment
```
Local machine:
  - Client SDK: npm run dev
  - Server SDK: npm run dev
  - Encryption Service: docker-compose up
  - AI Privacy Service: Mocked (no Nitro locally)
```

### Production Environment
```
AWS Region: us-east-1

┌─────────────────────────────────────┐
│         CloudFront (CDN)            │
└─────────────┬───────────────────────┘
              ▼
┌─────────────────────────────────────┐
│      Application Load Balancer      │
└─────┬─────────────┬─────────────────┘
      ▼             ▼
┌─────────────┐ ┌─────────────┐
│  Encryption │ │  Encryption │
│  Service    │ │  Service    │
│  (Fargate)  │ │  (Fargate)  │
└──────┬──────┘ └──────┬──────┘
       └────────┬───────┘
                ▼
       ┌─────────────────┐
       │  AI Privacy Svc  │
       │ (Nitro Enclave)  │
       │   EC2 c6a.2xl    │
       └─────────────────┘

Database Layer:
  - PostgreSQL (RDS Aurora)
  - Redis (ElastiCache)

Key Management:
  - AWS KMS (FIPS 140-2 Level 3)
```

**Scaling Strategy:**
- Encryption Service: Auto-scale ECS Fargate (2-10 instances)
- AI Privacy Service: 1 Nitro Enclave per EC2 (scale EC2 instances)
- Database: Aurora auto-scaling read replicas

---

## 📊 Observability

### Metrics to Track
```
Application Metrics:
  - Encryption operations/sec
  - Decryption operations/sec
  - AI processing latency (p50, p95, p99)
  - Enclave memory usage
  - Key derivation time

Business Metrics:
  - API calls per customer
  - Customer tier distribution
  - Revenue per service

Security Metrics:
  - Failed authentication attempts
  - Rate limit violations
  - Unusual access patterns
```

### Logging Strategy
```
Application Logs:
  - Structured JSON logs
  - No PII/PHI ever logged
  - Request IDs for tracing

Audit Logs (HIPAA required):
  - Who accessed what (user IDs only)
  - When (timestamp)
  - What operation (encrypt/decrypt/analyze)
  - Result (success/failure)
  - Stored in immutable S3 bucket
```

---

## 🧪 Testing Strategy

### Unit Tests
- All SDK functions
- Encryption/decryption correctness
- Key derivation determinism

### Integration Tests
- Client SDK ↔ Server SDK
- Server SDK ↔ Encryption Service
- Encryption Service ↔ AI Privacy Service

### Security Tests
- Penetration testing (quarterly)
- Dependency scanning (daily)
- Secrets scanning (pre-commit)

### Compliance Tests
- HIPAA audit log completeness
- Data retention policies
- Encryption at rest/transit
- Key rotation procedures

---

## 📝 API Versioning

**Strategy:** URL-based versioning

```
/v1/encrypt   ← Current stable
/v2/encrypt   ← Future (breaking changes only)
```

**Backward Compatibility:**
- Never break v1 API
- Deprecation warnings 6 months before removal
- Automatic migration tools for customers

---

## 🎯 Success Metrics

**Technical:**
- ✅ <100ms encryption/decryption latency (p95)
- ✅ <500ms AI processing latency (p95)
- ✅ 99.9% uptime SLA
- ✅ Zero plaintext data breaches (ever)

**Business:**
- ✅ 2-week integration time for customers
- ✅ 10 customers by Month 6
- ✅ 50 customers by Month 12
- ✅ $50K MRR by Month 12

---

## 🔗 Integration with Zenalyze App

Zenalyze will be the first customer:

```typescript
// In Zenalyze codebase
import { ZenalyzeEncryption } from '@zenalyze/client-sdk';
import { ZenalyzeServer } from '@zenalyze/server-sdk';

// Client-side (React Native)
const encryption = new ZenalyzeEncryption({
  email: user.email,
  password: userPassword
});

const encryptedJournal = await encryption.encrypt({
  entry: journalText
});

// Server-side (Hono API)
const server = new ZenalyzeServer({
  apiKey: process.env.ZENALYZE_PLATFORM_API_KEY
});

const aiAnalysis = await server.analyzeWithAI({
  encryptedData: encryptedJournal,
  prompt: 'Analyze this journal entry'
});
```

**Migration Plan:**
1. Keep current Zenalyze encryption as-is
2. Build platform independently
3. Create migration script (Week 10)
4. Run both systems in parallel (Week 11)
5. Cut over to platform (Week 12)
6. Remove old encryption code (Week 13)

---

## 🚨 Disaster Recovery

**Backup Strategy:**
- Database: Automated daily snapshots (30-day retention)
- Audit logs: Immutable S3 (7-year retention for HIPAA)
- Secrets: KMS key material backed up to separate region

**Recovery Time Objective (RTO):** 1 hour
**Recovery Point Objective (RPO):** 5 minutes

**Failover Plan:**
- Multi-AZ deployment (automatic)
- Cross-region read replicas (manual promotion)
- Runbooks for common incidents

---

## ✅ Ready to Build

This architecture is designed for:
- ✅ HIPAA compliance
- ✅ Zero-knowledge security
- ✅ Horizontal scalability
- ✅ Self-service integration
- ✅ B2B SaaS business model

**Next:** Read `DEVELOPMENT_PLAN.md` for week-by-week implementation guide.
