// pages/api/revision-log.js
// AI共有宣言の改訂ログ管理

import admin from "firebase-admin";
import { v4 as uuidv4 } from "uuid";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY,
    }),
  });
}

const db = admin.firestore();

// 日付取得 (ISO8601)
function getFormattedDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default async function handler(req, res) {
  try {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    
    if (req.method === "OPTIONS") {
      return res.status(200).end();
    }

    if (req.method === "GET") {
      const { startDate, endDate, aiName } = req.query;
      
      let query = db.collection("revision-logs");
      
      if (aiName) {
        query = query.where("aiName", "==", aiName);
      }
      
      const snapshot = await query
        .orderBy("timestamp", "desc")
        .limit(100)
        .get();
      
      const logs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      
      return res.status(200).json({ logs, count: logs.length });
    }

    if (req.method === "POST") {
      const { action, aiName, fileName, summary, details } = req.body;
      
      if (!action) {
        return res.status(400).json({
          error: "Missing required field: action",
        });
      }

      const logId = uuidv4();
      const logData = {
        id: logId,
        action: action,
        date: getFormattedDate(),
        aiName: aiName || "system",
        fileName: fileName || null,
        summary: summary || null,
        details: details || null,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      };

      await db.collection("revision-logs").doc(logId).set(logData);

      return res.status(201).json({
        status: "success",
        logId: logId,
        data: logData,
      });
    }

    return res.status(405).json({ error: "Method Not Allowed" });
  } catch (error) {
    console.error("Revision log error:", error);
    return res.status(500).json({ error: error.message });
  }
}
