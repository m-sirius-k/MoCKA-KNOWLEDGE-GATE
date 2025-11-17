import { db } from '@/firebase';
import { collection, addDoc, query, where, getDocs, Timestamp } from 'firebase/firestore';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { userId, action, status, ip, userAgent, metadata } = req.body;

      // Validate required fields
      if (!userId || !action || !status) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Create audit log entry
      const auditLog = {
        userId,
        action,
        status,
        ip: ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress,
        userAgent: userAgent || req.headers['user-agent'],
        metadata: metadata || {},
        timestamp: Timestamp.now(),
        createdAt: new Date().toISOString(),
      };

      // Add to Firestore
      const auditLogsRef = collection(db, 'audit_logs');
      const docRef = await addDoc(auditLogsRef, auditLog);

      res.status(201).json({ 
        success: true, 
        id: docRef.id,
        message: 'Audit log entry created' 
      });
    } catch (error) {
      console.error('Audit log error:', error);
      res.status(500).json({ error: 'Failed to create audit log' });
    }
  } else if (req.method === 'GET') {
    try {
      const { userId, action, limit = 100 } = req.query;

      let queryRef = collection(db, 'audit_logs');
      let constraints = [];

      if (userId) constraints.push(where('userId', '==', userId));
      if (action) constraints.push(where('action', '==', action));

      const q = query(queryRef, ...constraints);
      const querySnapshot = await getDocs(q);

      const logs = [];
      querySnapshot.forEach((doc) => {
        logs.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      // Sort by timestamp descending and apply limit
      const sortedLogs = logs
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, parseInt(limit));

      res.status(200).json({ 
        success: true, 
        count: sortedLogs.length,
        logs: sortedLogs 
      });
    } catch (error) {
      console.error('Audit log retrieval error:', error);
      res.status(500).json({ error: 'Failed to retrieve audit logs' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
