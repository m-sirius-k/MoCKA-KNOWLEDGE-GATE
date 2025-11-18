// pages/api/metadata-index.js
// Standalone Metadata & Index API - Pure file-system based (NO external dependencies)
// Provides metadata about available knowledge base resources and indexing capabilities

import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const CONVERSATIONS_DIR = path.join(DATA_DIR, 'conversations');
const KNOWLEDGE_DIR = path.join(DATA_DIR, 'knowledge');
const SIMULATIONS_DIR = path.join(DATA_DIR, 'simulations');

// Utility function to count files in directory
function countFilesInDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) return 0;
  try {
    const files = fs.readdirSync(dirPath);
    return files.filter(f => f.endsWith('.json')).length;
  } catch {
    return 0;
  }
}

// Get directory size
function getDirectorySize(dirPath) {
  if (!fs.existsSync(dirPath)) return 0;
  try {
    const files = fs.readdirSync(dirPath);
    let totalSize = 0;
    for (const file of files) {
      if (file.endsWith('.json')) {
        const filePath = path.join(dirPath, file);
        const stats = fs.statSync(filePath);
        totalSize += stats.size;
      }
    }
    return totalSize;
  } catch {
    return 0;
  }
}

// Get timestamp of last modification
function getLastModified(dirPath) {
  if (!fs.existsSync(dirPath)) return null;
  try {
    const files = fs.readdirSync(dirPath);
    if (files.length === 0) return null;
    
    let lastModified = null;
    for (const file of files) {
      if (file.endsWith('.json')) {
        const filePath = path.join(dirPath, file);
        const stats = fs.statSync(filePath);
        if (!lastModified || stats.mtime > lastModified) {
          lastModified = stats.mtime;
        }
      }
    }
    return lastModified?.toISOString() || null;
  } catch {
    return null;
  }
}

// List all items in directory with their metadata
function listDirectoryItems(dirPath) {
  if (!fs.existsSync(dirPath)) return [];
  try {
    const files = fs.readdirSync(dirPath);
    const items = [];
    
    for (const file of files) {
      if (file.endsWith('.json')) {
        const filePath = path.join(dirPath, file);
        const stats = fs.statSync(filePath);
        items.push({
          id: file.replace('.json', ''),
          file: file,
          size: stats.size,
          created: stats.birthtime.toISOString(),
          modified: stats.mtime.toISOString()
        });
      }
    }
    return items;
  } catch {
    return [];
  }
}

export default async function handler(req, res) {
  try {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    
    if (req.method === 'GET') {
      const { type } = req.query;
      
      // Global metadata index
      if (!type || type === 'all') {
        const metadata = {
          success: true,
          timestamp: new Date().toISOString(),
          api: {
            name: 'MoCKA Knowledge Gate - Standalone API',
            version: '1.0.0',
            description: 'Decentralized knowledge sharing and information retrieval API'
          },
          resources: {
            conversations: {
              count: countFilesInDirectory(CONVERSATIONS_DIR),
              size: getDirectorySize(CONVERSATIONS_DIR),
              lastModified: getLastModified(CONVERSATIONS_DIR),
              endpoint: '/api/conversations-standalone'
            },
            knowledge: {
              count: countFilesInDirectory(KNOWLEDGE_DIR),
              size: getDirectorySize(KNOWLEDGE_DIR),
              lastModified: getLastModified(KNOWLEDGE_DIR),
              endpoints: [
                '/api/knowledge-search',
                '/api/knowledge-export'
              ]
            },
            simulations: {
              count: countFilesInDirectory(SIMULATIONS_DIR),
              size: getDirectorySize(SIMULATIONS_DIR),
              lastModified: getLastModified(SIMULATIONS_DIR)
            }
          },
          availableEndpoints: [
            { path: '/api/metadata-index', method: 'GET', description: 'Get metadata and index information' },
            { path: '/api/knowledge-search', method: 'GET', description: 'Search knowledge base' },
            { path: '/api/knowledge-export', method: 'GET', description: 'Export knowledge base' },
            { path: '/api/conversations-standalone', method: 'GET|POST|PUT|DELETE', description: 'Manage conversations' }
          ]
        };
        
        return res.status(200).json(metadata);
      }
      
      // Get specific resource type metadata
      if (type === 'conversations') {
        const items = listDirectoryItems(CONVERSATIONS_DIR);
        return res.status(200).json({
          success: true,
          type: 'conversations',
          count: items.length,
          items
        });
      }
      
      if (type === 'knowledge') {
        const items = listDirectoryItems(KNOWLEDGE_DIR);
        return res.status(200).json({
          success: true,
          type: 'knowledge',
          count: items.length,
          items
        });
      }
      
      if (type === 'simulations') {
        const items = listDirectoryItems(SIMULATIONS_DIR);
        return res.status(200).json({
          success: true,
          type: 'simulations',
          count: items.length,
          items
        });
      }
      
      return res.status(400).json({
        error: 'Invalid type parameter. Use: all, conversations, knowledge, or simulations'
      });
    }
    
    return res.status(405).json({ error: 'Method Not Allowed' });
    
  } catch (error) {
    console.error('Error in metadata-index API:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    });
  }
}
