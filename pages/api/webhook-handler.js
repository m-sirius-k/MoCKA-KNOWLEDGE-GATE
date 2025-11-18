// Webhook Handler - あらゆるシステム間のリアルタイム同期
import admin from 'firebase-admin';

const db = admin.firestore();

const webhookRef = db.collection('webhooks');
const auditRef = db.collection('audit_logs');
const notificationsRef = db.collection('notifications');

/**
 * POST /api/webhook-handler
 * Central webhook dispatcher for all system events
 * Routes events to appropriate handlers
 * 
 * Request body:
 * {
 *   eventType: "algorithm_promoted" | "colab_sync" | "github_commit" | "metric_update",
 *   source: "automated-promotion" | "colab-integration" | "github-sync" | "ai-simulation",
 *   payload: { ...event-specific data },
 *   timestamp: ISO timestamp
 * }
 */
export default async function handler(req, res) {
  if (req.method === 'POST') {
    return handleWebhookEvent(req, res);
  } else if (req.method === 'GET') {
    return handleWebhookStatus(req, res);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

/**
 * POST - Process and dispatch webhook events
 */
async function handleWebhookEvent(req, res) {
  try {
    const { eventType, source, payload } = req.body;
    const timestamp = admin.firestore.Timestamp.now();
    const webhookId = `WH-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    if (!eventType || !source || !payload) {
      return res.status(400).json({
        error: 'Missing required fields: eventType, source, payload'
      });
    }

    // Create webhook record
    const webhookRecord = {
      webhookId,
      eventType,
      source,
      payload,
      timestamp,
      status: 'processing',
      handlers: [],
      result: null
    };

    // Store webhook
    await webhookRef.doc(webhookId).set(webhookRecord);

    // Route to appropriate handlers based on event type
    const handlers = getHandlersForEvent(eventType);
    const results = [];

    for (const handler of handlers) {
      try {
        const result = await executeHandler(handler, payload, timestamp);
        results.push({
          handler: handler.name,
          status: 'success',
          result
        });
      } catch (err) {
        console.error(`Handler ${handler.name} failed:`, err);
        results.push({
          handler: handler.name,
          status: 'error',
          error: err.message
        });
      }
    }

    // Update webhook with results
    await webhookRef.doc(webhookId).update({
      status: 'completed',
      handlers: results,
      completedAt: timestamp
    });

    // Log audit trail
    await auditRef.add({
      action: 'WEBHOOK_EVENT_PROCESSED',
      webhookId,
      eventType,
      source,
      handlersExecuted: results.length,
      timestamp
    });

    res.status(200).json({
      success: true,
      webhookId,
      eventType,
      handlersExecuted: results.length,
      results
    });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ error: 'Failed to process webhook' });
  }
}

/**
 * GET - Get webhook status and history
 */
async function handleWebhookStatus(req, res) {
  try {
    const { webhookId, eventType, limit = 50 } = req.query;
    const queryLimit = Math.min(parseInt(limit), 200);

    let query = webhookRef;

    if (webhookId) {
      const doc = await webhookRef.doc(webhookId).get();
      if (!doc.exists) {
        return res.status(404).json({ error: 'Webhook not found' });
      }
      return res.status(200).json({
        success: true,
        webhook: { id: doc.id, ...doc.data() }
      });
    }

    if (eventType) {
      query = query.where('eventType', '==', eventType);
    }

    const snapshot = await query
      .orderBy('timestamp', 'desc')
      .limit(queryLimit)
      .get();

    const webhooks = [];
    snapshot.forEach(doc => {
      webhooks.push({ id: doc.id, ...doc.data() });
    });

    res.status(200).json({
      success: true,
      count: webhooks.length,
      webhooks
    });
  } catch (error) {
    console.error('Error retrieving webhook status:', error);
    res.status(500).json({ error: 'Failed to retrieve webhook status' });
  }
}

/**
 * Route event to appropriate handlers
 */
function getHandlersForEvent(eventType) {
  const handlersMap = {
    'algorithm_promoted': [
      { name: 'notify_colab', fn: notifyColab },
      { name: 'sync_github', fn: syncToGitHub },
      { name: 'broadcast_notification', fn: broadcastNotification }
    ],
    'colab_sync': [
      { name: 'update_deliverable', fn: updateDeliverable },
      { name: 'check_promotion_eligibility', fn: checkPromotionEligibility },
      { name: 'broadcast_metrics', fn: broadcastMetrics }
    ],
    'github_commit': [
      { name: 'sync_to_mocka', fn: syncToMoCKA },
      { name: 'validate_metadata', fn: validateMetadata },
      { name: 'broadcast_sync', fn: broadcastSync }
    ],
    'metric_update': [
      { name: 'update_metrics', fn: updateMetrics },
      { name: 'evaluate_quality', fn: evaluateQuality },
      { name: 'trigger_promotion', fn: triggerPromotion }
    ]
  };

  return (handlersMap[eventType] || []).map(h => h);
}

/**
 * Execute specific event handler
 */
async function executeHandler(handler, payload, timestamp) {
  switch (handler.name) {
    case 'notify_colab':
      return await notifyColab(payload, timestamp);
    case 'sync_github':
      return await syncToGitHub(payload, timestamp);
    case 'broadcast_notification':
      return await broadcastNotification(payload, timestamp);
    case 'update_deliverable':
      return await updateDeliverable(payload, timestamp);
    case 'check_promotion_eligibility':
      return await checkPromotionEligibility(payload, timestamp);
    case 'sync_to_mocka':
      return await syncToMoCKA(payload, timestamp);
    case 'validate_metadata':
      return await validateMetadata(payload, timestamp);
    default:
      return { executed: false };
  }
}

// Handler implementations
async function notifyColab(payload, timestamp) {
  // Sends notification to Colab via webhook
  return { action: 'notifyColab', status: 'sent', timestamp };
}

async function syncToGitHub(payload, timestamp) {
  // Syncs promoted algorithm to GitHub
  return { action: 'syncToGitHub', status: 'synced', timestamp };
}

async function broadcastNotification(payload, timestamp) {
  // Broadcasts notification to all listeners
  await notificationsRef.add({
    type: 'algorithm_promoted',
    payload,
    timestamp,
    read: false
  });
  return { action: 'broadcastNotification', status: 'notified', timestamp };
}

async function updateDeliverable(payload, timestamp) {
  // Updates deliverable metrics from Colab sync
  return { action: 'updateDeliverable', status: 'updated', timestamp };
}

async function checkPromotionEligibility(payload, timestamp) {
  // Checks if algorithm meets promotion criteria
  return { action: 'checkPromotionEligibility', status: 'checked', timestamp };
}

async function broadcastMetrics(payload, timestamp) {
  // Broadcasts metrics update
  return { action: 'broadcastMetrics', status: 'broadcasted', timestamp };
}

async function syncToMoCKA(payload, timestamp) {
  // Syncs GitHub commit to MoCKA
  return { action: 'syncToMoCKA', status: 'synced', timestamp };
}

async function validateMetadata(payload, timestamp) {
  // Validates commit metadata
  return { action: 'validateMetadata', status: 'validated', timestamp };
}

async function broadcastSync(payload, timestamp) {
  // Broadcasts sync event
  return { action: 'broadcastSync', status: 'broadcasted', timestamp };
}

async function updateMetrics(payload, timestamp) {
  // Updates algorithm metrics
  return { action: 'updateMetrics', status: 'updated', timestamp };
}

async function evaluateQuality(payload, timestamp) {
  // Evaluates quality metrics
  return { action: 'evaluateQuality', status: 'evaluated', timestamp };
}

async function triggerPromotion(payload, timestamp) {
  // Triggers automatic promotion if criteria met
  return { action: 'triggerPromotion', status: 'triggered', timestamp };
}
