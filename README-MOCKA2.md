# MoCKA 2.0 自律協働フローシステム

日本語: [Japanese](#japanese-version) | English: [English](#english-version)

---

## 日本語版 (Japanese Version)

### 概要

MoCKA 2.0は、複数のAI（Perplexity、Gemini、Copilot）が協働し、知識タスクを自丘実行できる分散型システムです。

### 主要機能

✅ **ゲートウェイシステム**
- Consent Gate: 同意確認
- Role Gate: ロール検証
- SLA Gate: 実行制約検証

✅ **幹等性 (Idempotency)**
- ハッシュベース重複検知
- 安全な燍等性預保

✅ **監査ログ**
- Append-only JSONL形式
- 全アクションを記録

✅ **Dry-run/Previewモード**
- 本実行前の安全テスト

### クイックスタート

```bash
# 1. リポジトリをクローン
 git clone https://github.com/nsjpkimura-del/MoCKA-KNOWLEDGE-GATE.git
 cd MoCKA-KNOWLEDGE-GATE

# 2. 環境変数を設定
 cp .env.example .env
 # .envを編集してAPIキーを設定

# 3. タスクを送信
 # AI-SHARE-LOGS/Tasks/ 下に新しいTASK-*.jsonを作成

# 4. 自動実行
 # GitHub Actionsが自動的にcoordinatorを実行
```

### ドキュメンテーション

- [MOCKA2-OPERATION-GUIDE.md](./MOCKA2-OPERATION-GUIDE.md) - 適用ガイド
- [ARCHITECTURE.md](./ARCHITECTURE.md) - システム設計
- [TEST-SCENARIOS.md](./TEST-SCENARIOS.md) - テストケース
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - トラブルシュート

### サンプルタスク

例:
```json
{
  "task_id": "TASK-2025-11-21-PERPLEXITY-001",
  "executor": "perplexity",
  "consent": { "approved": true },
  "role": { "required": ["executor"], "user": ["executor"] },
  "parameters": { "operation": "semantic_search", "query": "..." }
}
```

### ライセンス

MIT License - 詳詳使用は自由です。

---

## English Version

MoCKA 2.0 is a distributed autonomous system where multiple AIs (Perplexity, Gemini, Copilot) collaborate to execute knowledge tasks autonomously with comprehensive governance gates and audit trails.

**Key Features:**
- 3-tier Gateway System (Consent/Role/SLA)
- Idempotency via Hash-based Duplicate Detection
- Append-only Audit Logging (JSONL Format)
- Dry-run/Preview Mode for Safe Testing
- Multi-executor Fallback Mechanism

**Quick Links:**
- [Operation Guide](./MOCKA2-OPERATION-GUIDE.md)
- [System Architecture](./ARCHITECTURE.md)
- [Test Cases](./TEST-SCENARIOS.md)
- [Troubleshooting](./TROUBLESHOOTING.md)

**License:** MIT
