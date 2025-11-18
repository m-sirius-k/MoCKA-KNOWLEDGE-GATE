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

module.exports = {
  saveSimulationResult,
  getSimulationResults,
  validateIssueId,
  validateRodNumber,
  createMetadata
};
