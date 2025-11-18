import admin from 'firebase-admin';
import crypto from 'crypto';

const db = admin.firestore();
const COLLECTION = 'ai_simulation_logs';

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    if (req.method === 'POST') {
      return await handleLogSimulation(req, res);
    } else {
      return await handleGetLogs(req, res);
    }
  } catch (error) {
    console.error('AI Simulation logging error:', error);
    res.status(500).json({ error: error.message });
  }
}

async function handleLogSimulation(req, res) {
  const {
    issueId,
    rodNumber,
    aiModel,
    modelProvider,
    prompt,
    output,
    metadata = {}
  } = req.body;

  if (!issueId || !rodNumber || !aiModel || !output) {
    return res.status(400).json({
      error: 'issueId, rodNumber, aiModel, and output are required'
    });
  }

  try {
    const timestamp = new Date().toISOString();
    const logId = `${issueId}-${rodNumber}-${Date.now()}`;
    const outputHash = crypto
      .createHash('sha256')
      .update(output)
      .digest('hex');

    const logEntry = {
      issueId,
      rodNumber,
      aiModel,
      modelProvider: modelProvider || 'unknown',
      promptHash: prompt ? crypto.createHash('sha256').update(prompt).digest('hex') : null,
      outputHash,
      outputLength: output.length,
      timestamp,
      createdAt: timestamp,
      status: 'logged',
      platform: 'github-actions',
      executionContext: {
        workflowRun: metadata.workflowRun || null,
        runNumber: metadata.runNumber || null,
        branch: metadata.branch || null,
        commit: metadata.commit || null,
        actor: metadata.actor || 'automated'
      },
      tokenMetrics: {
        promptTokens: metadata.promptTokens || null,
        completionTokens: metadata.completionTokens || null,
        totalTokens: metadata.totalTokens || null
      },
      costEstimate: {
        model: aiModel,
        estimatedCost: calculateCost(aiModel, metadata.promptTokens, metadata.completionTokens)
      },
      quality: {
        contentLength: output.length,
        hasCode: output.includes('```'),
        hasMarkdown: output.includes('#') || output.includes('**'),
        sentiment: null,
        confidence: metadata.confidence || null
      }
    };

    await db.collection(COLLECTION).doc(logId).set(logEntry);

    // Update summary statistics
    const summaryId = `${issueId}-${rodNumber}`;
    await db.collection('ai_simulation_summaries').doc(summaryId).set({
      issueId,
      rodNumber,
      lastUpdate: timestamp,
      totalExecutions: admin.firestore.FieldValue.increment(1),
      models: admin.firestore.FieldValue.arrayUnion(aiModel),
      providers: admin.firestore.FieldValue.arrayUnion(modelProvider || 'unknown')
    }, { merge: true });

    res.status(201).json({
      success: true,
      logId,
      outputHash,
      timestamp,
      message: 'AI simulation output logged successfully'
    });
  } catch (error) {
    console.error('Logging failed:', error);
    res.status(500).json({ error: error.message });
  }
}

async function handleGetLogs(req, res) {
  const { issueId, rodNumber, model, limit = 50 } = req.query;

  try {
    let query = db.collection(COLLECTION);

    if (issueId) query = query.where('issueId', '==', issueId);
    if (rodNumber) query = query.where('rodNumber', '==', rodNumber);
    if (model) query = query.where('aiModel', '==', model);

    const snapshot = await query
      .orderBy('timestamp', 'desc')
      .limit(parseInt(limit) || 50)
      .get();

    const logs = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Calculate statistics
    const stats = {
      totalLogs: logs.length,
      models: [...new Set(logs.map(l => l.aiModel))],
      providers: [...new Set(logs.map(l => l.modelProvider))],
      totalTokens: logs.reduce((sum, log) => sum + (log.tokenMetrics?.totalTokens || 0), 0),
      estimatedTotalCost: logs.reduce((sum, log) => sum + (log.costEstimate?.estimatedCost || 0), 0)
    };

    res.status(200).json({
      success: true,
      count: logs.length,
      statistics: stats,
      logs
    });
  } catch (error) {
    console.error('Retrieval failed:', error);
    res.status(500).json({ error: error.message });
  }
}

function calculateCost(model, promptTokens = 0, completionTokens = 0) {
  const costs = {
    'gpt-4': { prompt: 0.03, completion: 0.06 },
    'gpt-3.5-turbo': { prompt: 0.0005, completion: 0.0015 },
    'claude-3-opus': { prompt: 0.015, completion: 0.075 },
    'claude-3-sonnet': { prompt: 0.003, completion: 0.015 },
    'claude-3-haiku': { prompt: 0.00025, completion: 0.00125 }
  };

  const modelCosts = costs[model] || { prompt: 0.001, completion: 0.002 };
  return (promptTokens * modelCosts.prompt + completionTokens * modelCosts.completion) / 1000;
}
