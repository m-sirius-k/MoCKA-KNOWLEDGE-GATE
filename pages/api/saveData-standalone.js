// pages/api/saveData-standalone.js
// Standalone Data Save API - Pure file-system based (NO Firebase dependency)
// Stores data in JSON files for local data persistence

import fs from 'fs';
import path from 'path';

// Define data storage directory
const DATA_DIR = path.join(process.cwd(), 'data');

// Ensure data directory exists
function ensureDirectoryExists(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Save data to file
function saveDataToFile(collectionName, id, data) {
  const collectionDir = path.join(DATA_DIR, collectionName);
  ensureDirectoryExists(collectionDir);
  
  const filePath = path.join(collectionDir, `${id}.json`);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  
  return { id, path: filePath, timestamp: new Date().toISOString() };
}

// Get data from file
function getDataFromFile(collectionName, id) {
  const filePath = path.join(DATA_DIR, collectionName, `${id}.json`);
  
  if (!fs.existsSync(filePath)) {
    return null;
  }
  
  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    return { id, ...data };
  } catch (err) {
    console.error(`Error reading file ${filePath}:`, err);
    return null;
  }
}

// Get all data from collection
function getAllDataFromCollection(collectionName) {
  const collectionDir = path.join(DATA_DIR, collectionName);
  
  if (!fs.existsSync(collectionDir)) {
    return [];
  }
  
  const files = fs.readdirSync(collectionDir);
  const data = [];
  
  for (const file of files) {
    if (file.endsWith('.json')) {
      const filePath = path.join(collectionDir, file);
      try {
        const fileData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        data.push({
          id: file.replace('.json', ''),
          ...fileData
        });
      } catch (err) {
        console.error(`Error reading file ${file}:`, err);
      }
    }
  }
  
  return data;
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
    
    // POST: Save data
    if (req.method === 'POST') {
      const { collectionName, id, data } = req.body;
      
      if (!collectionName || !id || !data) {
        return res.status(400).json({
          error: 'Missing required fields: collectionName, id, and data'
        });
      }
      
      try {
        const result = saveDataToFile(collectionName, id, data);
        return res.status(200).json({
          success: true,
          status: 'saved',
          ...result
        });
      } catch (err) {
        return res.status(500).json({
          error: 'Failed to save data',
          message: err.message
        });
      }
    }
    
    // GET: Retrieve data
    if (req.method === 'GET') {
      const { collectionName, id } = req.query;
      
      if (!collectionName) {
        return res.status(400).json({
          error: 'Missing required query parameter: collectionName'
        });
      }
      
      try {
        let resultData;
        
        if (id) {
          // Get single document
          resultData = getDataFromFile(collectionName, id);
          if (!resultData) {
            return res.status(404).json({
              error: 'Data not found'
            });
          }
        } else {
          // Get all documents in collection
          resultData = getAllDataFromCollection(collectionName);
        }
        
        return res.status(200).json({
          success: true,
          data: resultData,
          timestamp: new Date().toISOString()
        });
      } catch (err) {
        return res.status(500).json({
          error: 'Failed to retrieve data',
          message: err.message
        });
      }
    }
    
    // PUT: Update data
    if (req.method === 'PUT') {
      const { collectionName, id, data } = req.body;
      
      if (!collectionName || !id || !data) {
        return res.status(400).json({
          error: 'Missing required fields: collectionName, id, and data'
        });
      }
      
      const filePath = path.join(DATA_DIR, collectionName, `${id}.json`);
      
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({
          error: 'Data not found'
        });
      }
      
      try {
        // Merge with existing data
        const existing = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        const merged = { ...existing, ...data };
        const result = saveDataToFile(collectionName, id, merged);
        
        return res.status(200).json({
          success: true,
          status: 'updated',
          ...result
        });
      } catch (err) {
        return res.status(500).json({
          error: 'Failed to update data',
          message: err.message
        });
      }
    }
    
    // DELETE: Remove data
    if (req.method === 'DELETE') {
      const { collectionName, id } = req.body;
      
      if (!collectionName || !id) {
        return res.status(400).json({
          error: 'Missing required fields: collectionName and id'
        });
      }
      
      const filePath = path.join(DATA_DIR, collectionName, `${id}.json`);
      
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({
          error: 'Data not found'
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
          error: 'Failed to delete data',
          message: err.message
        });
      }
    }
    
    return res.status(405).json({ error: 'Method Not Allowed' });
    
  } catch (error) {
    console.error('Error in saveData API:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    });
  }
}
