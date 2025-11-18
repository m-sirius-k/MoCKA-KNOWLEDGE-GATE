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
      return await handleImport(req, res);
    } else {
      return await handleGetImportHistory(req, res);
    }
  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({ error: error.message });
  }
}

async function handleImport(req, res) {
  const { notebookId, noteId, issueId, rodNumber } = req.body;

  if (!notebookId || !noteId) {
    return res.status(400).json({ error: 'notebookId and noteId required' });
  }

  try {
    const noteResponse = await fetch(
      `${MEM_API_URL}/notebooks/${notebookId}/notes/${noteId}`,
      {
        headers: {
          'Authorization': `Bearer ${MEM_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!noteResponse.ok) {
      throw new Error(`Mem.ai API error: ${noteResponse.statusText}`);
    }

    const note = await noteResponse.json();
    const timestamp = new Date().toISOString();
    const docId = `${issueId || 'unknown'}-${rodNumber || 'unknown'}-import`;

    await db.collection('mem_import_history').doc(docId).set({
      issueId: issueId || null,
      rodNumber: rodNumber || null,
      noteId,
      notebookId,
      title: note.title,
      content: note.content,
      importedAt: timestamp,
      status: 'imported',
      contentLength: note.content ? note.content.length : 0,
      platform: 'mem.ai',
      metadata: note.metadata
    }, { merge: true });

    await db.collection('ai-simulation').add({
      type: 'mem_insight',
      issueId: issueId || null,
      rodNumber: rodNumber || null,
      title: note.title,
      content: note.content,
      source: 'mem.ai',
      importedAt: timestamp,
      noteId,
      notebookId
    });

    res.status(200).json({
      success: true,
      note: {
        id: note.id,
        title: note.title,
        contentLength: note.content ? note.content.length : 0
      },
      timestamp,
      message: 'Note imported from Mem.ai'
    });
  } catch (error) {
    console.error('Import from Mem.ai failed:', error);
    res.status(500).json({ error: error.message });
  }
}

async function handleGetImportHistory(req, res) {
  const { issueId, rodNumber, limit = 50 } = req.query;

  try {
    let query = db.collection('mem_import_history');
    
    if (issueId) query = query.where('issueId', '==', issueId);
    if (rodNumber) query = query.where('rodNumber', '==', rodNumber);
    
    const snapshot = await query
      .orderBy('importedAt', 'desc')
      .limit(parseInt(limit) || 50)
      .get();
    
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
