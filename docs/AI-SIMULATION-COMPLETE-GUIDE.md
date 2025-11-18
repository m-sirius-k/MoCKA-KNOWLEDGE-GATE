# AI Simulation自動ログ記録・プラットフォーム統合ガイド

## 📋 概要

このガイドは、AI Simulation完成時の自動ログ記録、GitHub Actions自動commit機能、および複数プラットフォーム(Notion/Slack/Discord)への統合フレームワークの完全な実装を説明します。

## 🎯 実装された機能

### 1. AI Simulationログ記録 (`ai-output-logger.js`)

**用途**: Claude/OpenAIなどのAIモデル出力を完全に記録

```bash
curl -X POST http://localhost:3000/api/ai-output-logger \
  -H "Content-Type: application/json" \
  -d '{
    "issueId": "ISSUE-001",
    "rodNumber": "ROD-001",
    "aiModel": "gpt-4",
    "modelProvider": "openai",
    "output": "AI generated content here...",
    "metadata": {
      "workflowRun": "123",
      "runNumber": "45",
      "branch": "main",
      "commit": "abc123",
      "promptTokens": 150,
      "completionTokens": 500,
      "totalTokens": 650,
      "confidence": 0.95
    }
  }'
```

**記録内容**:
- ✅ ISSUE-IDおよびROD番号メタデータ
- ✅ AIモデル名とプロバイダー
- ✅ トークンメトリクス(プロンプト/完了/合計)
- ✅ 月別コスト計算
- ✅ 実行コンテキスト(workflow, commit, branch)
- ✅ 出力品質メトリクス(長さ、コード有無、マークダウン有無)
- ✅ SHA256ハッシュによる出力検証

### 2. プラットフォーム統合フレームワーク (`platform-integration-factory.js`)

**対応プラットフォーム**:
- Notion (データベース記事作成)
- Slack (メッセージ投稿)
- Discord (埋め込みメッセージ投稿)

**ファクトリーパターン実装**:

```javascript
import PlatformIntegrationFactory, { PLATFORM_TYPES } from './platform-integration-factory';

// Notion統合
const notionConfig = {
  platform: PLATFORM_TYPES.NOTION,
  apiKey: process.env.NOTION_API_KEY,
  databaseId: process.env.NOTION_DATABASE_ID,
  metadata: { workspace: 'Engineering' }
};

const notion = await PlatformIntegrationFactory.createIntegration(
  PLATFORM_TYPES.NOTION,
  notionConfig
);

await notion.postToDB('ISSUE-001', 'ROD-001', 'AI simulation results...');
```

### 3. GitHub Actions自動commit機能

現在のワークフロー(`.github/workflows/ai-simulation.yml`)は既に以下をサポート:

- ✅ AI Simulation完成時の自動commit
- ✅ ISSUE-ID + ROD番号メタデータ付き
- ✅ Workflow実行情報の保存
- ✅ データディレクトリへの自動保存
- ✅ Firestoreへの自動メタデータ記録

**commitメッセージ例**:
```
AI Simulation Result: ISSUE-001 - ROD-001
Simulation Details:
- ISSUE-ID: ISSUE-001
- ROD Number: ROD-001
- Workflow Run: 45
- Mode: standard
- Branch: main
- Commit: abc123def
```

## 📊 データ構造

### Firestore Collections

#### `ai_simulation_logs`
```json
{
  "issueId": "ISSUE-001",
  "rodNumber": "ROD-001",
  "aiModel": "gpt-4",
  "modelProvider": "openai",
  "outputHash": "abc123...",
  "timestamp": "2025-11-18T18:30:00Z",
  "executionContext": {
    "workflowRun": "123",
    "runNumber": "45",
    "branch": "main",
    "commit": "abc123"
  },
  "tokenMetrics": {
    "promptTokens": 150,
    "completionTokens": 500,
    "totalTokens": 650
  },
  "costEstimate": {
    "model": "gpt-4",
    "estimatedCost": 0.015
  }
}
```

#### `platform_integration_logs`
```json
{
  "platform": "notion",
  "issueId": "ISSUE-001",
  "rodNumber": "ROD-001",
  "action": "post_to_db",
  "timestamp": "2025-11-18T18:30:00Z",
  "status": "success",
  "result": { "id": "page-123" }
}
```

## 🔌 統合ワークフロー例

### エンドツーエンド統合

```bash
# 1. GitHub Actions runs AI Simulation
# ↓
# 2. AI Output recorded via ai-output-logger
# ↓
# 3. Platform Integration triggered
# ↓
# 4. Results posted to Notion/Slack/Discord
# ↓
# 5. Auto-commit with full metadata
# ↓
# 6. Firestore records updated
```

## 🚀 使用方法

### 環境変数設定

```bash
# .env.local
NOTION_API_KEY=notion_xxx
NOTION_DATABASE_ID=xxx
SLACK_BOT_TOKEN=xoxb-xxx
DISCORD_BOT_TOKEN=xxx
MEM_API_KEY=xxx
NOTEBOOK_LM_API_KEY=xxx
```

### API呼び出し例

#### Notion投稿
```javascript
const result = await notion.postToDB(
  'ISSUE-001',
  'ROD-001',
  'AI simulation completed successfully...'
);
```

#### Slack投稿
```javascript
const result = await slack.postMessage(
  'ISSUE-001',
  'ROD-001',
  'AI simulation result...*bold text* and _italic_'
);
```

#### Discord投稿
```javascript
const result = await discord.sendMessage(
  'ISSUE-001',
  'ROD-001',
  'AI simulation result with Discord embeds...'
);
```

## 📈 統計情報取得

```bash
# AIログ統計情報
curl "http://localhost:3000/api/ai-output-logger?issueId=ISSUE-001&rodNumber=ROD-001"

# レスポンス例
{
  "success": true,
  "count": 5,
  "statistics": {
    "totalLogs": 5,
    "models": ["gpt-4", "claude-3-opus"],
    "providers": ["openai", "anthropic"],
    "totalTokens": 3500,
    "estimatedTotalCost": 0.085
  }
}
```

## 🔒 セキュリティ

- ✅ HMAC-SHA256署名検証
- ✅ Bearer tokenベースの認証
- ✅ データハッシング(プロンプト/出力)
- ✅ Firestore RulesでのアクセスControl

## 📊 拡張性

### 新プラットフォーム追加

```javascript
// 1. BaseIntegrationを継承
class MyPlatformIntegration extends BaseIntegration {
  async customAction(issueId, rodNumber, data) {
    const result = await this.sendRequest('POST', '/endpoint', data);
    await this.logIntegration(issueId, rodNumber, 'custom_action', result);
    return result;
  }
}

// 2. Factoryに登録
PlatformIntegrationFactory.registerPlatform('myplatform', MyPlatformIntegration);
```

## 📝 ベストプラクティス

1. **メタデータは常に含める**: ISSUE-IDとROD番号は必須
2. **トークン情報を記録**: コスト追跡のため
3. **エラーハンドリング**: すべてのプラットフォーム呼び出しをtry-catchで
4. **非同期処理**: 複数プラットフォームへの投稿は並列化
5. **キャッシング**: API呼び出し数を最小化

## 🆘 トラブルシューティング

### APIキーエラー
```bash
# 環境変数確認
echo $NOTION_API_KEY

# Firebaseシークレット確認
firebase functions:config:get
```

### プラットフォーム投稿失敗
```javascript
// ログから詳細確認
db.collection('platform_integration_logs')
  .where('status', '==', 'failed')
  .orderBy('timestamp', 'desc')
  .limit(10)
  .get()
```

## 📚 関連ドキュメント

- [NotebookLM統合ガイド](./NOTEBOOKLM-BIDIRECTIONAL-INTEGRATION.md)
- [Mem.ai統合ガイド](./MEM-AI-BIDIRECTIONAL-INTEGRATION.md)
- [GitHub Actions設定](../.github/workflows/ai-simulation.yml)

## ✅ チェックリスト

- [ ] 環境変数が正しく設定されている
- [ ] Firestore RulesでAPIアクセス許可されている
- [ ] プラットフォームAPIキーが有効
- [ ] Webhook登録されている(該当プラットフォーム)
- [ ] ログ記録が正常に動作している
- [ ] 統計情報が取得可能

---

**作成日**: 2025年11月18日
**最終更新**: 2025年11月18日
**バージョン**: 1.0
