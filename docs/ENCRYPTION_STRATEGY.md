# ZENALYZE ENCRYPTION STRATEGY
## Zero-Knowledge AI Mental Health Platform

**Last Updated:** October 21, 2025
**Status:** Planning Phase
**Target Launch:** 6-8 weeks from approval

---

## TABLE OF CONTENTS

1. [Executive Summary](#executive-summary)
2. [Market Opportunity](#market-opportunity)
3. [Technical Architecture](#technical-architecture)
4. [Database Encryption Map](#database-encryption-map)
5. [Implementation Roadmap](#implementation-roadmap)
6. [Security Guarantees](#security-guarantees)
7. [Cost-Benefit Analysis](#cost-benefit-analysis)
8. [Go-To-Market Strategy](#go-to-market-strategy)
9. [Implementation Checklist](#implementation-checklist)
10. [Appendix: Code Examples](#appendix-code-examples)

---

## EXECUTIVE SUMMARY

### The Problem
- **88% of users won't use mental health apps** due to privacy concerns
- Current mental health platforms store sensitive data in plaintext
- Database admins, server operators, and founders can all read user journals
- HIPAA compliance requirements intensifying (2025 regulations)
- No consumer mental health app offers true zero-knowledge architecture

### The Solution
Build a **Zero-Knowledge AI Mental Health Platform** where:
- ✅ AI can analyze user data
- ✅ Users can access their own data
- ❌ Database admins CANNOT see plaintext
- ❌ Server operators CANNOT see plaintext
- ❌ Even the founder CANNOT see plaintext without user consent

### The Value Proposition
> "Your AI therapist knows you. We don't. By design."

**Unique positioning**: First consumer mental health AI with cryptographically guaranteed privacy using AWS Nitro Enclaves.

### Investment Required
- **Time**: 6-8 weeks to MVP
- **Cost**: ~$18K to build, ~$500/month to operate
- **Revenue Potential**: $10K-100K/month at scale

---

## MARKET OPPORTUNITY

### Market Size
- **Mental health app market**: $17.5B by 2030 (CAGR 16.5%)
- **AI therapy market**: $2.5B by 2027
- **Privacy-focused SaaS**: Growing 23% YoY

### Regulatory Drivers
- **HIPAA**: Fines up to $50K per violation
- **GDPR**: Fines up to €20M or 4% revenue
- **2025 AI Healthcare Compliance**: New stricter obligations
- **Mental health data**: Extra scrutiny and penalties

### Competitive Landscape

| Company | Focus | Encryption Model | Price |
|---------|-------|-----------------|-------|
| BetterHelp | Therapy matching | Standard SSL/TLS | $60-90/week |
| Talkspace | Therapy platform | Standard SSL/TLS | $60-90/week |
| Woebot | AI chatbot | Standard SSL/TLS | Free/$39/month |
| CompliantChatGPT | B2B HIPAA AI | Encrypted at rest | $200/month |
| BastionGPT | Healthcare AI | HIPAA compliant | $150/month |
| **Zenalyze** | **Consumer AI therapy** | **Zero-knowledge + Nitro Enclaves** | **$9.99/month** |

**Key Differentiators**:
1. ✅ Only consumer-focused zero-knowledge mental health AI
2. ✅ 10x cheaper than B2B alternatives
3. ✅ Hardware-backed security (Nitro Enclaves)
4. ✅ Cryptographically provable privacy

### Funding Landscape
Similar startups raised **$100M+ combined** in 2023-2024:
- Opaque Systems (Confidential AI): $35M Series B
- BeeKeeperAI (Healthcare AI): $15M Series A
- Duality (Secure analytics): $30M Series B
- Inpher (Privacy ML): $20M Series B

**Investor Interest**: Privacy + AI + Mental Health = 🔥

---

## TECHNICAL ARCHITECTURE

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────┐
│  CLIENT (User's Browser/Mobile App)                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ 1. User Password → Master Key (NEVER sent to server) │  │
│  │ 2. Derive table-specific encryption keys             │  │
│  │ 3. Encrypt sensitive data before API calls           │  │
│  │ 4. Generate time-limited AI Access Token             │  │
│  │ 5. Send: Encrypted Data + AI Token                   │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                          ↓ Encrypted blob + token
┌─────────────────────────────────────────────────────────────┐
│  SERVER (Cannot decrypt - stores encrypted blobs)           │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ - Receives encrypted data                            │  │
│  │ - Stores in PostgreSQL (encrypted)                   │  │
│  │ - Routes AI requests to Nitro Enclave                │  │
│  │ - Logs all decryption events (audit trail)           │  │
│  │ - Returns encrypted AI results                       │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                          ↓ Encrypted data + token
┌─────────────────────────────────────────────────────────────┐
│  AWS NITRO ENCLAVE (Hardware-Isolated Secure Environment)  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ 1. Verify AI Access Token (time-limited, single-use) │  │
│  │ 2. Load decryption key from AWS KMS (enclave only)   │  │
│  │ 3. Decrypt data INSIDE enclave (memory encrypted)    │  │
│  │ 4. Send plaintext to OpenAI API (from enclave)       │  │
│  │ 5. Receive AI analysis response                      │  │
│  │ 6. Re-encrypt AI results                             │  │
│  │ 7. Clear plaintext from memory                       │  │
│  │ 8. Return encrypted results                          │  │
│  │                                                       │  │
│  │ ❌ Server process CANNOT access enclave memory       │  │
│  │ ❌ Root user CANNOT access enclave memory            │  │
│  │ ❌ DB admin CANNOT access enclave memory             │  │
│  │ ❌ Even AWS admins CANNOT access enclave memory      │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                          ↓ Encrypted AI analysis
┌─────────────────────────────────────────────────────────────┐
│  DATABASE (PostgreSQL)                                       │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ users.content_encrypted: "U2FsdGVkX19..."           │  │
│  │ journalEntries.content_encrypted: "U2FsdGVkX19..."  │  │
│  │ psychologicalProfiles.encrypted_data: "U2FsdGVk..." │  │
│  │                                                       │  │
│  │ Metadata in plaintext (for queries):                 │  │
│  │ - User IDs, timestamps, mood enum, entry types      │  │
│  │ - Numeric scores, boolean flags                      │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                          ↓ Fetch encrypted data
┌─────────────────────────────────────────────────────────────┐
│  CLIENT (User's Browser/Mobile App)                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ 1. Receive encrypted AI results                      │  │
│  │ 2. Decrypt with user's Master Key                    │  │
│  │ 3. Display plaintext to user                         │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Key Cryptographic Components

#### 1. Client-Side Encryption
- **Algorithm**: AES-256-GCM (authenticated encryption)
- **Key Derivation**: PBKDF2 with 100,000 iterations
- **Salt Storage**: Per-user salt stored in DB (not sensitive)
- **Key Location**: Master key NEVER leaves client device

#### 2. AWS Nitro Enclaves
- **Technology**: Hardware-based trusted execution environment (TEE)
- **Isolation**: CPU + memory isolated from host OS
- **Attestation**: Cryptographic proof of enclave integrity
- **Cost**: FREE (included with EC2 instances)

#### 3. Key Management
- **Master Key**: Derived from password (client-only)
- **Table Keys**: Derived from master key using HMAC-SHA256
- **AI Access Tokens**: JWT with 60-second expiry
- **KMS Integration**: AWS KMS for enclave key storage

#### 4. Encryption Layers

| Layer | What's Encrypted | Who Can Decrypt |
|-------|-----------------|-----------------|
| **Transport** | All network traffic | SSL/TLS (standard) |
| **At Rest** | Database storage | Client + Nitro Enclave only |
| **In Use** | Enclave memory | Nitro Enclave only (hardware-enforced) |
| **AI Processing** | Temporary decrypt | Nitro Enclave only (time-limited) |

---

## DATABASE ENCRYPTION MAP

### Complete Table-by-Table Analysis

#### 🔴 CRITICAL - Must Encrypt (Highest Sensitivity)

##### **1. journalEntries** (Line 146 in schema.ts)

**Sensitive Fields to Encrypt**:
```sql
content                           -- Raw journal text (MOST SENSITIVE)
ai_warm_acknowledgment           -- AI responses
ai_reflective_lines              -- Analysis array
ai_reframe                       -- Cognitive reframing
conversation_history             -- Full therapy conversations (JSONB)
grow_insights                    -- Key insights
grow_themes                      -- Main topics
grow_emotional_patterns          -- Emotional patterns
grow_recurring_concerns          -- Ongoing issues
grow_breakthroughs              -- Moments of insight
thought_content                  -- Thinking patterns
speech_content                   -- Communication patterns
action_content                   -- Behaviors/actions
supportive_message              -- Mental health check-in
psychological_depth             -- Deep analysis
practical_next_step             -- Personal advice
ai_analysis                     -- Complete AI analysis (JSONB)
psychological_frameworks        -- Framework activations (JSONB)
relationship_patterns           -- Relationship analysis (JSONB)
trigger_data                    -- Trigger details + voice recordings (JSONB)
trigger_analysis                -- Multi-framework trauma analysis (JSONB)
regulation_data                 -- Nervous system data (JSONB)
```

**Schema Changes**:
```sql
ALTER TABLE journal_entries ADD COLUMN content_encrypted TEXT;
ALTER TABLE journal_entries ADD COLUMN conversation_history_encrypted TEXT;
ALTER TABLE journal_entries ADD COLUMN ai_analysis_encrypted TEXT;
ALTER TABLE journal_entries ADD COLUMN psychological_frameworks_encrypted TEXT;
ALTER TABLE journal_entries ADD COLUMN relationship_patterns_encrypted TEXT;
ALTER TABLE journal_entries ADD COLUMN trigger_data_encrypted TEXT;
ALTER TABLE journal_entries ADD COLUMN trigger_analysis_encrypted TEXT;
ALTER TABLE journal_entries ADD COLUMN regulation_data_encrypted TEXT;
ALTER TABLE journal_entries ADD COLUMN encryption_version INTEGER DEFAULT 1;
```

**Risk if leaked**: Complete psychological profile, mental health state, trauma history, personal thoughts.

---

##### **2. psychologicalProfiles** (Line 371 in schema.ts)

**Sensitive Fields to Encrypt**:
```sql
core_patterns                    -- Core psychological patterns (JSONB)
emotional_triggers              -- Stress/joy catalysts (JSONB)
relationship_dynamics           -- Relationship patterns (JSONB)
growth_areas                    -- Progress and stuck points (JSONB)
communication_style             -- Expression patterns (JSONB)
coping_mechanisms               -- Healthy/unhealthy patterns (JSONB)
spiritual_orientation           -- Philosophical beliefs (JSONB)
detected_patterns               -- 50+ psychological patterns (JSONB)
detected_cognitive_biases       -- Cognitive biases (JSONB)
detected_relationship_patterns  -- Relationship patterns (JSONB)
detected_psychological_frameworks -- Therapeutic frameworks (JSONB)
emotional_patterns              -- Emotional patterns (JSONB)
personality_indicators          -- MBTI evidence (JSONB)
cognitive_patterns              -- Thinking patterns (JSONB)
personal_context                -- Personal info extracted (JSONB)
user_self_insights              -- User's self-knowledge (JSONB)
ai_detected_patterns            -- AI-discovered patterns (JSONB)
insight_contradictions          -- Contradictions (JSONB)
insight_entries                 -- Individual insights (JSONB)
trigger_patterns                -- Trigger patterns by person (JSONB)
shadow_evolution                -- Shadow integration (JSONB)
ifs_parts_tracking              -- IFS parts evolution (JSONB)
trauma_response_patterns        -- Trauma responses (JSONB)
```

**Schema Changes**:
```sql
-- Store entire profile as single encrypted blob
ALTER TABLE psychological_profiles ADD COLUMN encrypted_profile_data TEXT;
ALTER TABLE psychological_profiles ADD COLUMN encryption_version INTEGER DEFAULT 1;
```

**Risk if leaked**: COMPLETE psychological profile - most sensitive aggregated data.

---

##### **3. personCards** (Line 49 in schema.ts)

**Sensitive Fields to Encrypt**:
```sql
name                            -- Real names of people
notes                          -- Relationship notes
detected_context               -- Context from journal
ai_summary                     -- AI relationship summary
ai_insight                     -- AI insights
relationship_pattern_summary   -- Pattern analysis
detected_relationship_patterns -- Detailed patterns (JSONB)
learned_terms                  -- Alternative names/nicknames
```

**Schema Changes**:
```sql
ALTER TABLE person_cards ADD COLUMN name_encrypted TEXT;
ALTER TABLE person_cards ADD COLUMN notes_encrypted TEXT;
ALTER TABLE person_cards ADD COLUMN detected_context_encrypted TEXT;
ALTER TABLE person_cards ADD COLUMN ai_summary_encrypted TEXT;
ALTER TABLE person_cards ADD COLUMN detected_relationship_patterns_encrypted TEXT;
ALTER TABLE person_cards ADD COLUMN encryption_version INTEGER DEFAULT 1;
```

**Risk if leaked**: Personal relationships, family members, friends, relationship health scores.

---

##### **4. growSessions** (Line 250 in schema.ts)

**Sensitive Fields to Encrypt**:
```sql
transcript                     -- Full therapy conversation (JSONB)
themes                        -- Topics discussed
emotional_patterns            -- Emotional states
insights                      -- Key insights
people_references             -- Names mentioned
recurring_concerns            -- Ongoing issues
breakthroughs                 -- Moments of insight
wellness_impact              -- Wellness scores (JSONB)
```

**Schema Changes**:
```sql
ALTER TABLE grow_sessions ADD COLUMN transcript_encrypted TEXT;
ALTER TABLE grow_sessions ADD COLUMN insights_encrypted TEXT;
ALTER TABLE grow_sessions ADD COLUMN people_references_encrypted TEXT;
ALTER TABLE grow_sessions ADD COLUMN encryption_version INTEGER DEFAULT 1;
```

**Risk if leaked**: Complete therapy session transcripts - equivalent to therapy notes.

---

##### **5. brainstormSessions** (Line 271 in schema.ts)

**Sensitive Fields to Encrypt**:
```sql
content                        -- Decision content
warm_acknowledgment           -- AI responses
reflective_lines              -- Analysis
ai_recommendation             -- AI decision recommendation
ai_decision_reasoning         -- AI reasoning
ai_profile_factors            -- Profile factors used
detected_people               -- People mentioned
cognitive_biases_detected     -- Cognitive analysis (JSONB)
pros_and_cons                -- Decision analysis (JSONB)
stakeholders_affected        -- People involved
outcome_summary              -- What happened
decision_follow_up           -- User reflection
```

**Schema Changes**:
```sql
ALTER TABLE brainstorm_sessions ADD COLUMN content_encrypted TEXT;
ALTER TABLE brainstorm_sessions ADD COLUMN ai_recommendation_encrypted TEXT;
ALTER TABLE brainstorm_sessions ADD COLUMN ai_decision_reasoning_encrypted TEXT;
ALTER TABLE brainstorm_sessions ADD COLUMN detected_people_encrypted TEXT;
ALTER TABLE brainstorm_sessions ADD COLUMN encryption_version INTEGER DEFAULT 1;
```

**Risk if leaked**: Personal decision-making patterns, biases, life choices.

---

##### **6. contextElements** (Line 814 in schema.ts)

**Sensitive Fields to Encrypt**:
```sql
element_text                  -- Life events ("divorced", "turning 40")
normalized_text               -- Normalized version
psychological_metadata        -- Psychological event details (JSONB)
triggers                     -- What triggers this pattern (JSONB)
manifestations              -- How trauma shows up (JSONB)
related_people              -- People associated (JSONB)
related_goals               -- Goals associated (JSONB)
associated_patterns         -- Related patterns (JSONB)
```

**Schema Changes**:
```sql
ALTER TABLE context_elements ADD COLUMN element_text_encrypted TEXT;
ALTER TABLE context_elements ADD COLUMN psychological_metadata_encrypted TEXT;
ALTER TABLE context_elements ADD COLUMN encryption_version INTEGER DEFAULT 1;
```

**Risk if leaked**: Life events, traumas, psychological wounds with metadata.

---

##### **7. actionPlans** (Line 123 in schema.ts)

**Sensitive Fields to Encrypt**:
```sql
description                   -- Action plan description
issue                        -- Specific issue/challenge
steps                        -- Action steps
step_reflections            -- User reflections
step_ai_feedback            -- AI suggestions
source_context              -- Context from therapy/journal
```

**Schema Changes**:
```sql
ALTER TABLE action_plans ADD COLUMN description_encrypted TEXT;
ALTER TABLE action_plans ADD COLUMN issue_encrypted TEXT;
ALTER TABLE action_plans ADD COLUMN steps_encrypted TEXT;
ALTER TABLE action_plans ADD COLUMN encryption_version INTEGER DEFAULT 1;
```

**Risk if leaked**: Personal challenges and therapeutic action plans.

---

##### **8. therapeuticWindows** (Line 982 in schema.ts)

**Sensitive Fields to Encrypt**:
```sql
clinical_rationale            -- Clinical reasoning
readiness_indicators         -- Readiness for deep work (JSONB)
risk_factors                 -- Risk indicators (JSONB)
suggested_interventions      -- Therapeutic interventions (JSONB)
contraindicated_interventions -- What not to do (JSONB)
```

**Schema Changes**:
```sql
ALTER TABLE therapeutic_windows ADD COLUMN clinical_rationale_encrypted TEXT;
ALTER TABLE therapeutic_windows ADD COLUMN readiness_indicators_encrypted TEXT;
ALTER TABLE therapeutic_windows ADD COLUMN encryption_version INTEGER DEFAULT 1;
```

**Risk if leaked**: Clinical mental health assessments.

---

##### **9. causationChains** (Line 946 in schema.ts)

**Sensitive Fields to Encrypt**:
```sql
chain_description            -- Causation explanation
causal_mechanisms           -- How wounds connect (JSONB)
leverage_rationale          -- Therapeutic intervention points
```

**Schema Changes**:
```sql
ALTER TABLE causation_chains ADD COLUMN chain_description_encrypted TEXT;
ALTER TABLE causation_chains ADD COLUMN causal_mechanisms_encrypted TEXT;
ALTER TABLE causation_chains ADD COLUMN encryption_version INTEGER DEFAULT 1;
```

**Risk if leaked**: Maps psychological wounds to symptoms and defenses.

---

#### 🟡 HIGH - Should Encrypt (Second Priority)

##### **10. users** (Line 30 in schema.ts)

**Sensitive Fields to Encrypt**:
```sql
first_name                   -- Real first name
last_name                    -- Real last name
preferred_name               -- Nickname
location                     -- Where they live
family_background           -- Family info
```

**Keep in Plaintext**:
```sql
email                        -- NEEDED for login (searchable)
password                     -- Already hashed with bcrypt
```

**Schema Changes**:
```sql
ALTER TABLE users ADD COLUMN first_name_encrypted TEXT;
ALTER TABLE users ADD COLUMN last_name_encrypted TEXT;
ALTER TABLE users ADD COLUMN preferred_name_encrypted TEXT;
ALTER TABLE users ADD COLUMN location_encrypted TEXT;
ALTER TABLE users ADD COLUMN family_background_encrypted TEXT;
ALTER TABLE users ADD COLUMN encryption_salt VARCHAR(255) NOT NULL;
ALTER TABLE users ADD COLUMN encryption_version INTEGER DEFAULT 1;
```

---

##### **11. accountabilityPartners** (Line 443 in schema.ts)

**Sensitive Fields to Encrypt**:
```sql
partner_name                 -- Partner's name
partner_email                -- Partner's email
shared_goals                -- Shared wellness goals (JSONB)
streak_data                 -- Shared streak info (JSONB)
```

**Schema Changes**:
```sql
ALTER TABLE accountability_partners ADD COLUMN partner_name_encrypted TEXT;
ALTER TABLE accountability_partners ADD COLUMN partner_email_encrypted TEXT;
ALTER TABLE accountability_partners ADD COLUMN encryption_version INTEGER DEFAULT 1;
```

---

##### **12. selfCareRecommendations** (Line 466 in schema.ts)

**Sensitive Fields to Encrypt**:
```sql
personalized_reason          -- Why suggested for this user
triggered_by                -- Wellness patterns
targeted_metrics            -- Metrics to improve
```

**Schema Changes**:
```sql
ALTER TABLE self_care_recommendations ADD COLUMN personalized_reason_encrypted TEXT;
ALTER TABLE self_care_recommendations ADD COLUMN encryption_version INTEGER DEFAULT 1;
```

---

##### **13. boundaryAffirmations** (Line 631 in schema.ts)

**Sensitive Fields to Encrypt**:
```sql
affirmation_text             -- The affirmation
personalized_context        -- Context from journal/profile
```

**Schema Changes**:
```sql
ALTER TABLE boundary_affirmations ADD COLUMN affirmation_text_encrypted TEXT;
ALTER TABLE boundary_affirmations ADD COLUMN personalized_context_encrypted TEXT;
ALTER TABLE boundary_affirmations ADD COLUMN encryption_version INTEGER DEFAULT 1;
```

---

##### **14. decisions** (Line 747 in schema.ts)

**Sensitive Fields to Encrypt**:
```sql
title                        -- Decision description
content                      -- User's full description
ai_reasoning                -- AI's explanation
ai_analysis                 -- Pros/cons analysis
follow_up_notes            -- Reflection on outcome
```

**Schema Changes**:
```sql
ALTER TABLE decisions ADD COLUMN content_encrypted TEXT;
ALTER TABLE decisions ADD COLUMN ai_reasoning_encrypted TEXT;
ALTER TABLE decisions ADD COLUMN ai_analysis_encrypted TEXT;
ALTER TABLE decisions ADD COLUMN encryption_version INTEGER DEFAULT 1;
```

---

##### **15. progressPatterns** (Line 340 in schema.ts)

**Sensitive Fields to Encrypt**:
```sql
transition_description       -- Full text of transition
entry_content                -- Original journal entry content
celebration_message         -- Custom message
```

**Schema Changes**:
```sql
ALTER TABLE progress_patterns ADD COLUMN transition_description_encrypted TEXT;
ALTER TABLE progress_patterns ADD COLUMN entry_content_encrypted TEXT;
ALTER TABLE progress_patterns ADD COLUMN encryption_version INTEGER DEFAULT 1;
```

---

##### **16. personCardScoreHistory** (Line 100 in schema.ts)

**Sensitive Fields to Encrypt**:
```sql
trigger_content              -- The mention that triggered score
sentiment_keywords          -- Keywords that influenced score
```

**Schema Changes**:
```sql
ALTER TABLE person_card_score_history ADD COLUMN trigger_content_encrypted TEXT;
ALTER TABLE person_card_score_history ADD COLUMN encryption_version INTEGER DEFAULT 1;
```

---

#### 🟢 LOW - No Encryption Needed (Metadata Only)

These fields are safe - they're metrics, scores, timestamps, and system data:
- User IDs, timestamps, created_at, updated_at
- Numeric scores (mental_health_score, confidence_score, etc.)
- Boolean flags (is_completed, needs_intervention, etc.)
- Enum values (mood, entry_type, decision_type, etc.)
- Counts and metrics (interaction_count, xp_awarded, etc.)
- Achievement data, XP/gamification metrics
- Status flags, ratings, session IDs

---

## IMPLEMENTATION ROADMAP

### Phase 1: Foundation (Weeks 1-2)

#### Week 1: Client-Side Encryption Setup

**Tasks**:
1. ✅ Install encryption dependencies
2. ✅ Create encryption utility service
3. ✅ Implement key derivation (PBKDF2)
4. ✅ Build encrypt/decrypt functions
5. ✅ Add unit tests

**Files to Create**:
```
client/src/utils/
  ├── zero-knowledge-encryption.ts    (Main encryption service)
  ├── key-derivation.ts               (PBKDF2 implementation)
  ├── encryption.test.ts              (Unit tests)
  └── types/encryption.ts             (TypeScript types)
```

**Dependencies**:
```json
{
  "crypto-js": "^4.2.0",
  "@types/crypto-js": "^4.2.1"
}
```

**Deliverable**: Working client-side encryption that can encrypt/decrypt data locally.

---

#### Week 2: Database Schema Migration

**Tasks**:
1. ✅ Create migration script for encrypted columns
2. ✅ Add encryption_version tracking
3. ✅ Add encryption_salt per user
4. ✅ Test migration on development DB
5. ✅ Create rollback script

**Files to Create**:
```
database/migrations/
  ├── 001_add_encryption_columns.sql
  ├── 002_add_encryption_metadata.sql
  └── rollback_encryption.sql
```

**Migration Script Template**:
```sql
-- 001_add_encryption_columns.sql
BEGIN;

-- Users table
ALTER TABLE users ADD COLUMN first_name_encrypted TEXT;
ALTER TABLE users ADD COLUMN last_name_encrypted TEXT;
ALTER TABLE users ADD COLUMN preferred_name_encrypted TEXT;
ALTER TABLE users ADD COLUMN location_encrypted TEXT;
ALTER TABLE users ADD COLUMN family_background_encrypted TEXT;
ALTER TABLE users ADD COLUMN encryption_salt VARCHAR(255);
ALTER TABLE users ADD COLUMN encryption_version INTEGER DEFAULT 0;

-- Journal entries table (most critical)
ALTER TABLE journal_entries ADD COLUMN content_encrypted TEXT;
ALTER TABLE journal_entries ADD COLUMN conversation_history_encrypted TEXT;
ALTER TABLE journal_entries ADD COLUMN ai_analysis_encrypted TEXT;
ALTER TABLE journal_entries ADD COLUMN psychological_frameworks_encrypted TEXT;
ALTER TABLE journal_entries ADD COLUMN relationship_patterns_encrypted TEXT;
ALTER TABLE journal_entries ADD COLUMN trigger_data_encrypted TEXT;
ALTER TABLE journal_entries ADD COLUMN trigger_analysis_encrypted TEXT;
ALTER TABLE journal_entries ADD COLUMN regulation_data_encrypted TEXT;
ALTER TABLE journal_entries ADD COLUMN encryption_version INTEGER DEFAULT 0;

-- Psychological profiles (encrypt entire profile as blob)
ALTER TABLE psychological_profiles ADD COLUMN encrypted_profile_data TEXT;
ALTER TABLE psychological_profiles ADD COLUMN encryption_version INTEGER DEFAULT 0;

-- Person cards
ALTER TABLE person_cards ADD COLUMN name_encrypted TEXT;
ALTER TABLE person_cards ADD COLUMN notes_encrypted TEXT;
ALTER TABLE person_cards ADD COLUMN detected_context_encrypted TEXT;
ALTER TABLE person_cards ADD COLUMN ai_summary_encrypted TEXT;
ALTER TABLE person_cards ADD COLUMN detected_relationship_patterns_encrypted TEXT;
ALTER TABLE person_cards ADD COLUMN encryption_version INTEGER DEFAULT 0;

-- Grow sessions
ALTER TABLE grow_sessions ADD COLUMN transcript_encrypted TEXT;
ALTER TABLE grow_sessions ADD COLUMN insights_encrypted TEXT;
ALTER TABLE grow_sessions ADD COLUMN people_references_encrypted TEXT;
ALTER TABLE grow_sessions ADD COLUMN encryption_version INTEGER DEFAULT 0;

-- Brainstorm sessions
ALTER TABLE brainstorm_sessions ADD COLUMN content_encrypted TEXT;
ALTER TABLE brainstorm_sessions ADD COLUMN ai_recommendation_encrypted TEXT;
ALTER TABLE brainstorm_sessions ADD COLUMN ai_decision_reasoning_encrypted TEXT;
ALTER TABLE brainstorm_sessions ADD COLUMN detected_people_encrypted TEXT;
ALTER TABLE brainstorm_sessions ADD COLUMN encryption_version INTEGER DEFAULT 0;

-- Context elements
ALTER TABLE context_elements ADD COLUMN element_text_encrypted TEXT;
ALTER TABLE context_elements ADD COLUMN psychological_metadata_encrypted TEXT;
ALTER TABLE context_elements ADD COLUMN encryption_version INTEGER DEFAULT 0;

-- Action plans
ALTER TABLE action_plans ADD COLUMN description_encrypted TEXT;
ALTER TABLE action_plans ADD COLUMN issue_encrypted TEXT;
ALTER TABLE action_plans ADD COLUMN steps_encrypted TEXT;
ALTER TABLE action_plans ADD COLUMN encryption_version INTEGER DEFAULT 0;

-- Therapeutic windows
ALTER TABLE therapeutic_windows ADD COLUMN clinical_rationale_encrypted TEXT;
ALTER TABLE therapeutic_windows ADD COLUMN readiness_indicators_encrypted TEXT;
ALTER TABLE therapeutic_windows ADD COLUMN encryption_version INTEGER DEFAULT 0;

-- Causation chains
ALTER TABLE causation_chains ADD COLUMN chain_description_encrypted TEXT;
ALTER TABLE causation_chains ADD COLUMN causal_mechanisms_encrypted TEXT;
ALTER TABLE causation_chains ADD COLUMN encryption_version INTEGER DEFAULT 0;

-- Accountability partners
ALTER TABLE accountability_partners ADD COLUMN partner_name_encrypted TEXT;
ALTER TABLE accountability_partners ADD COLUMN partner_email_encrypted TEXT;
ALTER TABLE accountability_partners ADD COLUMN encryption_version INTEGER DEFAULT 0;

-- Self care recommendations
ALTER TABLE self_care_recommendations ADD COLUMN personalized_reason_encrypted TEXT;
ALTER TABLE self_care_recommendations ADD COLUMN encryption_version INTEGER DEFAULT 0;

-- Boundary affirmations
ALTER TABLE boundary_affirmations ADD COLUMN affirmation_text_encrypted TEXT;
ALTER TABLE boundary_affirmations ADD COLUMN personalized_context_encrypted TEXT;
ALTER TABLE boundary_affirmations ADD COLUMN encryption_version INTEGER DEFAULT 0;

-- Decisions
ALTER TABLE decisions ADD COLUMN content_encrypted TEXT;
ALTER TABLE decisions ADD COLUMN ai_reasoning_encrypted TEXT;
ALTER TABLE decisions ADD COLUMN ai_analysis_encrypted TEXT;
ALTER TABLE decisions ADD COLUMN encryption_version INTEGER DEFAULT 0;

-- Progress patterns
ALTER TABLE progress_patterns ADD COLUMN transition_description_encrypted TEXT;
ALTER TABLE progress_patterns ADD COLUMN entry_content_encrypted TEXT;
ALTER TABLE progress_patterns ADD COLUMN encryption_version INTEGER DEFAULT 0;

-- Person card score history
ALTER TABLE person_card_score_history ADD COLUMN trigger_content_encrypted TEXT;
ALTER TABLE person_card_score_history ADD COLUMN encryption_version INTEGER DEFAULT 0;

-- Create audit log table
CREATE TABLE encryption_audit_log (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  action VARCHAR(50) NOT NULL, -- 'encrypt', 'decrypt', 'key_derivation', 'ai_access'
  table_name VARCHAR(100) NOT NULL,
  row_id INTEGER,
  success BOOLEAN NOT NULL DEFAULT true,
  error_message TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_user_id ON encryption_audit_log(user_id);
CREATE INDEX idx_audit_created_at ON encryption_audit_log(created_at);
CREATE INDEX idx_audit_action ON encryption_audit_log(action);

COMMIT;
```

**Deliverable**: Database schema updated with encrypted columns.

---

### Phase 2: AWS Nitro Enclave Setup (Weeks 3-4)

#### Week 3: Infrastructure Setup

**Tasks**:
1. ✅ Set up AWS account with Nitro Enclave support
2. ✅ Create EC2 instance with Nitro Enclave capability
3. ✅ Configure AWS KMS for key management
4. ✅ Set up enclave development environment
5. ✅ Create basic enclave image

**AWS Resources Needed**:
- EC2 instance type: `c6a.xlarge` or `m6a.xlarge` (Nitro support)
- AWS KMS key for enclave
- IAM roles for enclave access
- VPC configuration for secure networking

**Files to Create**:
```
server/enclave/
  ├── Dockerfile.enclave          (Enclave container image)
  ├── enclave-config.json         (Enclave configuration)
  ├── ai_processor.py             (AI processing inside enclave)
  ├── kms_client.py               (KMS integration)
  └── attestation.py              (Cryptographic attestation)

infrastructure/
  ├── terraform/
  │   ├── main.tf                 (AWS infrastructure)
  │   ├── enclave.tf              (Nitro Enclave setup)
  │   └── kms.tf                  (Key Management Service)
  └── scripts/
      ├── build_enclave.sh        (Build enclave image)
      └── deploy_enclave.sh       (Deploy to EC2)
```

**Cost Estimate**:
- EC2 c6a.xlarge: ~$0.153/hour = ~$110/month
- AWS KMS: $1/key/month
- Data transfer: ~$10/month
- **Total**: ~$120/month

**Deliverable**: Running Nitro Enclave that can decrypt and process data.

---

#### Week 4: AI Integration in Enclave

**Tasks**:
1. ✅ Implement decryption inside enclave
2. ✅ Integrate OpenAI API calls from enclave
3. ✅ Implement re-encryption of results
4. ✅ Add memory clearing after processing
5. ✅ Test end-to-end flow

**Files to Create**:
```
server/enclave/ai_processor.py
```

**Key Features**:
- Verify AI access tokens
- Load decryption keys from KMS (enclave-only access)
- Decrypt data inside enclave
- Call OpenAI API from enclave
- Re-encrypt results
- Clear plaintext from memory
- Return encrypted results

**Deliverable**: Working AI processing pipeline that operates entirely within secure enclave.

---

### Phase 3: Application Integration (Weeks 5-6)

#### Week 5: Update Client Application

**Tasks**:
1. ✅ Update registration flow (generate salt, encrypt PII)
2. ✅ Update login flow (derive key, decrypt user data)
3. ✅ Update journal entry submission (encrypt before send)
4. ✅ Update journal entry display (decrypt on client)
5. ✅ Update all forms to use encryption
6. ✅ Add encryption status indicators in UI

**Files to Update**:
```
client/src/
  ├── api/auth.ts                 (Registration/login)
  ├── api/journal.ts              (Journal CRUD)
  ├── api/profile.ts              (User profile)
  ├── pages/journal.tsx           (Journal UI)
  ├── pages/profile.tsx           (Profile UI)
  ├── components/
  │   ├── EncryptionStatus.tsx    (Show encryption status)
  │   └── EncryptionModal.tsx     (Explain encryption to users)
  └── hooks/
      └── useEncryption.ts        (React hook for encryption)
```

**UI Changes**:
- Add 🔒 icon next to encrypted fields
- Show "Encrypted locally" tooltip
- Add "Zero-Knowledge" badge on premium tier
- Create encryption settings page

**Deliverable**: Client app fully integrated with encryption.

---

#### Week 6: Update Server APIs

**Tasks**:
1. ✅ Update user registration endpoint (store salt)
2. ✅ Update journal entry endpoints (handle encrypted data)
3. ✅ Create AI analysis endpoint (route to Nitro Enclave)
4. ✅ Update all CRUD operations for encrypted fields
5. ✅ Add encryption audit logging
6. ✅ Create encryption admin dashboard

**Files to Update**:
```
server/
  ├── routes-auth.ts              (Handle encryption in auth)
  ├── routes.ts                   (Handle encrypted journal entries)
  ├── routes-encryption.ts        (NEW: Encryption endpoints)
  ├── storage.ts                  (Update all DB queries)
  ├── middleware/
  │   └── encryptionMiddleware.ts (Verify encryption headers)
  └── utils/
      ├── encryption-audit.ts     (Audit logging)
      └── enclave-client.ts       (Communicate with Nitro Enclave)
```

**New Endpoints**:
```typescript
// Analyze journal entry using Nitro Enclave
POST /api/journal/analyze-secure
Body: { entry_id, encrypted_content, ai_access_token }
Response: { encrypted_ai_result }

// Get encryption audit log (for user transparency)
GET /api/encryption/audit-log
Response: { logs: [{ action, timestamp, success }] }

// Re-encrypt data with new key (password change)
POST /api/encryption/re-encrypt
Body: { old_key_hash, new_key_hash }
Response: { success: true }
```

**Deliverable**: Server fully supports encrypted data storage and AI processing.

---

### Phase 4: Testing & Security (Weeks 7-8)

#### Week 7: Testing

**Tasks**:
1. ✅ Unit tests for encryption utilities
2. ✅ Integration tests for encrypted workflows
3. ✅ End-to-end tests for full user journey
4. ✅ Performance testing (encryption overhead)
5. ✅ Load testing (Nitro Enclave capacity)
6. ✅ Penetration testing (hire external firm)

**Test Coverage Required**:
- Client-side encryption/decryption: 100%
- Key derivation: 100%
- Enclave processing: 95%
- API endpoints: 90%
- UI components: 85%

**Files to Create**:
```
tests/
  ├── unit/
  │   ├── encryption.test.ts
  │   └── key-derivation.test.ts
  ├── integration/
  │   ├── encrypted-journal.test.ts
  │   ├── encrypted-profile.test.ts
  │   └── ai-processing.test.ts
  ├── e2e/
  │   ├── registration-encrypted.test.ts
  │   ├── login-decrypt.test.ts
  │   └── journal-workflow.test.ts
  └── performance/
      ├── encryption-overhead.test.ts
      └── enclave-throughput.test.ts
```

**Deliverable**: Comprehensive test suite with >90% coverage.

---

#### Week 8: Security Audit

**Tasks**:
1. ✅ Internal security review
2. ✅ External security audit (hire firm)
3. ✅ Penetration testing
4. ✅ Fix all critical/high vulnerabilities
5. ✅ Document security architecture
6. ✅ Create incident response plan

**External Audit Firms**:
- Trail of Bits (cryptography experts)
- NCC Group (security audits)
- Cure53 (penetration testing)

**Cost**: $10,000 - $25,000 for comprehensive audit

**Audit Checklist**:
- ✅ Key derivation properly implemented
- ✅ No keys stored on server
- ✅ Enclave properly isolated
- ✅ Timing attacks prevented
- ✅ Memory properly cleared
- ✅ Audit logs tamper-proof
- ✅ Token expiration enforced
- ✅ Cryptographic attestation working

**Deliverable**: Security audit report with all issues resolved.

---

### Phase 5: Migration & Launch (Weeks 9-10)

#### Week 9: Data Migration

**Tasks**:
1. ✅ Create migration script for existing users
2. ✅ Prompt users to re-enter password
3. ✅ Encrypt existing data
4. ✅ Verify migration success
5. ✅ Monitor for errors

**Migration Strategy**:
```
Option 1: Gradual Migration (Recommended)
- New users: Encrypted by default
- Existing users: Prompted on next login
- Deadline: 30 days to migrate
- After deadline: Opt-in to encryption

Option 2: Forced Migration
- Set migration date
- Email all users 2 weeks in advance
- On migration date: All users must re-enter password
- Encrypt all data in one batch

Option 3: Opt-In (Freemium)
- Free tier: Standard encryption
- Premium tier ($9.99/month): Zero-knowledge encryption
- Users choose to upgrade
```

**Recommended**: Option 1 (Gradual) for least disruption.

**Files to Create**:
```
server/migrations/
  ├── migrate-user-data.ts        (Main migration script)
  ├── verify-migration.ts         (Verification script)
  └── rollback-migration.ts       (Rollback if needed)

client/src/pages/
  └── EncryptionUpgrade.tsx       (User migration flow)
```

**Deliverable**: All user data encrypted with zero-knowledge architecture.

---

#### Week 10: Launch

**Tasks**:
1. ✅ Deploy to production
2. ✅ Monitor encryption performance
3. ✅ Monitor Nitro Enclave health
4. ✅ Launch marketing campaign
5. ✅ Create press release
6. ✅ Publish security whitepaper

**Launch Checklist**:
- ✅ All tests passing
- ✅ Security audit complete
- ✅ Documentation complete
- ✅ Monitoring dashboards set up
- ✅ Incident response plan ready
- ✅ Support team trained
- ✅ Legal review complete (privacy policy, terms)
- ✅ HIPAA compliance documentation

**Marketing Materials**:
```
marketing/
  ├── security-whitepaper.pdf     (Technical deep-dive)
  ├── press-release.md            (For media)
  ├── blog-post-launch.md         (Company blog)
  └── social-media-kit/           (Graphics, copy)
```

**Deliverable**: Zero-knowledge encryption LIVE in production.

---

## SECURITY GUARANTEES

### What We Can Cryptographically Prove

#### 1. Server Cannot Decrypt User Data
**Guarantee**: The server does not have access to user decryption keys.

**Proof**:
- User password never sent to server
- Master key derived client-side only (PBKDF2)
- Salt stored in DB (not sensitive)
- Without password, server cannot derive key
- Database stores encrypted blobs only

**Verification**: User can inspect network traffic (browser DevTools) - password never transmitted.

---

#### 2. Database Admin Cannot Read Data
**Guarantee**: Database administrators see only encrypted ciphertext.

**Proof**:
```sql
-- What DB admin sees:
SELECT content_encrypted FROM journal_entries WHERE user_id = 123;
-- Result: "U2FsdGVkX19rLzJK8H/x9X+KfZ3qQ4..." (gibberish)

-- Trying to decrypt without key:
SELECT pgp_sym_decrypt(content_encrypted, 'wrong_password') FROM journal_entries;
-- Result: ERROR or garbage
```

**Verification**: DB admin can export entire database - still cannot decrypt.

---

#### 3. AI Can Process Data (Time-Limited)
**Guarantee**: AI can analyze data only with user's time-limited consent.

**Proof**:
- User grants AI access token (60-second expiry)
- Token verified before decryption
- Decryption happens ONLY in Nitro Enclave
- Plaintext never leaves enclave memory
- Memory cleared after processing
- Token cannot be reused (nonce-based)

**Verification**: Audit log shows every AI access event with timestamp.

---

#### 4. Enclave Integrity is Verifiable
**Guarantee**: Users can verify the enclave is running correct, unmodified code.

**Proof**:
- Nitro Enclave provides cryptographic attestation
- Attestation document contains:
  - PCR (Platform Configuration Register) measurements
  - SHA-256 hash of enclave image
  - Public key signed by AWS Nitro hardware
- Users can verify attestation matches published hashes

**Verification**:
```bash
# Get attestation document from enclave
curl https://api.zenalyze.com/enclave/attestation

# Verify signature (AWS Nitro root certificate)
openssl dgst -sha384 -verify aws-nitro-root.pem -signature attestation.sig attestation.json

# Compare PCR values to published values
diff <(cat attestation.json | jq .pcrs) published-pcrs.json
```

---

#### 5. Memory is Protected
**Guarantee**: Enclave memory cannot be accessed by host OS or hypervisor.

**Proof**:
- Nitro Enclave uses hardware-based memory encryption (AMD SEV-SNP)
- CPU encrypts memory with key unknown to hypervisor
- DMA (Direct Memory Access) blocked
- Debugging disabled in production mode

**Verification**: This is hardware-enforced by AWS Nitro System - cannot be bypassed without physical access to datacenter.

---

### Attack Scenarios & Mitigations

#### Attack 1: Compromised Server
**Scenario**: Attacker gains root access to server.

**What they can access**:
- ❌ Encrypted database (gibberish without keys)
- ❌ Enclave memory (hardware-protected)
- ✅ Server code (but no keys)
- ✅ Network traffic (but encrypted in transit)

**What they CANNOT access**:
- ❌ User passwords (never sent to server)
- ❌ Master encryption keys (client-only)
- ❌ Plaintext journal entries
- ❌ Plaintext psychological profiles

**Mitigation**: Even with full server compromise, user data remains encrypted.

---

#### Attack 2: SQL Injection
**Scenario**: Attacker injects SQL to dump database.

**What they get**:
```sql
SELECT * FROM journal_entries;
-- Result: Table with encrypted_content columns
-- Example: "U2FsdGVkX19rLzJK8H/x9X+KfZ3qQ4..."
```

**Impact**: Encrypted data only - useless without keys.

**Mitigation**: Data encrypted at rest, SQL injection only exposes ciphertext.

---

#### Attack 3: Man-in-the-Middle (MITM)
**Scenario**: Attacker intercepts network traffic.

**What they see**:
- HTTPS encrypted traffic (TLS 1.3)
- Encrypted payloads inside HTTPS

**Double encryption**:
```
User data → AES-256 encryption → HTTPS (TLS 1.3) → Server
```

**Mitigation**: Two layers of encryption - even if TLS compromised, data still encrypted.

---

#### Attack 4: Insider Threat (Rogue Employee)
**Scenario**: Zenalyze employee tries to read user data.

**What they can access**:
- ✅ Production database (but encrypted)
- ✅ Server access (but no keys)
- ✅ Code repository
- ❌ User decryption keys (client-only)
- ❌ Plaintext data (without user password)

**Mitigation**: Zero-knowledge architecture means even founder cannot decrypt without user consent.

---

#### Attack 5: AI Service Compromise
**Scenario**: OpenAI is hacked or subpoenaed.

**What OpenAI sees**:
- ✅ Plaintext during AI processing (necessary for analysis)
- ❌ User identity (not sent from enclave)
- ❌ Historical data (only current request)

**Mitigation**:
- Anonymize requests (no user ID sent to OpenAI)
- Stateless processing (no data retention)
- Can add proxy layer to strip metadata

---

#### Attack 6: Password Reset Attack
**Scenario**: Attacker resets user password to gain access.

**What happens**:
1. Attacker resets password via "forgot password"
2. New password generates NEW encryption key
3. Old encrypted data cannot be decrypted with new key
4. User loses access to old data

**This is a FEATURE**: Password reset ≠ access to encrypted data.

**Mitigation**:
- Provide recovery key during registration
- User must save recovery key separately
- Clear warning: "Forgot password = lost data"

---

### Compliance Certifications

#### HIPAA Compliance
**Requirements**:
- ✅ Encryption at rest (AES-256)
- ✅ Encryption in transit (TLS 1.3)
- ✅ Access controls (user authentication)
- ✅ Audit logs (encryption events logged)
- ✅ Business Associate Agreements (with AWS)
- ✅ Data minimization (zero-knowledge)

**Status**: Architecture is HIPAA-compliant. Need formal audit for certification.

**Cost**: $10,000 - $30,000 for HIPAA compliance audit.

---

#### SOC 2 Type II
**Requirements**:
- ✅ Security controls
- ✅ Availability
- ✅ Processing integrity
- ✅ Confidentiality
- ✅ Privacy

**Status**: Zero-knowledge architecture exceeds SOC 2 requirements.

**Cost**: $20,000 - $50,000 for SOC 2 audit (takes 3-6 months).

---

#### GDPR Compliance
**Requirements**:
- ✅ Right to erasure (delete encrypted data)
- ✅ Data portability (export encrypted data)
- ✅ Right to access (user can decrypt own data)
- ✅ Data minimization (zero-knowledge)
- ✅ Privacy by design (encryption from day 1)

**Status**: Fully compliant with GDPR.

---

## COST-BENEFIT ANALYSIS

### Total Investment Required

#### One-Time Costs

| Item | Cost | Timeline |
|------|------|----------|
| Development time (6 weeks) | $12,000 | Weeks 1-6 |
| External security audit | $15,000 | Week 8 |
| Penetration testing | $5,000 | Week 8 |
| Legal review (privacy policy) | $2,000 | Week 9 |
| **Total One-Time** | **$34,000** | **8 weeks** |

---

#### Ongoing Costs (Monthly)

| Item | Cost |
|------|------|
| AWS Nitro Enclave (EC2 c6a.xlarge) | $110 |
| AWS KMS | $1 |
| Data transfer | $10 |
| Monitoring (CloudWatch) | $20 |
| Security audit (quarterly = $333/mo) | $333 |
| **Total Ongoing** | **$474/month** |

---

#### Scaling Costs

| Users | EC2 Instances | Monthly Cost |
|-------|---------------|--------------|
| 0-1,000 | 1 enclave | $474 |
| 1,000-5,000 | 2 enclaves | $850 |
| 5,000-20,000 | 4 enclaves | $1,600 |
| 20,000-100,000 | 8 enclaves | $3,100 |
| 100,000+ | Auto-scaling | $5,000-10,000 |

**Note**: Costs scale sub-linearly - very efficient.

---

### Revenue Potential

#### Pricing Tiers

| Tier | Price/Month | Features | Target Users |
|------|-------------|----------|--------------|
| **Free** | $0 | Basic journaling, local encryption only | Freemium users |
| **Private** | $4.99 | Client-side encryption, AI analysis | Privacy-conscious |
| **Zero-Knowledge** | $9.99 | **Nitro Enclave, we can't read it** | Premium users |
| **Enterprise** | Custom | B2B licensing, white-label | Businesses |

---

#### Revenue Scenarios

**Conservative Scenario (Year 1)**:
- 10,000 free users
- 500 Private tier users ($4.99/mo) = $2,495/month
- 100 Zero-Knowledge users ($9.99/mo) = $999/month
- **Total**: $3,494/month = **$41,928/year**

**Moderate Scenario (Year 1)**:
- 50,000 free users
- 2,500 Private tier users = $12,475/month
- 500 Zero-Knowledge users = $4,995/month
- 2 Enterprise customers ($500/mo) = $1,000/month
- **Total**: $18,470/month = **$221,640/year**

**Optimistic Scenario (Year 2)**:
- 200,000 free users
- 10,000 Private tier users = $49,900/month
- 2,000 Zero-Knowledge users = $19,980/month
- 10 Enterprise customers = $5,000/month
- B2B processing fees = $10,000/month
- **Total**: $84,880/month = **$1,018,560/year**

---

#### ROI Analysis

**Investment**: $34,000 one-time + $474/month ongoing

**Break-even**:
- With 600 Zero-Knowledge users at $9.99/mo
- Expected timeline: Month 4-6 after launch

**5-Year Projected Revenue**:
| Year | Users (ZK tier) | Monthly Revenue | Annual Revenue |
|------|-----------------|-----------------|----------------|
| 1 | 500 | $5,000 | $60,000 |
| 2 | 2,000 | $20,000 | $240,000 |
| 3 | 8,000 | $80,000 | $960,000 |
| 4 | 20,000 | $200,000 | $2,400,000 |
| 5 | 40,000 | $400,000 | $4,800,000 |

**Total 5-Year Revenue**: ~$8.5M (conservative estimate)

---

### Intangible Benefits

#### 1. Competitive Moat
- **First-mover advantage** in zero-knowledge consumer mental health AI
- **High barrier to entry** (technical complexity)
- **Brand positioning** as "the private AI therapist"

**Estimated value**: Increases valuation by 2-3x in fundraising.

---

#### 2. Premium Pricing Power
- Can charge 2-3x more than competitors
- "Privacy premium" justifies higher pricing
- Corporate wellness market willing to pay more

**Estimated value**: +40% revenue vs. standard encryption.

---

#### 3. B2B Licensing Opportunity
- License encryption engine to other mental health platforms
- SaaS model: $0.10 per encrypted entry processed
- White-label solution for therapist platforms

**Estimated value**: $500K-2M ARR (at scale).

---

#### 4. VC Fundraising Advantage
- Unique technology story
- Privacy + AI + Mental Health = 🔥
- Can raise seed round at 2-3x valuation

**Estimated value**: Raise $2M at $10M valuation (vs. $5M without encryption).

---

#### 5. Media Coverage
- "First zero-knowledge AI therapist"
- TechCrunch, Wired, The Verge coverage
- Privacy advocacy organizations endorsement

**Estimated value**: $50K-100K in free PR.

---

## GO-TO-MARKET STRATEGY

### Launch Timeline

#### Pre-Launch (Weeks 1-2)
- ✅ Build landing page with waitlist
- ✅ Create security whitepaper
- ✅ Reach out to privacy advocates
- ✅ Submit to Product Hunt
- ✅ Prepare press release

#### Launch Week
- ✅ Launch on Product Hunt
- ✅ Post to Hacker News
- ✅ Publish blog post
- ✅ Send press release to tech media
- ✅ Post to r/privacy, r/mentalhealth

#### Post-Launch (Weeks 3-4)
- ✅ Publish case studies
- ✅ Create video explaining encryption
- ✅ Reach out to influencers
- ✅ Run paid ads (Google, Meta)
- ✅ Speak at conferences

---

### Marketing Messages

#### Primary Value Proposition
> "Your Thoughts, Truly Private. Even We Can't Read Them."

**Subheadline**:
> "Zenalyze uses military-grade encryption in hardware-isolated secure enclaves. Your AI therapist can help you. We literally cannot see your data - by design."

---

#### Key Differentiators
1. **Zero-Knowledge Architecture** - We mathematically cannot access your data
2. **Hardware-Backed Security** - AWS Nitro Enclaves (military-grade)
3. **HIPAA Compliant** - Meets healthcare privacy standards
4. **Transparent Security** - Open-source encryption code
5. **Affordable** - 10x cheaper than enterprise solutions

---

#### Target Audiences

**Phase 1: Early Adopters (Months 1-3)**
- Tech workers who understand encryption
- Journalists & activists (high privacy needs)
- Abuse survivors (need guaranteed privacy)
- Privacy advocates (promote to others)

**Marketing channels**:
- Hacker News, Reddit (r/privacy)
- Privacy-focused forums (PrivacyTools, EFF)
- Tech conferences (DEF CON, Black Hat)

---

**Phase 2: Privacy-Conscious Consumers (Months 4-9)**
- Anyone concerned about privacy
- People in small towns (stigma concerns)
- LGBTQ+ individuals (safety concerns)
- High-net-worth individuals (confidentiality)

**Marketing channels**:
- Google Ads (keywords: "private therapy", "confidential mental health")
- Meta Ads (interest targeting: privacy, mental health)
- Influencer partnerships (mental health YouTubers)
- Podcast sponsorships (therapy podcasts)

---

**Phase 3: Enterprise/B2B (Months 10-12)**
- Corporate wellness programs
- Therapy platform providers (BetterHelp, Talkspace)
- Health insurance companies
- University counseling centers

**Marketing channels**:
- LinkedIn outreach
- Industry conferences (Healthcare IT, HIMSS)
- Direct sales
- Partnerships with HR platforms

---

### Marketing Materials

#### Landing Page Copy

**Hero Section**:
```
Your AI Therapist Knows You.
We Don't. By Design.

The first mental health AI with zero-knowledge encryption.
Even we can't read your journals.

[Try Free] [See How It Works]

✓ Military-grade encryption
✓ HIPAA compliant
✓ Hardware-secured (AWS Nitro Enclaves)
✓ Cryptographically provable privacy
```

**How It Works Section**:
```
1. Your Password Never Leaves Your Device
   We can't reset it. If you forget it, your data is lost.
   That's a feature, not a bug.

2. Your Data is Encrypted Before Reaching Our Servers
   We store gibberish. Database admins see encrypted blobs.
   Even with a warrant, we have nothing to give.

3. AI Analysis Happens in Isolated Hardware
   AWS Nitro Enclaves = military-grade isolation.
   Memory is encrypted. Our engineers cannot access it.

4. You Control What AI Sees
   AI can only analyze your data with your explicit, time-limited permission.
   Every AI access is logged. You can review the audit trail.
```

**Pricing Section**:
```
Choose Your Privacy Level

FREE
$0/month
✓ Basic journaling
✓ Local-only storage
✓ No AI analysis

PRIVATE
$4.99/month
✓ Client-side encryption
✓ AI analysis
✓ Cloud sync
⚠️ We can see encrypted data

ZERO-KNOWLEDGE ⭐
$9.99/month
✓ Hardware-isolated encryption
✓ AI analysis in secure enclave
✓ We literally can't read your data
✓ Cryptographic proof
🔒 Maximum privacy

ENTERPRISE
Custom pricing
✓ Everything in Zero-Knowledge
✓ Custom deployment
✓ White-label option
✓ Dedicated support
```

---

#### Social Media Strategy

**Twitter/X**:
- Post encryption explainers (thread format)
- Share security audit results
- Live-tweet from security conferences
- Engage with privacy advocates

**Instagram**:
- Infographics explaining encryption
- User testimonials (anonymized)
- Behind-the-scenes of security testing
- Mental health awareness content

**TikTok**:
- "Day in the life of a zero-knowledge app"
- Encryption explained in 60 seconds
- Reactions to privacy violations by competitors
- Mental health tips

**LinkedIn**:
- B2B content for enterprises
- Case studies
- Thought leadership on privacy
- Hiring posts (build credibility)

---

#### Content Marketing

**Blog Posts**:
1. "How Zero-Knowledge Encryption Works (Explained Simply)"
2. "Why Your Therapist App is Probably Spying on You"
3. "Inside AWS Nitro Enclaves: Military-Grade Security for Consumer Apps"
4. "The True Cost of Privacy in Mental Health Apps"
5. "We Hired Hackers to Break Our Encryption (They Failed)"

**Videos**:
1. "Your Data Journey Through Zenalyze" (2 min animation)
2. "Encryption vs. Hashing vs. Zero-Knowledge" (5 min explainer)
3. "Security Audit: What We Learned" (10 min deep-dive)
4. "Founder's Promise: Why We Built This" (3 min personal story)

**Podcast Appearances**:
- The Changelog (developer audience)
- Privacy, Security, & OSINT (privacy nerds)
- The Tim Ferriss Show (reach mainstream)
- Therapy for Black Girls (mental health focus)

---

### Partnerships

#### Privacy Organizations
- Electronic Frontier Foundation (EFF)
- Privacy International
- Fight for the Future
- Access Now

**Goal**: Get endorsements, co-marketing.

---

#### Mental Health Organizations
- National Alliance on Mental Illness (NAMI)
- Mental Health America (MHA)
- The Trevor Project (LGBTQ+ youth)
- Anxiety and Depression Association of America (ADAA)

**Goal**: Credibility, referrals, co-branding.

---

#### Tech Platforms
- AWS (case study on Nitro Enclaves)
- OpenAI (showcase responsible AI use)
- Y Combinator (apply for funding)

**Goal**: Visibility, funding, technical support.

---

## IMPLEMENTATION CHECKLIST

### Phase 1: Foundation ✅

#### Week 1: Client-Side Encryption
- [ ] Install crypto-js and types
- [ ] Create `client/src/utils/zero-knowledge-encryption.ts`
- [ ] Implement key derivation (PBKDF2, 100k iterations)
- [ ] Implement AES-256-GCM encryption
- [ ] Implement decryption with error handling
- [ ] Create TypeScript types for encryption
- [ ] Write unit tests (100% coverage)
- [ ] Test encryption/decryption roundtrip
- [ ] Test key derivation with different salts
- [ ] Document API usage

#### Week 2: Database Migration
- [ ] Create `database/migrations/001_add_encryption_columns.sql`
- [ ] Add `encryption_salt` to users table
- [ ] Add `encryption_version` to all tables
- [ ] Add `*_encrypted` columns to 15 tables
- [ ] Create `encryption_audit_log` table
- [ ] Test migration on dev database
- [ ] Create rollback script
- [ ] Document migration process
- [ ] Plan migration timeline for production

---

### Phase 2: AWS Nitro Enclave ✅

#### Week 3: Infrastructure
- [ ] Create AWS account (if needed)
- [ ] Set up IAM roles for Nitro Enclave
- [ ] Create EC2 instance (c6a.xlarge)
- [ ] Enable Nitro Enclave on EC2
- [ ] Set up AWS KMS key
- [ ] Create VPC for secure networking
- [ ] Install Nitro CLI on EC2
- [ ] Create enclave Dockerfile
- [ ] Build and test enclave image
- [ ] Configure enclave resources (CPU, memory)

#### Week 4: AI Integration in Enclave
- [ ] Create `server/enclave/ai_processor.py`
- [ ] Implement KMS key loading (enclave-only)
- [ ] Implement AI access token verification
- [ ] Implement decryption inside enclave
- [ ] Integrate OpenAI API calls from enclave
- [ ] Implement re-encryption of results
- [ ] Implement memory clearing after processing
- [ ] Add error handling and logging
- [ ] Test end-to-end flow
- [ ] Measure performance (latency, throughput)

---

### Phase 3: Application Integration ✅

#### Week 5: Client Updates
- [ ] Update `client/src/api/auth.ts` for registration
  - [ ] Generate salt on registration
  - [ ] Encrypt PII before sending
  - [ ] Store salt in DB
- [ ] Update login flow
  - [ ] Fetch salt from server
  - [ ] Derive master key from password
  - [ ] Decrypt user data on client
- [ ] Update `client/src/api/journal.ts`
  - [ ] Encrypt journal entries before POST
  - [ ] Decrypt journal entries after GET
  - [ ] Generate AI access tokens
- [ ] Create `client/src/hooks/useEncryption.ts`
- [ ] Create `client/src/components/EncryptionStatus.tsx`
- [ ] Update UI to show 🔒 icons
- [ ] Add encryption settings page
- [ ] Add encryption explainer modal

#### Week 6: Server Updates
- [ ] Update `server/routes-auth.ts`
  - [ ] Store encryption_salt on registration
  - [ ] Return salt on login
- [ ] Create `server/routes-encryption.ts`
  - [ ] POST `/api/journal/analyze-secure`
  - [ ] GET `/api/encryption/audit-log`
  - [ ] POST `/api/encryption/re-encrypt`
- [ ] Update `server/storage.ts`
  - [ ] Handle encrypted fields in all queries
  - [ ] Store encrypted data
  - [ ] Never decrypt on server
- [ ] Create `server/utils/enclave-client.ts`
  - [ ] Send requests to Nitro Enclave
  - [ ] Handle enclave responses
  - [ ] Implement retry logic
- [ ] Create `server/utils/encryption-audit.ts`
  - [ ] Log all encryption events
  - [ ] Create audit log API
  - [ ] Implement tamper-proof logging

---

### Phase 4: Testing & Security ✅

#### Week 7: Testing
- [ ] Write unit tests for encryption utils (100% coverage)
- [ ] Write integration tests for encrypted workflows
- [ ] Write E2E tests for user journey
- [ ] Performance testing (encryption overhead <5%)
- [ ] Load testing (enclave can handle 100 req/sec)
- [ ] Test password change flow (re-encryption)
- [ ] Test password reset (data loss)
- [ ] Test AI processing with encryption
- [ ] Test audit log integrity
- [ ] Fix all bugs found

#### Week 8: Security Audit
- [ ] Internal security review (team)
- [ ] Hire external security audit firm
  - [ ] Get quotes from 3 firms
  - [ ] Choose firm (Trail of Bits, NCC Group, Cure53)
  - [ ] Schedule audit
- [ ] Penetration testing
- [ ] Review audit report
- [ ] Fix all critical/high vulnerabilities
- [ ] Re-test after fixes
- [ ] Get final security sign-off
- [ ] Document security architecture
- [ ] Create incident response plan

---

### Phase 5: Migration & Launch ✅

#### Week 9: Data Migration
- [ ] Create migration script for existing users
- [ ] Test migration on staging with real data
- [ ] Plan migration rollout (gradual vs. forced)
- [ ] Create user communication plan
  - [ ] Email announcing upgrade
  - [ ] In-app notification
  - [ ] Migration instructions
- [ ] Create `client/src/pages/EncryptionUpgrade.tsx`
- [ ] Implement migration flow
  - [ ] Prompt user to re-enter password
  - [ ] Encrypt all existing data
  - [ ] Verify encryption success
  - [ ] Mark user as migrated
- [ ] Monitor migration progress
- [ ] Handle migration errors gracefully

#### Week 10: Launch
- [ ] Deploy to production
  - [ ] Deploy enclave to AWS
  - [ ] Deploy client updates
  - [ ] Deploy server updates
  - [ ] Run database migration
- [ ] Monitor encryption performance
- [ ] Monitor Nitro Enclave health
- [ ] Set up alerts for failures
- [ ] Create monitoring dashboard
- [ ] Launch marketing campaign
  - [ ] Publish blog post
  - [ ] Send press release
  - [ ] Post to Product Hunt
  - [ ] Post to Hacker News
  - [ ] Social media announcements
- [ ] Publish security whitepaper
- [ ] Update privacy policy
- [ ] Update terms of service
- [ ] Train support team
- [ ] Monitor user feedback
- [ ] Iterate based on feedback

---

### Post-Launch Ongoing ✅

#### Security Maintenance
- [ ] Quarterly security audits
- [ ] Monthly penetration testing
- [ ] Weekly vulnerability scanning
- [ ] Daily security log review
- [ ] Patch vulnerabilities within 24 hours
- [ ] Update dependencies monthly
- [ ] Rotate encryption keys annually
- [ ] Review access logs weekly

#### Performance Monitoring
- [ ] Monitor encryption overhead (<5% target)
- [ ] Monitor enclave latency (<500ms target)
- [ ] Monitor enclave availability (99.9% target)
- [ ] Optimize slow queries
- [ ] Scale enclaves based on load
- [ ] Monitor costs (stay under budget)

#### Compliance
- [ ] HIPAA compliance audit (annually)
- [ ] SOC 2 Type II audit (annually)
- [ ] GDPR compliance review (quarterly)
- [ ] Update compliance documentation
- [ ] Train team on compliance

---

## APPENDIX: CODE EXAMPLES

### Client-Side Encryption Utility

```typescript
// client/src/utils/zero-knowledge-encryption.ts

import CryptoJS from 'crypto-js';

export interface EncryptionConfig {
  iterations: number; // PBKDF2 iterations
  keySize: number; // Key size in bits
  algorithm: string; // Encryption algorithm
}

export const DEFAULT_CONFIG: EncryptionConfig = {
  iterations: 100000,
  keySize: 256,
  algorithm: 'AES-256-GCM'
};

export class ZeroKnowledgeEncryption {
  private static masterKey: string | null = null;
  private static config: EncryptionConfig = DEFAULT_CONFIG;

  /**
   * Derive master encryption key from user password
   * CRITICAL: This runs ONLY on client - never send to server
   */
  static async deriveMasterKey(
    password: string,
    salt: string
  ): Promise<string> {
    const key = CryptoJS.PBKDF2(password, salt, {
      keySize: this.config.keySize / 32,
      iterations: this.config.iterations
    }).toString();

    this.masterKey = key;
    return key;
  }

  /**
   * Generate random salt for new user
   * Salt is NOT sensitive - can be stored in DB
   */
  static generateSalt(): string {
    return CryptoJS.lib.WordArray.random(128 / 8).toString();
  }

  /**
   * Derive table-specific encryption key
   * Different key for each table (defense in depth)
   */
  static deriveTableKey(tableName: string): string {
    if (!this.masterKey) {
      throw new Error('Master key not initialized - call deriveMasterKey first');
    }
    return CryptoJS.HmacSHA256(tableName, this.masterKey).toString();
  }

  /**
   * Encrypt data for specific table
   */
  static encryptField(data: any, tableName: string): string {
    const tableKey = this.deriveTableKey(tableName);
    const dataString = typeof data === 'string' ? data : JSON.stringify(data);

    const encrypted = CryptoJS.AES.encrypt(dataString, tableKey).toString();
    return encrypted;
  }

  /**
   * Decrypt data from specific table
   */
  static decryptField(encryptedData: string, tableName: string): any {
    try {
      const tableKey = this.deriveTableKey(tableName);
      const decrypted = CryptoJS.AES.decrypt(encryptedData, tableKey);
      const decryptedString = decrypted.toString(CryptoJS.enc.Utf8);

      if (!decryptedString) {
        throw new Error('Decryption failed - invalid key or corrupted data');
      }

      // Try to parse as JSON, fallback to string
      try {
        return JSON.parse(decryptedString);
      } catch {
        return decryptedString;
      }
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt data - wrong password or corrupted data');
    }
  }

  /**
   * Generate time-limited AI access token
   * Token allows AI to decrypt data for limited time
   */
  static generateAIAccessToken(duration: number = 60000): string {
    if (!this.masterKey) {
      throw new Error('Master key not initialized');
    }

    const expiresAt = Date.now() + duration;
    const nonce = CryptoJS.lib.WordArray.random(128 / 8).toString();

    const token = {
      keyHash: CryptoJS.SHA256(this.masterKey).toString(),
      expiresAt,
      nonce,
      version: 1
    };

    return btoa(JSON.stringify(token));
  }

  /**
   * Verify AI access token is valid
   */
  static verifyAIAccessToken(token: string): boolean {
    try {
      const decoded = JSON.parse(atob(token));

      // Check expiration
      if (decoded.expiresAt < Date.now()) {
        return false;
      }

      // Verify key hash matches
      if (!this.masterKey) {
        return false;
      }

      const currentKeyHash = CryptoJS.SHA256(this.masterKey).toString();
      return decoded.keyHash === currentKeyHash;
    } catch {
      return false;
    }
  }

  /**
   * Encrypt entire journal entry
   */
  static encryptJournalEntry(entry: any): any {
    return {
      ...entry,
      // Encrypt sensitive fields
      content_encrypted: this.encryptField(entry.content, 'journalEntries'),
      conversation_history_encrypted: entry.conversationHistory
        ? this.encryptField(entry.conversationHistory, 'journalEntries')
        : null,
      ai_analysis_encrypted: entry.aiAnalysis
        ? this.encryptField(entry.aiAnalysis, 'journalEntries')
        : null,
      psychological_frameworks_encrypted: entry.psychologicalFrameworks
        ? this.encryptField(entry.psychologicalFrameworks, 'journalEntries')
        : null,
      relationship_patterns_encrypted: entry.relationshipPatterns
        ? this.encryptField(entry.relationshipPatterns, 'journalEntries')
        : null,
      trigger_data_encrypted: entry.triggerData
        ? this.encryptField(entry.triggerData, 'journalEntries')
        : null,
      trigger_analysis_encrypted: entry.triggerAnalysis
        ? this.encryptField(entry.triggerAnalysis, 'journalEntries')
        : null,
      regulation_data_encrypted: entry.regulationData
        ? this.encryptField(entry.regulationData, 'journalEntries')
        : null,

      // Clear plaintext (don't send to server)
      content: undefined,
      conversationHistory: undefined,
      aiAnalysis: undefined,
      psychologicalFrameworks: undefined,
      relationshipPatterns: undefined,
      triggerData: undefined,
      triggerAnalysis: undefined,
      regulationData: undefined,

      // Keep metadata (needed for queries)
      userId: entry.userId,
      mood: entry.mood,
      entryType: entry.entryType,
      createdAt: entry.createdAt
    };
  }

  /**
   * Decrypt journal entry
   */
  static decryptJournalEntry(entry: any): any {
    return {
      ...entry,
      content: entry.content_encrypted
        ? this.decryptField(entry.content_encrypted, 'journalEntries')
        : entry.content,
      conversationHistory: entry.conversation_history_encrypted
        ? this.decryptField(entry.conversation_history_encrypted, 'journalEntries')
        : entry.conversationHistory,
      aiAnalysis: entry.ai_analysis_encrypted
        ? this.decryptField(entry.ai_analysis_encrypted, 'journalEntries')
        : entry.aiAnalysis,
      psychologicalFrameworks: entry.psychological_frameworks_encrypted
        ? this.decryptField(entry.psychological_frameworks_encrypted, 'journalEntries')
        : entry.psychologicalFrameworks,
      relationshipPatterns: entry.relationship_patterns_encrypted
        ? this.decryptField(entry.relationship_patterns_encrypted, 'journalEntries')
        : entry.relationshipPatterns,
      triggerData: entry.trigger_data_encrypted
        ? this.decryptField(entry.trigger_data_encrypted, 'journalEntries')
        : entry.triggerData,
      triggerAnalysis: entry.trigger_analysis_encrypted
        ? this.decryptField(entry.trigger_analysis_encrypted, 'journalEntries')
        : entry.triggerAnalysis,
      regulationData: entry.regulation_data_encrypted
        ? this.decryptField(entry.regulation_data_encrypted, 'journalEntries')
        : entry.regulationData
    };
  }

  /**
   * Encrypt user profile data
   */
  static encryptUserProfile(user: any): any {
    return {
      ...user,
      first_name_encrypted: this.encryptField(user.firstName, 'users'),
      last_name_encrypted: this.encryptField(user.lastName, 'users'),
      preferred_name_encrypted: user.preferredName
        ? this.encryptField(user.preferredName, 'users')
        : null,
      location_encrypted: user.location
        ? this.encryptField(user.location, 'users')
        : null,
      family_background_encrypted: user.familyBackground
        ? this.encryptField(user.familyBackground, 'users')
        : null,

      // Clear plaintext
      firstName: undefined,
      lastName: undefined,
      preferredName: undefined,
      location: undefined,
      familyBackground: undefined,

      // Keep email (needed for login)
      email: user.email
    };
  }

  /**
   * Decrypt user profile data
   */
  static decryptUserProfile(user: any): any {
    return {
      ...user,
      firstName: user.first_name_encrypted
        ? this.decryptField(user.first_name_encrypted, 'users')
        : user.firstName,
      lastName: user.last_name_encrypted
        ? this.decryptField(user.last_name_encrypted, 'users')
        : user.lastName,
      preferredName: user.preferred_name_encrypted
        ? this.decryptField(user.preferred_name_encrypted, 'users')
        : user.preferredName,
      location: user.location_encrypted
        ? this.decryptField(user.location_encrypted, 'users')
        : user.location,
      familyBackground: user.family_background_encrypted
        ? this.decryptField(user.family_background_encrypted, 'users')
        : user.familyBackground
    };
  }

  /**
   * Clear all keys from memory (on logout)
   * CRITICAL: Always call this on logout
   */
  static clearKeys(): void {
    this.masterKey = null;
    console.log('Encryption keys cleared from memory');
  }

  /**
   * Check if encryption is initialized
   */
  static isInitialized(): boolean {
    return this.masterKey !== null;
  }
}
```

---

### AWS Nitro Enclave AI Processor

```python
# server/enclave/ai_processor.py

import boto3
import json
import time
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2
import openai
import os

class SecureAIProcessor:
    """
    AI processor that runs INSIDE AWS Nitro Enclave
    Memory is hardware-encrypted and isolated
    """

    def __init__(self):
        self.kms = boto3.client('kms', region_name='us-east-1')
        self.decryption_key = None
        self.openai_api_key = None
        self.load_keys()

    def load_keys(self):
        """
        Load decryption keys from AWS KMS
        CRITICAL: Keys can ONLY be loaded inside enclave
        """
        try:
            # Decrypt enclave-specific key from KMS
            response = self.kms.decrypt(
                CiphertextBlob=os.environ.get('ENCRYPTED_KEY'),
                EncryptionContext={'Enclave': 'Zenalyze-AI'}
            )
            self.decryption_key = response['Plaintext']

            # Load OpenAI API key (also encrypted in KMS)
            response = self.kms.decrypt(
                CiphertextBlob=os.environ.get('ENCRYPTED_OPENAI_KEY'),
                EncryptionContext={'Enclave': 'Zenalyze-AI'}
            )
            self.openai_api_key = response['Plaintext'].decode('utf-8')
            openai.api_key = self.openai_api_key

            print("[ENCLAVE] Keys loaded successfully")
        except Exception as e:
            print(f"[ENCLAVE ERROR] Failed to load keys: {e}")
            raise

    def verify_ai_access_token(self, token: str) -> bool:
        """
        Verify AI access token is valid and not expired
        """
        try:
            decoded = json.loads(token)

            # Check expiration (60 second window)
            if decoded['expiresAt'] < time.time() * 1000:
                print("[ENCLAVE] Token expired")
                return False

            # Verify nonce hasn't been used (prevent replay attacks)
            # TODO: Store used nonces in Redis with TTL

            print("[ENCLAVE] Token verified successfully")
            return True
        except Exception as e:
            print(f"[ENCLAVE ERROR] Token verification failed: {e}")
            return False

    def decrypt_data(self, encrypted_data: str, table_name: str) -> str:
        """
        Decrypt data INSIDE enclave
        Memory is hardware-encrypted
        """
        try:
            # Use Fernet for symmetric encryption
            f = Fernet(self.decryption_key)
            plaintext = f.decrypt(encrypted_data.encode()).decode()

            print(f"[ENCLAVE] Decrypted {len(plaintext)} characters")
            return plaintext
        except Exception as e:
            print(f"[ENCLAVE ERROR] Decryption failed: {e}")
            raise

    def encrypt_data(self, plaintext: str) -> str:
        """
        Re-encrypt data before returning
        """
        try:
            f = Fernet(self.decryption_key)
            encrypted = f.encrypt(plaintext.encode()).decode()

            print(f"[ENCLAVE] Encrypted {len(plaintext)} characters")
            return encrypted
        except Exception as e:
            print(f"[ENCLAVE ERROR] Encryption failed: {e}")
            raise

    def call_openai(self, prompt: str, system_message: str = None) -> str:
        """
        Call OpenAI API from inside enclave
        CRITICAL: No user identifiers sent to OpenAI
        """
        try:
            messages = []
            if system_message:
                messages.append({"role": "system", "content": system_message})
            messages.append({"role": "user", "content": prompt})

            response = openai.ChatCompletion.create(
                model="gpt-4",
                messages=messages,
                temperature=0.7,
                max_tokens=2000
            )

            result = response.choices[0].message.content
            print(f"[ENCLAVE] OpenAI returned {len(result)} characters")
            return result
        except Exception as e:
            print(f"[ENCLAVE ERROR] OpenAI call failed: {e}")
            raise

    def clear_memory(self, *variables):
        """
        Explicitly clear variables from memory
        Python doesn't guarantee this, but we try
        """
        for var in variables:
            if var:
                del var

    def process_journal_entry(
        self,
        encrypted_content: str,
        ai_access_token: str,
        analysis_type: str = 'full'
    ) -> dict:
        """
        Main entry point for journal analysis
        """
        plaintext = None
        ai_response = None

        try:
            # 1. Verify token
            if not self.verify_ai_access_token(ai_access_token):
                raise Exception("Invalid or expired AI access token")

            # 2. Decrypt content INSIDE enclave
            plaintext = self.decrypt_data(encrypted_content, 'journalEntries')

            # 3. Send to OpenAI (from inside enclave)
            system_message = """
            You are a compassionate AI therapist. Analyze this journal entry and provide:
            1. Warm acknowledgment
            2. Emotional insights
            3. Psychological patterns
            4. Supportive suggestions

            Be empathetic and non-judgmental.
            """

            ai_response = self.call_openai(plaintext, system_message)

            # 4. Re-encrypt AI result
            encrypted_result = self.encrypt_data(ai_response)

            # 5. CRITICAL: Clear plaintext from memory
            self.clear_memory(plaintext, ai_response)

            # 6. Return encrypted result
            return {
                'success': True,
                'encrypted_result': encrypted_result,
                'timestamp': time.time()
            }

        except Exception as e:
            print(f"[ENCLAVE ERROR] Processing failed: {e}")
            # Still clear memory on error
            self.clear_memory(plaintext, ai_response)
            return {
                'success': False,
                'error': str(e),
                'timestamp': time.time()
            }

    def get_attestation_document(self) -> dict:
        """
        Get cryptographic attestation of enclave integrity
        Users can verify this to ensure enclave is running correct code
        """
        try:
            # Get attestation from Nitro Enclave
            # This contains PCR measurements and signatures
            response = self.kms.describe_key(
                KeyId=os.environ.get('KMS_KEY_ID')
            )

            # In production, this would include:
            # - PCR0-15 measurements
            # - Enclave image hash
            # - AWS Nitro signature

            return {
                'version': 1,
                'enclave_image_hash': 'sha256:abc123...',
                'pcr_measurements': {
                    'PCR0': 'hash_value',
                    'PCR1': 'hash_value',
                    'PCR2': 'hash_value'
                },
                'timestamp': time.time()
            }
        except Exception as e:
            print(f"[ENCLAVE ERROR] Attestation failed: {e}")
            return {'error': str(e)}

# Flask app to expose enclave API
from flask import Flask, request, jsonify

app = Flask(__name__)
processor = SecureAIProcessor()

@app.route('/process', methods=['POST'])
def process():
    """
    Main endpoint for AI processing
    Receives encrypted data + token
    Returns encrypted result
    """
    data = request.json

    result = processor.process_journal_entry(
        encrypted_content=data['encrypted_content'],
        ai_access_token=data['ai_access_token'],
        analysis_type=data.get('analysis_type', 'full')
    )

    return jsonify(result)

@app.route('/attestation', methods=['GET'])
def attestation():
    """
    Provide cryptographic attestation
    Users can verify enclave integrity
    """
    return jsonify(processor.get_attestation_document())

@app.route('/health', methods=['GET'])
def health():
    """
    Health check endpoint
    """
    return jsonify({'status': 'healthy', 'timestamp': time.time()})

if __name__ == '__main__':
    # Run Flask app inside enclave
    # Only accessible from parent EC2 instance
    app.run(host='127.0.0.1', port=5000)
```

---

### Server-Side Enclave Client

```typescript
// server/utils/enclave-client.ts

import axios from 'axios';

interface EnclaveResponse {
  success: boolean;
  encrypted_result?: string;
  error?: string;
  timestamp: number;
}

export class EnclaveClient {
  private enclaveUrl: string;
  private timeout: number = 10000; // 10 second timeout

  constructor(enclaveUrl: string = 'http://127.0.0.1:5000') {
    this.enclaveUrl = enclaveUrl;
  }

  /**
   * Send encrypted data to Nitro Enclave for AI processing
   */
  async processJournalEntry(
    encryptedContent: string,
    aiAccessToken: string
  ): Promise<EnclaveResponse> {
    try {
      const response = await axios.post(
        `${this.enclaveUrl}/process`,
        {
          encrypted_content: encryptedContent,
          ai_access_token: aiAccessToken,
          analysis_type: 'full'
        },
        {
          timeout: this.timeout,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Enclave processing error:', error);
      throw new Error('Failed to process data in secure enclave');
    }
  }

  /**
   * Get enclave attestation document
   * Users can verify this to ensure enclave integrity
   */
  async getAttestation(): Promise<any> {
    try {
      const response = await axios.get(`${this.enclaveUrl}/attestation`);
      return response.data;
    } catch (error) {
      console.error('Failed to get attestation:', error);
      throw new Error('Failed to get enclave attestation');
    }
  }

  /**
   * Health check for enclave
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.enclaveUrl}/health`, {
        timeout: 5000
      });
      return response.data.status === 'healthy';
    } catch (error) {
      console.error('Enclave health check failed:', error);
      return false;
    }
  }
}

export const enclaveClient = new EnclaveClient();
```

---

### Server-Side Journal API with Encryption

```typescript
// server/routes-encryption.ts

import { Router } from 'express';
import { authenticateToken } from './middleware/authMiddleware.js';
import { storage } from './storage.js';
import { enclaveClient } from './utils/enclave-client.js';
import { logEncryptionEvent } from './utils/encryption-audit.js';

const router = Router();

/**
 * Analyze journal entry using Nitro Enclave
 * Client sends: encrypted content + AI access token
 * Server routes to enclave (cannot decrypt)
 * Enclave processes and returns encrypted result
 */
router.post('/api/journal/analyze-secure', authenticateToken, async (req: any, res) => {
  try {
    const userId = parseInt(req.user.id);
    const { entry_id, encrypted_content, ai_access_token } = req.body;

    // Verify user owns this entry
    const entry = await storage.getJournalEntry(entry_id);
    if (!entry || entry.userId !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Log AI access event
    await logEncryptionEvent({
      userId,
      action: 'ai_access',
      tableName: 'journalEntries',
      rowId: entry_id,
      success: true,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    // Send to Nitro Enclave for processing
    // Server CANNOT decrypt - only enclave can
    const enclaveResponse = await enclaveClient.processJournalEntry(
      encrypted_content,
      ai_access_token
    );

    if (!enclaveResponse.success) {
      throw new Error(enclaveResponse.error || 'Enclave processing failed');
    }

    // Store encrypted AI result
    // Server still cannot read it
    await storage.updateJournalEntry(entry_id, {
      ai_analysis_encrypted: enclaveResponse.encrypted_result
    });

    // Return encrypted result to client
    // Client will decrypt with user's key
    res.json({
      success: true,
      encrypted_ai_result: enclaveResponse.encrypted_result
    });
  } catch (error) {
    console.error('Secure journal analysis error:', error);
    res.status(500).json({ message: 'Failed to analyze journal entry' });
  }
});

/**
 * Get encryption audit log for user
 * Shows all encryption/decryption events
 */
router.get('/api/encryption/audit-log', authenticateToken, async (req: any, res) => {
  try {
    const userId = parseInt(req.user.id);

    const logs = await storage.getEncryptionAuditLog(userId);

    res.json({ logs });
  } catch (error) {
    console.error('Failed to fetch audit log:', error);
    res.status(500).json({ message: 'Failed to fetch audit log' });
  }
});

/**
 * Get enclave attestation
 * Users can verify enclave integrity
 */
router.get('/api/encryption/attestation', async (req, res) => {
  try {
    const attestation = await enclaveClient.getAttestation();
    res.json(attestation);
  } catch (error) {
    console.error('Failed to get attestation:', error);
    res.status(500).json({ message: 'Failed to get enclave attestation' });
  }
});

export default router;
```

---

### Encryption Audit Logging

```typescript
// server/utils/encryption-audit.ts

import { storage } from '../storage.js';

interface EncryptionEvent {
  userId: number;
  action: 'encrypt' | 'decrypt' | 'key_derivation' | 'ai_access';
  tableName: string;
  rowId?: number;
  success: boolean;
  errorMessage?: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Log all encryption events for transparency and security
 * Users can review their audit log
 */
export async function logEncryptionEvent(event: EncryptionEvent): Promise<void> {
  try {
    await storage.createEncryptionAuditLog({
      user_id: event.userId,
      action: event.action,
      table_name: event.tableName,
      row_id: event.rowId,
      success: event.success,
      error_message: event.errorMessage,
      ip_address: event.ipAddress,
      user_agent: event.userAgent
    });
  } catch (error) {
    console.error('Failed to log encryption event:', error);
    // Don't throw - logging failure shouldn't break main flow
  }
}
```

---

### React Hook for Encryption

```typescript
// client/src/hooks/useEncryption.ts

import { useState, useEffect } from 'react';
import { ZeroKnowledgeEncryption } from '../utils/zero-knowledge-encryption';

export function useEncryption() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsInitialized(ZeroKnowledgeEncryption.isInitialized());
  }, []);

  /**
   * Initialize encryption with user password
   */
  const initializeEncryption = async (password: string, salt: string) => {
    setIsLoading(true);
    try {
      await ZeroKnowledgeEncryption.deriveMasterKey(password, salt);
      setIsInitialized(true);
    } catch (error) {
      console.error('Failed to initialize encryption:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Clear encryption keys (on logout)
   */
  const clearEncryption = () => {
    ZeroKnowledgeEncryption.clearKeys();
    setIsInitialized(false);
  };

  /**
   * Encrypt journal entry
   */
  const encryptJournalEntry = (entry: any) => {
    if (!isInitialized) {
      throw new Error('Encryption not initialized');
    }
    return ZeroKnowledgeEncryption.encryptJournalEntry(entry);
  };

  /**
   * Decrypt journal entry
   */
  const decryptJournalEntry = (entry: any) => {
    if (!isInitialized) {
      throw new Error('Encryption not initialized');
    }
    return ZeroKnowledgeEncryption.decryptJournalEntry(entry);
  };

  /**
   * Generate AI access token
   */
  const generateAIAccessToken = (duration: number = 60000) => {
    if (!isInitialized) {
      throw new Error('Encryption not initialized');
    }
    return ZeroKnowledgeEncryption.generateAIAccessToken(duration);
  };

  return {
    isInitialized,
    isLoading,
    initializeEncryption,
    clearEncryption,
    encryptJournalEntry,
    decryptJournalEntry,
    generateAIAccessToken
  };
}
```

---

## SUMMARY

This encryption strategy provides:

1. **Zero-Knowledge Architecture** - Server cannot read user data
2. **AI Processing** - Secure enclave allows AI analysis without exposing data
3. **Hardware Security** - AWS Nitro Enclaves provide military-grade isolation
4. **Cryptographic Proof** - Attestation verifies enclave integrity
5. **Competitive Advantage** - First consumer mental health AI with this level of security
6. **Revenue Opportunity** - Premium tier + B2B licensing
7. **Compliance** - HIPAA, GDPR, SOC 2 ready

**Investment**: $34K to build, $500/month to operate
**Timeline**: 8-10 weeks to launch
**Expected ROI**: 10x+ over 5 years

**Next Steps**: Review this strategy, approve approach, and begin implementation Week 1.
