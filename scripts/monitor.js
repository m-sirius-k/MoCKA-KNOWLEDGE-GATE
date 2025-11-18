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

  // Time-window based error rate calculation
  getErrorRateByTimeWindow() {
    try {
      if (!fs.existsSync(this.logFiles.errors)) {
        return { windows: {} };
      }
      const lines = fs.readFileSync(this.logFiles.errors, 'utf8').split('\n').filter(l => l);
      const now = new Date();
      const windows = {
        lastMinute: 0,
        lastFiveMinutes: 0,
        lastHour: 0,
        lastDay: 0
      };

      lines.forEach(line => {
        try {
          const errorTime = new Date(JSON.parse(line).timestamp);
          const diffMs = now - errorTime;
          
          if (diffMs < 60000) windows.lastMinute++;
          if (diffMs < 300000) windows.lastFiveMinutes++;
          if (diffMs < 3600000) windows.lastHour++;
          if (diffMs < 86400000) windows.lastDay++;
        } catch (e) {
          // Skip parsing errors
        }
      });

      return {
        windows,
        rates: {
          lastMinute: ((windows.lastMinute / Math.max(1, lines.length)) * 100).toFixed(2) + '%',
          lastFiveMinutes: ((windows.lastFiveMinutes / Math.max(1, lines.length)) * 100).toFixed(2) + '%',
          lastHour: ((windows.lastHour / Math.max(1, lines.length)) * 100).toFixed(2) + '%',
          lastDay: ((windows.lastDay / Math.max(1, lines.length)) * 100).toFixed(2) + '%'
        }
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  // Export metrics in Prometheus format
  exportPrometheusMetrics(filename = 'metrics.prom') {
    const metrics = this.getMetrics();
    const errorRates = this.getErrorRateByTimeWindow();
    const thresholds = this.calculateDynamicThresholds();

    let prometheusOutput = '# HELP felo_sync_timestamp Last synchronization timestamp\n';
    prometheusOutput += '# TYPE felo_sync_timestamp gauge\n';
    prometheusOutput += `felo_sync_timestamp{job="felo-monitor"} ${new Date(metrics.sync.lastSync).getTime() || 0}\n`;

    prometheusOutput += '\n# HELP felo_events_total Total webhook events received\n';
    prometheusOutput += '# TYPE felo_events_total counter\n';
    prometheusOutput += `felo_events_total{job="felo-monitor"} ${metrics.webhook.totalEvents}\n`;

    prometheusOutput += '\n# HELP felo_errors_total Total errors occurred\n';
    prometheusOutput += '# TYPE felo_errors_total counter\n';
    prometheusOutput += `felo_errors_total{job="felo-monitor"} ${metrics.errors.totalErrors}\n`;

    prometheusOutput += '\n# HELP felo_error_rate_percent Error rate percentage by time window\n';
    prometheusOutput += '# TYPE felo_error_rate_percent gauge\n';
    Object.entries(errorRates.rates || {}).forEach(([window, rate]) => {
      const cleanRate = parseFloat(rate);
      prometheusOutput += `felo_error_rate_percent{window="${window}",job="felo-monitor"} ${cleanRate}\n`;
    });

    prometheusOutput += '\n# HELP felo_alert_threshold Current alert threshold\n';
    prometheusOutput += '# TYPE felo_alert_threshold gauge\n';
    prometheusOutput += `felo_alert_threshold{job="felo-monitor"} ${thresholds.alertThreshold}\n`;

    prometheusOutput += '\n# HELP felo_health_status Health check status (0=warning, 1=healthy)\n';
    prometheusOutput += '# TYPE felo_health_status gauge\n';
    const healthValue = metrics.health.status === 'healthy' ? 1 : 0;
    prometheusOutput += `felo_health_status{job="felo-monitor"} ${healthValue}\n`;

    fs.writeFileSync(filename, prometheusOutput);
    console.log(`Prometheus metrics exported to ${filename}`);
    return prometheusOutput;
  }

  // Calculate dynamic alert thresholds based on error patterns
  calculateDynamicThresholds() {
    try {
      if (!fs.existsSync(this.logFiles.errors)) {
        return {
          alertThreshold: 5.0,
          warningThreshold: 2.0,
          criticalThreshold: 10.0,
          recommendation: 'baseline'
        };
      }

      const lines = fs.readFileSync(this.logFiles.errors, 'utf8').split('\n').filter(l => l);
      const errorRates = this.getErrorRateByTimeWindow();
      
      const lastHourRate = parseFloat(errorRates.rates?.lastHour || 0);
      const lastDayRate = parseFloat(errorRates.rates?.lastDay || 0);
      
      let alertThreshold = 5.0;
      let warningThreshold = 2.0;
      let criticalThreshold = 10.0;
      let recommendation = 'baseline';

      // Dynamic calculation based on historical patterns
      if (lastHourRate > 8) {
        alertThreshold = lastHourRate * 1.2;
        warningThreshold = lastHourRate * 0.8;
        criticalThreshold = lastHourRate * 1.5;
        recommendation = 'elevated_errors_in_last_hour';
      } else if (lastHourRate > 5) {
        alertThreshold = 6.5;
        warningThreshold = 3.5;
        criticalThreshold = 9.0;
        recommendation = 'moderate_errors';
      }

      if (lastDayRate < 1.0) {
        alertThreshold = 3.0;
        warningThreshold = 1.0;
        criticalThreshold = 5.0;
        recommendation = 'system_healthy';
      }

      return {
        alertThreshold: parseFloat(alertThreshold.toFixed(2)),
        warningThreshold: parseFloat(warningThreshold.toFixed(2)),
        criticalThreshold: parseFloat(criticalThreshold.toFixed(2)),
        recommendation,
        basedOn: {
          lastHourRate,
          lastDayRate,
          totalErrors: lines.length
        }
      };
    } catch (error) {
      return {
        error: error.message,
        alertThreshold: 5.0
      };
    }
  }

module.exports = FeloMonitor;
