# GitHub Secrets Configuration Guide

## Overview
This guide explains how to configure GitHub repository secrets required for Felo AI Search bidirectional integration.

## Prerequisites
- Repository admin access
- Felo AI API credentials
- Understanding of GitHub Actions and Secrets

## Step 1: Access Repository Settings

1. Navigate to your repository: `https://github.com/nsjpkimura-del/MoCKA-KNOWLEDGE-GATE`
2. Click the **Settings** tab
3. In the left sidebar, click **Secrets and variables**
4. Select **Actions**

## Step 2: Add FELO_API_TOKEN Secret

### Configuration Steps:

1. Click **New repository secret**
2. Enter the following:
   - **Name:** `FELO_API_TOKEN`
   - **Secret:** Your Felo OAuth2 access token

### Token Format:
```
felo_oauth2_<random_string>
```

### How to Obtain Felo API Token:

1. Visit [Felo AI Dashboard](https://dashboard.felo.ai)
2. Navigate to **API Settings** or **Integrations**
3. Click **Generate OAuth Token**
4. Select scopes:
   - `read:knowledge`
   - `write:knowledge`
   - `read:metadata`
   - `write:metadata`
5. Click **Generate**
6. Copy the token immediately (cannot be retrieved later)

### Token Security Notes:
- Tokens expire after 90 days by default
- Keep tokens confidential - never commit to repository
- Rotate tokens regularly
- If compromised, regenerate immediately

### Example Configuration:
```
Name: FELO_API_TOKEN
Secret: felo_oauth2_eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Step 3: Add FELO_WEBHOOK_URL Secret

### Configuration Steps:

1. Click **New repository secret**
2. Enter the following:
   - **Name:** `FELO_WEBHOOK_URL`
   - **Secret:** Your webhook endpoint URL

### Webhook Endpoint Requirements:

- **Protocol:** HTTPS (required for security)
- **Method:** POST
- **Format:** `https://yourdomain.com/webhook/felo`

### Webhook Endpoint Setup:

If you don't have a webhook receiver yet, see [Webhook Receiver Implementation Guide](./WEBHOOK-RECEIVER.md)

### Supported Events:
- `data-update`: Data updated in Felo
- `sync-status`: Sync status notification
- `error-occurred`: Error event notification

### Example Configuration:
```
Name: FELO_WEBHOOK_URL
Secret: https://webhook.example.com/felo/webhook
```

## Step 4: Verification

### Verify Secrets Are Set:

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Confirm both secrets appear in the list:
   - ✅ `FELO_API_TOKEN`
   - ✅ `FELO_WEBHOOK_URL`

### Run Workflow to Test:

1. Go to **Actions** tab
2. Select **Felo Bidirectional Sync**
3. Click **Run workflow** → **main branch**
4. Monitor the execution:
   - Check for green checkmarks ✅
   - Review logs for errors

## Step 5: Troubleshooting

### Secret Not Found Error
```
error: secret 'FELO_API_TOKEN' is not found in your environment
```
**Solution:** Verify secret name exactly matches (case-sensitive)

### Invalid Token Error
```
error: Invalid OAuth token. Token may be expired or revoked.
```
**Solution:** 
- Regenerate token from Felo Dashboard
- Update secret with new token
- Ensure token has correct scopes

### Webhook Connection Failed
```
error: Failed to connect to webhook URL
```
**Solution:**
- Verify webhook URL is correct and accessible
- Confirm webhook server is running
- Check firewall/security group settings
- Review webhook logs for incoming requests

## Step 6: Security Best Practices

### Do's:
- ✅ Use strong, random tokens
- ✅ Rotate tokens every 90 days
- ✅ Use HTTPS for webhook URLs
- ✅ Enable webhook signature verification
- ✅ Monitor secret access logs

### Don'ts:
- ❌ Commit secrets to repository
- ❌ Share tokens via email or chat
- ❌ Use test tokens in production
- ❌ Hardcode URLs in code
- ❌ Log sensitive data

## Step 7: Testing Integration

### Manual Test:

```bash
# Test API Token
curl -H "Authorization: Bearer $FELO_API_TOKEN" \
  https://api.felo.ai/v1/health

# Response should be:
{"status": "healthy", "timestamp": "2025-11-18T14:00:00Z"}
```

### Verify Webhook:

```bash
# Send test payload
curl -X POST $FELO_WEBHOOK_URL \
  -H "Content-Type: application/json" \
  -d '{"event": "test", "timestamp": "2025-11-18T14:00:00Z"}'
```

## Step 8: Monitoring

### Check Sync Status:

1. Go to repository **Actions**
2. Select **Felo Bidirectional Sync**
3. Review workflow runs
4. Check `sync_log.txt` for details

### View Enriched Data:

1. Navigate to `docs/felo-enriched-data.json`
2. Verify data is being populated
3. Check timestamps for recent syncs

## Step 9: Rotation Schedule

### Token Rotation:

| Action | Frequency | Method |
|--------|-----------|--------|
| Review | Monthly | Check Felo Dashboard |
| Rotate | Every 90 days | Regenerate token |
| Emergency Rotate | Immediately | If compromised |

### Calendar Reminder:
- Add "Token Rotation" to calendar
- Set reminders 30 days before expiration
- Document rotation dates in team wiki

## Automation Option

For automated token rotation, consider:

```bash
#!/bin/bash
# scripts/rotate-secrets.sh
echo "Renewing Felo API Token..."
NEW_TOKEN=$(curl -X POST https://auth.felo.ai/oauth/token \
  --data "grant_type=refresh_token&refresh_token=$REFRESH_TOKEN")
echo "::add-mask::$NEW_TOKEN"
gh secret set FELO_API_TOKEN --body "$NEW_TOKEN"
```

## Support

For issues or questions:
1. Check GitHub Actions logs
2. Review troubleshooting section above
3. Consult [Felo Integration Setup Guide](./FELO-INTEGRATION-SETUP.md)
4. Contact repository maintainers

## Related Documentation

- [Felo Integration Setup](./FELO-INTEGRATION-SETUP.md)
- [Webhook Receiver](./WEBHOOK-RECEIVER.md)
- [Workflow Configuration](./.github/workflows/felo-bidirectional-sync.yml)
- [Connection Configuration](../connection/connection-info.yaml)
