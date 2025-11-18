import admin from 'firebase-admin';
import fetch from 'node-fetch';

const db = admin.firestore();
const MEM_API_URL = process.env.MEM_API_URL || 'https://api.mem.ai/v1';
const MEM_API_KEY = process.env.MEM_API_KEY;

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET' && req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { action } = req.body || req.query;
    
    switch (action) {
      case 'create':
        return await handleCreateCollection(req, res);
      case 'list':
        return await handleListCollections(req, res);
      case 'update':
        return await handleUpdateCollection(req, res);
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    console.error('Collection error:', error);
    res.status(500).json({ error: error.message });
  }
}

async function handleCreateCollection(req, res) {
  const { issueId, rodNumber, collectionName, description } = req.body;

  if (!issueId || !rodNumber) {
    return res.status(400).json({ error: 'issueId and rodNumber required' });
  }

  try {
    const name = collectionName || `ISSUE-${issueId}-ROD-${rodNumber}`;
    const timestamp = new Date().toISOString();
    const docId = `${issueId}-${rodNumber}-collection`;

    const collectionData = {
      issueId,
      rodNumber,
      name,
      description: description || `Auto-generated collection for ISSUE-${issueId}`,
      createdAt: timestamp,
      status: 'active',
      platform: 'mem.ai',
      noteCount: 0,
      permissions: {
        owner: 'system',
        editors: [],
        viewers: ['all']
      }
    };

    await db.collection('mem_collections').doc(docId).set(collectionData);

    res.status(201).json({
      success: true,
      collectionId: docId,
      collection: collectionData,
      timestamp
    });
  } catch (error) {
    console.error('Collection creation failed:', error);
    res.status(500).json({ error: error.message });
  }
}

async function handleListCollections(req, res) {
  const { issueId, rodNumber, limit = 100 } = req.query;

  try {
    let query = db.collection('mem_collections');
    
    if (issueId) query = query.where('issueId', '==', issueId);
    if (rodNumber) query = query.where('rodNumber', '==', rodNumber);
    
    const snapshot = await query.limit(parseInt(limit) || 100).get();
    const collections = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.status(200).json({
      success: true,
      count: collections.length,
      collections
    });
  } catch (error) {
    console.error('Collection listing failed:', error);
    res.status(500).json({ error: error.message });
  }
}

async function handleUpdateCollection(req, res) {
  const { collectionId, issueId, rodNumber, updates } = req.body;

  if (!collectionId && (!issueId || !rodNumber)) {
    return res.status(400).json({ error: 'collectionId or issueId+rodNumber required' });
  }

  try {
    const docId = collectionId || `${issueId}-${rodNumber}-collection`;
    const timestamp = new Date().toISOString();

    await db.collection('mem_collections').doc(docId).update({
      ...updates,
      updatedAt: timestamp,
      lastModified: timestamp
    });

    const updated = await db.collection('mem_collections').doc(docId).get();

    res.status(200).json({
      success: true,
      collectionId: docId,
      collection: updated.data(),
      timestamp
    });
  } catch (error) {
    console.error('Collection update failed:', error);
    res.status(500).json({ error: error.message });
  }
}
