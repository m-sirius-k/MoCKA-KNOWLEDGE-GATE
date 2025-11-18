#!/usr/bin/env node
/**
 * Felo AI Search - Monitoring Dashboard
 * Provides real-time metrics and health status
 */

const fs = require('fs');
const path = require('path');

class FeloMonitor {
  constructor(logsDir = './logs') {
    this.logsDir = logsDir;
    this.logFiles = {
      events: path.join(logsDir, 'webhook-events.log'),
      errors: path.join(logsDir, 'errors.log'),
      status: path.join(logsDir, 'sync-status.json'),
      updates: path.join(logsDir, 'data-updates.json'),
    };
  }

  getMetrics() {
    const metrics = {
      timestamp: new Date().toISOString(),
      sync: this.getSyncMetrics(),
      webhook: this.getWebhookMetrics(),
      errors: this.getErrorMetrics(),
      health: this.getHealthStatus(),
    };
    return metrics;
  }

  getSyncMetrics() {
    try {
      if (!fs.existsSync(this.logFiles.status)) {
        return { lastSync: null, status: 'unknown' };
      }
      const data = JSON.parse(fs.readFileSync(this.logFiles.status, 'utf8'));
      return {
        lastSync: data.timestamp,
        status: data.status || 'unknown',
        updatedRecords: data.updated_count || 0,
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  getWebhookMetrics() {
    try {
      if (!fs.existsSync(this.logFiles.events)) {
        return { totalEvents: 0, eventsByType: {} };
      }
      const lines = fs.readFileSync(this.logFiles.events, 'utf8').split('\n').filter(l => l);
      const eventsByType = {};
      lines.forEach(line => {
        try {
          const event = JSON.parse(line);
          const type = event.eventType || 'unknown';
          eventsByType[type] = (eventsByType[type] || 0) + 1;
        } catch (e) {
          // Skip invalid JSON
        }
      });
      return {
        totalEvents: lines.length,
        eventsByType,
        recentActivity: new Date().getTime() - 300000, // Last 5 mins
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  getErrorMetrics() {
    try {
      if (!fs.existsSync(this.logFiles.errors)) {
        return { totalErrors: 0, recentErrors: [] };
      }
      const lines = fs.readFileSync(this.logFiles.errors, 'utf8').split('\n').filter(l => l);
      const recentErrors = lines.slice(-10);
      return {
        totalErrors: lines.length,
        recentErrors,
        errorRate: lines.length > 0 ? (lines.length / 100).toFixed(2) + '%' : '0%',
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  getHealthStatus() {
    const health = {
      status: 'healthy',
      checks: {
        logsAccessible: fs.existsSync(this.logsDir),
        eventLogsPresent: fs.existsSync(this.logFiles.events),
        statusLogsPresent: fs.existsSync(this.logFiles.status),
        errorLogsPresent: fs.existsSync(this.logFiles.errors),
      },
    };

    const allChecksPass = Object.values(health.checks).every(v => v);
    if (!allChecksPass) {
      health.status = 'warning';
    }

    return health;
  }

  printDashboard() {
    const metrics = this.getMetrics();
    console.clear();
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║        Felo AI Search - Integration Monitor Dashboard      ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    console.log(`Timestamp: ${metrics.timestamp}\n`);

    // Sync Status
    console.log('📊 SYNC STATUS');
    console.log(`  Last Sync: ${metrics.sync.lastSync || 'Never'}`);
    console.log(`  Status: ${metrics.sync.status}`);
    console.log(`  Updated Records: ${metrics.sync.updatedRecords}\n`);

    // Webhook Activity
    console.log('🔔 WEBHOOK ACTIVITY');
    console.log(`  Total Events: ${metrics.webhook.totalEvents}`);
    Object.entries(metrics.webhook.eventsByType).forEach(([type, count]) => {
      console.log(`    - ${type}: ${count}`);
    });
    console.log();

    // Error Metrics
    console.log('⚠️  ERROR METRICS');
    console.log(`  Total Errors: ${metrics.errors.totalErrors}`);
    console.log(`  Error Rate: ${metrics.errors.errorRate}`);
    if (metrics.errors.recentErrors.length > 0) {
      console.log(`  Recent Errors:`);
      metrics.errors.recentErrors.slice(-3).forEach(err => {
        console.log(`    - ${err}`);
      });
    }
    console.log();

    // Health Status
    console.log('❤️  HEALTH STATUS');
    console.log(`  Overall: ${metrics.health.status.toUpperCase()}`);
    Object.entries(metrics.health.checks).forEach(([check, status]) => {
      const icon = status ? '✓' : '✗';
      console.log(`  ${icon} ${check}`);
    });
    console.log();

    console.log('═══════════════════════════════════════════════════════════\n');
  }

  startLiveMonitor(interval = 5000) {
    console.log('Starting live monitor (Press Ctrl+C to exit)\n');
    setInterval(() => {
      this.printDashboard();
    }, interval);
  }

  exportMetrics(filename = 'metrics.json') {
    const metrics = this.getMetrics();
    fs.writeFileSync(filename, JSON.stringify(metrics, null, 2));
    console.log(`Metrics exported to ${filename}`);
  }
}

if (require.main === module) {
  const monitor = new FeloMonitor();
  
  if (process.argv[2] === 'export') {
    monitor.exportMetrics();
  } else if (process.argv[2] === 'once') {
    monitor.printDashboard();
  } else {
    monitor.startLiveMonitor();
  }
}

module.exports = FeloMonitor;
