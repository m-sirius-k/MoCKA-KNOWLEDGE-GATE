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

// ===== Event Sourcing & Dead Letter Queue Pattern =====

// Event Store for replaying historical events
class EventStore {
  constructor(logDir = LOG_DIR) {
    this.logDir = logDir;
    this.eventLog = path.join(logDir, 'event-store.log');
    this.dlqLog = path.join(logDir, 'dead-letter-queue.log');
  }

  // Append event to event store (Event Sourcing)
  appendEvent(event) {
    const storedEvent = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      version: 1,
      ...event
    };
    fs.appendFileSync(this.eventLog, JSON.stringify(storedEvent) + '\n');
    return storedEvent;
  }

  // Replay events from store
  replayEvents(filters = {}) {
    if (!fs.existsSync(this.eventLog)) {
      return [];
    }
    const lines = fs.readFileSync(this.eventLog, 'utf8').split('\n').filter(l => l);
    return lines
      .map(line => {
        try {
          return JSON.parse(line);
        } catch (e) {
          return null;
        }
      })
      .filter(event => event && this.matchesFilters(event, filters));
  }

  matchesFilters(event, filters) {
    if (filters.eventType && event.eventType !== filters.eventType) return false;
    if (filters.startTime && new Date(event.timestamp) < new Date(filters.startTime)) return false;
    if (filters.endTime && new Date(event.timestamp) > new Date(filters.endTime)) return false;
    return true;
  }
}

// Dead Letter Queue for failed events
class DeadLetterQueue {
  constructor(logDir = LOG_DIR) {
    this.dlqLog = path.join(logDir, 'dead-letter-queue.log');
    this.maxRetries = 3;
  }

  // Add event to DLQ with retry metadata
  addFailedEvent(event, error, retryCount = 0) {
    const dlqEntry = {
      id: event.id || crypto.randomUUID(),
      originalEvent: event,
      error: error.message,
      errorStack: error.stack,
      retryCount,
      failedAt: new Date().toISOString(),
      nextRetryAt: this.calculateNextRetry(retryCount),
      status: retryCount >= this.maxRetries ? 'dead' : 'pending_retry'
    };
    fs.appendFileSync(this.dlqLog, JSON.stringify(dlqEntry) + '\n');
    return dlqEntry;
  }

  calculateNextRetry(retryCount) {
    // Exponential backoff: 5s, 25s, 125s
    const delays = [5, 25, 125];
    const delay = delays[Math.min(retryCount, delays.length - 1)];
    return new Date(Date.now() + delay * 1000).toISOString();
  }

  // Get pending retry events
  getPendingRetries() {
    if (!fs.existsSync(this.dlqLog)) return [];
    const lines = fs.readFileSync(this.dlqLog, 'utf8').split('\n').filter(l => l);
    return lines
      .map(line => {
        try {
          return JSON.parse(line);
        } catch (e) {
          return null;
        }
      })
      .filter(entry => entry && entry.status === 'pending_retry' && new Date() >= new Date(entry.nextRetryAt));
  }
}

// Initialize event sourcing components
const eventStore = new EventStore();
const dlq = new DeadLetterQueue();

// Enhanced webhook endpoint with event sourcing
app.post('/webhook/felo/sourced', (req, res) => {
  try {
    // Verify signature
    if (process.env.VERIFY_SIGNATURE !== 'false') {
      if (!verifyWebhookSignature(req)) {
        return res.status(401).json({ error: 'Invalid signature' });
      }
    }

    const event = {
      eventType: req.body.event || 'unknown',
      eventId: req.body.event_id || crypto.randomUUID(),
      payload: req.body
    };

    // Store event in event log (Event Sourcing)
    const storedEvent = eventStore.appendEvent(event);

    // Log the event
    logWebhookEvent(event.eventType, req.body);

    // Process event with error handling
    try {
      switch (event.eventType) {
        case 'data-update':
          handleDataUpdate(req.body);
          break;
        case 'sync-status':
          handleSyncStatus(req.body);
          break;
        case 'error-occurred':
          handleError(req.body);
          break;
      }
    } catch (error) {
      console.error('Event processing failed:', error);
      dlq.addFailedEvent(storedEvent, error, 0);
      return res.status(202).json({
        success: false,
        eventId: storedEvent.id,
        message: 'Event queued for retry',
        status: 'pending_retry'
      });
    }

    res.status(200).json({
      success: true,
      eventId: storedEvent.id,
      message: 'Event processed and stored successfully',
      eventSourceId: storedEvent.id
    });
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Event replay endpoint
app.get('/events/replay', (req, res) => {
  const filters = {
    eventType: req.query.type,
    startTime: req.query.from,
    endTime: req.query.to
  };
  const events = eventStore.replayEvents(filters);
  res.status(200).json({
    count: events.length,
    events,
    timestamp: new Date().toISOString()
  });
});

// DLQ status endpoint
app.get('/dlq/status', (req, res) => {
  const pending = dlq.getPendingRetries();
  res.status(200).json({
    pendingRetries: pending.length,
    nextRetries: pending.slice(0, 5),
    timestamp: new Date().toISOString()
  });
});

// Manual retry endpoint
app.post('/dlq/retry/:eventId', (req, res) => {
  const { eventId } = req.params;
  const dlqEntries = dlq.getPendingRetries();
  const entry = dlqEntries.find(e => e.id === eventId);
  
  if (!entry) {
    return res.status(404).json({ error: 'Event not found in DLQ' });
  }

  try {
    const event = entry.originalEvent;
    switch (event.eventType) {
      case 'data-update':
        handleDataUpdate(event.payload);
        break;
      case 'sync-status':
        handleSyncStatus(event.payload);
        break;
      case 'error-occurred':
        handleError(event.payload);
        break;
    }
    res.status(200).json({
      success: true,
      message: 'Event retried successfully',
      eventId
    });
  } catch (error) {
    res.status(500).json({
      error: 'Retry failed',
      message: error.message
    });
  }
});


module.exports = app;
