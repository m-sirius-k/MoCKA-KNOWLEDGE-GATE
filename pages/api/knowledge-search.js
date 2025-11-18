/**
 * Standalone Knowledge Search API
 * No external dependencies - pure file-system based search
 * Searches through docs/AI-SIMULATION and knowledge base
 */

import fs from 'fs';
import path from 'path';

/**
 * Search knowledge base by query
 * GET /api/knowledge-search?q=<query>&type=<type>
 * Returns: Array of matching documents
 */
export default function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { q: query, type = 'all', limit = 10 } = req.query;

    if (!query) {
      return res.status(400).json({ 
        error: 'Query parameter "q" is required',
        example: '/api/knowledge-search?q=ISSUE-001&type=simulation'
      });
    }

    // Search in docs directory
    const docsPath = path.join(process.cwd(), 'docs');
    const results = searchKnowledge(docsPath, query, type, parseInt(limit));

    res.status(200).json({
      success: true,
      query,
      type,
      total: results.length,
      results,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ 
      error: 'Search failed',
      message: error.message 
    });
  }
}

/**
 * Recursive search through knowledge base
 */
function searchKnowledge(dir, query, type, limit) {
  const results = [];
  const queryLower = query.toLowerCase();

  function walkDir(currentPath) {
    if (results.length >= limit) return;

    try {
      const files = fs.readdirSync(currentPath);

      for (const file of files) {
        if (results.length >= limit) break;

        const fullPath = path.join(currentPath, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          walkDir(fullPath);
        } else if (stat.isFile() && file.endsWith('.json')) {
          try {
            const content = fs.readFileSync(fullPath, 'utf-8');
            const data = JSON.parse(content);
            const fileName = file.toLowerCase();
            const filePath = fullPath.replace(process.cwd(), '');

            // Search in metadata and content
            const matches = checkMatches(data, query, queryLower, type);

            if (matches) {
              results.push({
                file: fileName,
                path: filePath,
                matched: matches,
                data: limitObjectSize(data, 500)
              });
            }
          } catch (e) {
            // Skip invalid JSON files
          }
        }
      }
    } catch (e) {
      // Skip directories we can't read
    }
  }

  walkDir(dir);
  return results;
}

/**
 * Check if data matches search criteria
 */
function checkMatches(data, query, queryLower, type) {
  const stringified = JSON.stringify(data).toLowerCase();
  
  if (stringified.includes(queryLower)) {
    // Extract matching context
    const index = stringified.indexOf(queryLower);
    const start = Math.max(0, index - 50);
    const end = Math.min(stringified.length, index + query.length + 50);
    return stringified.substring(start, end);
  }
  
  return null;
}

/**
 * Limit object size for response
 */
function limitObjectSize(obj, maxSize) {
  const str = JSON.stringify(obj);
  if (str.length > maxSize) {
    return JSON.parse(str.substring(0, maxSize) + '...');
  }
  return obj;
}
