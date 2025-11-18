// pages/api/colab-integration.js
// Bidirectional Colab <-> MoCKA sync orchestration
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
 * Colab Integration API
 * Manages bidirectional sync between Colab notebooks and deliverables
 */
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    switch (req.method) {
      case 'GET':
        return handleGetColabSession(req, res);
      case 'POST':
        return handleColabExecution(req, res);
      case 'PUT':
        return handleSyncWithDeliverable(req, res);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: error.message });
  }
}

// GET: Retrieve Colab session and sync status
async function handleGetColabSession(req, res) {
  const { algorithmId, sessionId } = req.query;

  if (!algorithmId) {
    return res.status(400).json({ error: 'algorithmId required' });
  }

  try {
    const sessionsSnap = await db.collection('algorithm_deliverables')
      .doc(algorithmId).collection('colab_sessions').orderBy('createdAt', 'desc').limit(1).get();

    if (sessionsSnap.empty) {
      return res.status(404).json({ error: 'No Colab sessions found' });
    }

    const session = sessionsSnap.docs[0].data();
    return res.status(200).json({
      algorithmId,
      sessionId: sessionsSnap.docs[0].id,
      ...session,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

// POST: Log Colab execution and sync state
async function handleColabExecution(req, res) {
  const { algorithmId, colabUrl, executionData, metrics, cellOutputs, notebookState } = req.body;

  if (!algorithmId || !colabUrl) {
    return res.status(400).json({ error: 'algorithmId and colabUrl required' });
  }

  try {
    const timestamp = admin.firestore.FieldValue.serverTimestamp();
    const sessionId = `COLAB-${algorithmId}-${Date.now()}`;

    // Create Colab session record
    const sessionData = {
      algorithmId,
      colabUrl,
      sessionId,
      executionData: executionData || {},
      metrics: metrics || {},
      cellOutputs: cellOutputs || [],
      notebookState: notebookState || {},
      syncStatus: 'synced',
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    await db.collection('algorithm_deliverables').doc(algorithmId)
      .collection('colab_sessions').doc(sessionId).set(sessionData);

    // Update parent algorithm with latest execution info
    await db.collection('algorithm_deliverables').doc(algorithmId).update({
      lastColabExecution: timestamp,
      lastColabUrl: colabUrl,
      lastExecutionSessionId: sessionId,
      updatedAt: timestamp,
    });

    // Trigger sync with Draft version
    await syncToDraft(algorithmId, sessionId, executionData, metrics);

    return res.status(201).json({
      success: true,
      algorithmId,
      sessionId,
      syncStatus: 'synced',
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

// PUT: Sync Colab state to deliverable
async function handleSyncWithDeliverable(req, res) {
  const { algorithmId, sessionId, syncDirection = 'colab-to-deliverable' } = req.body;

  if (!algorithmId || !sessionId) {
    return res.status(400).json({ error: 'algorithmId and sessionId required' });
  }

  try {
    const timestamp = admin.firestore.FieldValue.serverTimestamp();

    if (syncDirection === 'colab-to-deliverable') {
      const sessionSnap = await db.collection('algorithm_deliverables').doc(algorithmId)
        .collection('colab_sessions').doc(sessionId).get();

      if (!sessionSnap.exists) {
        return res.status(404).json({ error: 'Session not found' });
      }

      const sessionData = sessionSnap.data();
      const { executionData, metrics } = sessionData;

      // Update Draft version with execution data
      await db.collection('algorithm_deliverables').doc(algorithmId)
        .collection('versions').doc('v1').update({
          colabExecutionHistory: admin.firestore.FieldValue.arrayUnion({
            sessionId,
            timestamp,
            executionData,
            metrics,
          }),
          metrics: { ...metrics },
          lastSyncedAt: timestamp,
        });

      return res.status(200).json({
        success: true,
        algorithmId,
        sessionId,
        syncDirection,
        message: 'Synced to Draft',
      });
    } else if (syncDirection === 'deliverable-to-colab') {
      // Push Draft state back to Colab
      const versionSnap = await db.collection('algorithm_deliverables').doc(algorithmId)
        .collection('versions').doc('v1').get();

      if (!versionSnap.exists) {
        return res.status(404).json({ error: 'Draft version not found' });
      }

      const versionData = versionSnap.data();
      const colabSyncData = {
        draftVersion: versionData,
        syncedAt: timestamp,
        syncDirection: 'deliverable-to-colab',
      };

      return res.status(200).json({
        success: true,
        algorithmId,
        colabSyncData,
        message: 'Ready to push to Colab',
      });
    }

    return res.status(400).json({ error: 'Invalid syncDirection' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

// Helper: Sync Colab execution to Draft version
async function syncToDraft(algorithmId, sessionId, executionData, metrics) {
  try {
    const timestamp = admin.firestore.FieldValue.serverTimestamp();

    await db.collection('algorithm_deliverables').doc(algorithmId)
      .collection('versions').doc('v1').update({
        colabExecutionHistory: admin.firestore.FieldValue.arrayUnion({
          sessionId,
          timestamp,
          executionData,
          metrics,
        }),
        lastSyncedFrom: 'colab',
        lastSyncedAt: timestamp,
      });

    // Log sync action
    await db.collection('algorithm_deliverables').doc(algorithmId)
      .collection('audit_log').add({
        action: 'COLAB_SYNC',
        description: `Synced from Colab session ${sessionId}`,
        details: { sessionId, executionData, metrics },
        timestamp,
      });
  } catch (error) {
    console.error('Error syncing to Draft:', error);
  }
}
