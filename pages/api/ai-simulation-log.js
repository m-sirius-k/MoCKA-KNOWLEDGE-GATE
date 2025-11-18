// pages/api/ai-simulation-log.js
// AI Simulation Result Logging API - Store Claude/OpenAI outputs with ISSUE-ID & ROD metadata
// Pure file-system based with automatic Git commit integration

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const SIMULATIONS_DIR = path.join(process.cwd(), 'data', 'simulations');
const LOG_DIR = path.join(process.cwd(), 'data', 'ai-logs');

// Ensure directories exist
function ensureDirectoriesExist() {
  [SIMULATIONS_DIR, LOG_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
}

// Generate unique simulation ID with timestamp
function generateSimulationId() {
  return `SIM-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Commit to Git
function commitToGit(filePath, message) {
  try {
    execSync(`git add ${filePath}`, { cwd: process.cwd() });
    execSync(`git commit -m "${message}"`, { cwd: process.cwd() });
    execSync(`git push origin main`, { cwd: process.cwd() });
    return true;
  } catch (err) {
    console.error('Git commit failed:', err.message);
    return false;
  }
}

export default async function handler(req, res) {
  try {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    
    ensureDirectoriesExist();
    
    // POST: Log AI simulation result
    if (req.method === 'POST') {
      const {
        issueId,
        rodNumber,
        aiProvider,
        model,
        prompt,
        response,
        metadata = {},
        autoCommit = true
      } = req.body;
      
      // Validation
      if (!issueId || !rodNumber) {
        return res.status(400).json({ 
          error: 'Missing required fields: issueId, rodNumber' 
        });
      }
      
      if (!aiProvider || !model || !prompt || !response) {
        return res.status(400).json({ 
          error: 'Missing AI simulation data: aiProvider, model, prompt, response' 
        });
      }
      
      try {
        // Create log entry
        const simulationId = generateSimulationId();
        const timestamp = new Date().toISOString();
        
        const logEntry = {
          simulationId,
          issueId,
          rodNumber,
          aiProvider,
          model,
          timestamp,
          input: {
            prompt,
            metadata
          },
          output: {
            response,
            tokenUsage: metadata.tokenUsage || null
          },
          status: 'completed'
        };
        
        // Save to file system
        const filename = `${issueId}_${rodNumber}_${simulationId}.json`;
        const filePath = path.join(SIMULATIONS_DIR, filename);
        fs.writeFileSync(filePath, JSON.stringify(logEntry, null, 2));
        
        // Also save to AI logs directory
        const logPath = path.join(LOG_DIR, `${issueId}.jsonl`);
        const logLine = JSON.stringify(logEntry) + '\n';
        fs.appendFileSync(logPath, logLine);
        
        // Auto-commit if requested
        let commitStatus = null;
        if (autoCommit) {
          const commitMessage = `Log AI simulation: ${issueId}/${rodNumber} (${aiProvider} - ${model})`;
          commitStatus = commitToGit(filePath, commitMessage);
        }
        
        return res.status(201).json({
          success: true,
          simulationId,
          issueId,
          rodNumber,
          message: 'AI simulation logged successfully',
          filePath: filename,
          committed: commitStatus,
          timestamp
        });
      } catch (err) {
        return res.status(500).json({
          error: 'Failed to log simulation',
          message: err.message
        });
      }
    }
    
    // GET: Retrieve AI logs
    if (req.method === 'GET') {
      const { issueId, rodNumber, limit = 50 } = req.query;
      
      try {
        const files = fs.readdirSync(SIMULATIONS_DIR);
        let logs = [];
        
        for (const file of files) {
          if (file.endsWith('.json')) {
            const filePath = path.join(SIMULATIONS_DIR, file);
            const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
            
            // Filter if specified
            if (issueId && data.issueId !== issueId) continue;
            if (rodNumber && data.rodNumber !== rodNumber) continue;
            
            logs.push(data);
          }
        }
        
        // Sort by timestamp descending
        logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        return res.status(200).json({
          success: true,
          total: logs.length,
          logs: logs.slice(0, limit)
        });
      } catch (err) {
        return res.status(500).json({
          error: 'Failed to retrieve logs',
          message: err.message
        });
      }
    }
    
    return res.status(405).json({ error: 'Method Not Allowed' });
    
  } catch (error) {
    console.error('Error in AI simulation log API:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    });
  }
}
