// pages/api/send-email-standalone.js
// Standalone Email API - Pure file-based logging (NO Firebase dependency)
// Uses nodemailer for sending emails and stores logs in JSON files

import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';

// Define email logs directory
const EMAIL_LOGS_DIR = path.join(process.cwd(), 'data', 'email-logs');

// Ensure email logs directory exists
function ensureDirectoryExists(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Initialize email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Log email to file
function logEmailToFile(emailData) {
  ensureDirectoryExists(EMAIL_LOGS_DIR);
  const timestamp = new Date().toISOString();
  const filename = `${timestamp.replace(/[:.]/g, '-')}-${Math.random().toString(36).substr(2, 9)}.json`;
  const filePath = path.join(EMAIL_LOGS_DIR, filename);
  
  const logEntry = {
    ...emailData,
    timestamp,
    id: filename.replace('.json', '')
  };
  
  fs.writeFileSync(filePath, JSON.stringify(logEntry, null, 2));
  return logEntry;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { to, subject, htmlContent, type, data } = req.body;
    
    if (!to || !subject || !htmlContent) {
      return res.status(400).json({ error: 'Missing required fields: to, subject, htmlContent' });
    }
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject,
      html: htmlContent,
    };
    
    // Attempt to send email
    let emailSent = false;
    let sendError = null;
    
    try {
      await transporter.sendMail(mailOptions);
      emailSent = true;
    } catch (err) {
      console.error('Email send error:', err);
      sendError = err.message;
    }
    
    // Log email to file (regardless of send status)
    const logEntry = logEmailToFile({
      to,
      subject,
      type: type || 'general',
      status: emailSent ? 'sent' : 'failed',
      error: sendError,
      data: data || {},
    });
    
    if (!emailSent) {
      return res.status(500).json({
        success: false,
        error: 'Failed to send email',
        message: sendError,
        logId: logEntry.id
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Email sent successfully',
      logId: logEntry.id,
      timestamp: logEntry.timestamp
    });
    
  } catch (error) {
    console.error('Email API error:', error);
    return res.status(500).json({
      error: 'Failed to process email request',
      message: error.message
    });
  }
}
