// Colab Notification API - Final版昇格時の自動通知
import admin from 'firebase-admin';

const db = admin.firestore();

// Colab notifications collection reference
const notificationsRef = db.collection('colab_notifications');
const auditRef = db.collection('audit_logs');

/**
 * POST /api/colab-notification
 * Notify Colab when algorithm is promoted to Final version
 * Request body:
 * {
 *   algorithmId: "ALG-ISSUE-001-ROD-001",
 *   promotionVersion: 2,
 *   metrics: { accuracy: 92, f1Score: 89, loss: 0.15 },
 *   colabUrl: "https://colab.research.google.com/drive/...",
 *   colabSessionId: "session-123"
 * }
 */
export default async function handler(req, res) {
  if (req.method === 'POST') {
    return handlePostNotification(req, res);
  } else if (req.method === 'GET') {
    return handleGetNotifications(req, res);
  } else if (req.method === 'PUT') {
    return handleAcknowledgeNotification(req, res);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

/**
 * POST - Create and send notification to Colab
 */
async function handlePostNotification(req, res) {
  try {
    const { algorithmId, promotionVersion, metrics, colabUrl, colabSessionId } = req.body;

    // Validate inputs
    if (!algorithmId || !promotionVersion || !metrics) {
      return res.status(400).json({
        error: 'Missing required fields: algorithmId, promotionVersion, metrics'
      });
    }

    const timestamp = admin.firestore.Timestamp.now();
    const notificationId = `NOTIF-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Create notification object
    const notification = {
      notificationId,
      algorithmId,
      promotionVersion,
      status: 'pending',
      metrics,
      colabUrl,
      colabSessionId,
      message: `Algorithm ${algorithmId} has been promoted to Final v${promotionVersion}`,
      timestamp,
      acknowledged: false,
      acknowledgedAt: null,
      webhookStatus: 'pending',
      webhookAttempts: 0,
      maxRetries: 3
    };

    // Store notification
    await notificationsRef.doc(notificationId).set(notification);

    // Log audit trail
    await auditRef.add({
      action: 'COLAB_NOTIFICATION_CREATED',
      algorithmId,
      notificationId,
      promotionVersion,
      timestamp,
      details: { metrics }
    });

    // Send webhook notification to Colab (async)
    sendWebhookToCola(notificationId, notification).catch(err => {
      console.error(`Webhook send failed for ${notificationId}:`, err);
    });

    res.status(201).json({
      success: true,
      notificationId,
      message: `Notification created and pending delivery to Colab`,
      notification
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({ error: 'Failed to create notification' });
  }
}

/**
 * GET - Retrieve notifications for a specific Colab session
 * Query: /api/colab-notification?colabSessionId=session-123
 */
async function handleGetNotifications(req, res) {
  try {
    const { colabSessionId, algorithmId, status } = req.query;

    if (!colabSessionId && !algorithmId) {
      return res.status(400).json({
        error: 'Must provide either colabSessionId or algorithmId'
      });
    }

    let query = notificationsRef;

    if (colabSessionId) {
      query = query.where('colabSessionId', '==', colabSessionId);
    }
    if (algorithmId) {
      query = query.where('algorithmId', '==', algorithmId);
    }
    if (status) {
      query = query.where('status', '==', status);
    }

    const snapshot = await query.orderBy('timestamp', 'desc').limit(100).get();
    const notifications = [];

    snapshot.forEach(doc => {
      notifications.push({ id: doc.id, ...doc.data() });
    });

    res.status(200).json({
      success: true,
      count: notifications.length,
      notifications
    });
  } catch (error) {
    console.error('Error retrieving notifications:', error);
    res.status(500).json({ error: 'Failed to retrieve notifications' });
  }
}

/**
 * PUT - Acknowledge notification received in Colab
 * Request body: { notificationId, colabSessionId }
 */
async function handleAcknowledgeNotification(req, res) {
  try {
    const { notificationId, colabSessionId } = req.body;

    if (!notificationId || !colabSessionId) {
      return res.status(400).json({
        error: 'Missing required fields: notificationId, colabSessionId'
      });
    }

    const timestamp = admin.firestore.Timestamp.now();

    // Update notification status
    await notificationsRef.doc(notificationId).update({
      acknowledged: true,
      acknowledgedAt: timestamp,
      status: 'delivered',
      colabSessionId
    });

    // Log audit trail
    await auditRef.add({
      action: 'COLAB_NOTIFICATION_ACKNOWLEDGED',
      notificationId,
      colabSessionId,
      timestamp
    });

    res.status(200).json({
      success: true,
      message: 'Notification acknowledged',
      notificationId,
      acknowledgedAt: timestamp
    });
  } catch (error) {
    console.error('Error acknowledging notification:', error);
    res.status(500).json({ error: 'Failed to acknowledge notification' });
  }
}

/**
 * Send webhook notification to Colab via HTTP POST
 * This function is called asynchronously
 */
async function sendWebhookToCola(notificationId, notification) {
  const colabWebhookUrl = process.env.COLAB_WEBHOOK_URL;
  
  if (!colabWebhookUrl) {
    console.warn('COLAB_WEBHOOK_URL not configured, skipping webhook');
    return;
  }

  try {
    const payload = {
      type: 'ALGORITHM_PROMOTED',
      notificationId,
      algorithmId: notification.algorithmId,
      promotionVersion: notification.promotionVersion,
      metrics: notification.metrics,
      message: notification.message,
      timestamp: notification.timestamp
    };

    const response = await fetch(colabWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-MoCKA-Secret': process.env.COLAB_WEBHOOK_SECRET || ''
      },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      // Update webhook status
      await notificationsRef.doc(notificationId).update({
        webhookStatus: 'delivered'
      });
      console.log(`Webhook delivered successfully for ${notificationId}`);
    } else {
      throw new Error(`Webhook returned ${response.status}`);
    }
  } catch (error) {
    console.error(`Failed to send webhook for ${notificationId}:`, error);
    // Retry logic with exponential backoff
    await retryWebhook(notificationId, error);
  }
}

/**
 * Retry webhook delivery with exponential backoff
 */
async function retryWebhook(notificationId, error) {
  try {
    const docRef = notificationsRef.doc(notificationId);
    const docSnapshot = await docRef.get();
    const notification = docSnapshot.data();

    if (!notification) return;

    const attempts = (notification.webhookAttempts || 0) + 1;
    const maxRetries = notification.maxRetries || 3;

    if (attempts < maxRetries) {
      // Schedule retry (would use a task queue in production)
      await docRef.update({
        webhookAttempts: attempts,
        webhookStatus: `pending_retry_${attempts}`,
        lastError: error.message
      });
      console.log(`Scheduled retry ${attempts}/${maxRetries} for ${notificationId}`);
    } else {
      // Max retries exceeded
      await docRef.update({
        webhookStatus: 'failed',
        webhookAttempts: attempts,
        lastError: error.message
      });
      console.error(`Webhook delivery failed after ${attempts} attempts for ${notificationId}`);
    }
  } catch (retryError) {
    console.error('Error in retry logic:', retryError);
  }
}
