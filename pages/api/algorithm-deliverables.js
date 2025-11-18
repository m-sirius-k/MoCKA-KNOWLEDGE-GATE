// pages/api/algorithm-deliverables.js
// Deliverable History System with Draft/Final version management
import admin from 'firebase-admin';

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

/**
 * Algorithm Deliverable Management API
 * Handles Draft/Final versioning, Colab integration, bidirectional sync
 */
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    switch (req.method) {
      case 'GET':
        return handleGetAlgorithm(req, res);
      case 'POST':
        return handleCreateDeliverable(req, res);
      case 'PUT':
        return handleUpdateDeliverable(req, res);
      case 'PATCH':
        return handlePromoteVersion(req, res);
      case 'DELETE':
        return handleDeleteDeliverable(req, res);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: error.message });
  }
}

// GET: Retrieve algorithm deliverables and their version history
async function handleGetAlgorithm(req, res) {
  const { algorithmId, version = 'all' } = req.query;

  if (!algorithmId) {
    return res.status(400).json({ error: 'algorithmId required' });
  }

  try {
    if (version === 'all') {
      const docSnap = await db.collection('algorithm_deliverables').doc(algorithmId).get();
      if (!docSnap.exists) return res.status(404).json({ error: 'Not found' });
      const data = docSnap.data();
      return res.status(200).json({ algorithmId, ...data, versions: data.versions || [] });
    }

    if (['final', 'draft'].includes(version)) {
      const query = db.collection('algorithm_deliverables').doc(algorithmId)
        .collection('versions').where('status', '==', version).orderBy('createdAt', 'desc').limit(1);
      const snapshot = await query.get();
      if (snapshot.empty) return res.status(404).json({ error: `No ${version}` });
      const versionData = snapshot.docs[0].data();
      return res.status(200).json({ algorithmId, version: snapshot.docs[0].id, status: version, ...versionData });
    }
    return res.status(400).json({ error: 'Invalid version' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

// POST: Create new algorithm deliverable (Draft version)
async function handleCreateDeliverable(req, res) {
  const { algorithmName, colabUrl, issueId, rodNumber, description, tags } = req.body;

  if (!algorithmName || !colabUrl || !issueId) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const algorithmId = `ALG-${issueId}-${rodNumber || Date.now()}`;
    const timestamp = admin.firestore.FieldValue.serverTimestamp();

    const deliverableData = {
      algorithmId, algorithmName, description, tags: tags || [], issueId, rodNumber, colabUrl,
      createdAt: timestamp, updatedAt: timestamp, currentStatus: 'draft', versions: [1],
    };

    const draftVersionData = {
      versionNumber: 1, status: 'draft', colabUrl, issueId, rodNumber,
      createdAt: timestamp, updatedAt: timestamp, colabExecutionHistory: [], metrics: {},
    };

    await db.collection('algorithm_deliverables').doc(algorithmId).set(deliverableData);
    await db.collection('algorithm_deliverables').doc(algorithmId).collection('versions').doc('v1').set(draftVersionData);
    await logDeliverableAction(algorithmId, 'CREATE_DRAFT', 'Draft created', req.body);

    return res.status(201).json({ success: true, algorithmId, version: 'v1', status: 'draft', colabUrl });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

// PUT: Update algorithm deliverable (save to Draft)
async function handleUpdateDeliverable(req, res) {
  const { algorithmId, version = 'draft', colabUrl, metrics, executionLog } = req.body;

  if (!algorithmId) {
    return res.status(400).json({ error: 'algorithmId required' });
  }

  try {
    const timestamp = admin.firestore.FieldValue.serverTimestamp();
    const versionId = version === 'draft' ? 'v1' : version;
    const updateData = { updatedAt: timestamp, ...(colabUrl && { colabUrl }), ...(metrics && { metrics }) };

    await db.collection('algorithm_deliverables').doc(algorithmId).collection('versions').doc(versionId).update(updateData);
    await db.collection('algorithm_deliverables').doc(algorithmId).update({ updatedAt: timestamp });

    if (executionLog) {
      await db.collection('algorithm_deliverables').doc(algorithmId).collection('versions').doc(versionId)
        .update({
          colabExecutionHistory: admin.firestore.FieldValue.arrayUnion({ timestamp, ...executionLog }),
        });
    }

    await logDeliverableAction(algorithmId, 'UPDATE_DRAFT', 'Draft updated', { version: versionId });
    return res.status(200).json({ success: true, algorithmId, version: versionId, status: 'draft', updatedAt: new Date().toISOString() });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

// PATCH: Promote Draft to Final
async function handlePromoteVersion(req, res) {
  const { algorithmId, fromVersion = 'draft', promotionReason, approvedBy } = req.body;

  if (!algorithmId) {
    return res.status(400).json({ error: 'algorithmId required' });
  }

  try {
    const docRef = db.collection('algorithm_deliverables').doc(algorithmId);
    const docSnap = await docRef.get();
    if (!docSnap.exists) return res.status(404).json({ error: 'Not found' });

    const data = docSnap.data();
    const newVersionNumber = (data.versions || []).length + 1;
    const newVersionId = `v${newVersionNumber}`;
    const timestamp = admin.firestore.FieldValue.serverTimestamp();
    const sourceVersionId = fromVersion === 'draft' ? 'v1' : fromVersion;

    const sourceVersionSnap = await db.collection('algorithm_deliverables').doc(algorithmId)
      .collection('versions').doc(sourceVersionId).get();
    if (!sourceVersionSnap.exists) return res.status(404).json({ error: `Version not found` });

    const sourceData = sourceVersionSnap.data();
    const finalVersionData = {
      ...sourceData, versionNumber: newVersionNumber, status: 'final',
      promotedAt: timestamp, promotionReason, approvedBy, createdAt: timestamp, updatedAt: timestamp,
    };

    await db.collection('algorithm_deliverables').doc(algorithmId).collection('versions').doc(newVersionId).set(finalVersionData);
    await docRef.update({
      currentStatus: 'final', currentVersion: newVersionNumber,
      versions: admin.firestore.FieldValue.arrayUnion(newVersionNumber),
      lastFinalizedAt: timestamp, updatedAt: timestamp,
    });

    await logDeliverableAction(algorithmId, 'PROMOTE_TO_FINAL', `${sourceVersionId} -> ${newVersionId}`,
      { newVersionNumber, promotionReason, approvedBy });

    return res.status(200).json({
      success: true, algorithmId, previousVersion: sourceVersionId, newVersion: newVersionId,
      status: 'final', versionNumber: newVersionNumber,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

// DELETE: Archive algorithm deliverable
async function handleDeleteDeliverable(req, res) {
  const { algorithmId, reason } = req.body;
  if (!algorithmId) return res.status(400).json({ error: 'algorithmId required' });

  try {
    const timestamp = admin.firestore.FieldValue.serverTimestamp();
    await db.collection('algorithm_deliverables').doc(algorithmId).update({
      status: 'archived', archivedAt: timestamp, archiveReason: reason,
    });
    await logDeliverableAction(algorithmId, 'ARCHIVE', `Archived: ${reason}`, {});
    return res.status(200).json({ success: true, algorithmId, status: 'archived' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

// Helper: Log deliverable actions
async function logDeliverableAction(algorithmId, actionType, description, details) {
  const timestamp = admin.firestore.FieldValue.serverTimestamp();
  await db.collection('algorithm_deliverables').doc(algorithmId).collection('audit_log').add({
    action: actionType, description, details, timestamp,
  });
}
