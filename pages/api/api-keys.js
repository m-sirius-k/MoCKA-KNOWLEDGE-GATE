// pages/api/api-keys.js
// APIキー管理エンドポイント
// プログラマティックアクセス対応

import admin from "firebase-admin";
import crypto from "crypto";

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

// APIキー生成関数
function generateApiKey() {
  return "sk_" + crypto.randomBytes(32).toString("hex");
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

    // GETリクエスト: APIキー一覧取得またはキー検証
    if (req.method === "GET") {
      const { uid, keyId, validate } = req.query;

      if (validate) {
        // APIキー検証
        const key = req.headers["x-api-key"];
        if (!key) {
          return res.status(401).json({ valid: false, error: "Missing X-API-Key header" });
        }

        // キーをハッシュ化して検索
        const keyHash = crypto.createHash("sha256").update(key).digest("hex");
        const snapshot = await db.collection("api-keys").where("keyHash", "==", keyHash).get();

        if (snapshot.empty) {
          return res.status(401).json({ valid: false, error: "Invalid API key" });
        }

        const keyDoc = snapshot.docs[0];
        const keyData = keyDoc.data();

        // 有効期限チェック
        if (keyData.expiresAt && new Date(keyData.expiresAt) < new Date()) {
          return res.status(401).json({ valid: false, error: "API key has expired" });
        }

        // ステータスチェック
        if (keyData.status !== "active") {
          return res.status(401).json({ valid: false, error: "API key is inactive" });
        }

        // 使用回数更新
        await db.collection("api-keys").doc(keyDoc.id).update({
          lastUsedAt: admin.firestore.FieldValue.serverTimestamp(),
          usageCount: admin.firestore.FieldValue.increment(1),
        });

        return res.status(200).json({
          valid: true,
          uid: keyData.uid,
          permissions: keyData.permissions,
          name: keyData.name,
        });
      }

      if (uid) {
        // ユーザーのAPIキー一覧取得
        const snapshot = await db.collection("api-keys")
          .where("uid", "==", uid)
          .orderBy("createdAt", "desc")
          .get();

        const keys = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name,
            permissions: data.permissions,
            status: data.status,
            createdAt: data.createdAt,
            expiresAt: data.expiresAt,
            lastUsedAt: data.lastUsedAt,
            usageCount: data.usageCount,
          };
        });

        return res.status(200).json({ keys });
      }

      if (keyId) {
        // 特定のキー情報取得
        const doc = await db.collection("api-keys").doc(keyId).get();
        if (!doc.exists) {
          return res.status(404).json({ error: "API key not found" });
        }
        return res.status(200).json(doc.data());
      }

      return res.status(400).json({ error: "Missing uid or keyId parameter" });
    }

    // POSTリクエスト: APIキー生成
    if (req.method === "POST") {
      const { uid, name, permissions, daysValid = 365, description = "" } = req.body;

      if (!uid || !name) {
        return res.status(400).json({ error: "Missing required fields: uid, name" });
      }

      // 新規APIキー生成
      const apiKey = generateApiKey();
      const keyHash = crypto.createHash("sha256").update(apiKey).digest("hex");
      const expiresAt = new Date(Date.now() + daysValid * 24 * 60 * 60 * 1000);

      const keyData = {
        uid,
        name,
        permissions: permissions || ["read"],
        keyHash, // ハッシュ化されたキーのみ保存
        status: "active",
        description,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        expiresAt: expiresAt.toISOString(),
        lastUsedAt: null,
        usageCount: 0,
      };

      const docRef = await db.collection("api-keys").add(keyData);

      // 監査ログ記録
      await logAuditEvent("API_KEY_CREATED", {
        uid,
        keyId: docRef.id,
        name,
        timestamp: new Date().toISOString(),
      });

      return res.status(201).json({
        status: "success",
        keyId: docRef.id,
        apiKey, // 最初の1回だけ返す
        expiresAt: expiresAt.toISOString(),
        message: "Save your API key securely. You won't be able to see it again.",
      });
    }

    // DELETEリクエスト: APIキー無効化
    if (req.method === "DELETE") {
      const { keyId } = req.body;
      if (!keyId) {
        return res.status(400).json({ error: "Missing keyId in request body" });
      }

      const doc = await db.collection("api-keys").doc(keyId).get();
      if (!doc.exists) {
        return res.status(404).json({ error: "API key not found" });
      }

      await db.collection("api-keys").doc(keyId).update({
        status: "inactive",
        deactivatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // 監査ログ記録
      await logAuditEvent("API_KEY_REVOKED", {
        keyId,
        uid: doc.data().uid,
        timestamp: new Date().toISOString(),
      });

      return res.status(200).json({ status: "success", message: "API key revoked" });
    }

    return res.status(405).json({ error: "Method Not Allowed" });
  } catch (error) {
    console.error("Error in api-keys API:", error);
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
