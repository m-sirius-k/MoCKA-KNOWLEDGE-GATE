// pages/api/trigger.js
import admin from "firebase-admin";

// 環境変数チェック
if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
  throw new Error("Firebase environment variables are not set correctly");
}

// Firebase初期化（複数回呼ばれないようにチェック）
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_
    }),
  });
}

const db = admin.firestore();

export default async function handler(req, res) {
  try {
    // CORS対応
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
      return res.status(200).end();
    }

    if (req.method === "POST") {
      const { question, emotion_tag, mode } = req.body;
      if (!question || !emotion_tag || !mode) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const docRef = await db.collection("triggers").add({
        question,
        emotion_tag,
        mode,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return res.status(200).json({ status: "success", id: docRef.id });
    }

    if (req.method === "GET") {
      const snapshot = await db.collection("triggers")
        .limit(20)
        .get();

      const triggers = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      return res.status(200).json({ triggers });
    }

    return res.status(405).json({ error: "Method Not Allowed" });
  } catch (error) {
    console.error("Error in trigger API:", error);
    return res.status(500).json({ error: error.message });
  }
}


