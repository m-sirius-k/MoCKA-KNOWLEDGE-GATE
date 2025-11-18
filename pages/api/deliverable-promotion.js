// pages/api/deliverable-promotion.js
// Automated Draft -> Final promotion workflow
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
 * Deliverable Promotion API
 * Automates Draft->Final version promotion with validation
 */
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    switch (req.method) {
      case 'GET':
        return handleGetPromotionStatus(req, res);
      case 'POST':
        return handleInitiatePromotion(req, res);
      case 'PUT':
        return handleApprovePromotion(req, res);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: error.message });
  }
}

// GET: Check promotion eligibility
async function handleGetPromotionStatus(req, res) {
  const { algorithmId } = req.query;

  if (!algorithmId) {
    return res.status(400).json({ error: 'algorithmId required' });
  }

  try {
    const docSnap = await db.collection('algorithm_deliverables').doc(algorithmId).get();

    if (!docSnap.exists) {
      return res.status(404).json({ error: 'Algorithm not found' });
    }

    const data = docSnap.data();
    const draftSnap = await db.collection('algorithm_deliverables')
      .doc(algorithmId).collection('versions').doc('v1').get();

    if (!draftSnap.exists) {
      return res.status(404).json({ error: 'Draft not found' });
    }

    const draftData = draftSnap.data();
    const validationResult = validateDraftForPromotion(draftData);

    return res.status(200).json({
      algorithmId,
      currentStatus: data.currentStatus,
      canPromote: validationResult.isValid,
      validationIssues: validationResult.issues,
      lastUpdated: data.updatedAt,
      executionCount: (draftData.colabExecutionHistory || []).length,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

// POST: Request promotion
async function handleInitiatePromotion(req, res) {
  const { algorithmId, reason, requestedBy } = req.body;

  if (!algorithmId) {
    return res.status(400).json({ error: 'algorithmId required' });
  }

  try {
    const timestamp = admin.firestore.FieldValue.serverTimestamp();
    const promotionRequestId = `PROMO-${algorithmId}-${Date.now()}`;

    // Get Draft and validate
    const draftSnap = await db.collection('algorithm_deliverables')
      .doc(algorithmId).collection('versions').doc('v1').get();

    if (!draftSnap.exists) {
      return res.status(404).json({ error: 'Draft not found' });
    }

    const draftData = draftSnap.data();
    const validation = validateDraftForPromotion(draftData);

    if (!validation.isValid) {
      return res.status(400).json({
        error: 'Draft not eligible for promotion',
        issues: validation.issues,
      });
    }

    // Create promotion request
    const promotionData = {
      promotionRequestId,
      algorithmId,
      fromVersion: 'v1',
      status: 'pending_approval',
      reason,
      requestedBy,
      requestedAt: timestamp,
      validationResult: validation,
      draftMetadata: {
        executionCount: (draftData.colabExecutionHistory || []).length,
        metrics: draftData.metrics || {},
        lastExecutedAt: draftData.lastSyncedAt,
      },
    };

    await db.collection('algorithm_deliverables').doc(algorithmId)
      .collection('promotion_requests').doc(promotionRequestId).set(promotionData);

    // Update algorithm status
    await db.collection('algorithm_deliverables').doc(algorithmId).update({
      promotionPending: true,
      lastPromotionRequest: timestamp,
    });

    return res.status(201).json({
      success: true,
      promotionRequestId,
      status: 'pending_approval',
      message: 'Promotion request created',
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

// PUT: Approve and execute promotion
async function handleApprovePromotion(req, res) {
  const { algorithmId, promotionRequestId, approvedBy } = req.body;

  if (!algorithmId || !promotionRequestId || !approvedBy) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const timestamp = admin.firestore.FieldValue.serverTimestamp();

    // Get promotion request
    const promSnap = await db.collection('algorithm_deliverables').doc(algorithmId)
      .collection('promotion_requests').doc(promotionRequestId).get();

    if (!promSnap.exists) {
      return res.status(404).json({ error: 'Promotion request not found' });
    }

    const promData = promSnap.data();

    if (promData.status !== 'pending_approval') {
      return res.status(400).json({ error: 'Promotion already processed' });
    }

    // Execute promotion via algorithm-deliverables PATCH endpoint
    const docRef = db.collection('algorithm_deliverables').doc(algorithmId);
    const docSnap = await docRef.get();
    const data = docSnap.data();

    const newVersionNumber = (data.versions || []).length + 1;
    const newVersionId = `v${newVersionNumber}`;

    const sourceSnap = await db.collection('algorithm_deliverables')
      .doc(algorithmId).collection('versions').doc('v1').get();
    const sourceData = sourceSnap.data();

    const finalVersionData = {
      ...sourceData,
      versionNumber: newVersionNumber,
      status: 'final',
      promotedAt: timestamp,
      promotionRequestId,
      approvedBy,
      promotionReason: promData.reason,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    // Create final version
    await db.collection('algorithm_deliverables').doc(algorithmId)
      .collection('versions').doc(newVersionId).set(finalVersionData);

    // Update parent document
    await docRef.update({
      currentStatus: 'final',
      currentVersion: newVersionNumber,
      versions: admin.firestore.FieldValue.arrayUnion(newVersionNumber),
      lastFinalizedAt: timestamp,
      promotionPending: false,
      updatedAt: timestamp,
    });

    // Update promotion request
    await db.collection('algorithm_deliverables').doc(algorithmId)
      .collection('promotion_requests').doc(promotionRequestId).update({
        status: 'approved',
        approvedBy,
        approvedAt: timestamp,
        finalVersionId: newVersionId,
      });

    // Log audit trail
    await db.collection('algorithm_deliverables').doc(algorithmId)
      .collection('audit_log').add({
        action: 'PROMOTION_APPROVED',
        description: `Draft promoted to Final version ${newVersionId}`,
        details: { promotionRequestId, approvedBy, newVersionId },
        timestamp,
      });

    return res.status(200).json({
      success: true,
      algorithmId,
      newVersion: newVersionId,
      status: 'final',
      message: 'Algorithm promoted to Final version',
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

// Helper: Validate Draft for promotion eligibility
function validateDraftForPromotion(draftData) {
  const issues = [];

  // Check for execution history
  if (!draftData.colabExecutionHistory || draftData.colabExecutionHistory.length === 0) {
    issues.push('No Colab execution history - at least one execution required');
  }

  // Check for metrics
  if (!draftData.metrics || Object.keys(draftData.metrics).length === 0) {
    issues.push('No metrics recorded - execution metrics required');
  }

  // Check Colab URL
  if (!draftData.colabUrl) {
    issues.push('No Colab URL provided - notebook link required');
  }

  // Check metadata
  if (!draftData.issueId) {
    issues.push('No ISSUE-ID assigned');
  }

  return {
    isValid: issues.length === 0,
    issues,
    checkedAt: new Date().toISOString(),
  };
}
