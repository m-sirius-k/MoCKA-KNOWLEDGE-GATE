# NotebookLM Bidirectional Integration Guide

## Overview

This guide provides a comprehensive implementation of **bidirectional (双方吁E synchronization** between MoCKA-KNOWLEDGE-GATE and Google NotebookLM. The integration enables seamless two-way data flow with real-time updates, webhook triggers, and automated knowledge management.

## Architecture Overview

### System Components

```
┌─────────────────────────────────────────────────────────────━E━E                   GitHub Repository                        ━E━E        (MoCKA-KNOWLEDGE-GATE on main branch)              ━E├─────────────────────────────────────────────────────────────┤
━E                                                             ━E━E AI-SIMULATION/    AI-SHARE-      ALGORITHM-             ━E━E data/             CONSTITUTION/  DELIVERABLES/          ━E━E                                                             ━E└──────────────┬──────────────────────────────┬──────────────━E               ━E                             ━E         [GitHub Actions]              [Webhooks]
               ━E                             ━E               ▼                              ▼
┌──────────────────────────────────────────────────────────────━E━E        API Gateway & Middleware (Node.js Next.js)          ━E├──────────────────────────────────────────────────────────────┤
━E /api/notebooklm-sync     (Bidirectional Sync)             ━E━E /api/notebooklm-webhook  (Webhook Handler)                ━E━E /api/notebooklm-export   (Export to NotebookLM)          ━E━E /api/notebooklm-import   (Import from NotebookLM)        ━E━E /api/notebooklm-metadata (Metadata Management)            ━E━E /api/knowledge-sync       (Knowledge Base Sync)            ━E└──────────────┬──────────────────────────────────────────────━E               ━E               ▼
┌──────────────────────────────────────────────────────────────━E━E            Google NotebookLM & Google AI API               ━E├──────────────────────────────────────────────────────────────┤
━E                                                             ━E━E Notebooks  ━E Sources  ━E Notes  ━E Audio Guide━E Export━E━E                                                             ━E└──────────────────────────────────────────────────────────────━E```

## Bidirectional Sync Flow

### 1. GitHub ↁENotebookLM (Push)

When AI simulations complete or algorithms are delivered:

```mermaid
GitHub Commit
    ↁE[Generate ISSUE-ID & ROD Number]
    ↁE[Create/Update Simulation Result]
    ↁE[Trigger notebooklm-sync API]
    ↁE[Export to NotebookLM Notebook]
    ↁE[Log sync metadata]
```

### 2. NotebookLM ↁEGitHub (Pull)

When notebooks are updated or new insights are generated:

```mermaid
NotebookLM Webhook Event
    ↁE[Receive webhook at /api/notebooklm-webhook]
    ↁE[Extract notebook data & metadata]
    ↁE[Create/Update GitHub issue]
    ↁE[Store as AI-SIMULATION result]
    ↁE[Commit to main branch]
    ↁE[Generate audit logs]
```

## Implementation Files

### Required API Endpoints

1. **notebooklm-sync.js** - Main bidirectional sync orchestrator
2. **notebooklm-webhook.js** - Webhook receiver for NotebookLM events
3. **notebooklm-export.js** - Export simulation data to NotebookLM
4. **notebooklm-import.js** - Import insights from NotebookLM
5. **notebooklm-metadata.js** - Manage sync metadata and mappings
6. **knowledge-sync.js** - Synchronize knowledge base

### Metadata Storage

```javascript
// Sync Metadata Structure
{
  syncId: "sync-ISSUE-001-ROD-001-20231118",
  issueId: "ISSUE-001",
  rodNumber: "ROD-001",
  notebookId: "notebook-uuid",
  direction: "push"|"pull",
  status: "pending"|"syncing"|"completed"|"failed",
  lastSyncTime: "2025-11-18T05:00:00Z",
  sourceTimestamp: "2025-11-18T04:55:00Z",
  dataHash: "sha256-hash",
  changes: {
    added: [...],
    updated: [...],
    deleted: [...]
  },
  metrics: {
    rowsAffected: 10,
    bytesTransferred: 5120,
    executionTimeMs: 1234
  },
  errors: []
}
```

## Environment Variables Required

```bash
# Google NotebookLM API
NOTEBOOKLM_API_KEY=xxx
NOTEBOOKLM_PROJECT_ID=xxx
NOTEBOOKLM_API_ENDPOINT=https://notebooklm.googleapis.com/v1

# GitHub Integration
GITHUB_TOKEN=xxx
GITHUB_REPO=nsjpkimura-del/MoCKA-KNOWLEDGE-GATE

# Webhook Configuration
WEBHOOK_SECRET=xxx
WEBHOOK_URL=https://your-domain.com/api/notebooklm-webhook

# Firebase (for metadata storage)
FIREBASE_PROJECT_ID=xxx
FIREBASE_CLIENT_EMAIL=xxx
FIREBASE_PRIVATE_KEY=xxx

# Logging
LOG_LEVEL=info
LOG_PATH=data/notebooklm-logs
```

## Workflow Integration Steps

### Step 1: Configure Webhooks

1. Register NotebookLM webhook endpoint in Google Cloud Console
2. Set webhook secret in environment variables
3. Test webhook connectivity

### Step 2: Update GitHub Actions Workflow

Add to `.github/workflows/ai-simulation.yml`:

```yaml
- name: Sync to NotebookLM
  if: success()
  run: |
    curl -X POST http://localhost:3000/api/notebooklm-sync \
      -H "Content-Type: application/json" \
      -d '{
        "issueId": "${{ steps.generate_ids.outputs.ISSUE_ID }}",
        "rodNumber": "${{ steps.generate_ids.outputs.ROD_NUMBER }}",
        "simulationData": "${{ steps.simulation.outputs.RESULT }}",
        "direction": "push"
      }'
```

### Step 3: Create Data Export Format

NotebookLM compatible export:

```json
{
  "metadata": {
    "issueId": "ISSUE-001",
    "rodNumber": "ROD-001",
    "timestamp": "2025-11-18T05:00:00Z",
    "source": "MoCKA-KNOWLEDGE-GATE"
  },
  "content": {
    "title": "AI Simulation Result: ISSUE-001-ROD-001",
    "sections": [
      {
        "name": "Execution Summary",
        "content": "..."
      },
      {
        "name": "Metrics",
        "content": "..."
      },
      {
        "name": "Logs",
        "content": "..."
      }
    ]
  },
  "sources": [
    {
      "type": "github_commit",
      "url": "https://github.com/.../commit/...",
      "timestamp": "2025-11-18T04:55:00Z"
    }
  ]
}
```

### Step 4: Conflict Resolution

When bidirectional sync conflicts occur:

```javascript
conflictResolutionStrategy: {
  // Latest Write Wins (Default)
  "lww": {
    precedence: "timestamp",
    description: "Most recent modification is kept"
  },
  // GitHub Primary
  "github_primary": {
    precedence: "github",
    description: "GitHub data always overwrites NotebookLM"
  },
  // NotebookLM Primary
  "notebooklm_primary": {
    precedence: "notebooklm",
    description: "NotebookLM data always overwrites GitHub"
  },
  // Manual Review
  "manual": {
    precedence: "manual",
    description: "Flag conflict for manual review"
  }
}
```

## Monitoring & Logging

### Sync Metrics

```
data/notebooklm-logs/
├── sync-metrics-2025-11-18.json
├── webhook-events-2025-11-18.json
├── conflict-log-2025-11-18.json
├── error-log-2025-11-18.json
└── performance-metrics-2025-11-18.json
```

### Health Check Endpoint

```bash
GET /api/notebooklm-health

Response:
{
  "status": "healthy",
  "lastSyncTime": "2025-11-18T05:10:00Z",
  "pendingSyncs": 3,
  "failedSyncs": 0,
  "apiLatency": 145,
  "webhookStatus": "connected"
}
```

## Security Considerations

1. **Authentication**
   - Use OAuth 2.0 for NotebookLM API access
   - Store credentials in environment variables
   - Rotate API keys regularly

2. **Webhook Security**
   - Verify HMAC-SHA256 signatures
   - Use HTTPS only
   - Implement rate limiting

3. **Data Encryption**
   - Encrypt PII in transit and at rest
   - Use field-level encryption for sensitive data

4. **Access Control**
   - Implement role-based access control (RBAC)
   - Audit all sync operations
   - Maintain detailed logs

## Rollback Procedures

If sync fails:

```bash
# Rollback to last known good state
GET /api/notebooklm-sync/rollback?issueId=ISSUE-001&rodNumber=ROD-001

# Verify state
GET /api/notebooklm-sync/verify?issueId=ISSUE-001

# Force resync
POST /api/notebooklm-sync/force-resync
```

## Performance Optimization

1. **Batch Operations**
   - Sync multiple records in single API call
   - Implement request queuing

2. **Caching**
   - Cache NotebookLM metadata locally
   - Implement cache invalidation strategy

3. **Async Processing**
   - Use background jobs for large syncs
   - Implement exponential backoff for retries

## Testing

```bash
# Unit tests
npm test -- notebooklm-sync.test.js

# Integration tests
npm run test:integration -- notebooklm

# End-to-end tests
npm run test:e2e -- notebooklm-bidirectional
```

## References

- [Google NotebookLM API Documentation](https://cloud.google.com/notebooklm/docs)
- [GitHub API v3 Documentation](https://docs.github.com/en/rest)
- [Webhook Event Types](https://docs.github.com/en/developers/webhooks-and-events)

## Support & Troubleshooting

For issues or questions:

1. Check sync logs: `data/notebooklm-logs/`
2. Verify API keys and credentials
3. Test webhook connectivity
4. Review error messages and stack traces
5. Create GitHub issue with detailed logs
