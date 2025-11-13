// firestore_schema.js
const admin = require("firebase-admin");

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
});

const db = admin.firestore();

async function initSchema() {
  const collections = [
    { name: "pils", sample: { id: "pils_001", question: "制度的問い", structure: { step1: "背景", step2: "検証", step3: "結論" }, created_at: admin.firestore.Timestamp.now() }},
    { name: "sacl", sample: { id: "sacl_001", title: "論文形式成果物", content: "# MoCKA論文形式\n本文…", created_at: admin.firestore.Timestamp.now() }},
    { name: "emotion", sample: { id: "emotion_001", dialogue: "安心したいという感情", tags: ["安心", "確認"], created_at: admin.firestore.Timestamp.now() }},
    { name: "visual", sample: { id: "visual_001", image_url: "https://example.com/visual.png", metadata: { type: "diagram", author: "Gamma" }, created_at: admin.firestore.Timestamp.now() }}
  ];

  for (const col of collections) {
    await db.collection(col.name).doc(col.sample.id).set(col.sample);
    console.log(`Collection ${col.name} initialized.`);
  }
}

initSchema().catch(console.error);
