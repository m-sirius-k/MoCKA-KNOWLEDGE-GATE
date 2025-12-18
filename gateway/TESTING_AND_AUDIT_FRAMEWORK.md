# TESTING_AND_AUDIT_FRAMEWORK

## MoCKA-GATE Automated Testing and Audit Framework

### Purpose

This document defines the testing and audit framework for MoCKA-GATE staging and production deployments.

### 1. Staging Tests

**Run:** `bash scripts/run_staging_tests.sh`

**Test Cases:**
- Connectivity check: `/v1/status/ping` => 200 OK
- JWT authentication: `POST /v1/intention/submit` => status: accepted
- Client testing: Gemini/Copilot (Python/TypeScript)
- Rate limiting: 10 req/min exceeded => 429 Too Many Requests

### 2. Production Tests

**Run:** `bash scripts/run_production_tests.sh`

**Configuration:**
- NODE_ENV=production
- Base URL: https://mocka-gate-prod.example.com
- JWT regeneration with production secrets

**Test Cases:**
- Production connectivity
- Intent submission with audit logging
- Audit trail verification

### 3. Audit Log Format

**Location:** `gateway/audit-logs/`

**Schema:**
{
  "auditId": "AUD-20251218-000789",
  "requestId": "UUID",
  "clientId": "gemini|copilot",
  "event": "staging_test|production_test|intent_submit",
  "status": "completed|failed|pending",
  "timestamp": "2025-12-18T11:30:00Z",
  "details": {
    "steps": [],
    "outcome": "",
    "duration_ms": 1234
  }
}

### 4. Audit Publication

**Internal Audit:**
- BigQuery: `gateway_logs_prod.intent_requests`
- Looker Dashboard: "MoCKA-GATE Audit View"
- Search by auditId

**External Audit:**
- CSV/JSON export
- PII anonymized
- Published items: auditId, event, status, timestamp, outcome

### 5. Ceremony Declaration

After production migration, execute audit publication ceremony:

**Command:**
```bash
node scripts/audit-publication-ceremony.js
```

This declares:
- Audit logs saved to BigQuery
- Internal views published
- External reports generated
- Transparency guaranteed

### 6. Completion Checklist

- [ ] run_staging_tests.sh PASS 100%
- [ ] run_production_tests.sh PASS 100%
- [ ] BigQuery audit trail saved
- [ ] Looker dashboard functional
- [ ] External audit report generated
- [ ] Audit ceremony completed
- [ ] GitHub audit-reports directory created

### 7. Troubleshooting

**Staging tests fail with HTTP 500:**
- Verify NODE_ENV=staging
- Check staging server online
- Review: tail -f gateway/logs/staging_test.log

**JWT authentication fails:**
- Verify secrets file exists: ls -la gateway/.env.staging
- Regenerate JWT: npm run generate-jwt:staging
- Check token expiration

**BigQuery upload fails:**
- Verify GCP auth: gcloud auth list
- Check permissions: gcloud projects get-iam-policy mocka-knowledge-gate
- Verify table exists in BigQuery

---

MoCKA-GATE ensures complete transparency, reproducibility, and auditability through systematic testing and documented audit trails.
