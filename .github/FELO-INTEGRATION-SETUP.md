# Felo AI Search Integration Setup Guide

## Overview
This guide walks through the setup and configuration of bidirectional integration between MoCKA-KNOWLEDGE-GATE and Felo AI Search.

## Prerequisites
- GitHub repository admin access
- Felo AI API credentials
- Understanding of GitHub Actions and Secrets

## Step 1: Configure Repository Secrets

Navigate to your repository Settings ↁESecrets and variables ↁEActions, and add the following secrets:

### Required Secrets

#### 1. FELO_API_TOKEN
**Type:** GitHub Repository Secret
**Description:** OAuth2 access token for Felo AI API
**Value:** Your Felo OAuth token (Bearer token format)

```bash
# Example:
FELO_API_TOKEN=felo_oauth2_token_xxxxxxxxxxxxx
```

#### 2. FELO_WEBHOOK_URL
**Type:** GitHub Repository Secret  
**Description:** Webhook endpoint for receiving sync notifications from Felo
**Value:** Complete webhook URL with protocol

```bash
# Example:
FELO_WEBHOOK_URL=https://webhook.felo.ai/repository-update
```

## Step 2: Verify Configuration Files

Ensure the following configuration files are in place:

- `connection/connection-info.yaml` - Main connection configuration
  - Contains Felo integration settings
  - Defines data mapping rules
  - Specifies authentication methods

- `.github/workflows/felo-bidirectional-sync.yml` - GitHub Actions workflow
  - Automated sync job every 5 minutes
  - Bidirectional data exchange
  - Webhook notifications
  - Health checks

## Step 3: Test the Integration

### Manual Workflow Trigger

1. Go to Actions tab
2. Select "Felo Bidirectional Sync" workflow
3. Click "Run workflow"
4. Monitor execution in the workflow logs

### Verify Sync Status

Check the generated log files:
- `sync_log.txt` - Complete sync history
- `docs/felo-enriched-data.json` - Enriched data from Felo

## Step 4: Monitor Sync Operations

### Metrics Endpoint
View sync metrics at: `/metrics/felo-sync`

### Health Check
Endpoint: `https://api.felo.ai/v1/health`

### Troubleshooting

If syncs fail:
1. Check GitHub Actions logs for error messages
2. Verify FELO_API_TOKEN is valid and not expired
3. Confirm FELO_WEBHOOK_URL is accessible
4. Check network connectivity to api.felo.ai

## Data Synchronization Details

### Knowledge Gate ↁEFelo
**Endpoint:** `/api/v1/share` (POST)
**Frequency:** Every 5 minutes (configurable)
**Data Mapped:**
- ISSUE-ID ↁEknowledge_id
- TRUST_SCORE ↁEconfidence_score (0-1 scale)
- rod-number ↁEreference_id

### Felo ↁEKnowledge Gate
**Endpoint:** `/api/v1/fetch` (GET)
**Frequency:** Every 5 minutes (configurable)
**Data Mapped:**
- search_result_id ↁEISSUE-ID
- relevance_score ↁETRUST_SCORE (0-100 scale)

## Webhook Events

### Inbound Webhooks (Felo ↁEGitHub)
- `data-update` - Data updated in Felo
- `sync-status` - Sync status notification

### Outbound Webhooks (GitHub ↁEFelo)
- `repository-push` - Repository changes
- `content-modified` - Content modifications
- `repository-sync-complete` - Sync completed

## Cache Configuration
- **Enabled:** true
- **TTL:** 3600 seconds (1 hour)
- **Backend:** Redis

## Error Handling
- **Retry Attempts:** 3
- **Retry Backoff:** Exponential
- **Max Retry Delay:** 300 seconds
- **Fallback Mode:** Read-only

## Compliance & Security
- **Data Retention:** 90 days
- **PII Handling:** Encrypted
- **GDPR Compliant:** Yes

## Logging
- **Felo Sync Logs:** Enabled
- **Debug Mode:** Disabled (set to true for troubleshooting)
- **Log Level:** info
- **Health Check Interval:** 60 seconds

## Advanced Configuration

### Modify Sync Frequency

Edit `.github/workflows/felo-bidirectional-sync.yml`:

```yaml
on:
  schedule:
    - cron: '*/5 * * * *'  # Change this cron expression
```

Common intervals:
- `'*/5 * * * *'` - Every 5 minutes
- `'0 * * * *'` - Every hour
- `'0 0 * * *'` - Daily

### Enable Debug Logging

In `connection/connection-info.yaml`:

```yaml
felo_integration:
  logging:
    debug_mode: true  # Change to true
    log_level: debug  # Change from 'info'
```

## Support & Issues

For integration issues:
1. Check `.github/workflows/felo-bidirectional-sync.yml` logs
2. Review `sync_log.txt` for error details
3. Consult Felo API documentation: https://api.felo.ai/docs
4. Contact repository maintainers

## Success Criteria

✁ESecrets are configured in GitHub  
✁EWorkflow runs successfully (green checkmark)  
✁E`sync_log.txt` shows [TO_FELO] SUCCESS and [FROM_FELO] SUCCESS  
✁E`docs/felo-enriched-data.json` contains enriched data  
✁EWebhook notifications received by Felo  

## Next Steps

1. Set up API monitoring and alerting
2. Configure rate limiting if needed
3. Plan for data backup and recovery
4. Document custom data mappings for your use case
