import admin from 'firebase-admin';
import fetch from 'node-fetch';

const db = admin.firestore();
const MEM_API_URL = process.env.MEM_API_URL || 'https://api.mem.ai/v1';
const MEM_API_KEY = process.env.MEM_API_KEY;

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    if (req.method === 'POST') {
      return await handleExport(req, res);
    } else {
      return await handleGetHistory(req, res);
    }
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: error.message });
  }
}

async function handleExport(req, res) {
  const { issueId, rodNumber, content, title, notebookId } = req.body;

  if (!issueId || !rodNumber || !content) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const noteResponse = await fetch(`${MEM_API_URL}/notebooks/${notebookId}/notes`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MEM_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: title || `ISSUE-${issueId}-ROD-${rodNumber}`,
        content,
        metadata: {
          issueId,
          rodNumber,
          exportedAt: new Date().toISOString(),
          source: 'MoCKA-KNOWLEDGE-GATE'
        }
      })
    });

    if (!noteResponse.ok) {
      throw new Error(`Mem.ai API error: ${noteResponse.statusText}`);
    }

    const note = await noteResponse.json();
    const timestamp = new Date().toISOString();
    const docId = `${issueId}-${rodNumber}-export`;

    await db.collection('mem_export_history').doc(docId).set({
      issueId,
      rodNumber,
      noteId: note.id,
      notebookId,
      title: note.title,
      contentLength: content.length,
      exportedAt: timestamp,
      status: 'exported',
      platform: 'mem.ai'
    }, { merge: true });

    res.status(200).json({
      success: true,
      noteId: note.id,
      timestamp,
      message: 'Content exported to Mem.ai'
    });
  } catch (error) {
    console.error('Export to Mem.ai failed:', error);
    res.status(500).json({ error: error.message });
  }
}

async function handleGetHistory(req, res) {
  const { issueId, rodNumber } = req.query;

  try {
    let query = db.collection('mem_export_history');
    
    if (issueId) query = query.where('issueId', '==', issueId);
    if (rodNumber) query = query.where('rodNumber', '==', rodNumber);
    
    const snapshot = await query.orderBy('exportedAt', 'desc').limit(50).get();
    const history = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.status(200).json({
      success: true,
      count: history.length,
      history
    });
  } catch (error) {
    console.error('History retrieval error:', error);
    res.status(500).json({ error: error.message });
  }
}
