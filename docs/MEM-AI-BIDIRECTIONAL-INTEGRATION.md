# Mem.ai 双方向統合ガイド

## 概要

Mem.ai との **完全な双方向統合** を実装し、GitHub と Mem.ai 間でシミュレーション結果とナレッジを自動同期します。

## Mem.ai 統合アーキテクチャ

```
GitHub (main branch)
    ↕ [GitHub Actions]
API Gateway (Node.js)
    ├─ /api/mem-sync (双方向同期)
    ├─ /api/mem-webhook (Webhook受信)
    ├─ /api/mem-export (エクスポート)
    ├─ /api/mem-import (インポート)
    ├─ /api/mem-collections (コレクション管理)
    └─ /api/mem-metadata (メタデータ管理)
        ↕ [Firebase Firestore]
        ↓
Mem.ai API
    ├─ Notes
    ├─ Collections
    └─ AI Chat
```

## 双方向フロー

### GitHub → Mem.ai (Push)

```
AI Simulation完了
    ↓
ISSUE-ID & ROD番号生成
    ↓
/api/mem-sync (POST) 呼び出し
    ↓
Note フォーマット変換
    ↓
Mem.ai 新規 Note 作成
    ↓
コレクション割り当て
    ↓
Firestore メタデータ保存
```

### Mem.ai → GitHub (Pull)

```
Mem.ai Note 更新
    ↓
Webhook Event 発火
    ↓
/api/mem-webhook 受信
    ↓
メタデータ抽出
    ↓
AI-SIMULATION 更新
    ↓
Git Commit & Push
    ↓
監査ログ記録
```

## Mem.ai API 統合詳細

### 認証方式

```javascript
// Mem.ai API Key
const memApiKey = process.env.MEM_AI_API_KEY;
const memApiEndpoint = 'https://api.mem.ai/v1';

// ヘッダー
const headers = {
  'Authorization': `Bearer ${memApiKey}`,
  'Content-Type': 'application/json',
  'X-Request-ID': generateUUID(),
};
```

### Note作成フォーマット

```javascript
{
  title: `AI Simulation: ${issueId}-${rodNumber}`,
  content: `## 実行結果\n\n${simulationData}\n\n### メタデータ\nISSUE-ID: ${issueId}\nROD: ${rodNumber}`,
  collectionId: 'ai-simulations',
  tags: [
    'ai-simulation',
    `issue-${issueId}`,
    `rod-${rodNumber}`,
    'automation'
  ],
  metadata: {
    issueId,
    rodNumber,
    source: 'MoCKA-KNOWLEDGE-GATE',
    timestamp: new Date().toISOString(),
    gitCommit: process.env.GITHUB_SHA,
  }
}
```

### Collection管理

```javascript
// 自動的に作成・管理される
Collections:
  - ai-simulations (全AI実行結果)
  - algorithm-deliverables (成果物)
  - knowledge-base (知識ベース)
  - issue-tracking (Issue連携)
  - rod-catalog (ROD 管理)
```

## メタデータ構造

```javascript
{
  memNoteId: 'note-uuid-xxx',
  issueId: 'ISSUE-001',
  rodNumber: 'ROD-001',
  collectionId: 'ai-simulations',
  collectionName: 'AI Simulations',
  syncId: 'sync-ISSUE-001-ROD-001-...',
  direction: 'push' | 'pull',
  status: 'synced' | 'pending' | 'conflict',
  lastSyncTime: '2025-11-18T05:00:00Z',
  sourceTimestamp: '2025-11-18T04:55:00Z',
  contentHash: 'sha256-hash',
  aiChatHistory: [
    {
      query: '...',
      response: '...',
      timestamp: '...'
    }
  ],
  collaborators: ['user1', 'user2'],
  permissions: 'private' | 'team' | 'public',
}
```

## 環境変数設定

```bash
# Mem.ai API
MEM_AI_API_KEY=xxx
MEM_AI_API_ENDPOINT=https://api.mem.ai/v1
MEM_AI_USER_ID=xxx

# Webhook
MEM_WEBHOOK_SECRET=xxx
MEM_WEBHOOK_URL=https://your-domain.com/api/mem-webhook

# Collection設定
MEM_COLLECTION_SIMULATIONS=ai-simulations
MEM_COLLECTION_DELIVERABLES=algorithm-deliverables
MEM_COLLECTION_KNOWLEDGE=knowledge-base

# GitHub
GITHUB_TOKEN=xxx
GITHUB_REPO=nsjpkimura-del/MoCKA-KNOWLEDGE-GATE

# Firebase
FIREBASE_PROJECT_ID=xxx
FIREBASE_CLIENT_EMAIL=xxx
FIREBASE_PRIVATE_KEY=xxx
```

## 実装するAPI エンドポイント

### 1. /api/mem-sync (双方向同期)

```javascript
// POST: Mem.aiへエクスポート
POST /api/mem-sync
{
  issueId: 'ISSUE-001',
  rodNumber: 'ROD-001',
  simulationData: {...},
  direction: 'push' | 'pull' | 'bidirectional'
}

Response:
{
  success: true,
  memNoteId: 'note-uuid',
  syncId: 'sync-xxx',
  contentHash: 'sha256-hash'
}
```

### 2. /api/mem-webhook (イベント受信)

```javascript
// POST: Mem.ai Webhook
X-Mem-Signature: HMAC-SHA256
{
  eventType: 'note.updated' | 'note.created' | 'note.deleted',
  noteId: 'note-uuid',
  data: {...}
}
```

### 3. /api/mem-export (データエクスポート)

```javascript
// POST: Mem.aiにエクスポート
// GET: 履歴取得
```

### 4. /api/mem-import (データインポート)

```javascript
// POST: Mem.aiからインポート
// GET: インポート履歴
```

### 5. /api/mem-collections (コレクション管理)

```javascript
// POST: コレクション作成
// GET: コレクション一覧
// PUT: コレクション更新
```

### 6. /api/mem-metadata (メタデータ管理)

```javascript
// CRUD操作で同期状態を管理
```

## GitHub Actions 統合

```yaml
# .github/workflows/ai-simulation.yml に追加

- name: Export to Mem.ai
  if: success()
  run: |
    curl -X POST http://localhost:3000/api/mem-sync \
      -H "Content-Type: application/json" \
      -d '{
        "issueId": "${{ steps.generate_ids.outputs.ISSUE_ID }}",
        "rodNumber": "${{ steps.generate_ids.outputs.ROD_NUMBER }}",
        "simulationData": ${{ steps.simulation.outputs.RESULT }},
        "direction": "bidirectional"
      }'

- name: Create Mem.ai Collection
  run: |
    curl -X POST http://localhost:3000/api/mem-collections \
      -H "Content-Type: application/json" \
      -d '{
        "name": "${{ steps.generate_ids.outputs.ISSUE_ID }}",
        "parent": "ai-simulations"
      }'
```

## Mem.ai AI Chat 統合

```javascript
// Mem.ai の AI Chat を活用して、シミュレーション結果を自動分析

- 自動質問生成
- インサイト抽出
- 推奨事項提案
- 異常検知

// チャット履歴自動記録
memMetadata.aiChatHistory.push({
  query: 'これらの結果から何が学べるのか？',
  response: 'AI による分析結果...',
  timestamp: new Date().toISOString()
})
```

## コレクション階層構造

```
ai-simulations (ルート)
├─ ISSUE-001 (Issue別)
│  ├─ ROD-001
│  ├─ ROD-002
│  └─ ROD-003
├─ ISSUE-002
└─ ...

algorithm-deliverables
├─ Draft
├─ Final
└─ Archived

knowledge-base
├─ Patterns
├─ Insights
└─ Lessons Learned
```

## 同期ステータス管理

```javascript
Status:
- 'pending': 同期待機中
- 'syncing': 同期中
- 'synced': 同期完了
- 'conflict': 競合検出
- 'failed': 失敗

// 自動リトライ
Retry:
  maxAttempts: 3
  backoffMultiplier: 2
  initialDelayMs: 1000
```

## セキュリティ

- HMAC-SHA256 署名検証
- API Key 暗号化保存
- 監査ログ記録
- アクセス制御
- レート制限

## Firestore コレクション

```
mem_sync_metadata/
mem_webhook_events/
mem_exports/
mem_imports/
mem_collections/
mem_ai_chat_history/
```

## テストコマンド

```bash
# Mem.ai 双方向同期テスト
curl -X POST http://localhost:3000/api/mem-sync \
  -H "Content-Type: application/json" \
  -d '{
    "issueId": "ISSUE-TEST-001",
    "rodNumber": "ROD-TEST-001",
    "direction": "bidirectional"
  }'

# コレクション作成テスト
curl -X POST http://localhost:3000/api/mem-collections \
  -H "Content-Type: application/json" \
  -d '{"name": "test-collection"}'

# メタデータ確認
curl -X GET "http://localhost:3000/api/mem-metadata?issueId=ISSUE-001&rodNumber=ROD-001"
```

## 完全自動フロー

1. **AI Simulation 完了** → GitHub Actions トリガー
2. **Mem.ai へ自動エクスポート** → Note 作成 + コレクション割り当て
3. **Firestore メタデータ保存** → 同期状態記録
4. **Mem.ai Webhook** → Note 更新検出
5. **GitHub 自動更新** → AI-SIMULATION リンク
6. **監査ログ記録** → 完全なトレーサビリティ

## トラッキング

全ての操作が以下で追跡可能:
- ISSUE-ID
- ROD 番号
- syncId
- memNoteId
- タイムスタンプ
