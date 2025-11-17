// pages/api/ai-share-metadata.js
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

// AI共有用フォーマット（YAML構造）
const aiShareStructure = {
  foundation: {
    label: "基盤設計",
    items: [
      { id: "001-005", title: "基盤設計" },
      { id: "007", title: "制度完成宣言" },
    ],
  },
  international: {
    label: "国際展開",
    items: [
      { id: "009", title: "国内制度完成版" },
      { id: "010", title: "英語翻訳版" },
      { id: "011", title: "ISO/IEEE標準化提案" },
    ],
  },
  collaboration: {
    label: "国際共同研究",
    items: [
      { id: "012", title: "国際共同研究ロードマップ" },
      { id: "013", title: "実施計画" },
    ],
  },
  evaluation: {
    label: "評価・改善",
    items: [
      { id: "014", title: "評価指標とフィードバック" },
      { id: "015", title: "国際評価委員会設置" },
      { id: "016", title: "年次報告書フォーマット" },
      { id: "017", title: "年次評価サイクル" },
      { id: "018", title: "改善提案反映" },
      { id: "019", title: "改訂版公開" },
      { id: "020", title: "成果蓄積プロセス" },
    ],
  },
  future: {
    label: "将来構想",
    items: [
      { id: "025", title: "将来プラン" },
    ],
  },
};

export default async function handler(req, res) {
  try {
    // CORS対応
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
      return res.status(200).end();
    }

    // GETリクエスト: メタデータ取得またはyaml形式で返す
    if (req.method === "GET") {
      const format = req.query.format || "json"; // json または yaml

      if (format === "yaml") {
        // YAML形式で返す
        let yamlOutput = "AI-SHARE:\n";
        Object.entries(aiShareStructure).forEach(([key, section]) => {
          yamlOutput += `  ${key}:\n`;
          yamlOutput += `    label: ${section.label}\n`;
          yamlOutput += `    items:\n`;
          section.items.forEach(item => {
            yamlOutput += `      - id: "${item.id}"\n`;
            yamlOutput += `        title: "${item.title}"\n`;
          });
        });

        res.setHeader("Content-Type", "text/yaml; charset=utf-8");
        return res.status(200).send(yamlOutput);
      }

      // JSON形式で返す
      const metadata = await db.collection("ai-share-metadata").doc("structure").get();
      if (metadata.exists) {
        return res.status(200).json({ data: metadata.data() });
      }

      // メタデータが存在しない場合は デフォルト構造を返す
      return res.status(200).json({ data: aiShareStructure });
    }

    // POSTリクエスト: メタデータを保存
    if (req.method === "POST") {
      const { structure } = req.body;
      if (!structure) {
        return res.status(400).json({ error: "Missing required field: structure" });
      }

      // ai-share-metadataコレクションに保存
      await db.collection("ai-share-metadata").doc("structure").set(structure, { merge: true });
      return res.status(200).json({ status: "success", message: "AI-SHARE structure saved" });
    }

    return res.status(405).json({ error: "Method Not Allowed" });
  } catch (error) {
    console.error("Error in ai-share-metadata API:", error);
    return res.status(500).json({ error: error.message });
  }
}
