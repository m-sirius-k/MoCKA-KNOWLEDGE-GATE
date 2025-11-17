// pages/api/conversations.js
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
      privateKey: process.env.FIREBASE_PRIVATE_KEY,
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

    if (req.method === "GET") {
      // conversationsコレクションからすべてのドキュメントを取得
      const snapshot = await db.collection("conversations").get();
      const conversations = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      return res.status(200).json({ conversations });
    }

    if (req.method === "POST") {
      const { id, data } = req.body;
      if (!id || !data) {
        return res.status(400).json({ error: "Missing required fields: id and data" });
      }
      await db.collection("conversations").doc(id).set(data, { merge: true });
      return res.status(200).json({ status: "success", id });
    }

    return res.status(405).json({ error: "Method Not Allowed" });
  } catch (error) {
    console.error("Error in conversations API:", error);
    return res.status(500).json({ error: error.message });
  }
}
