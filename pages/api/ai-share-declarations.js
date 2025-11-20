// pages/api/ai-share-declarations.js
// AI共有宣言の保存・管理API
// 形式: AI名 + 連番 + 日付

import admin from "firebase-admin";
import { v4 as uuidv4 } from "uuid";

// Firebase初期化
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

// AI共有宣言の連番を取得
async function getNextSerialNumber(aiName) {
  try {
    const docRef = db.collection("ai-share-logs").doc("serial-counters");
    const doc = await docRef.get();
    const currentCount = doc.data()?.[aiName] || -1;
    const nextCount = currentCount + 1;
    await docRef.set({ [aiName]: nextCount }, { merge: true });
    return nextCount;
  } catch (error) {
    console.error(`Error: ${aiName}`, error);
    throw error;
  }
}

// 日付をYYYYMMDD形式で取得
function getFormattedDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}

// ファイル名を生成
function generateFileName(aiName, serialNumber, date) {
  const paddedSerial = String(serialNumber).padStart(2, "0");
  return `${aiName}${paddedSerial}-${date}`;
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
      const { aiName } = req.query;
      
      if (!aiName) {
        const snapshot = await db.collection("ai-share-logs").get();
        const declarations = snapshot.docs
          .filter(doc => doc.id !== "serial-counters")
          .map(doc => ({
            id: doc.id,
            ...doc.data(),
          }));
        return res.status(200).json({ declarations });
      }

      const snapshot = await db
        .collection("ai-share-logs")
        .where("ai_name", "==", aiName)
        .orderBy("date", "desc")
        .get();
      
      const declarations = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      
      return res.status(200).json({ aiName, declarations });
    }

    if (req.method === "POST") {
      const { aiName, summary, details } = req.body;
      
      if (!aiName || !summary || !details) {
        return res.status(400).json({
          error: "Missing: aiName, summary, details",
        });
      }

      const serialNumber = await getNextSerialNumber(aiName);
      const date = getFormattedDate();
      const fileName = generateFileName(aiName, serialNumber, date);
      
      const docId = `${aiName}/${fileName}`;
      const declarationData = {
        ai_name: aiName,
        serial: serialNumber,
        date: date,
        fileName: fileName,
        summary: summary,
        details: details,
        shared_by: `${aiName} Team`,
        created_at: admin.firestore.FieldValue.serverTimestamp(),
      };

      await db.collection("ai-share-logs").doc(docId).set(declarationData);

      await recordRevisionLog({
        date: date,
        aiName: aiName,
        fileName: fileName,
        action: "declaration_created",
        summary: summary,
      });

      return res.status(201).json({
        status: "success",
        fileName: fileName,
        docId: docId,
      });
    }

    return res.status(405).json({ error: "Method Not Allowed" });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ error: error.message });
  }
}

async function recordRevisionLog(logData) {
  try {
    const logId = uuidv4();
    await db.collection("revision-logs").doc(logId).set({
      ...logData,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });
  } catch (error) {
    console.error("Revision log error:", error);
  }
}
