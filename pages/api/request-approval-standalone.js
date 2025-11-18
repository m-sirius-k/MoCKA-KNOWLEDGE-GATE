// pages/api/request-approval-standalone.js
// Standalone Request Approval API - Pure file-system based (NO Firebase dependency)
// Stores approval requests in JSON files for local data persistence

import fs from 'fs';
import path from 'path';

// Define approval requests directory
const REQUESTS_DIR = path.join(process.cwd(), 'data', 'access-requests');

// Ensure directory exists
function ensureDirectoryExists(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Generate invite code
function generateInviteCode() {
  return 'INVITE-' + Math.random().toString(36).substr(2, 9).toUpperCase();
}

// Save request to file
function saveRequest(id, data) {
  ensureDirectoryExists(REQUESTS_DIR);
  const filePath = path.join(REQUESTS_DIR, `${id}.json`);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// Get request from file
function getRequest(id) {
  const filePath = path.join(REQUESTS_DIR, `${id}.json`);
  if (!fs.existsSync(filePath)) return null;
  
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch (err) {
    console.error(`Error reading request ${id}:`, err);
    return null;
  }
}

// Get all requests
function getAllRequests(status = null) {
  ensureDirectoryExists(REQUESTS_DIR);
  const files = fs.readdirSync(REQUESTS_DIR);
  const requests = [];
  
  for (const file of files) {
    if (file.endsWith('.json')) {
      const filePath = path.join(REQUESTS_DIR, file);
      try {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        if (!status || data.status === status) {
          requests.push({ id: file.replace('.json', ''), ...data });
        }
      } catch (err) {
        console.error(`Error reading file ${file}:`, err);
      }
    }
  }
  
  return requests.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  try {
    // POST: Create approval request
    if (req.method === 'POST') {
      const { email, name, requestReason } = req.body;
      
      if (!email || !name) {
        return res.status(400).json({ error: 'Email and name are required' });
      }
      
      const requestId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const request = {
        email,
        name,
        requestReason: requestReason || 'Not specified',
        status: 'pending',
        createdAt: new Date().toISOString(),
        approvedBy: null,
        approvedAt: null,
        inviteCode: null,
      };
      
      saveRequest(requestId, request);
      
      // TODO: Send admin notification email
      
      return res.status(201).json({
        success: true,
        requestId,
        message: 'Access request submitted',
      });
    }
    
    // PUT: Update approval request
    if (req.method === 'PUT') {
      const { requestId, action, inviteCode, adminId } = req.body;
      
      if (!requestId || !action) {
        return res.status(400).json({ error: 'requestId and action are required' });
      }
      
      const request = getRequest(requestId);
      if (!request) {
        return res.status(404).json({ error: 'Request not found' });
      }
      
      const updateData = {
        ...request,
        status: action,
        approvedBy: adminId,
        approvedAt: new Date().toISOString(),
      };
      
      if (action === 'approved' && inviteCode) {
        updateData.inviteCode = inviteCode || generateInviteCode();
      }
      
      saveRequest(requestId, updateData);
      
      // TODO: Send approval/rejection email to user
      
      return res.status(200).json({
        success: true,
        message: `Request ${action}ed successfully`,
      });
    }
    
    // GET: Retrieve approval requests
    if (req.method === 'GET') {
      const { status } = req.query;
      const requests = getAllRequests(status);
      
      return res.status(200).json({
        success: true,
        count: requests.length,
        requests,
      });
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
    
  } catch (error) {
    console.error('Request approval error:', error);
    return res.status(500).json({
      error: 'Failed to process request',
      message: error.message,
    });
  }
}
