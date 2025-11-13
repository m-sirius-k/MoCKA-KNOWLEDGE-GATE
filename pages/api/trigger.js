<<<<<<< HEAD
// pages/api/trigger.js

import admin from "firebase-admin";

// Firebase初期化（複数回呼ばれないようにチェック）
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    }),
  });
}

const db = admin.firestore();

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { question, emotion_tag, mode } = req.body;

    if (!question || !emotion_tag || !mode) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Firestoreに保存
    const docRef = await db.collection("triggers").add({
      question,
      emotion_tag,
      mode,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return res.status(200).json({
      status: "success",
      id: docRef.id,
    });
  } catch (error) {
    console.error("Error saving to Firestore:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
=======
// pages/api/trigger.js

import admin from "firebase-admin";

// Firebase初期化（複数回呼ばれないようにチェック）
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    }),
  });
}

const db = admin.firestore();

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { question, emotion_tag, mode } = req.body;

    if (!question || !emotion_tag || !mode) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Firestoreに保存
    const docRef = await db.collection("triggers").add({
      question,
      emotion_tag,
      mode,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return res.status(200).json({
      status: "success",
      id: docRef.id,
    });
  } catch (error) {
    console.error("Error saving to Firestore:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
>>>>>>> ca3c54d (Initial Next.js project setup)
