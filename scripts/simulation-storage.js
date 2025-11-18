/**
 * AI Simulation Results Storage Module
 * Handles storing Claude and OpenAI simulation results with ISSUE-ID and rod-number
 */

const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

/**
 * Validate ISSUE-ID format (ISSUE-XXX)
 */
function validateIssueId(issueId) {
  const issuePattern = /^ISSUE-\d{3,}$/;
  return issuePattern.test(issueId);
}

/**
 * Validate rod-number format (ROD-XXX)
 */
function validateRodNumber(rodNumber) {
  const rodPattern = /^ROD-\d{3,}$/;
  return rodPattern.test(rodNumber);
}

/**
 * Generate timestamp in YYYY-MM-DD_HH-mm-ss format
 */
function getFormattedTimestamp() {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const day = String(now.getUTCDate()).padStart(2, '0');
  const hours = String(now.getUTCHours()).padStart(2, '0');
  const minutes = String(now.getUTCMinutes()).padStart(2, '0');
  const seconds = String(now.getUTCSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
}

/**
 * Create metadata object
 */
function createMetadata({
  issueId,
  rodNumber,
  modelProvider,
  modelName,
  parameters = {},
  confidenceScore = null,
  error = null
}) {
  return {
    metadata_version: '1.0',
    issue_id: issueId,
    rod_number: rodNumber,
    model_provider: modelProvider,
    model_name: modelName,
    simulation_id: uuidv4(),
    timestamp: new Date().toISOString(),
    simulation_version: 'v1.0',
    execution_time_ms: 0,
    parameters,
    result_status: error ? 'failed' : 'completed',
    confidence_score: confidenceScore,
    error
  };
}

/**
 * Save simulation result to file system
 */
async function saveSimulationResult({
  issueId,
  rodNumber,
  modelProvider,
  modelName,
  input,
  output,
  parameters = {},
  confidenceScore = null,
  error = null
}) {
  // Validate inputs
  if (!validateIssueId(issueId)) {
    throw new Error(`Invalid ISSUE-ID format: ${issueId}`);
  }
  if (!validateRodNumber(rodNumber)) {
    throw new Error(`Invalid rod-number format: ${rodNumber}`);
  }
  if (!['claude', 'openai'].includes(modelProvider)) {
    throw new Error(`Invalid model provider: ${modelProvider}`);
  }

  // Create directory structure
  const baseDir = path.join('docs', 'AI-SIMULATION', modelProvider, issueId, rodNumber);
  await fs.mkdir(baseDir, { recursive: true });

  // Create metadata
  const metadata = createMetadata({
    issueId,
    rodNumber,
    modelProvider,
    modelName,
    parameters,
    confidenceScore,
    error
  });

  // Create simulation result
  const timestamp = getFormattedTimestamp();
  const simulationData = {
    metadata,
    input,
    output,
    results: {
      analysis: {},
      metrics: {},
      tags: []
    }
  };

  // Save files
  const simulationFile = path.join(baseDir, `simulation_${timestamp}.json`);
  const metadataFile = path.join(baseDir, 'metadata.json');

  await fs.writeFile(simulationFile, JSON.stringify(simulationData, null, 2));
  await fs.writeFile(metadataFile, JSON.stringify(metadata, null, 2));

  // Update index
  await updateIndex(issueId, rodNumber, modelProvider, metadata, timestamp);

  console.log(`Simulation saved: ${simulationFile}`);
  return {
    simulationId: metadata.simulation_id,
    simulationFile,
    metadataFile
  };
}

/**
 * Update index files
 */
async function updateIndex(issueId, rodNumber, modelProvider, metadata, timestamp) {
  const issueDir = path.join('docs', 'AI-SIMULATION', modelProvider, issueId);
  const indexFile = path.join(issueDir, 'index.json');

  let indexData = { simulations: [] };
  try {
    const content = await fs.readFile(indexFile, 'utf-8');
    indexData = JSON.parse(content);
  } catch (err) {
    // File doesn't exist yet
  }

  // Add new entry
  indexData.simulations.push({
    simulation_id: metadata.simulation_id,
    rod_number: rodNumber,
    timestamp: metadata.timestamp,
    model: metadata.model_name,
    file: `${rodNumber}/simulation_${timestamp}.json`,
    result_status: metadata.result_status
  });

  indexData.last_updated = new Date().toISOString();
  indexData.total_simulations = indexData.simulations.length;

  await fs.writeFile(indexFile, JSON.stringify(indexData, null, 2));
}

/**
 * Retrieve simulation results by ISSUE-ID and rod-number
 */
async function getSimulationResults(issueId, rodNumber, modelProvider) {
  if (!validateIssueId(issueId)) {
    throw new Error(`Invalid ISSUE-ID format: ${issueId}`);
  }
  if (!validateRodNumber(rodNumber)) {
    throw new Error(`Invalid rod-number format: ${rodNumber}`);
  }

  const rodDir = path.join('docs', 'AI-SIMULATION', modelProvider, issueId, rodNumber);
  const files = await fs.readdir(rodDir);
  const simulations = [];

  for (const file of files) {
    if (file.startsWith('simulation_') && file.endsWith('.json')) {
      const content = await fs.readFile(path.join(rodDir, file), 'utf-8');
      simulations.push(JSON.parse(content));
    }
  }

  return simulations;
}


                           /**
 * PHASE 2: Enhanced Storage Backend
 * - Firestore integration for distributed storage
 * - Redis cache layer for performance optimization
 * - Multi-region replication support (AI-SHARE-005, 006)
 */

// Firestore adapter class
class FirestoreAdapter {
  constructor(config = {}) {
    this.projectId = config.projectId || process.env.GCP_PROJECT_ID;
    this.firestoreEnabled = config.enabled !== false;
    this.db = null;
    this.collection = 'ai_simulations';
    this.initializeFirestore();
  }

  initializeFirestore() {
    if (!this.firestoreEnabled) return;
    try {
      const admin = require('firebase-admin');
      if (!admin.apps.length) {
        admin.initializeApp();
      }
      this.db = admin.firestore();
      console.log('[Firestore] Initialized successfully');
    } catch (error) {
      console.warn('[Firestore] Initialization skipped:', error.message);
      this.firestoreEnabled = false;
    }
  }

  async saveToFirestore(issueId, rodNumber, simulationData) {
    if (!this.firestoreEnabled || !this.db) return null;
    try {
      const docRef = this.db.collection(this.collection).doc(`${issueId}_${rodNumber}`);
      const docData = {
        issue_id: issueId,
        rod_number: rodNumber,
        simulation_id: simulationData.metadata.simulation_id,
        timestamp: new Date(),
        data: simulationData,
        replicated_regions: [],
        created_at: simulationData.metadata.timestamp
      };
      await docRef.set(docData, { merge: true });
      console.log(`[Firestore] Saved: ${issueId}/${rodNumber}`);
      return docData;
    } catch (error) {
      console.error('[Firestore] Save failed:', error);
      return null;
    }
  }
}

// Redis cache adapter class
class RedisCache {
  constructor(config = {}) {
    this.cacheEnabled = config.enabled !== false;
    this.ttl = config.ttl || 3600;
    this.redis = null;
    this.initializeRedis();
  }

  initializeRedis() {
    if (!this.cacheEnabled) return;
    try {
      const redis = require('redis');
      this.redis = redis.createClient({
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD
      });
      this.redis.on('error', (err) => console.warn('[Redis] Error:', err));
      console.log('[Redis] Cache initialized');
    } catch (error) {
      console.warn('[Redis] Initialization skipped:', error.message);
      this.cacheEnabled = false;
    }
  }

  async getCached(key) {
    if (!this.cacheEnabled || !this.redis) return null;
    try {
      const cached = await this.redis.getAsync(key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.warn('[Redis] Get failed:', error);
      return null;
    }
  }

  async setCached(key, value, ttl = null) {
    if (!this.cacheEnabled || !this.redis) return false;
    try {
      const expiry = ttl || this.ttl;
      await this.redis.setexAsync(key, expiry, JSON.stringify(value));
      return true;
    } catch (error) {
      console.warn('[Redis] Set failed:', error);
      return false;
    }
  }
}

// Multi-region replication manager
class MultiRegionReplication {
  constructor(config = {}) {
    this.regions = config.regions || ['us-east', 'eu-west', 'asia-southeast'];
    this.replicationEnabled = config.enabled !== false;
    this.replicationLog = [];
  }

  async replicateToRegions(issueId, rodNumber, simulationData) {
    if (!this.replicationEnabled) return { status: 'skipped' };
    const replicationTask = {
      id: `REPL-${Date.now()}`,
      issue_id: issueId,
      rod_number: rodNumber,
      timestamp: new Date().toISOString(),
      regions: {},
      status: 'initiated'
    };
    for (const region of this.regions) {
      replicationTask.regions[region] = {
        status: 'pending',
        attempted_at: null,
        completed_at: null
      };
    }
    this.replicationLog.push(replicationTask);
    console.log(`[Replication] Task initiated: ${replicationTask.id}`);
    return replicationTask;
  }
}

// Extended module.exports
module.exports = {
  saveSimulationResult,
  getSimulationResults,
  validateIssueId,
  validateRodNumber,
  createMetadata,
  // Phase 2 additions
  FirestoreAdapter,
  RedisCache,
  MultiRegionReplication,
  // Convenience initialization
  initializeStorage: (config = {}) => ({
    firestore: new FirestoreAdapter(config.firestore),
    cache: new RedisCache(config.cache),
    replication: new MultiRegionReplication(config.replication)
  })
};
module.exports = {
  saveSimulationResult,
  getSimulationResults,
  validateIssueId,
  validateRodNumber,
  createMetadata
};
