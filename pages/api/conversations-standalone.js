// pages/api/conversations-standalone.js
// Standalone Conversations API - Pure file-system based (NO Firebase dependency)
// Stores conversations in JSON files for local data persistence

import fs from 'fs';
import path from 'path';

// Define conversations data directory
const CONVERSATIONS_DIR = path.join(process.cwd(), 'data', 'conversations');

// Ensure conversations directory exists
function ensureDirectoryExists() {
  if (!fs.existsSync(CONVERSATIONS_DIR)) {
    fs.mkdirSync(CONVERSATIONS_DIR, { recursive: true });
  }
}

// Get all conversations from files
function getAllConversations() {
  ensureDirectoryExists();
  const files = fs.readdirSync(CONVERSATIONS_DIR);
  const conversations = [];
  
  for (const file of files) {
    if (file.endsWith('.json')) {
      const filePath = path.join(CONVERSATIONS_DIR, file);
      try {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        conversations.push({
          id: file.replace('.json', ''),
          ...data
        });
      } catch (err) {
        console.error(`Error reading conversation file ${file}:`, err);
      }
    }
  }
  
  return conversations;
}

// Save a conversation to file
function saveConversation(id, data) {
  ensureDirectoryExists();
  const filePath = path.join(CONVERSATIONS_DIR, `${id}.json`);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

export default async function handler(req, res) {
  try {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    
    // GET: Retrieve all conversations
    if (req.method === 'GET') {
      const conversations = getAllConversations();
      return res.status(200).json({ 
        success: true, 
        conversations,
        total: conversations.length 
      });
    }
    
    // POST: Create or update a conversation
    if (req.method === 'POST') {
      const { id, data } = req.body;
      
      if (!id || !data) {
        return res.status(400).json({ 
          error: 'Missing required fields: id and data' 
        });
      }
      
      try {
        saveConversation(id, data);
        return res.status(200).json({ 
          success: true, 
          status: 'saved', 
          id,
          timestamp: new Date().toISOString()
        });
      } catch (err) {
        return res.status(500).json({ 
          error: 'Failed to save conversation',
          message: err.message 
        });
      }
    }
    
    // PUT: Update existing conversation
    if (req.method === 'PUT') {
      const { id, data } = req.body;
      
      if (!id || !data) {
        return res.status(400).json({ 
          error: 'Missing required fields: id and data' 
        });
      }
      
      const filePath = path.join(CONVERSATIONS_DIR, `${id}.json`);
      
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ 
          error: 'Conversation not found' 
        });
      }
      
      try {
        // Merge with existing data
        const existing = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        const merged = { ...existing, ...data };
        saveConversation(id, merged);
        
        return res.status(200).json({ 
          success: true, 
          status: 'updated', 
          id,
          timestamp: new Date().toISOString()
        });
      } catch (err) {
        return res.status(500).json({ 
          error: 'Failed to update conversation',
          message: err.message 
        });
      }
    }
    
    // DELETE: Remove a conversation
    if (req.method === 'DELETE') {
      const { id } = req.body;
      
      if (!id) {
        return res.status(400).json({ 
          error: 'Missing required field: id' 
        });
      }
      
      const filePath = path.join(CONVERSATIONS_DIR, `${id}.json`);
      
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ 
          error: 'Conversation not found' 
        });
      }
      
      try {
        fs.unlinkSync(filePath);
        return res.status(200).json({ 
          success: true, 
          status: 'deleted', 
          id,
          timestamp: new Date().toISOString()
        });
      } catch (err) {
        return res.status(500).json({ 
          error: 'Failed to delete conversation',
          message: err.message 
        });
      }
    }
    
    return res.status(405).json({ error: 'Method Not Allowed' });
    
  } catch (error) {
    console.error('Error in conversations API:', error);
    return res.status(500).json({ 
      error: 'Internal Server Error',
      message: error.message 
    });
  }
}
