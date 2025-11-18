/**
 * Platform Integration Logs API
 * Tracks all platform integration events for Notion, Slack, Discord, etc.
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, query, where, orderBy, getDocs } from 'firebase/firestore';

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

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'POST') {
      return await logPlatformIntegration(req, res);
    } else if (req.method === 'GET') {
      return await getPlatformIntegrationLogs(req, res);
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Platform integration logs error:', error);
    return res.status(500).json({ 
      error: 'Failed to process request',
      message: error.message 
    });
  }
}

async function logPlatformIntegration(req, res) {
  const { platform, issueId, rodNumber, action, status, result } = req.body;

  if (!platform || !issueId || !rodNumber || !action) {
    return res.status(400).json({ 
      error: 'Missing required fields: platform, issueId, rodNumber, action' 
    });
  }

  try {
    const logsCollection = collection(db, 'platform_integration_logs');
    const docRef = await addDoc(logsCollection, {
      platform: platform.toLowerCase(),
      issueId,
      rodNumber,
      action,
      status: status || 'pending',
      result: result || {},
      timestamp: new Date().toISOString(),
      createdAt: new Date()
    });

    return res.status(201).json({
      success: true,
      message: `${platform} integration logged`,
      docId: docRef.id,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error logging integration:', error);
    return res.status(500).json({ 
      error: 'Failed to log integration',
      message: error.message 
    });
  }
}

async function getPlatformIntegrationLogs(req, res) {
  const { platform, issueId, rodNumber, status, limit = '50' } = req.query;
  const pageLimit = parseInt(limit) > 100 ? 100 : parseInt(limit);

  try {
    const logsCollection = collection(db, 'platform_integration_logs');
    let constraints = [];

    if (platform) constraints.push(where('platform', '==', platform.toLowerCase()));
    if (issueId) constraints.push(where('issueId', '==', issueId));
    if (rodNumber) constraints.push(where('rodNumber', '==', rodNumber));
    if (status) constraints.push(where('status', '==', status));

    constraints.push(orderBy('timestamp', 'desc'));

    const q = query(logsCollection, ...constraints);
    const snapshot = await getDocs(q);

    const logs = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })).slice(0, pageLimit);

    return res.status(200).json({
      success: true,
      count: logs.length,
      logs,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error retrieving logs:', error);
    return res.status(500).json({ 
      error: 'Failed to retrieve logs',
      message: error.message 
    });
  }
}
