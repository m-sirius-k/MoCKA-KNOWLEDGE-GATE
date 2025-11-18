# Mem.ai ↔ GitHub Setup Guide

## Overview

This guide provides step-by-step instructions for setting up the Mem.ai ↔ GitHub bidirectional integration.

## Prerequisites

- Mem.ai account
- GitHub account with access to this repository
- Node.js 18+ (for local testing)
- Python 3.11+ (for local testing)

## Step 1: Obtain Mem.ai API Key

1. Visit https://mem.ai/settings/flows
2. Look for the "API" section in Setup Integrations
3. Generate an API key
4. Copy and securely store it (never commit to repository)

## Step 2: Obtain GitHub Personal Access Token

1. Go to https://github.com/settings/tokens
2. Click "Generate new token"
3. Select scopes: `repo` (full control), `workflow`
4. Copy and securely store the token

## Step 3: Configure GitHub Secrets

**Location:** Repository ※ Settings ※ Secrets and variables ※ Actions

**Required Secrets:**

| Name | Value | Source |
|------|-------|--------|
| `MEM_API_KEY` | Your Mem.ai API key | Step 1 |
| `MEM_COLLECTION_ID` | Target Mem collection ID | See Step 4 |

**How to add:**

1. Click "New repository secret"
2. Enter the name
3. Paste the value
4. Click "Add secret"

## Step 4: Find Mem.ai Collection ID

1. Visit https://mem.ai/notes
2. Go to Collections in the left sidebar
3. Select your target collection
4. The collection ID may be visible in the URL or via the collection settings
5. If you cannot find it, contact Mem.ai support

## Step 5: Local Testing

### Install dependencies

```bash
npm install
```

### Test export script

```bash
MEM_API_KEY=<your_api_key> \
GITHUB_TOKEN=<your_token> \
MEM_COLLECTION_ID=<collection_id> \
node scripts/integration/mem-ai-export.js
```

### Test import script

```bash
MEM_API_KEY=<your_api_key> \
MEM_COLLECTION_ID=<collection_id> \
python3 scripts/integration/mem-ai-import.py
```

## Step 6: Enable Automation

### GitHub Actions Workflows

The following workflows are already configured:

- `.github/workflows/mem-ai-export.yml` - Runs daily at 2 AM UTC
- `.github/workflows/mem-ai-import.yml` - Runs on docs folder changes

### Verify workflows

1. Go to Actions tab
2. Confirm workflows are listed
3. Test manual trigger (workflow_dispatch)

## Next Steps

For advanced scenarios, consider:

- **Zapier**: For complex triggers and actions
- **n8n**: For self-hosted workflow automation

## Support

For issues, refer to `docs/MEM-AI-INTEGRATION.md` for troubleshooting.
