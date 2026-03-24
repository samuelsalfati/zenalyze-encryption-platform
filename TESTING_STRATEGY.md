# Testing Strategy

## 🎯 Testing Philosophy

**Rule: Test behavior, not implementation**

We test at multiple levels:
1. **Unit Tests** - Individual functions/classes
2. **Integration Tests** - Components working together
3. **E2E Tests** - Full user flows
4. **Load Tests** - Performance under stress
5. **Security Tests** - Penetration testing

---

## 📊 Testing Pyramid

```
        /\
       /  \     E2E Tests (10%)
      /    \    - Full user flows
     /------\   - Slow, expensive
    /        \
   /  Integr. \ Integration Tests (30%)
  /    Tests   \- API endpoints
 /--------------\- Services talking
/                \
/   Unit Tests    \ Unit Tests (60%)
/     (Fast!)      \- Individual functions
--------------------\- No external dependencies
```

**Why this ratio?**
- Unit tests: Fast, catch bugs early
- Integration: Verify components work together
- E2E: Catch UX issues, slow but important
- Load: Performance validation
- Security: Compliance requirement

---

## 🧪 Testing Technologies

### For Client SDK (Browser)
- **vitest** - Test runner (fast, ESM support)
- **jsdom** - Browser environment simulation
- **@vitest/coverage-v8** - Code coverage

### For Server SDK (Node.js)
- **vitest** - Test runner
- **axios-mock-adapter** - Mock HTTP calls
- **@vitest/coverage-v8** - Code coverage

### For APIs (Services)
- **vitest** - Test runner
- **supertest** - HTTP assertions
- **testcontainers** - Real databases for tests
- **@vitest/coverage-v8** - Code coverage

### For Load Testing
- **k6** - Load testing tool (by Grafana)
- **Artillery** - Alternative load tester

### For Security Testing
- **OWASP ZAP** - Security scanner
- **npm audit** - Dependency vulnerabilities
- **Snyk** - Continuous security monitoring

---

## 🔬 Unit Testing Strategy

### What We Test

**✅ Test:**
- Public API methods
- Error handling
- Edge cases (null, undefined, empty)
- Validation logic
- Business logic

**❌ Don't Test:**
- Third-party libraries (trust them!)
- Private methods (test through public API)
- Trivial getters/setters
- Framework code

### Example: Client SDK

```typescript
// ZenalyzeEncryption.test.ts
describe('ZenalyzeEncryption', () => {
  it('should encrypt and decrypt data', async () => {
    const enc = new ZenalyzeEncryption({
      email: 'test@example.com',
      password: 'password123'
    });

    const plaintext = 'Secret data';
    const encrypted = await enc.encrypt(plaintext);
    const decrypted = await enc.decrypt(encrypted);

    expect(decrypted).toBe(plaintext);
  });

  it('should fail with wrong password', async () => {
    const enc1 = new ZenalyzeEncryption({
      email: 'test@example.com',
      password: 'password123'
    });

    const encrypted = await enc1.encrypt('Secret');

    const enc2 = new ZenalyzeEncryption({
      email: 'test@example.com',
      password: 'wrong-password'
    });

    await expect(enc2.decrypt(encrypted))
      .rejects.toThrow(EncryptionError);
  });
});
```

**Coverage Goal:** 80%+ (aiming for 100% on critical paths)

---

## 🔗 Integration Testing Strategy

### What We Test

**✅ Test:**
- API endpoints (request → response)
- Database operations (real DB in tests)
- External service integration (mocked)
- Authentication/authorization flows
- Error responses

### Example: Encryption Service API

```typescript
// encryption-service.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from './server';
import { startTestDatabase, stopTestDatabase } from './test-utils';

describe('Encryption Service API', () => {
  beforeAll(async () => {
    await startTestDatabase();
  });

  afterAll(async () => {
    await stopTestDatabase();
  });

  describe('POST /v1/data/store', () => {
    it('should store encrypted data', async () => {
      const response = await request(app)
        .post('/v1/data/store')
        .set('Authorization', 'Bearer test-api-key')
        .send({
          userId: 'user123',
          encryptedData: {
            version: 1,
            ciphertext: 'aB3xK2mP9zT',
            iv: 'rT2vN5kL8pQ',
            authTag: 'mZ9wP6fR4tY',
            timestamp: Date.now()
          }
        })
        .expect(200);

      expect(response.body).toHaveProperty('dataId');
      expect(response.body.status).toBe('success');
    });

    it('should reject invalid API key', async () => {
      await request(app)
        .post('/v1/data/store')
        .set('Authorization', 'Bearer invalid-key')
        .send({...})
        .expect(401);
    });

    it('should enforce rate limits', async () => {
      // Make 101 requests (assuming 100/min limit)
      for (let i = 0; i < 101; i++) {
        const response = await request(app)
          .post('/v1/data/store')
          .set('Authorization', 'Bearer test-key')
          .send({...});

        if (i < 100) {
          expect(response.status).toBe(200);
        } else {
          expect(response.status).toBe(429); // Rate limited
        }
      }
    });
  });
});
```

---

## 🌐 E2E Testing Strategy

### What We Test

**✅ Test:**
- Complete user flows (signup → encrypt → AI → decrypt)
- Cross-service interactions
- Real authentication
- Real database, real Redis
- Browser automation (for client SDK)

### Example: Full Encryption Flow

```typescript
// e2e/encryption-flow.test.ts
import { describe, it, expect } from 'vitest';
import { chromium } from 'playwright'; // Browser automation
import { ZenalyzeServer } from '@zenalyze/server-sdk';

describe('E2E: Encryption Flow', () => {
  it('should encrypt, store, analyze, and decrypt', async () => {
    // 1. Setup
    const server = new ZenalyzeServer({
      apiKey: process.env.ZENALYZE_TEST_API_KEY
    });

    const browser = await chromium.launch();
    const page = await browser.newPage();

    // 2. Client-side encryption (in browser)
    await page.goto('http://localhost:3000/test');

    const encrypted = await page.evaluate(async () => {
      const { ZenalyzeEncryption } = await import('@zenalyze/client-sdk');
      const enc = new ZenalyzeEncryption({
        email: 'test@example.com',
        password: 'test-password'
      });
      return await enc.encrypt({ message: 'I feel anxious today' });
    });

    // 3. Server stores encrypted data
    const stored = await server.storeEncrypted({
      userId: 'test-user',
      encryptedData: encrypted
    });

    expect(stored.dataId).toBeDefined();

    // 4. Server analyzes with AI
    const aiResponse = await server.analyzeWithAI({
      encryptedData: encrypted,
      prompt: 'Analyze this mental health entry',
      userId: 'test-user'
    });

    expect(aiResponse.encryptedResponse).toBeDefined();

    // 5. Client decrypts AI response
    const decrypted = await page.evaluate(async (encryptedResponse) => {
      const { ZenalyzeEncryption } = await import('@zenalyze/client-sdk');
      const enc = new ZenalyzeEncryption({
        email: 'test@example.com',
        password: 'test-password'
      });
      return await enc.decrypt(encryptedResponse);
    }, aiResponse.encryptedResponse);

    expect(decrypted).toContain('anxiety');

    await browser.close();
  });
});
```

**When to run:** Before deployments, nightly builds

---

## 🔥 Load Testing Strategy

### What We Test

**✅ Test:**
- Concurrent users (100, 1000, 10000)
- Requests per second throughput
- Response time percentiles (p50, p95, p99)
- Error rate under load
- Resource usage (CPU, memory)

### Example: k6 Load Test

```javascript
// load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '1m', target: 100 },   // Ramp up to 100 users
    { duration: '3m', target: 100 },   // Stay at 100 users
    { duration: '1m', target: 500 },   // Ramp up to 500 users
    { duration: '3m', target: 500 },   // Stay at 500 users
    { duration: '1m', target: 0 },     // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],  // 95% of requests < 500ms
    http_req_failed: ['rate<0.01'],    // Error rate < 1%
  },
};

export default function () {
  const payload = JSON.stringify({
    userId: 'user123',
    encryptedData: {
      version: 1,
      ciphertext: 'aB3xK2mP9zT',
      iv: 'rT2vN5kL8pQ',
      authTag: 'mZ9wP6fR4tY',
      timestamp: Date.now()
    }
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer test-api-key',
    },
  };

  const response = http.post(
    'http://localhost:3000/v1/data/store',
    payload,
    params
  );

  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(1);
}
```

**Run:**
```bash
k6 run load-test.js
```

**Success Criteria:**
- p95 latency < 500ms
- p99 latency < 1000ms
- Error rate < 1%
- Can handle 1000 concurrent users

---

## 🔒 Security Testing Strategy

### Automated Security Tests

**1. Dependency Scanning (Daily)**
```bash
npm audit
snyk test
```

**2. OWASP ZAP (Weekly)**
```bash
# Start ZAP
docker run -t owasp/zap2docker-stable zap-baseline.py \
  -t http://localhost:3000 \
  -r zap-report.html
```

**3. Secrets Scanning (Pre-commit)**
```bash
# Check for accidentally committed secrets
git secrets --scan
```

### Manual Security Tests (Before Launch)

**1. Penetration Testing**
- Hire external security firm
- Test for OWASP Top 10
- Cost: $10K-$50K

**2. Compliance Audit**
- HIPAA compliance checklist
- Review audit logs
- Test data retention
- Cost: $20K-$50K

---

## 🎯 Testing Checklist (By Week)

### Week 1-2: Client SDK + Server SDK
- ✅ Unit tests (80%+ coverage)
- ✅ Integration tests (API mocking)
- ❌ E2E tests (no API yet)
- ❌ Load tests (no API yet)

### Week 3-4: Encryption Service API
- ✅ Unit tests (controllers, middleware)
- ✅ Integration tests (real endpoints)
- ⚠️  E2E tests (basic flows)
- ❌ Load tests (wait for Nitro Enclave)

### Week 5-7: Nitro Enclave + Infrastructure
- ✅ Unit tests (enclave code)
- ✅ Integration tests (enclave communication)
- ✅ E2E tests (full encryption → AI → decrypt)
- ✅ Load tests (performance validation)

### Week 8-9: Security Audit + Testing
- ✅ All tests passing
- ✅ 80%+ code coverage
- ✅ Load tests meet SLAs
- ✅ Security scan passed
- ✅ Penetration test passed

### Week 10-12: Zenalyze Integration + Launch
- ✅ E2E tests with real app
- ✅ Production monitoring setup
- ✅ Incident response plan
- ✅ Load test production (limited traffic)

---

## 📊 CI/CD Testing Pipeline

### GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: test
      redis:
        image: redis:7

    steps:
      - uses: actions/checkout@v3

      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      # Unit tests
      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm test

      - name: Check coverage
        run: |
          npm run test:coverage
          if [ $(npm run test:coverage | grep "All files" | awk '{print $4}' | sed 's/%//') -lt 80 ]; then
            echo "Coverage below 80%!"
            exit 1
          fi

      # Integration tests
      - name: Run integration tests
        run: npm run test:integration
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/test
          REDIS_URL: redis://localhost:6379

      # Security scan
      - name: Security audit
        run: npm audit --audit-level=moderate

      # Build
      - name: Build
        run: npm run build
```

---

## 🎓 Testing Best Practices

### 1. Test Naming Convention

```typescript
// ✅ Good - Descriptive
it('should reject decryption with wrong password', async () => {});

// ❌ Bad - Vague
it('should fail', async () => {});
```

### 2. Arrange-Act-Assert Pattern

```typescript
it('should store encrypted data', async () => {
  // Arrange
  const server = new ZenalyzeServer({ apiKey: 'test' });
  const data = { encryptedData: {...} };

  // Act
  const response = await server.storeEncrypted(data);

  // Assert
  expect(response.dataId).toBeDefined();
});
```

### 3. Test Isolation

```typescript
// ✅ Good - Each test is independent
beforeEach(() => {
  // Reset state before each test
  server = new ZenalyzeServer({ apiKey: 'test' });
});

// ❌ Bad - Tests depend on each other
let globalState;
it('test 1', () => { globalState = 'foo'; });
it('test 2', () => { expect(globalState).toBe('foo'); }); // Brittle!
```

### 4. Mock External Dependencies

```typescript
// ✅ Good - Mock API calls
vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => ({
      post: vi.fn().mockResolvedValue({ data: {...} })
    }))
  }
}));

// ❌ Bad - Real API calls in tests (slow, brittle)
const response = await axios.post('https://api.zenalyze.com/...');
```

### 5. Test Edge Cases

```typescript
describe('Edge cases', () => {
  it('should handle null input', async () => {});
  it('should handle undefined input', async () => {});
  it('should handle empty string', async () => {});
  it('should handle very long strings (100KB+)', async () => {});
  it('should handle special characters', async () => {});
  it('should handle Unicode (emojis, Chinese, Arabic)', async () => {});
});
```

---

## 🚀 Running Tests

### Unit Tests
```bash
# Run once
npm test

# Watch mode (re-run on file changes)
npm run test:watch

# Coverage report
npm run test:coverage
```

### Integration Tests
```bash
# Start test database
docker-compose -f docker-compose.test.yml up -d

# Run integration tests
npm run test:integration

# Stop test database
docker-compose -f docker-compose.test.yml down
```

### E2E Tests
```bash
# Start all services
docker-compose up -d

# Run E2E tests
npm run test:e2e

# Stop services
docker-compose down
```

### Load Tests
```bash
# Install k6
brew install k6  # Mac
# or
sudo apt install k6  # Ubuntu

# Run load test
k6 run load-test.js

# Run with specific VUs (virtual users)
k6 run --vus 100 --duration 30s load-test.js
```

### Security Tests
```bash
# Dependency audit
npm audit

# Snyk scan
npx snyk test

# OWASP ZAP
docker run -t owasp/zap2docker-stable zap-baseline.py \
  -t http://localhost:3000
```

---

## 📈 Test Metrics & Goals

### Coverage Goals
- **Client SDK:** 90%+ (critical security code)
- **Server SDK:** 85%+ (API integration)
- **Services:** 80%+ (business logic)
- **Overall:** 85%+

### Performance Goals
- **Unit tests:** <10 seconds total
- **Integration tests:** <2 minutes total
- **E2E tests:** <10 minutes total
- **Load tests:** Meet SLA (p95 < 500ms)

### Quality Goals
- **Zero critical bugs** in production
- **<5% test flakiness** (tests should be deterministic)
- **100% of PRs** have tests
- **All tests pass** before merge

---

## ✅ Summary

**Testing Strategy:**
1. **Unit tests (60%)** - Fast, catch bugs early
2. **Integration tests (30%)** - Verify components work together
3. **E2E tests (10%)** - Validate user flows
4. **Load tests** - Performance validation
5. **Security tests** - HIPAA compliance

**Tools:**
- vitest (fast, modern test runner)
- supertest (API testing)
- k6 (load testing)
- OWASP ZAP (security scanning)

**CI/CD:**
- Run all tests on every commit
- Block merge if tests fail
- Coverage must be 80%+
- Security scans daily

**Next:** Let's build Week 3 with testing built-in! 🚀
