// pages/api/invite-codes.js
// AI-SHARE-027: アクセス管理制度
// 招待コード生成・検証・管理エンドポイント

import admin from "firebase-admin";
import crypto from "crypto";

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

// 招待コード生成関数
function generateInviteCode() {
  return crypto.randomBytes(16).toString("hex").toUpperCase().slice(0, 12);
}

export default async function handler(req, res) {
  try {
    // CORS対応
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

    if (req.method === "OPTIONS") {
      return res.status(200).end();
    }

    // GETリクエスト: 招待コード一覧取得または単一コード検証
    if (req.method === "GET") {
      const { code, list } = req.query;

      if (list === "true") {
        // 全招待コード一覧取得（管理者用）
        const snapshot = await db.collection("invite-codes").get();
        const codes = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        return res.status(200).json({ codes });
      }

      if (code) {
        // 特定のコード検証
        const docSnapshot = await db.collection("invite-codes").doc(code).get();
        if (docSnapshot.exists) {
          const codeData = docSnapshot.data();
          
          // 有効期限チェック
          if (codeData.expiresAt && new Date(codeData.expiresAt) < new Date()) {
            return res.status(400).json({ error: "Invite code has expired" });
          }
          
          // 使用上限チェック
          if (codeData.maxUses && codeData.usedCount >= codeData.maxUses) {
            return res.status(400).json({ error: "Invite code usage limit reached" });
          }

          return res.status(200).json({ valid: true, code: codeData });
        }
        return res.status(404).json({ valid: false, error: "Invite code not found" });
      }

      return res.status(400).json({ error: "Missing code parameter" });
    }

    // POSTリクエスト: 招待コード生成
    if (req.method === "POST") {
      const { 
        role = "viewer", 
        maxUses = 1, 
        daysValid = 30, 
        description = "",
        permissions = ["conversations:read", "ai-share-metadata:read"]
      } = req.body;

      // 新規招待コード生成
      const inviteCode = generateInviteCode();
      const expiresAt = new Date(Date.now() + daysValid * 24 * 60 * 60 * 1000);

      const inviteData = {
        code: inviteCode,
        role, // "viewer", "editor", "admin"
        permissions, // アクセス可能な操作
        maxUses,
        usedCount: 0,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        expiresAt: expiresAt.toISOString(),
        description,
        status: "active", // "active", "inactive", "expired", "exhausted"
      };

      await db.collection("invite-codes").doc(inviteCode).set(inviteData);

      return res.status(201).json({ 
        status: "success", 
        inviteCode,
        expiresAt: expiresAt.toISOString()
      });
    }

    // DELETEリクエスト: 招待コード無効化
    if (req.method === "DELETE") {
      const { code } = req.body;
      if (!code) {
        return res.status(400).json({ error: "Missing code in request body" });
      }

      // コード削除（または status を inactive に変更）
      await db.collection("invite-codes").doc(code).update({
        status: "inactive",
        deactivatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return res.status(200).json({ status: "success", message: "Invite code deactivated" });
    }

    return res.status(405).json({ error: "Method Not Allowed" });
  } catch (error) {
    console.error("Error in invite-codes API:", error);
    return res.status(500).json({ error: error.message });
  }
}
