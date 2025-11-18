import admin from 'firebase-admin';
import crypto from 'crypto';

const db = admin.firestore();
const COLLECTION = 'mem_sync_metadata';

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { action, issueId, rodNumber, data, direction = 'bidirectional' } = req.body || req.query;

    if (!issueId || !rodNumber) {
      return res.status(400).json({ error: 'issueId and rodNumber required' });
    }

    const syncId = `${issueId}-${rodNumber}`;
    const timestamp = new Date().toISOString();

    switch (action) {
      case 'push':
        return await handlePush(res, syncId, issueId, rodNumber, data, timestamp);
      case 'pull':
        return await handlePull(res, syncId, issueId, rodNumber, timestamp);
      case 'bidirectional':
        return await handleBidirectional(res, syncId, issueId, rodNumber, data, timestamp);
      case 'status':
        return await handleStatus(res, syncId);
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({ error: error.message });
  }
}

async function handlePush(res, syncId, issueId, rodNumber, data, timestamp) {
  const hash = crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
  
  await db.collection(COLLECTION).doc(syncId).set({
    issueId,
    rodNumber,
    direction: 'push',
    dataHash: hash,
    lastSyncTime: timestamp,
    status: 'synced',
    platform: 'mem.ai',
    notebookId: data.notebookId,
    content: data.content,
    metadata: {
      syncedAt: timestamp,
      version: 1
    }
  }, { merge: true });

  res.status(200).json({
    success: true,
    syncId,
    hash,
    timestamp
  });
}

async function handlePull(res, syncId, issueId, rodNumber, timestamp) {
  const doc = await db.collection(COLLECTION).doc(syncId).get();
  
  if (!doc.exists) {
    return res.status(404).json({ error: 'Sync record not found' });
  }

  const data = doc.data();
  
  await db.collection(COLLECTION).doc(syncId).update({
    lastPullTime: timestamp,
    pullCount: admin.firestore.FieldValue.increment(1)
  });

  res.status(200).json({
    success: true,
    syncId,
    data,
    timestamp
  });
}

async function handleBidirectional(res, syncId, issueId, rodNumber, data, timestamp) {
  const doc = await db.collection(COLLECTION).doc(syncId).get();
  const newHash = crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
  
  if (!doc.exists) {
    await db.collection(COLLECTION).doc(syncId).set({
      issueId,
      rodNumber,
      direction: 'bidirectional',
      dataHash: newHash,
      lastSyncTime: timestamp,
      syncCount: 1,
      status: 'synced',
      platform: 'mem.ai',
      content: data.content,
      metadata: {
        createdAt: timestamp,
        version: 1
      }
    });
  } else {
    const oldData = doc.data();
    const hasChanged = oldData.dataHash !== newHash;
    
    if (hasChanged) {
      await db.collection(COLLECTION).doc(syncId).update({
        dataHash: newHash,
        lastSyncTime: timestamp,
        content: data.content,
        syncCount: admin.firestore.FieldValue.increment(1),
        'metadata.lastModifiedAt': timestamp,
        'metadata.version': admin.firestore.FieldValue.increment(1)
      });
    }
  }

  res.status(200).json({
    success: true,
    syncId,
    hash: newHash,
    timestamp,
    synced: true
  });
}

async function handleStatus(res, syncId) {
  const doc = await db.collection(COLLECTION).doc(syncId).get();
  
  if (!doc.exists) {
    return res.status(404).json({ status: 'not_found' });
  }

  res.status(200).json({
    status: 'found',
    data: doc.data()
  });
}
