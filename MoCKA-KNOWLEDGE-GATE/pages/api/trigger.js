// pages/api/trigger.js
import admin from "firebase-admin";

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
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { question, emotion_tag, mode } = req.body;

  try {
    if (mode === "日常") {
      const docRef = await db.collection("sacl").add({
        title: "日常処理成果物",
        content: `# MoCKA論文形式\n問い: ${question}\n処理: Copilot単独`,
        created_at: admin.firestore.Timestamp.now()
      });
      return res.status(200).json({ status: "Copilot単独処理", id: docRef.id });
    } else if (mode === "AI全体会議") {
      const docRef = await db.collection("pils").add({
        question,
        structure: { step1: "背景", step2: "検証", step3: "結論" },
        emotion_tag,
        created_at: admin.firestore.Timestamp.now()
      });
      return res.status(200).json({ status: "MoCKA-PENTAD会議起動", id: docRef.id });
    } else {
      return res.status(400).json({ error: "モードが不正です" });
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
