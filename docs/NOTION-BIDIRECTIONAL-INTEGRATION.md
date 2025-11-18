# Notion Bidirectional Integration Guide

## Overview

This guide explains how to integrate Notion database with AI Simulation outputs. The Notion integration provides bidirectional synchronization between GitHub repositories and Notion databases, enabling seamless management of AI-generated content with automatic metadata tracking using ISSUE-ID and ROD numbers.

### Key Features

1. **Bidirectional Sync** - Sync AI outputs to Notion AND retrieve data back from Notion
2. **ISSUE-ID & ROD Tracking** - Automatic metadata tracking for all operations
3. **Webhook Support** - Real-time event handling from Notion database changes
4. **Batch Operations** - Export/import multiple AI outputs at once
5. **Audit Logging** - Complete Firestore logging for all operations
6. **HMAC Verification** - SHA256 signature verification for webhooks

## Installation

### 1. Set Environment Variables

```bash
export NOTION_API_KEY="your-notion-api-key"
export NOTION_DATABASE_ID="your-database-id"
export NOTION_WEBHOOK_SECRET="your-webhook-secret"
```

### 2. Create Notion Database

Create a Notion database with the following properties:

- **AI Output** (Title) - Main title for the output
- **Issue ID** (Text) - ISSUE-ID identifier
- **Rod Number** (Text) - ROD number identifier  
- **Model** (Select) - AI model used (gpt-4, claude-3, etc.)
- **Tokens Used** (Number) - Number of tokens consumed
- **Cost** (Number) - Cost in USD
- **Created** (Date) - Creation timestamp

### 3. Setup Webhook

```bash
curl -X POST https://api.notion.com/v1/webhooks \
  -H "Authorization: Bearer ${NOTION_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "database_id": "'${NOTION_DATABASE_ID}'",
    "url": "https://your-domain.com/api/notion-webhook",
    "events": ["page.updated", "database.changes"],
    "secret": "'${NOTION_WEBHOOK_SECRET}'"
  }'
```

## API Files

### 1. notion-sync.js

**Purpose**: Main bidirectional sync orchestrator

**Methods**:
- `syncToNotion(issueId, rodNumber, aiOutput)` - Export AI output to Notion
- `syncFromNotion(issueId, rodNumber)` - Import AI outputs from Notion
- `verifyNotionSignature(payload, signature)` - Verify webhook signatures

**Usage Example**:

```javascript
import NotionSync from './pages/api/notion-sync.js';

const result = await NotionSync.syncToNotion(
  'ISSUE-001',
  'ROD-001',
  {
    content: 'AI generated content here...',
    model: 'gpt-4',
    tokensUsed: 2048,
    cost: 0.06,
  }
);

console.log(result); // { success: true, pageId: '...' }
```

### 2. notion-webhook.js

**Purpose**: Handle incoming webhook events from Notion

**Methods**:
- `handle(request)` - Main webhook handler
- `handlePageUpdated(pageId, issueId, rodNumber, eventData)` - Page update handler
- `handleDatabaseChanges(databaseId, issueId, rodNumber, changedPages)` - Database change handler

**Usage Example**:

```bash
curl -X POST http://localhost:3000/api/notion-webhook \
  -H "Content-Type: application/json" \
  -H "X-Notion-Signature: sha256=..." \
  -d '{
    "event_type": "page.updated",
    "data": {
      "page_id": "page-uuid",
      "issue_id": "ISSUE-001",
      "rod_number": "ROD-001",
      "properties": {...}
    }
  }'
```

### 3. notion-export.js

**Purpose**: Export AI outputs to Notion database

**Methods**:
- `exportAIOutput(issueId, rodNumber, aiOutput)` - Single export
- `batchExport(exportItems)` - Batch export multiple outputs

**Usage Example**:

```javascript
import NotionExport from './pages/api/notion-export.js';

const result = await NotionExport.batchExport([
  {
    issueId: 'ISSUE-001',
    rodNumber: 'ROD-001',
    aiOutput: { content: 'Output 1...', model: 'gpt-4' }
  },
  {
    issueId: 'ISSUE-002',
    rodNumber: 'ROD-002',
    aiOutput: { content: 'Output 2...', model: 'claude-3' }
  }
]);

console.log(result);
// {
//   success: true,
//   totalItems: 2,
//   successCount: 2,
//   failureCount: 0
// }
```

### 4. notion-import.js

**Purpose**: Import AI outputs from Notion database

**Methods**:
- `importAIOutputs(issueId, rodNumber)` - Import by ISSUE-ID and ROD
- `queryNotion(filters)` - Custom database queries
- `syncToGitHub(importedData)` - Sync imported data back to GitHub

**Usage Example**:

```javascript
import NotionImport from './pages/api/notion-import.js';

const result = await NotionImport.importAIOutputs('ISSUE-001', 'ROD-001');

if (result.success) {
  console.log(`Imported ${result.results.length} items`);
  
  // Sync to GitHub
  await NotionImport.syncToGitHub(result.results);
}
```

## Firestore Collections

All operations are logged in Firestore:

### notion_integration_log
```json
{
  "issueId": "ISSUE-001",
  "rodNumber": "ROD-001",
  "pageId": "page-uuid",
  "action": "create",
  "timestamp": "2024-01-15T10:30:00Z",
  "status": "success"
}
```

### notion_webhook_events
```json
{
  "pageId": "page-uuid",
  "issueId": "ISSUE-001",
  "rodNumber": "ROD-001",
  "eventType": "page_updated",
  "status": "processed",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### notion_export_log
```json
{
  "issueId": "ISSUE-001",
  "rodNumber": "ROD-001",
  "pageId": "page-uuid",
  "status": "exported",
  "model": "gpt-4",
  "tokensUsed": 2048,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### notion_import_log
```json
{
  "issueId": "ISSUE-001",
  "rodNumber": "ROD-001",
  "itemsImported": 5,
  "status": "imported",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## Webhook Integration

### Event Types

**page.updated** - Triggered when a Notion page is updated
```json
{
  "event_type": "page.updated",
  "data": {
    "page_id": "...",
    "issue_id": "ISSUE-001",
    "rod_number": "ROD-001",
    "properties": {...}
  }
}
```

**database.changes** - Triggered when multiple pages in database change
```json
{
  "event_type": "database.changes",
  "data": {
    "database_id": "...",
    "issue_id": "ISSUE-001",
    "rod_number": "ROD-001",
    "changed_pages": [{...}, {...}]
  }
}
```

## Security

### HMAC-SHA256 Verification

All webhooks are verified using HMAC-SHA256:

```javascript
const crypto = require('crypto');

function verifySignature(payload, signature) {
  const hash = crypto
    .createHmac('sha256', process.env.NOTION_WEBHOOK_SECRET)
    .update(payload)
    .digest('hex');
  return `sha256=${hash}` === signature;
}
```

### Best Practices

1. **Always verify webhook signatures** before processing
2. **Use environment variables** for API keys and secrets
3. **Enable Firestore Rules** to restrict collection access
4. **Monitor audit logs** for suspicious activity
5. **Implement rate limiting** on webhook endpoints

## Troubleshooting

### Issue: "Invalid webhook signature"
- Verify `NOTION_WEBHOOK_SECRET` matches Notion configuration
- Check webhook payload format
- Ensure signature header is correctly formatted

### Issue: "Database not found"
- Verify `NOTION_DATABASE_ID` is correct
- Check API key has database access
- Ensure database is shared with API key user

### Issue: "Missing ISSUE-ID or ROD number"
- Verify webhook payload includes `issue_id` and `rod_number` fields
- Check Notion page properties match expected format

## Monitoring

### Check Integration Health

```bash
curl -X GET http://localhost:3000/api/notion-sync/health \
  -H "Authorization: Bearer ${API_TOKEN}"
```

### View Recent Logs

```bash
# Check latest 10 export logs
db.collection('notion_export_log')
  .orderBy('timestamp', 'desc')
  .limit(10)
  .get()
```

## Deployment

### GitHub Actions Integration

Add to `.github/workflows/ai-simulation.yml`:

```yaml
- name: Sync to Notion
  run: |
    node -e "
    import NotionExport from './pages/api/notion-export.js';
    await NotionExport.exportAIOutput(
      '${{ env.ISSUE_ID }}',
      '${{ env.ROD_NUMBER }}',
      ${{ env.AI_OUTPUT }}
    );
    "
```

## Support

For issues or questions:
1. Check Firestore audit logs
2. Review webhook event logs
3. Verify environment variables
4. Contact the development team

---

**Last Updated**: 2024-01-15
**Version**: 1.0
**Status**: Production Ready
