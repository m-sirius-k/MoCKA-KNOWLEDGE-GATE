
// pages/api/saveData.js
import admin from "firebase-admin";

// Firebase初期化（既に初期化済みなら再利用）
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  });
}

const db = admin.firestore();

export default async function handler(req, res) {
  if (req.method === "POST") {
    try {
      const { id, data } = req.body;
      await db.collection("collectionName").doc(id).set(data);
      res.status(200).json({ message: "保存成功" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: "Method Not Allowed" });
  }
}
