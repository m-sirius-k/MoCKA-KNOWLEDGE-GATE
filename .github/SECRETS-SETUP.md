# GitHub Secrets Setup Guide

## Overview

This guide explains how to configure GitHub Secrets for the Mem.ai and Miro integrations with MoCKA-KNOWLEDGE-GATE.

**IMPORTANT**: Never commit API keys, tokens, or sensitive credentials to the repository. Always use GitHub Secrets for sensitive data.

## Required Secrets

You need to configure the following secrets for all integrations to work properly.

### Mem.ai Integration Secrets

#### 1. MEM_API_KEY

**Purpose**: Authentication token for Mem.ai API

**How to obtain**:
1. Go to https://mem.ai/settings/flows
2. Navigate to "API" section in "Setup Integrations"
3. Generate a new API key
4. Copy the key (it will not be shown again)

**Format**: String (usually 32-64 characters)

#### 2. MEM_COLLECTION_ID

**Purpose**: Target Mem.ai collection for syncing

**How to obtain**:
1. Go to https://mem.ai/notes
2. Click on Collections in the left sidebar
3. Select your target collection
4. The Collection ID may be visible in:
   - The URL bar
   - Collection settings
   - Or contact Mem.ai support

**Format**: String (UUID format, e.g., `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)

### Miro Integration Secrets

#### 3. MIRO_CLIENT_ID

**Purpose**: Unique identifier for your Miro app

**How to obtain**:
1. Go to https://developers.miro.com/page/developer-hub
2. Click "Create your first app"
3. Name the app (e.g., "MoCKA-Miro-GitHub Integration")
4. Accept terms and create
5. Go to app settings
6. Copy the **Client ID** value

**Format**: String (numeric, e.g., `3458764648810247967`)

#### 4. MIRO_CLIENT_SECRET

**Purpose**: Secret key for OAuth authentication with Miro API

**How to obtain**:
1. In your Miro app settings (same location as Client ID)
2. Copy the **Client Secret** value
3. **WARNING**: This is shown only once. Save it securely.

**Format**: String (usually 32+ characters, alphanumeric)

#### 5. MIRO_BOARD_ID

**Purpose**: Target Miro board for syncing

**How to obtain**:
1. Go to https://miro.com/app/dashboard/
2. Open the board you want to use for integration
3. The Board ID is in the URL:
   - `https://miro.com/app/board/{BOARD_ID}/`
4. Copy the ID portion (between `/board/` and `/`)

**Format**: String (numeric, e.g., `3458764642095086879`)

## Step-by-Step Setup

### Step 1: Access GitHub Secrets Settings

1. Go to your repository: https://github.com/nsjpkimura-del/MoCKA-KNOWLEDGE-GATE
2. Click **Settings** tab
3. In the left sidebar, go to: **Secrets and variables** > **Actions**
4. Click **New repository secret** button

### Step 2: Add Each Secret

For each secret listed above:

1. Click **New repository secret**
2. In the **Name** field, enter the exact secret name (e.g., `MEM_API_KEY`)
3. In the **Secret** field, paste the value
4. Click **Add secret**

**Repeat for all 5 secrets**:
- MEM_API_KEY
- MEM_COLLECTION_ID
- MIRO_CLIENT_ID
- MIRO_CLIENT_SECRET
- MIRO_BOARD_ID

### Step 3: Verify Secrets

After adding all secrets:

1. Go back to **Secrets and variables** > **Actions**
2. You should see all 5 secrets listed
3. The values are masked with asterisks (✓ normal, values are hidden)

## Testing Secrets

Once configured, you can test the integration:

### Test 1: Manual Workflow Trigger

1. Go to the **Actions** tab in your repository
2. Select either:
   - `mem-ai-export.yml` (Mem.ai → GitHub)
   - `mem-ai-import.yml` (GitHub → Mem.ai)
   - `miro-export.yml` (Miro → GitHub) [if available]
3. Click **Run workflow** button
4. Monitor the workflow run for errors

### Test 2: Check Logs

If the workflow fails:

1. Click on the failed workflow run
2. Expand the failed step
3. Look for error messages related to:
   - Authentication failures (invalid credentials)
   - API rate limiting
   - Network connectivity

## Security Best Practices

### DO:
- ✅ Rotate secrets regularly (at least quarterly)
- ✅ Use strong, unique API keys
- ✅ Store secrets only in GitHub Secrets, never in code
- ✅ Monitor API usage for unauthorized access
- ✅ Review GitHub Actions logs regularly

### DON'T:
- ❌ Commit secrets to git history
- ❌ Share secrets via email or chat
- ❌ Hardcode secrets in configuration files
- ❌ Use the same secret for multiple integrations
- ❌ Add secrets to environment files (.env)

## Troubleshooting

### "Secret not found" Error

**Cause**: Workflow is referencing a secret that doesn't exist

**Solution**:
1. Verify the secret name matches exactly (case-sensitive)
2. Confirm all 5 secrets are added
3. Check workflow YAML for correct secret names

### "Authentication Failed" Error

**Cause**: Invalid or expired credentials

**Solution**:
1. Verify the API key is still valid
2. Re-generate the API key if expired
3. Check expiration dates in the respective platforms
4. Update the secret with the new value

### Workflow Won't Run

**Cause**: Missing required secrets

**Solution**:
1. Ensure all 5 secrets are configured
2. Run workflow manually to test
3. Check the workflow file for required secret names
4. Review GitHub Actions documentation

## Resetting Secrets

If you need to update a secret:

1. Go to **Secrets and variables** > **Actions**
2. Find the secret you want to update
3. Click the **...** menu
4. Click **Delete**
5. Click **New repository secret** to add the updated value

**Note**: Deleting a secret will not affect active workflows, only new workflows will use the new value.

## Support Resources

- [GitHub Secrets Documentation](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Mem.ai API Documentation](https://docs.mem.ai)
- [Miro API Documentation](https://developers.miro.com/docs)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)

## Next Steps

After setting up all secrets:

1. Run the integration workflows manually to test
2. Monitor the initial sync for any errors
3. Review synced content in both GitHub and the external platforms
4. Enable scheduled workflows (if not already enabled)
5. Monitor GitHub Actions for successful execution

---

**Last Updated**: November 18, 2025
**Status**: Ready for integration
