/**
 * Felo AI Search Webhook Receiver
 * Express.js server to receive webhook notifications from Felo
 */

const express = require('express');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'test-secret';
const LOG_DIR = process.env.LOG_DIR || './logs';

// Middleware
app.use(express.json());

// Ensure log directory exists
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

// Webhook signature verification
const verifyWebhookSignature = (req) => {
  const signature = req.headers['x-felo-signature'];
  if (!signature) {
    console.warn('No signature provided in webhook');
    return false;
  }

  const payload = JSON.stringify(req.body);
  const expectedSignature = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(payload)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(`sha256=${expectedSignature}`)
  );
};

// Webhook event logger
const logWebhookEvent = (eventType, eventData, status = 'received') => {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    eventType,
    status,
    eventData: {
      ...eventData,
      timestamp: eventData.timestamp || timestamp,
    },
  };

  const logFile = path.join(LOG_DIR, 'webhook-events.log');
  fs.appendFileSync(
    logFile,
    JSON.stringify(logEntry) + '\n'
  );

  console.log(`[${timestamp}] Webhook ${eventType}: ${status}`);
  return logEntry;
};

// Main webhook endpoint
app.post('/webhook/felo', (req, res) => {
  console.log('Received Felo webhook:', req.body);

  // Verify signature (optional - disable for testing)
  if (process.env.VERIFY_SIGNATURE !== 'false') {
    try {
      if (!verifyWebhookSignature(req)) {
        logWebhookEvent('unknown', req.body, 'signature_verification_failed');
        return res.status(401).json({ error: 'Invalid signature' });
      }
    } catch (error) {
      console.error('Signature verification error:', error);
      logWebhookEvent('unknown', req.body, 'signature_error');
      return res.status(401).json({ error: 'Signature verification failed' });
    }
  }

  const eventType = req.body.event || 'unknown';
  const eventId = req.body.event_id || 'no-id';

  try {
    logWebhookEvent(eventType, req.body);

    // Handle different event types
    switch (eventType) {
      case 'data-update':
        handleDataUpdate(req.body);
        break;

      case 'sync-status':
        handleSyncStatus(req.body);
        break;

      case 'error-occurred':
        handleError(req.body);
        break;

      default:
        console.warn(`Unknown event type: ${eventType}`);
    }

    res.status(200).json({
      success: true,
      eventId,
      message: `Event ${eventType} processed successfully`,
    });
  } catch (error) {
    console.error(`Error processing webhook: ${error.message}`);
    logWebhookEvent(eventType, req.body, 'processing_error');
    res.status(500).json({
      error: 'Internal server error',
      eventId,
    });
  }
});

// Event handlers
const handleDataUpdate = (data) => {
  console.log('Processing data-update event');
  console.log(`Updated records: ${data.updated_count || 0}`);
  console.log(`Modified fields: ${JSON.stringify(data.fields || [])}`);

  // Store update event
  const updateFile = path.join(LOG_DIR, 'data-updates.json');
  let updates = [];
  if (fs.existsSync(updateFile)) {
    updates = JSON.parse(fs.readFileSync(updateFile, 'utf8'));
  }
  updates.push({ timestamp: new Date().toISOString(), ...data });
  fs.writeFileSync(updateFile, JSON.stringify(updates, null, 2));
};

const handleSyncStatus = (data) => {
  console.log('Processing sync-status event');
  console.log(`Sync status: ${data.status}`);
  console.log(`Last sync: ${data.last_sync_time}`);

  // Store sync status
  const statusFile = path.join(LOG_DIR, 'sync-status.json');
  fs.writeFileSync(statusFile, JSON.stringify({
    timestamp: new Date().toISOString(),
    ...data,
  }, null, 2));
};

const handleError = (data) => {
  console.error('Processing error-occurred event');
  console.error(`Error code: ${data.error_code}`);
  console.error(`Error message: ${data.message}`);

  // Store error event
  const errorFile = path.join(LOG_DIR, 'errors.log');
  fs.appendFileSync(
    errorFile,
    `[${new Date().toISOString()}] ${data.error_code}: ${data.message}\n`
  );
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Metrics endpoint
app.get('/metrics', (req, res) => {
  const metricsFile = path.join(LOG_DIR, 'webhook-events.log');
  let totalEvents = 0;
  let eventsByType = {};

  if (fs.existsSync(metricsFile)) {
    const lines = fs.readFileSync(metricsFile, 'utf8').split('\n').filter(l => l);
    totalEvents = lines.length;

    lines.forEach(line => {
      try {
        const event = JSON.parse(line);
        const type = event.eventType || 'unknown';
        eventsByType[type] = (eventsByType[type] || 0) + 1;
      } catch (e) {
        // Skip invalid JSON lines
      }
    });
  }

  res.status(200).json({
    timestamp: new Date().toISOString(),
    totalEvents,
    eventsByType,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Felo Webhook Receiver running on port ${PORT}`);
  console.log(`Webhook endpoint: http://localhost:${PORT}/webhook/felo`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Metrics: http://localhost:${PORT}/metrics`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

module.exports = app;
