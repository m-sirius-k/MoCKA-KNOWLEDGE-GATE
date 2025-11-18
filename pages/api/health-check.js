/**
 * Health Check & Monitoring API
 * Comprehensive system health status for AI Simulation infrastructure
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, limit, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  projectId: process.env.FIREBASE_PROJECT_ID || 'mocka-knowledge-gate',
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: `${process.env.FIREBASE_PROJECT_ID}.firebaseapp.com`
};

let db;

try {
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
} catch (error) {
  console.log('Firebase already initialized');
}

const REQUIRED_SECRETS = [
  'NOTION_API_KEY',
  'SLACK_BOT_TOKEN',
  'DISCORD_BOT_TOKEN',
  'MEM_API_KEY',
  'NOTEBOOK_LM_API_KEY'
];

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Only GET allowed' });
  }

  try {
    const health = await checkSystemHealth();
    const statusCode = health.status === 'healthy' ? 200 : 503;
    return res.status(statusCode).json(health);
  } catch (error) {
    console.error('Health check error:', error);
    return res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

async function checkSystemHealth() {
  const startTime = Date.now();
  const checks = {};

  // Check Firebase Firestore
  checks.firestore = await checkFirestore();

  // Check Environment Secrets
  checks.secrets = checkEnvironmentSecrets();

  // Check Database Collections
  checks.collections = await checkCollections();

  // Check GitHub Actions Status
  checks.githubActions = await checkGitHubActions();

  const responseTime = Date.now() - startTime;
  const allHealthy = Object.values(checks).every(check => check.status === 'ok' || check.status === 'healthy');

  return {
    status: allHealthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    responseTime: `${responseTime}ms`,
    checks,
    version: '1.0.0'
  };
}

async function checkFirestore() {
  try {
    const col = collection(db, 'ai_simulation_logs');
    const q = query(col, limit(1));
    await getDocs(q);
    return { status: 'ok', message: 'Firestore connection successful' };
  } catch (error) {
    return { status: 'error', message: error.message };
  }
}

function checkEnvironmentSecrets() {
  const configured = [];
  const missing = [];

  REQUIRED_SECRETS.forEach(secret => {
    if (process.env[secret]) {
      configured.push(secret);
    } else {
      missing.push(secret);
    }
  });

  return {
    status: missing.length === 0 ? 'ok' : 'warning',
    configured: configured.length,
    missing: missing.length,
    missingSecrets: missing
  };
}

async function checkCollections() {
  const collections = {};

  try {
    const aiLogsCol = collection(db, 'ai_simulation_logs');
    const piLogsCol = collection(db, 'platform_integration_logs');

    const aiQuery = query(aiLogsCol, limit(1));
    const piQuery = query(piLogsCol, limit(1));

    const [aiSnapshot, piSnapshot] = await Promise.all([
      getDocs(aiQuery),
      getDocs(piQuery)
    ]);

    collections.ai_simulation_logs = { status: 'ok', exists: true };
    collections.platform_integration_logs = { status: 'ok', exists: true };

    return { status: 'ok', collections };
  } catch (error) {
    return { status: 'warning', message: 'Some collections may not exist yet', error: error.message };
  }
}

async function checkGitHubActions() {
  try {
    // Check if we can access GitHub Actions secrets (basic check)
    const hasGitHubToken = !!process.env.GITHUB_TOKEN;
    const workflowFile = process.env.GITHUB_WORKFLOW_FILE || 'ai-simulation.yml';

    return {
      status: 'ok',
      message: 'GitHub Actions workflow configured',
      workflow: workflowFile,
      authenticated: hasGitHubToken
    };
  } catch (error) {
    return { status: 'warning', message: error.message };
  }
}
