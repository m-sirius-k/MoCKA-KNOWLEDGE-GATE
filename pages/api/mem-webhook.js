import admin from 'firebase-admin';
import crypto from 'crypto';

const db = admin.firestore();
const COLLECTION = 'mem_webhook_logs';
const WEBHOOK_SECRET = process.env.MEM_WEBHOOK_SECRET;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const signature = req.headers['x-mem-signature'];
    const payload = JSON.stringify(req.body);
    
    if (!verifySignature(payload, signature)) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const event = req.body;
    const timestamp = new Date().toISOString();
    const { issueId, rodNumber } = event.metadata || {};
    
    const logId = `${issueId || 'unknown'}-${rodNumber || 'unknown'}-${Date.now()}`;
    
    await db.collection(COLLECTION).doc(logId).set({
      eventType: event.type,
      issueId: issueId || null,
      rodNumber: rodNumber || null,
      noteId: event.noteId,
      notebookId: event.notebookId,
      eventData: event,
      timestamp,
      status: 'processed',
      platform: 'mem.ai'
    });

    if (event.type === 'note.created' || event.type === 'note.updated') {
      await handleNoteEvent(event, issueId, rodNumber, timestamp);
    } else if (event.type === 'note.deleted') {
      await handleNoteDeleted(event, issueId, rodNumber, timestamp);
    }

    res.status(200).json({
      success: true,
      eventId: logId,
      processed: true
    });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: error.message });
  }
}

function verifySignature(payload, signature) {
  if (!WEBHOOK_SECRET) return false;
  
  const hash = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(payload)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(hash),
    Buffer.from(signature)
  );
}

async function handleNoteEvent(event, issueId, rodNumber, timestamp) {
  const docId = `${issueId}-${rodNumber}-sync`;
  
  await db.collection('mem_sync_metadata').doc(docId).update({
    lastWebhookTime: timestamp,
    webhookCount: admin.firestore.FieldValue.increment(1),
    lastEventType: event.type,
    notebookId: event.notebookId,
    content: event.content || null,
    'metadata.lastWebhookAt': timestamp
  }).catch(async () => {
    await db.collection('mem_sync_metadata').doc(docId).set({
      issueId,
      rodNumber,
      lastWebhookTime: timestamp,
      webhookCount: 1,
      lastEventType: event.type,
      notebookId: event.notebookId,
      status: 'webhook_received',
      platform: 'mem.ai'
    });
  });
}

async function handleNoteDeleted(event, issueId, rodNumber, timestamp) {
  const docId = `${issueId}-${rodNumber}-sync`;
  
  await db.collection('mem_sync_metadata').doc(docId).update({
    status: 'deleted',
    deletedAt: timestamp,
    deletedNoteId: event.noteId,
    lastWebhookTime: timestamp
  }).catch(err => console.error('Deletion update failed:', err));
}
