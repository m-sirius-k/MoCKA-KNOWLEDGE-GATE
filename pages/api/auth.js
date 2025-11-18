// pages/api/auth-standalone.js
// Standalone Authentication API - JWT based (NO Firebase dependency)
// Simple JWT token generation and validation for API access

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const USERS_DIR = path.join(process.cwd(), 'data', 'users');
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Ensure users directory exists
function ensureDirectoryExists() {
  if (!fs.existsSync(USERS_DIR)) {
    fs.mkdirSync(USERS_DIR, { recursive: true });
  }
}

// Simple JWT generation
function generateJWT(userId) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
  const payload = Buffer.from(JSON.stringify({
    userId,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
  })).toString('base64');
  
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${header}.${payload}`)
    .digest('base64');
  
  return `${header}.${payload}.${signature}`;
}

// Verify JWT token
function verifyJWT(token) {
  try {
    const [header, payload, signature] = token.split('.');
    const expectedSignature = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`${header}.${payload}`)
      .digest('base64');
    
    if (signature !== expectedSignature) return null;
    
    const decoded = JSON.parse(Buffer.from(payload, 'base64').toString());
    if (decoded.exp < Math.floor(Date.now() / 1000)) return null;
    
    return decoded;
  } catch (err) {
    return null;
  }
}

// Hash password (simple implementation - use bcrypt in production)
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Get or create user file
function getUserPath(email) {
  return path.join(USERS_DIR, `${email.replace(/@/g, '_').replace(/\./g, '_')}.json`);
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
    
    ensureDirectoryExists();
    
    // POST: Login or Register
    if (req.method === 'POST') {
      const { action, email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
      }
      
      const userPath = getUserPath(email);
      const hashedPassword = hashPassword(password);
      
      // REGISTER
      if (action === 'register') {
        if (fs.existsSync(userPath)) {
          return res.status(409).json({ error: 'User already exists' });
        }
        
        const userData = {
          id: crypto.randomUUID(),
          email,
          passwordHash: hashedPassword,
          createdAt: new Date().toISOString(),
          role: 'user'
        };
        
        fs.writeFileSync(userPath, JSON.stringify(userData, null, 2));
        const token = generateJWT(userData.id);
        
        return res.status(201).json({
          success: true,
          message: 'User registered successfully',
          token,
          user: { id: userData.id, email: userData.email, role: userData.role }
        });
      }
      
      // LOGIN
      if (action === 'login') {
        if (!fs.existsSync(userPath)) {
          return res.status(401).json({ error: 'Invalid email or password' });
        }
        
        const userData = JSON.parse(fs.readFileSync(userPath, 'utf-8'));
        if (userData.passwordHash !== hashedPassword) {
          return res.status(401).json({ error: 'Invalid email or password' });
        }
        
        const token = generateJWT(userData.id);
        return res.status(200).json({
          success: true,
          token,
          user: { id: userData.id, email: userData.email, role: userData.role }
        });
      }
      
      return res.status(400).json({ error: 'Invalid action' });
    }
    
    // GET: Verify token
    if (req.method === 'GET') {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Missing or invalid authorization header' });
      }
      
      const token = authHeader.substring(7);
      const decoded = verifyJWT(token);
      
      if (!decoded) {
        return res.status(401).json({ error: 'Invalid or expired token' });
      }
      
      return res.status(200).json({
        success: true,
        user: decoded
      });
    }
    
    return res.status(405).json({ error: 'Method Not Allowed' });
    
  } catch (error) {
    console.error('Error in auth API:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    });
  }
}
