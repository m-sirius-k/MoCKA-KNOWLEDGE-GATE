// pages/api/notebooklm-webhook.js
import admin from 'firebase-admin';
import crypto from 'crypto';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY,
    }),
  });
}

const db = admin.firestore();

function verifyWebhookSignature(payload, signature, secret) {
  const computedSignature = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(computedSignature));
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Webhook-Signature');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const signature = req.headers['x-webhook-signature'];
    const payload = JSON.stringify(req.body);
    if (!signature || !verifyWebhookSignature(payload, signature, process.env.WEBHOOK_SECRET)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { eventType, notebookId, data, timestamp } = req.body;
    await db.collection('notebooklm_webhook_events').add({
      eventType, notebookId, data, timestamp: new Date(timestamp), receivedAt: new Date(), status: 'processed',
    });

    if (eventType === 'notebook_updated') {
      const { issueId, rodNumber } = data.metadata || {};
      if (issueId && rodNumber) {
        await db.collection('AI-SIMULATION').doc(`${issueId}-${rodNumber}`).set(
          { issueId, rodNumber, notebookId, content: data, syncedAt: new Date(), source: 'notebooklm' },
          { merge: true }
        );
      }
    }
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).json({ error: error.message });
  }
}
