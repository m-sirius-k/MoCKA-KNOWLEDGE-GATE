// GitHub Sync API - コミットされた配信物をMoCKAに自動反映
import admin from 'firebase-admin';
import crypto from 'crypto';

const db = admin.firestore();

const deliverableRef = db.collection('algorithm_deliverables');
const auditRef = db.collection('audit_logs');
const githubSyncRef = db.collection('github_sync_history');

/**
 * POST /api/github-sync
 * Webhook endpoint for GitHub push events
 * Triggered when commit pushed to main branch
 * 
 * Payload from GitHub webhook:
 * {
 *   repository: "MoCKA-KNOWLEDGE-GATE",
 *   ref: "refs/heads/main",
 *   commits: [{ message, timestamp, author }],
 *   sender: "github-actions[bot]"
 * }
 */
export default async function handler(req, res) {
  if (req.method === 'POST') {
    return handleGitHubWebhook(req, res);
  } else if (req.method === 'GET') {
    return handleGetSyncHistory(req, res);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

/**
 * POST - Process GitHub webhook and sync deliverables to MoCKA
 */
async function handleGitHubWebhook(req, res) {
  try {
    // Verify GitHub webhook signature
    const signature = req.headers['x-hub-signature-256'];
    if (!verifyGitHubSignature(req.body, signature)) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const { repository, ref, commits, pusher } = req.body;

    // Only process main branch
    if (ref !== 'refs/heads/main') {
      return res.status(200).json({ message: 'Skipping non-main branch' });
    }

    const timestamp = admin.firestore.Timestamp.now();
    const syncId = `SYNC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const processedDeliverables = [];

    // Process each commit
    for (const commit of commits) {
      if (commit.message.includes('data/deliverables/')) {
        try {
          // Parse deliverable data from commit
          const deliverableData = parseDeliverableCommit(commit);
          
          if (deliverableData) {
            // Update or create deliverable in MoCKA
            const result = await syncDeliverableToMoCKA(deliverableData, timestamp);
            processedDeliverables.push(result);
          }
        } catch (err) {
          console.error(`Error processing commit ${commit.id}:`, err);
        }
      }
    }

    // Store sync history
    await githubSyncRef.doc(syncId).set({
      syncId,
      repository,
      branch: ref,
      totalCommits: commits.length,
      processedDeliverables: processedDeliverables.length,
      pusher,
      timestamp,
      status: 'completed',
      details: processedDeliverables
    });

    // Log audit trail
    await auditRef.add({
      action: 'GITHUB_SYNC_COMPLETED',
      syncId,
      processedCount: processedDeliverables.length,
      timestamp
    });

    res.status(200).json({
      success: true,
      syncId,
      processedDeliverables: processedDeliverables.length,
      details: processedDeliverables
    });
  } catch (error) {
    console.error('Error processing GitHub webhook:', error);
    res.status(500).json({ error: 'Failed to process webhook' });
  }
}

/**
 * GET - Retrieve GitHub sync history
 * Query: /api/github-sync?repository=MoCKA-KNOWLEDGE-GATE&limit=50
 */
async function handleGetSyncHistory(req, res) {
  try {
    const { repository, limit = 50 } = req.query;
    const queryLimit = Math.min(parseInt(limit), 200);

    let query = githubSyncRef;
    
    if (repository) {
      query = query.where('repository', '==', repository);
    }

    const snapshot = await query
      .orderBy('timestamp', 'desc')
      .limit(queryLimit)
      .get();

    const history = [];
    snapshot.forEach(doc => {
      history.push({ id: doc.id, ...doc.data() });
    });

    res.status(200).json({
      success: true,
      count: history.length,
      history
    });
  } catch (error) {
    console.error('Error retrieving sync history:', error);
    res.status(500).json({ error: 'Failed to retrieve sync history' });
  }
}

/**
 * Verify GitHub webhook signature
 */
function verifyGitHubSignature(payload, signature) {
  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  
  if (!secret) {
    console.warn('GITHUB_WEBHOOK_SECRET not configured');
    return false;
  }

  const hash = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');

  const expectedSignature = `sha256=${hash}`;
  return signature === expectedSignature;
}

/**
 * Parse deliverable data from commit message
 */
function parseDeliverableCommit(commit) {
  try {
    if (!commit.message || !commit.message.includes('ALGORITHM_ID')) {
      return null;
    }

    // Extract metadata from commit message
    const algorithmIdMatch = commit.message.match(/ALGORITHM_ID: ([A-Z0-9-]+)/);
    const issueIdMatch = commit.message.match(/ISSUE-ID: (\d+)/);
    const rodNumberMatch = commit.message.match(/ROD-NUMBER: (\d+)/);

    if (!algorithmIdMatch) return null;

    return {
      algorithmId: algorithmIdMatch[1],
      issueId: issueIdMatch ? issueIdMatch[1] : null,
      rodNumber: rodNumberMatch ? rodNumberMatch[1] : null,
      commitMessage: commit.message,
      commitTimestamp: new Date(commit.timestamp)
    };
  } catch (err) {
    console.error('Error parsing commit:', err);
    return null;
  }
}

/**
 * Sync deliverable to MoCKA Firestore
 */
async function syncDeliverableToMoCKA(deliverableData, timestamp) {
  try {
    const { algorithmId, issueId, rodNumber } = deliverableData;

    // Query existing deliverable
    const snapshot = await deliverableRef
      .where('algorithmId', '==', algorithmId)
      .orderBy('version', 'desc')
      .limit(1)
      .get();

    if (!snapshot.empty) {
      const existing = snapshot.docs[0].data();
      
      // Update with GitHub sync info
      await deliverableRef.doc(snapshot.docs[0].id).update({
        githubSyncTimestamp: timestamp,
        lastSyncedFrom: 'github',
        issueId,
        rodNumber
      });

      return {
        algorithmId,
        status: 'updated',
        version: existing.version
      };
    } else {
      // Create new deliverable record
      const newId = `ALG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      await deliverableRef.doc(newId).set({
        algorithmId,
        issueId,
        rodNumber,
        status: 'Draft',
        version: 1,
        githubSyncTimestamp: timestamp,
        lastSyncedFrom: 'github',
        createdAt: timestamp
      });

      return {
        algorithmId,
        status: 'created',
        version: 1
      };
    }
  } catch (err) {
    console.error(`Error syncing ${deliverableData.algorithmId}:`, err);
    return {
      algorithmId: deliverableData.algorithmId,
      status: 'error',
      error: err.message
    };
  }
}
