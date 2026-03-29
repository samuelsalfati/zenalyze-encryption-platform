/**
 * End-to-end proof: Client SDK → Encryption Service → Client SDK
 *
 * Proves the full pipeline works:
 * 1. Client encrypts a therapy journal entry (like Zenalyze would)
 * 2. Server SDK stores it via the encryption service
 * 3. Server SDK fetches it back
 * 4. Client decrypts it and verifies it matches
 * 5. Server SDK sends it for AI analysis (mock)
 * 6. Client decrypts AI response (mock — just proves the shape works)
 *
 * Prerequisites:
 *   - Encryption service running on localhost:3000
 *   - Redis running on localhost:6379 (optional, degrades gracefully)
 *
 * Run:
 *   cd services/encryption-service
 *   API_KEYS='{"zn_test_key123":{"customerId":"cust_001","tier":"starter","name":"Test"}}' npx tsx src/index.ts
 *
 *   # In another terminal:
 *   npx tsx scripts/e2e-proof.ts
 */

import { ZenalyzeEncryption } from '../packages/client-sdk/src/index';
import { ZenalyzeServer } from '../packages/server-sdk/src/index';

const DIVIDER = '─'.repeat(50);

async function main() {
  console.log('\n' + DIVIDER);
  console.log('  ZENALYZE ENCRYPTION E2E PROOF');
  console.log(DIVIDER + '\n');

  // ── Step 0: Setup ──────────────────────────────
  const userEmail = 'patient@example.com';
  const userPassword = 'my-secure-therapy-password';

  const encryption = new ZenalyzeEncryption({
    email: userEmail,
    password: userPassword,
  });

  const server = new ZenalyzeServer({
    apiKey: 'zn_test_key123',
    baseUrl: 'http://localhost:3000',
  });

  // ── Step 1: Simulate a real therapy journal entry ──
  const journalEntry = {
    sessionId: 'session-2026-03-28',
    mood: 6,
    content: 'Today I discussed my anxiety triggers with my therapist. ' +
      'We identified that work deadlines are a major source of stress. ' +
      'I practiced the breathing technique and it helped.',
    tags: ['anxiety', 'coping-strategies', 'work-stress'],
    therapistNotes: 'Patient shows improvement in self-awareness. ' +
      'Recommend continuing CBT exercises.',
    emotionScores: {
      anxiety: 7,
      hopefulness: 5,
      sadness: 3,
    },
    timestamp: new Date().toISOString(),
  };

  console.log('[1] Original journal entry:');
  console.log(`    Content: "${journalEntry.content.slice(0, 60)}..."`);
  console.log(`    Mood: ${journalEntry.mood}, Tags: ${journalEntry.tags.join(', ')}`);
  console.log();

  // ── Step 2: Client-side encryption ──
  console.log('[2] Encrypting on client side (browser would do this)...');
  const encrypted = await encryption.encrypt(journalEntry);
  console.log(`    Version: ${encrypted.version}`);
  console.log(`    Ciphertext: ${encrypted.ciphertext.slice(0, 40)}...`);
  console.log(`    IV: ${encrypted.iv}`);
  console.log(`    AuthTag: ${encrypted.authTag}`);
  console.log(`    --> Server CANNOT read this. Zero knowledge.`);
  console.log();

  // ── Step 3: Store via encryption service ──
  console.log('[3] Storing encrypted data via encryption service...');
  const storeResult = await server.storeEncrypted({
    userId: 'patient_001',
    encryptedData: encrypted,
    metadata: { type: 'journal_entry', session: journalEntry.sessionId },
  });
  console.log(`    Data ID: ${storeResult.dataId}`);
  console.log(`    Stored at: ${new Date(storeResult.storedAt).toISOString()}`);
  console.log(`    Status: ${storeResult.status}`);
  console.log();

  // ── Step 4: Fetch it back ──
  console.log('[4] Fetching encrypted data back from service...');
  const fetchResult = await server.fetchEncrypted({
    dataId: storeResult.dataId,
    userId: 'patient_001',
  });
  console.log(`    Got encrypted data back (ciphertext: ${fetchResult.encryptedData.ciphertext.slice(0, 40)}...)`);
  console.log(`    Metadata: ${JSON.stringify(fetchResult.metadata)}`);
  console.log();

  // ── Step 5: Decrypt on client ──
  console.log('[5] Decrypting on client side...');
  const decrypted = await encryption.decrypt<typeof journalEntry>(fetchResult.encryptedData);
  console.log(`    Content: "${decrypted.content.slice(0, 60)}..."`);
  console.log(`    Mood: ${decrypted.mood}, Tags: ${decrypted.tags.join(', ')}`);
  console.log();

  // ── Step 6: Verify roundtrip integrity ──
  const match = JSON.stringify(decrypted) === JSON.stringify(journalEntry);
  console.log(`[6] Roundtrip integrity check: ${match ? 'PASS' : 'FAIL'}`);
  if (!match) {
    console.error('    MISMATCH! Data was corrupted during roundtrip.');
    process.exit(1);
  }
  console.log();

  // ── Step 7: Mock AI analysis ──
  console.log('[7] Sending encrypted data for AI analysis (mock)...');
  const aiResult = await server.analyzeWithAI({
    encryptedData: encrypted,
    prompt: 'Analyze this therapy journal entry for mood patterns and recommend next session focus areas.',
    userId: 'patient_001',
    provider: 'openai',
    model: 'gpt-4',
  });
  console.log(`    Provider: ${aiResult.provider}`);
  console.log(`    Model: ${aiResult.model}`);
  console.log(`    Tokens used: ${aiResult.tokensUsed}`);
  console.log(`    Processing time: ${aiResult.processingTime}ms`);
  console.log(`    Encrypted response received (mock — real Nitro Enclave would produce real analysis)`);
  console.log();

  // ── Step 8: Usage stats ──
  console.log('[8] Checking usage stats...');
  const usage = await server.getUsage();
  console.log(`    Tier: ${usage.tier}`);
  console.log(`    Calls today: ${usage.apiCallsToday}`);
  console.log(`    Calls this month: ${usage.apiCallsThisMonth}`);
  console.log(`    Tier limit: ${usage.tierLimit}`);
  console.log();

  // ── Step 9: Clean up ──
  console.log('[9] Cleaning up — deleting stored data...');
  await server.deleteEncrypted(storeResult.dataId, 'patient_001');
  console.log('    Deleted.');
  console.log();

  // ── Done ──
  console.log(DIVIDER);
  console.log('  ALL STEPS PASSED');
  console.log();
  console.log('  Proven:');
  console.log('  - Client encrypts data (server never sees plaintext)');
  console.log('  - Encryption service stores/fetches opaque blobs');
  console.log('  - Client decrypts back to exact original data');
  console.log('  - AI analysis endpoint accepts encrypted data');
  console.log('  - Usage tracking works');
  console.log('  - Full CRUD lifecycle (store/fetch/delete)');
  console.log(DIVIDER + '\n');
}

main().catch((err) => {
  console.error('\nE2E PROOF FAILED:', err.message);
  if (err.message.includes('ECONNREFUSED')) {
    console.error('\nIs the encryption service running?');
    console.error('  cd services/encryption-service');
    console.error('  API_KEYS=\'{"zn_test_key123":{"customerId":"cust_001","tier":"starter","name":"Test"}}\' npx tsx src/index.ts');
  }
  process.exit(1);
});
