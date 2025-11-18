// pages/api/automated-promotion.js
// Automatically promote algorithms when quality metrics threshold is met
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

// Thresholds for automatic promotion
const AUTO_PROMOTION_THRESHOLDS = {
  minExecutions: 3,
  minAccuracy: 0.90,
  minF1Score: 0.85,
};

/**
 * Automated Promotion API
 * Checks all Draft versions and auto-promotes those meeting thresholds
 */
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    switch (req.method) {
      case 'GET':
        return handleCheckEligibility(req, res);
      case 'POST':
        return handleAutoPromote(req, res);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: error.message });
  }
}

// GET: Check which algorithms are eligible for auto-promotion
async function handleCheckEligibility(req, res) {
  try {
    const allDeliverables = await db.collection('algorithm_deliverables').get();
    const eligibleForPromotion = [];
    const notEligibleReasons = {};

    for (const doc of allDeliverables.docs) {
      const algorithmId = doc.id;
      const data = doc.data();
      
      // Skip if already finalized
      if (data.currentStatus === 'final') continue;

      // Check Draft version
      const draftSnap = await db.collection('algorithm_deliverables')
        .doc(algorithmId).collection('versions').doc('v1').get();
      
      if (!draftSnap.exists) {
        notEligibleReasons[algorithmId] = 'No Draft version';
        continue;
      }

      const draftData = draftSnap.data();
      const executionCount = (draftData.colabExecutionHistory || []).length;
      const metrics = draftData.metrics || {};

      const reasons = [];
      if (executionCount < AUTO_PROMOTION_THRESHOLDS.minExecutions) {
        reasons.push(`Only ${executionCount} executions (min ${AUTO_PROMOTION_THRESHOLDS.minExecutions})`);
      }
      if ((metrics.accuracy || 0) < AUTO_PROMOTION_THRESHOLDS.minAccuracy) {
        reasons.push(`Accuracy ${(metrics.accuracy || 0).toFixed(3)} (min ${AUTO_PROMOTION_THRESHOLDS.minAccuracy})`);
      }
      if ((metrics.f1Score || 0) < AUTO_PROMOTION_THRESHOLDS.minF1Score) {
        reasons.push(`F1 Score ${(metrics.f1Score || 0).toFixed(3)} (min ${AUTO_PROMOTION_THRESHOLDS.minF1Score})`);
      }

      if (reasons.length === 0) {
        eligibleForPromotion.push({
          algorithmId,
          algorithmName: data.algorithmName,
          executionCount,
          metrics,
        });
      } else {
        notEligibleReasons[algorithmId] = reasons;
      }
    }

    return res.status(200).json({
      eligibleCount: eligibleForPromotion.length,
      eligible: eligibleForPromotion,
      notEligibleCount: Object.keys(notEligibleReasons).length,
      notEligibleReasons,
      thresholds: AUTO_PROMOTION_THRESHOLDS,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

// POST: Auto-promote eligible algorithms
async function handleAutoPromote(req, res) {
  const { algorithmIds, autoApprove = true } = req.body;

  try {
    const promoted = [];
    const failed = [];
    const timestamp = admin.firestore.FieldValue.serverTimestamp();

    // If no specific IDs provided, find all eligible
    let idsToProcess = algorithmIds;
    if (!idsToProcess || idsToProcess.length === 0) {
      const eligibilityRes = await handleCheckEligibility({ query: {} }, {
        status: () => ({}),
        json: (data) => data,
        setHeader: () => {},
      });
      idsToProcess = eligibilityRes.eligible.map(e => e.algorithmId);
    }

    for (const algorithmId of idsToProcess) {
      try {
        const docRef = db.collection('algorithm_deliverables').doc(algorithmId);
        const docSnap = await docRef.get();

        if (!docSnap.exists) {
          failed.push({ algorithmId, reason: 'Algorithm not found' });
          continue;
        }

        const data = docSnap.data();
        const newVersionNumber = (data.versions || []).length + 1;
        const newVersionId = `v${newVersionNumber}`;

        // Get Draft data
        const sourceSnap = await db.collection('algorithm_deliverables')
          .doc(algorithmId).collection('versions').doc('v1').get();
        
        if (!sourceSnap.exists) {
          failed.push({ algorithmId, reason: 'Draft version not found' });
          continue;
        }

        const sourceData = sourceSnap.data();

        // Create Final version
        const finalVersionData = {
          ...sourceData,
          versionNumber: newVersionNumber,
          status: 'final',
          promotedAt: timestamp,
          promotionReason: 'Automatic promotion - quality thresholds met',
          approvedBy: 'automated-system',
          autoPromoted: true,
          createdAt: timestamp,
          updatedAt: timestamp,
        };

        await db.collection('algorithm_deliverables').doc(algorithmId)
          .collection('versions').doc(newVersionId).set(finalVersionData);

        await docRef.update({
          currentStatus: 'final',
          currentVersion: newVersionNumber,
          versions: admin.firestore.FieldValue.arrayUnion(newVersionNumber),
          lastFinalizedAt: timestamp,
          updatedAt: timestamp,
        });

        // Log action
        await db.collection('algorithm_deliverables').doc(algorithmId)
          .collection('audit_log').add({
            action: 'AUTO_PROMOTED',
            description: `Automatically promoted to Final v${newVersionNumber}`,
            details: { metricsQualified: sourceData.metrics },
            timestamp,
          });

        promoted.push({
          algorithmId,
          newVersion: newVersionId,
          metrics: sourceData.metrics,
        });
      } catch (error) {
        failed.push({ algorithmId, reason: error.message });
      }
    }

    return res.status(200).json({
      success: true,
      promoted: promoted.length,
      promotedAlgorithms: promoted,
      failed: failed.length,
      failedAlgorithms: failed,
      summary: `${promoted.length} promoted, ${failed.length} failed`,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
