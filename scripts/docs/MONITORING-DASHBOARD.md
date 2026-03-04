# Felo AI Search - Monitoring Dashboard

## Overview

The Monitoring Dashboard is a real-time monitoring system that tracks the health, performance, and status of the Felo AI Search bidirectional integration with GitHub. It provides comprehensive metrics collection, health checks, and live monitoring capabilities.

## Features

### 1. Real-Time Metrics Collection
- **Sync Metrics**: Tracks successful syncs, pending syncs, and failed syncs
- **Webhook Metrics**: Monitors webhook events received and processed
- **Error Tracking**: Captures and analyzes errors in the system
- **Health Status**: Monitors system health with status indicators

### 2. Monitoring Modes

#### Live Monitoring Mode
Continuously displays updated metrics in the terminal with a formatted dashboard.

```bash
node scripts/monitor.js live
```

This mode:
- Updates metrics every 5 seconds
- Shows real-time system status
- Displays sync, webhook, and error metrics
- Provides health status indicators
- Allows for Ctrl+C to exit

#### Single Report Mode
Generates a one-time report of current metrics.

```bash
node scripts/monitor.js once
```

This mode:
- Displays current metrics once
- Exits immediately after display
- Useful for automated monitoring scripts

#### Metrics Export Mode
Exports metrics to a JSON file for analysis.

```bash
node scripts/monitor.js export
```

This mode:
- Exports all metrics to `metrics.json`
- Includes timestamp information
- Can be used for data analysis and trending

## Dashboard Layout

The live dashboard displays the following information:

### System Status Section
- Overall health status (Healthy/Degraded/Unhealthy)
- Last sync timestamp
- Uptime indicator

### Sync Metrics
- Total syncs completed
- Successful syncs
- Pending syncs
- Failed syncs
- Success rate percentage

### Webhook Metrics
- Total events received
- Events processed
- Events pending
- Processing rate

### Error Metrics
- Total errors
- Sync errors
- Webhook errors
- Transform errors
- Error rate

### Health Indicators
- Database connection status
- API endpoint availability
- Webhook receiver status

## Usage Examples

### Start Live Monitoring
```bash
# Start real-time monitoring with updates every 5 seconds
node scripts/monitor.js live
```

### Get Current Status
```bash
# Display current metrics once
node scripts/monitor.js once
```

### Export Metrics
```bash
# Export metrics to JSON file
node scripts/monitor.js export
```

### Integration with Docker
```dockerfile
# Run monitoring in a Docker container
RUN npm install
CMD ["node", "scripts/monitor.js", "live"]
```

## Metrics Reference

### Sync Metrics
| Metric | Description |
|--------|-------------|
| `totalSyncs` | Total number of synchronization operations |
| `successfulSyncs` | Number of successful syncs |
| `pendingSyncs` | Number of syncs in progress |
| `failedSyncs` | Number of failed syncs |
| `successRate` | Percentage of successful syncs |
| `lastSync` | Timestamp of last sync operation |

### Webhook Metrics
| Metric | Description |
|--------|-------------|
| `totalEvents` | Total webhook events received |
| `processedEvents` | Events successfully processed |
| `pendingEvents` | Events awaiting processing |
| `processingRate` | Percentage of events processed |

### Error Metrics
| Metric | Description |
|--------|-------------|
| `totalErrors` | Total errors encountered |
| `syncErrors` | Errors during sync operations |
| `webhookErrors` | Errors in webhook processing |
| `transformErrors` | Errors in data transformation |
| `errorRate` | Percentage of operations resulting in errors |

## Health Status Levels

- **Healthy**: All systems operational, all metrics within normal ranges
- **Degraded**: One or more systems showing issues, but operational
- **Unhealthy**: Critical system failures, immediate attention required

## Configuration

The monitoring dashboard can be configured by modifying the following in `monitor.js`:

- **Update Interval**: Default 5000ms (5 seconds)
- **Metrics Collection**: Add or remove metrics as needed
- **Health Thresholds**: Adjust health indicators for your environment

## Integration with CI/CD

### GitHub Actions Example
```yaml
- name: Run Monitoring Check
  run: node scripts/monitor.js once
  
- name: Export Metrics
  run: node scripts/monitor.js export
  
- name: Upload Metrics
  uses: actions/upload-artifact@v2
  with:
    name: metrics
    path: metrics.json
```

## Troubleshooting

### Monitor Not Starting
- Check that all dependencies are installed: `npm install`
- Verify Node.js version is 14 or higher
- Ensure all required environment variables are set

### Metrics Not Updating
- Check network connectivity
- Verify webhook receiver is running
- Review logs in `.github/logs/` directory

### High Error Rates
- Check GitHub token validity
- Verify API rate limits haven't been exceeded
- Review webhook payload format
- Check data transformer validation rules

## Performance Notes

- Live monitoring updates every 5 seconds by default
- Metrics are stored in memory (cleared on restart)
- For persistent storage, use the export mode and store to a database
- Dashboard is optimized for terminal widths of 80+ characters

## Related Documentation

- [Secrets Configuration Guide](../../.github/SECRETS-CONFIGURATION.md)
- [Integration Setup](../../.github/FELO-INTEGRATION-SETUP.md)
- [Webhook Receiver Documentation](../scripts/webhook-receiver.js)
- [Data Transformer Documentation](../scripts/data-transformer.js)
- [Test Suite Documentation](../scripts/test-felo-sync.js)

