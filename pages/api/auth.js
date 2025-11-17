// pages/api/auth.js
// Firebase Authentication統合エンドポイント
// メール+パスワード認証、招待コード連携

import admin from "firebase-admin";

// 環境変数チェック
if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
  throw new Error("Firebase environment variables are not set correctly");
}

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
const auth = admin.auth();

export default async function handler(req, res) {
  try {
    // CORS対応
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

    if (req.method === "OPTIONS") {
      return res.status(200).end();
    }

    // ユーザー登録: 招待コード+メール+パスワード
    if (req.method === "POST" && req.body.action === "signup") {
      const { email, password, inviteCode, name } = req.body;

      if (!email || !password || !inviteCode) {
        return res.status(400).json({ error: "Missing required fields: email, password, inviteCode" });
      }

      // 招待コード検証
      const inviteDocSnapshot = await db.collection("invite-codes").doc(inviteCode).get();
      if (!inviteDocSnapshot.exists) {
        return res.status(401).json({ error: "Invalid invite code" });
      }

      const inviteData = inviteDocSnapshot.data();

      // 有効期限チェック
      if (inviteData.expiresAt && new Date(inviteData.expiresAt) < new Date()) {
        return res.status(401).json({ error: "Invite code has expired" });
      }

      // 使用上限チェック
      if (inviteData.maxUses && inviteData.usedCount >= inviteData.maxUses) {
        return res.status(401).json({ error: "Invite code usage limit reached" });
      }

      // Firebase Authenticationでユーザー作成
      const userRecord = await auth.createUser({
        email,
        password,
        displayName: name || email.split("@")[0],
      });

      // ユーザードキュメント作成（Firestore）
      const userData = {
        uid: userRecord.uid,
        email,
        displayName: userRecord.displayName,
        role: inviteData.role || "viewer",
        permissions: inviteData.permissions || [],
        inviteCode,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        status: "active",
      };

      await db.collection("users").doc(userRecord.uid).set(userData);

      // 招待コード使用回数インクリメント
      await db.collection("invite-codes").doc(inviteCode).update({
        usedCount: admin.firestore.FieldValue.increment(1),
      });

      // 監査ログ記録
      await logAuditEvent("USER_SIGNUP", {
        uid: userRecord.uid,
        email,
        inviteCode,
        timestamp: new Date().toISOString(),
      });

      return res.status(201).json({
        status: "success",
        uid: userRecord.uid,
        email,
        role: userData.role,
      });
    }

    // ユーザー情報取得
    if (req.method === "GET" && req.query.action === "profile") {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Missing authorization token" });
      }

      const token = authHeader.substring(7);

      try {
        const decodedToken = await auth.verifyIdToken(token);
        const uid = decodedToken.uid;

        const userDoc = await db.collection("users").doc(uid).get();
        if (!userDoc.exists) {
          return res.status(404).json({ error: "User not found" });
        }

        // 監査ログ記録
        await logAuditEvent("USER_PROFILE_ACCESS", {
          uid,
          timestamp: new Date().toISOString(),
        });

        return res.status(200).json(userDoc.data());
      } catch (error) {
        return res.status(401).json({ error: "Invalid or expired token" });
      }
    }

    // ユーザーロール更新（管理者用）
    if (req.method === "POST" && req.body.action === "updateRole") {
      const { uid, role, permissions } = req.body;

      if (!uid || !role) {
        return res.status(400).json({ error: "Missing required fields: uid, role" });
      }

      await db.collection("users").doc(uid).update({
        role,
        permissions: permissions || [],
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // 監査ログ記録
      await logAuditEvent("USER_ROLE_UPDATED", {
        uid,
        role,
        permissions,
        timestamp: new Date().toISOString(),
      });

      return res.status(200).json({ status: "success" });
    }

    return res.status(400).json({ error: "Invalid action" });
  } catch (error) {
    console.error("Error in auth API:", error);
    return res.status(500).json({ error: error.message });
  }
}

// 監査ログ記録関数
async function logAuditEvent(eventType, eventData) {
  try {
    await db.collection("audit-logs").add({
      eventType,
      eventData,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  } catch (error) {
    console.error("Error logging audit event:", error);
  }
}
