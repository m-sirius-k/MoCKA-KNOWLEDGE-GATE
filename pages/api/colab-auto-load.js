// Colab Auto-Load API - 最新Final版をColabで自動取得
import admin from 'firebase-admin';

const db = admin.firestore();

const deliverableRef = db.collection('algorithm_deliverables');
const auditRef = db.collection('audit_logs');

/**
 * GET /api/colab-auto-load
 * Retrieve latest Final version of algorithm for Colab
 * Query: /api/colab-auto-load?algorithmId=ALG-ISSUE-001-ROD-001&colabSessionId=session-123
 * 
 * Response:
 * {
 *   algorithmId: "ALG-ISSUE-001-ROD-001",
 *   finalVersion: 2,
 *   pythonCode: "...",
 *   metadata: { accuracy: 92, f1Score: 89 },
 *   metrics: [...],
 *   loadTimestamp: "2025-11-18T..."
 * }
 */
export default async function handler(req, res) {
  if (req.method === 'GET') {
    return handleGetLatestFinal(req, res);
  } else if (req.method === 'POST') {
    return handleLoadTrigger(req, res);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

/**
 * GET - Retrieve latest Final version for Colab
 */
async function handleGetLatestFinal(req, res) {
  try {
    const { algorithmId, colabSessionId } = req.query;

    if (!algorithmId) {
      return res.status(400).json({
        error: 'Missing required query parameter: algorithmId'
      });
    }

    // Query for the deliverable
    const snapshot = await deliverableRef
      .where('algorithmId', '==', algorithmId)
      .orderBy('version', 'desc')
      .limit(10)
      .get();

    if (snapshot.empty) {
      return res.status(404).json({
        error: `Algorithm not found: ${algorithmId}`
      });
    }

    // Find the latest Final version
    let latestFinal = null;
    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.status === 'Final' && !latestFinal) {
        latestFinal = { id: doc.id, ...data };
      }
    });

    if (!latestFinal) {
      return res.status(404).json({
        error: `No Final version found for algorithm: ${algorithmId}`,
        suggestion: 'Promote a Draft version to Final first'
      });
    }

    const timestamp = admin.firestore.Timestamp.now();

    // Log the auto-load access
    await auditRef.add({
      action: 'COLAB_AUTO_LOAD',
      algorithmId,
      version: latestFinal.version,
      colabSessionId,
      timestamp
    });

    // Return Final version with code and metadata
    res.status(200).json({
      success: true,
      algorithmId,
      finalVersion: latestFinal.version,
      pythonCode: latestFinal.pythonCode || '',
      metadata: latestFinal.metadata || {},
      metrics: latestFinal.executionMetrics || [],
      issueId: latestFinal.issueId,
      rodNumber: latestFinal.rodNumber,
      loadTimestamp: timestamp,
      colabSessionId
    });
  } catch (error) {
    console.error('Error retrieving Final version:', error);
    res.status(500).json({ error: 'Failed to retrieve Final version' });
  }
}

/**
 * POST - Trigger background auto-load for batch of algorithms
 * Request body:
 * {
 *   algorithmIds: ["ALG-ISSUE-001-ROD-001", "ALG-ISSUE-002-ROD-002"],
 *   colabSessionId: "session-123"
 * }
 */
async function handleLoadTrigger(req, res) {
  try {
    const { algorithmIds, colabSessionId } = req.body;

    if (!algorithmIds || !Array.isArray(algorithmIds)) {
      return res.status(400).json({
        error: 'Invalid request: algorithmIds must be an array'
      });
    }

    const timestamp = admin.firestore.Timestamp.now();
    const results = [];

    // Process each algorithm in parallel
    for (const algorithmId of algorithmIds) {
      try {
        // Query for latest Final
        const snapshot = await deliverableRef
          .where('algorithmId', '==', algorithmId)
          .where('status', '==', 'Final')
          .orderBy('version', 'desc')
          .limit(1)
          .get();

        if (snapshot.empty) {
          results.push({
            algorithmId,
            status: 'not_found',
            error: 'No Final version available'
          });
        } else {
          const finalDoc = snapshot.docs[0];
          const finalData = finalDoc.data();
          
          // Log the load
          await auditRef.add({
            action: 'COLAB_BATCH_AUTO_LOAD',
            algorithmId,
            version: finalData.version,
            colabSessionId,
            timestamp
          });

          results.push({
            algorithmId,
            status: 'loaded',
            version: finalData.version,
            codeSize: (finalData.pythonCode || '').length
          });
        }
      } catch (err) {
        console.error(`Error loading ${algorithmId}:`, err);
        results.push({
          algorithmId,
          status: 'error',
          error: err.message
        });
      }
    }

    res.status(200).json({
      success: true,
      colabSessionId,
      totalRequested: algorithmIds.length,
      results,
      loadedAt: timestamp
    });
  } catch (error) {
    console.error('Error triggering batch auto-load:', error);
    res.status(500).json({ error: 'Failed to trigger auto-load' });
  }
}

/**
 * Helper: Format algorithm for Colab delivery
 */
function formatForColab(deliverable) {
  return {
    algorithmId: deliverable.algorithmId,
    version: deliverable.version,
    pythonCode: deliverable.pythonCode || '',
    imports: deliverable.imports || [],
    dependencies: deliverable.dependencies || [],
    metadata: {
      accuracy: deliverable.accuracy,
      f1Score: deliverable.f1Score,
      loss: deliverable.loss,
      executionCount: deliverable.executionCount,
      issueId: deliverable.issueId,
      rodNumber: deliverable.rodNumber
    }
  };
}
