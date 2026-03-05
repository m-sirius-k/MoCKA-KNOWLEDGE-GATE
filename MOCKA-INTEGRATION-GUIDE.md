# MoCKA-KNOWLEDGE-GATE Integration Guide

## Overview

The MoCKA-KNOWLEDGE-GATE system provides a unified integration platform for managing AI simulations, metadata logging, and multi-platform synchronization. This guide documents the complete integration architecture.

## Architecture

### Components

1. **React Demo UI Component** (`pages/components/mocka-integration-demo.jsx`)
   - 3-tab interface: Overview, API Integration, Sync Status
   - Real-time platform status display
   - API testing interface with metadata capture

2. **API Endpoint** (`pages/api/mocka-endpoint.js`)
   - Handles requests from demo UI
   - Supports 5 integration platforms
   - Metadata enrichment and logging
   - GitHub Actions webhook integration

3. **GitHub Actions Workflow** (`.github/workflows/ai-simulation.yml`)
   - Automated AI simulation execution
   - ISSUE-ID and ROD-NUMBER generation
   - Metadata recording to Firestore
   - Webhook notifications
   - Auto-commit of deliverables

## Integration Platforms

### Supported Endpoints

- **NotebookLM**: Google's AI notebook platform
- **Mem.ai**: Memory management system
- **Notion**: Collaborative workspace
- **GitHub**: Version control and delivery tracking
- **Google Colab**: Jupyter notebook environment

## Workflow Integration

### AI Simulation Execution Flow

```
1. GitHub Actions Trigger (scheduled or manual)
   ↁE2. Generate ISSUE-ID and ROD-NUMBER metadata
   ↁE3. Run AI simulation in specified mode
   ↁE4. Log output to MoCKA API endpoint
   ↁE5. Record metadata to Firestore
   ↁE6. Sync results across platforms
   ↁE7. Auto-commit results to main branch
   ↁE8. Trigger webhook notifications
```

## Metadata Specification

### ISSUE-ID Format
- Pattern: `ISSUE-{timestamp}`
- Example: `ISSUE-1734103400000`
- Purpose: Unique identifier for AI simulation results

### ROD-NUMBER Format
- Pattern: `ROD-{random 0-9999}`
- Example: `ROD-7138`
- Purpose: Secondary tracking identifier

### Enriched Metadata

All API requests include:
- `timestamp`: Request timestamp
- `apiVersion`: API version (v1)
- `processed`: Processing timestamp
- `integration`: System identifier
- `issueId`: Associated ISSUE-ID
- `rodNumber`: Associated ROD-NUMBER

## API Usage

### POST /api/mocka-endpoint

**Request Body:**
```json
{
  "endpoint": "NotebookLM",
  "data": "Input data for processing",
  "timestamp": "2024-11-19T08:00:00.000Z",
  "metadata": {
    "issueId": "ISSUE-1734103400000",
    "rodNumber": "ROD-7138"
  }
}
```

**Response:**
```json
{
  "status": "success",
  "endpoint": "NotebookLM",
  "data": "Processing result",
  "notebookUrl": "https://...",
  "requestId": "uuid",
  "duration": "45ms",
  "metadata": {...}
}
```

## GitHub Actions Configuration

### Workflow Triggers

1. **Scheduled**: Daily at UTC 0:00 (JST 09:00)
2. **Manual**: `workflow_dispatch` with mode selection
3. **Push**: On changes to trigger files

### Simulation Modes

- `fast`: Quick validation
- `standard`: Normal execution (default)
- `comprehensive`: Full analysis

## Webhook Integration

### Events

- `ai_simulation_completed`: Simulation finished
- `integration_completed`: Platform integration done
- `metadata_recorded`: Metadata stored

### Webhook Endpoint

`/api/webhook-handler`

## Deployment

### Prerequisites

- Node.js 18+
- React/Next.js environment
- GitHub repository with Actions enabled
- Firestore credentials (optional)

### Installation

1. Clone repository
2. Install dependencies: `npm install lucide-react uuid`
3. Deploy to Vercel or Next.js environment
4. Configure environment variables

## Security Considerations

- Validate all incoming requests
- Verify webhook signatures
- Use HTTPS for all communications
- Protect API keys in environment variables
- Log all integration activities

## Testing

### Manual Testing

1. Navigate to `/pages/components/mocka-integration-demo` (when deployed)
2. Use API Integration tab
3. Select endpoint and submit test data
4. Verify response in results panel

### GitHub Actions Testing

1. Navigate to Actions tab
2. Select "AI Simulation Auto Execution"
3. Click "Run workflow"
4. Monitor execution logs

## Troubleshooting

### Common Issues

1. **Invalid endpoint**: Verify endpoint name matches supported list
2. **Metadata missing**: Ensure ISSUE-ID and ROD-NUMBER are provided
3. **Webhook failures**: Check webhook endpoint availability
4. **Firestore errors**: Verify authentication credentials

## Future Enhancements

- [ ] Real-time sync dashboard
- [ ] Advanced error recovery
- [ ] Rate limiting
- [ ] Webhook retry logic
- [ ] Enhanced monitoring

## References

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
- [Webhook Best Practices](https://webhooks.readthedocs.io/)

## Support

For issues or questions, please open an issue on the GitHub repository.
