# Mem.ai Integration Guide

## Overview

This document describes how to integrate **Mem.ai** (a note-taking and knowledge management platform) with the **MoCKA-KNOWLEDGE-GATE** repository on GitHub. This integration enables seamless two-way synchronization between your Mem.ai notes and your knowledge base stored in this repository.

## Integration Architecture

### Components

1. **Mem.ai Platform**: Cloud-based note-taking and knowledge management system
2. **GitHub Repository**: MoCKA-KNOWLEDGE-GATE (https://github.com/m-sirius-k/MoCKA-KNOWLEDGE-GATE)
3. **Mem API**: RESTful API for programmatic access to Mem.ai
4. **Integration Layer**: Scripts/workflows to sync content between platforms

### Data Flow

```
Mem.ai Notes
    |
    v
[Mem API]
    |
    v
[Integration Script/Workflow]
    |
    v
GitHub Repository
    |
    v
[GitHub Webhooks/Actions]
    |
    v
Mem.ai Collections
```

## Setup Instructions

### Prerequisites

- Mem.ai account (https://mem.ai)
- GitHub account with access to MoCKA-KNOWLEDGE-GATE repository
- Mem API key (obtainable from Mem.ai Settings > Integrations > API)
- GitHub Personal Access Token (for GitHub API access)

### Step 1: Obtain Mem.ai API Key

1. Go to https://mem.ai/settings/flows
2. Look for "API" section or go to Settings > Setup Integrations
3. Generate an API key
4. Store this key securely (never commit to repository)

### Step 2: Obtain GitHub Personal Access Token

1. Go to https://github.com/settings/tokens
2. Click "Generate new token"
3. Select scopes: `repo` (full control), `workflow` (if using GitHub Actions)
4. Copy the token and store securely

### Step 3: Set Up Repository Secrets

For automated workflows, add these secrets to your GitHub repository:

1. Go to Repository > Settings > Secrets and variables > Actions
2. Add the following secrets:
   - `MEM_API_KEY`: Your Mem.ai API key
   - `GITHUB_TOKEN`: Your GitHub Personal Access Token (usually pre-configured)

## API Endpoints

### Mem.ai API Reference

**Base URL**: `https://api.mem.ai/v0` or `https://api.mem.ai/v2`

#### Authentication

```bash
Authorization: Bearer <MEM_API_KEY>
# or
Authorization: ApiAccessToken <MEM_API_KEY>
```

#### Key Endpoints

**Create a Mem (Note)**

```bash
POST https://api.mem.ai/v0/mems
Content-Type: application/json
Authorization: Bearer $MEM_API_KEY

{
  "content": "# Note Title\n\nNote content here..."
}
```

**Create a Collection**

```bash
POST https://api.mem.ai/v2/collections
Content-Type: application/json
Authorization: Bearer $MEM_API_KEY

{
  "id": "unique-collection-id",
  "name": "Collection Name",
  "description": "Collection description"
}
```

**Add Note to Collection**

```bash
POST https://api.mem.ai/v2/notes
Content-Type: application/json
Authorization: Bearer $MEM_API_KEY

{
  "content": "# Note Title\n\nContent...",
  "collection_ids": ["collection-id-1"]
}
```

**Append to Existing Mem**

```bash
POST https://api.mem.ai/v0/mems/:memId/append
Content-Type: application/json
Authorization: Bearer $MEM_API_KEY

{
  "content": "Additional content to append"
}
```

**Batch Create Mems**

You can create up to 100 mems in a single request for efficient bulk operations.

## Integration Scenarios

### Scenario 1: Export Mem.ai Notes to GitHub

**Goal**: Automatically export notes from Mem.ai to GitHub repository

**Implementation Options**:

1. **GitHub Actions Workflow** (Recommended)
   - Schedule: Daily at specific time
   - Action: Fetch notes from Mem.ai API
   - Action: Convert to Markdown files
   - Action: Commit to repository

2. **External Service** (Zapier, n8n, Make)
   - Trigger: New note in Mem.ai
   - Action: Create/update GitHub file
   - Action: Create pull request

### Scenario 2: Import GitHub Content to Mem.ai

**Goal**: Automatically create Mem.ai notes from GitHub commits/PRs

**Implementation**:

1. GitHub Webhooks -> Integration Service -> Mem.ai API
2. Create mems from:
   - Commit messages
   - Pull request descriptions
   - Issue descriptions
   - Documentation files

### Scenario 3: Two-Way Synchronization

**Goal**: Keep Mem.ai and GitHub in sync

**Implementation**:

1. Monitor Mem.ai for changes (via API polling or webhooks when available)
2. Monitor GitHub for changes (via webhooks)
3. Apply transformations as needed
4. Update the other platform
5. Manage conflicts with timestamps/versioning

## Example Integration Script

### Node.js Example: Export Mems to Markdown Files

```javascript
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const MEM_API_KEY = process.env.MEM_API_KEY;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

const memAPI = axios.create({
  baseURL: 'https://api.mem.ai/v0',
  headers: {
    'Authorization': `Bearer ${MEM_API_KEY}`,
    'Content-Type': 'application/json'
  }
});

// Fetch mems from collection
async function fetchMems(collectionId) {
  try {
    const response = await memAPI.get('/mems', {
      params: {
        collection_id: collectionId
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching mems:', error);
    return [];
  }
}

// Convert mem content to markdown file
function saveMemAsFile(mem, directory) {
  const filename = `${mem.id}.md`;
  const filepath = path.join(directory, filename);
  fs.writeFileSync(filepath, mem.content);
  return filepath;
}

// Main export function
async function exportMemsToGitHub() {
  const collectionId = process.env.MEM_COLLECTION_ID;
  const outputDir = './exported-mems';
  
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const mems = await fetchMems(collectionId);
  
  mems.forEach(mem => {
    saveMemAsFile(mem, outputDir);
    console.log(`Exported: ${mem.id}`);
  });
  
  console.log(`Total mems exported: ${mems.length}`);
}

if (require.main === module) {
  exportMemsToGitHub();
}

module.exports = { fetchMems, saveMemAsFile };
```

### Python Example: Create Mems from GitHub Files

```python
import requests
import os
import json
from pathlib import Path

MEM_API_KEY = os.getenv('MEM_API_KEY')
MEM_API_BASE = 'https://api.mem.ai/v0'
COLLECTION_ID = os.getenv('MEM_COLLECTION_ID')

def create_mem(content, collection_ids=None):
    """Create a new mem in Mem.ai"""
    headers = {
        'Authorization': f'Bearer {MEM_API_KEY}',
        'Content-Type': 'application/json'
    }
    
    data = {'content': content}
    if collection_ids:
        data['collection_ids'] = collection_ids
    
    response = requests.post(
        f'{MEM_API_BASE}/mems',
        headers=headers,
        json=data
    )
    
    return response.json()

def import_files_to_mems(directory):
    """Import markdown files from directory as mems"""
    collection_ids = [COLLECTION_ID] if COLLECTION_ID else None
    
    for file_path in Path(directory).glob('**/*.md'):
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        result = create_mem(content, collection_ids)
        print(f'Created mem from {file_path.name}: {result.get("id")}')

if __name__ == '__main__':
    import_files_to_mems('./docs')
```

## Using Integrations Tools

### Zapier Integration

Zapier provides a no-code way to connect Mem.ai with GitHub:

1. Create a Zapier account
2. Create a new Zap:
   - Trigger: Mem.ai (new note, etc.)
   - Action: GitHub (create file, update file, etc.)
3. Map fields between platforms
4. Test and activate

### n8n Workflow

For more complex workflows, use n8n:

1. Install n8n locally or use cloud version
2. Create workflow with:
   - Mem.ai node (trigger or read)
   - Transform node (convert format if needed)
   - GitHub node (create/update files)
3. Deploy and monitor

## Best Practices

### Data Management

1. **Collection Organization**: Use Mem collections to mirror repository structure
2. **Naming Conventions**: Use consistent naming for mems and files
3. **Metadata**: Include metadata tags in mems for filtering and organization
4. **Version Control**: Include version numbers or timestamps

### Security

1. **Never commit API keys** - use environment variables or secrets management
2. **Rotate API keys** regularly
3. **Use least privilege**: Only request necessary permissions
4. **Monitor access**: Review API usage logs regularly

### Performance

1. **Batch Operations**: Use batch endpoints when available (up to 100 mems)
2. **Rate Limiting**: Implement exponential backoff for API calls
3. **Caching**: Cache frequently accessed data to reduce API calls
4. **Scheduled Syncs**: Run heavy operations during off-peak hours

### Conflict Resolution

1. **Last-write-wins**: Simple approach - keep most recent version
2. **Timestamps**: Always include modification timestamps
3. **Source tracking**: Track which system is the "source of truth"
4. **Backup**: Maintain backups before syncing

## Troubleshooting

### Common Issues

**API Authentication Errors**
- Verify API key is correct and not expired
- Check authorization header format
- Ensure token has required scopes

**Rate Limiting**
- Implement delay between requests
- Use batch endpoints when possible
- Check Mem.ai and GitHub rate limit documentation

**Data Format Issues**
- Ensure markdown is properly formatted
- Handle special characters in filenames
- Verify encoding (UTF-8)

**Sync Failures**
- Check network connectivity
- Review error logs for specific messages
- Test API endpoints independently
- Verify webhook configurations

## Resources

- **Mem.ai API Documentation**: https://docs.mem.ai
- **GitHub API Documentation**: https://docs.github.com/en/rest
- **GitHub Actions**: https://docs.github.com/en/actions
- **Integration Platforms**:
  - Zapier: https://zapier.com
  - n8n: https://n8n.io
  - Make (formerly Integromat): https://make.com

## Examples Repository

For more examples and templates, see:
- `/scripts/integration/` - Sample integration scripts
- `/workflows/` - GitHub Actions workflow examples
- `/docs/examples/` - Step-by-step integration guides

## Support

For issues or questions:
1. Check this documentation
2. Review API documentation for relevant platform
3. Open an issue in the repository
4. Contact platform support teams

---

*Last Updated: November 18, 2025*
*Version: 1.0*

