import admin from 'firebase-admin';

const db = admin.firestore();
const COLLECTION = 'mem_metadata';

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET' && req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { action } = req.body || req.query;
    
    switch (action) {
      case 'create':
        return await handleCreate(req, res);
      case 'get':
        return await handleGet(req, res);
      case 'update':
        return await handleUpdate(req, res);
      case 'delete':
        return await handleDelete(req, res);
      case 'list':
        return await handleList(req, res);
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    console.error('Metadata error:', error);
    res.status(500).json({ error: error.message });
  }
}

async function handleCreate(req, res) {
  const { issueId, rodNumber, metadata } = req.body;

  if (!issueId || !rodNumber) {
    return res.status(400).json({ error: 'issueId and rodNumber required' });
  }

  try {
    const docId = `${issueId}-${rodNumber}`;
    const timestamp = new Date().toISOString();

    const data = {
      issueId,
      rodNumber,
      createdAt: timestamp,
      updatedAt: timestamp,
      syncStatus: 'initialized',
      platform: 'mem.ai',
      syncHistory: [{
        timestamp,
        action: 'created',
        status: 'success'
      }],
      ...metadata
    };

    await db.collection(COLLECTION).doc(docId).set(data);

    res.status(201).json({
      success: true,
      metadataId: docId,
      metadata: data
    });
  } catch (error) {
    console.error('Metadata creation failed:', error);
    res.status(500).json({ error: error.message });
  }
}

async function handleGet(req, res) {
  const { issueId, rodNumber } = req.query;

  if (!issueId || !rodNumber) {
    return res.status(400).json({ error: 'issueId and rodNumber required' });
  }

  try {
    const docId = `${issueId}-${rodNumber}`;
    const doc = await db.collection(COLLECTION).doc(docId).get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Metadata not found' });
    }

    res.status(200).json({
      success: true,
      metadataId: docId,
      metadata: doc.data()
    });
  } catch (error) {
    console.error('Metadata retrieval failed:', error);
    res.status(500).json({ error: error.message });
  }
}

async function handleUpdate(req, res) {
  const { issueId, rodNumber, updates } = req.body;

  if (!issueId || !rodNumber) {
    return res.status(400).json({ error: 'issueId and rodNumber required' });
  }

  try {
    const docId = `${issueId}-${rodNumber}`;
    const timestamp = new Date().toISOString();

    await db.collection(COLLECTION).doc(docId).update({
      ...updates,
      updatedAt: timestamp,
      'syncHistory': admin.firestore.FieldValue.arrayUnion({
        timestamp,
        action: 'updated',
        status: 'success',
        fields: Object.keys(updates)
      })
    });

    const updated = await db.collection(COLLECTION).doc(docId).get();

    res.status(200).json({
      success: true,
      metadataId: docId,
      metadata: updated.data()
    });
  } catch (error) {
    console.error('Metadata update failed:', error);
    res.status(500).json({ error: error.message });
  }
}

async function handleDelete(req, res) {
  const { issueId, rodNumber } = req.body || req.query;

  if (!issueId || !rodNumber) {
    return res.status(400).json({ error: 'issueId and rodNumber required' });
  }

  try {
    const docId = `${issueId}-${rodNumber}`;
    const timestamp = new Date().toISOString();

    await db.collection(COLLECTION).doc(docId).update({
      status: 'deleted',
      deletedAt: timestamp,
      'syncHistory': admin.firestore.FieldValue.arrayUnion({
        timestamp,
        action: 'deleted',
        status: 'success'
      })
    });

    res.status(200).json({
      success: true,
      metadataId: docId,
      message: 'Metadata marked as deleted',
      timestamp
    });
  } catch (error) {
    console.error('Metadata deletion failed:', error);
    res.status(500).json({ error: error.message });
  }
}

async function handleList(req, res) {
  const { limit = 100 } = req.query;

  try {
    const snapshot = await db.collection(COLLECTION)
      .limit(parseInt(limit) || 100)
      .get();
    
    const metadata = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.status(200).json({
      success: true,
      count: metadata.length,
      metadata
    });
  } catch (error) {
    console.error('Metadata listing failed:', error);
    res.status(500).json({ error: error.message });
  }
}
