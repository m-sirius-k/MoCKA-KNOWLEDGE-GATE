# Colab Linked Algorithm Deliverable System - Complete Integration Guide

## システム概要

このドキュメントは、Colab実行可能アルゴリズムを成果物履歴制度（Draft/Final版区別）に完全連動させた自動化システムの全体統合ガイドです。

## 実装済みコンポーネント

### 1. 成果物管理API (`algorithm-deliverables.js`)
- **POST**: 新規アルゴリズム成果物作成（Draft v1初期化）
- **GET**: 成果物履歴とバージョン一覧取得
- **PUT**: Draft状態をColab実行データで更新
- **PATCH**: Draft→Finalへ昇格（検証付き）
- **DELETE**: 成果物をアーカイブ

### 2. Colab双方向同期API (`colab-integration.js`)
- **GET**: Colabセッションと同期状態取得
- **POST**: Colab実行をログし自動的にDraftに同期
- **PUT**: 双方向同期（Colab→Draft、Draft→Colab）
- 実行履歴とメトリクス自動キャプチャ

### 3. 昇格ワークフローAPI (`deliverable-promotion.js`)
- **GET**: Draft昇格適格性を検証
- **POST**: 理由付き昇格リクエスト作成
- **PUT**: 昇格承認してFinal版を生成
- 包括的検証と監査ログ記録

### 4. 自動昇格API (`automated-promotion.js`)
- **GET**: 品質メトリクス基準を満たすアルゴリズムを検査
- **POST**: 条件を満たしたアルゴリズムを自動的に昇格
- 昇格閾値：
  - 最小実行回数: 3回以上
  - 精度: 90%以上
  - F1スコア: 85%以上

### 5. GitHub Actions自動化ワークフロー

拡張されたai-simulation.ymlに以下が追加：

**Step 13: Register Algorithm Deliverable**
- シミュレーション完了時に成果物を自動登録
- Firestore にALG-ISSUE-XXX-ROD-YYY形式でアルゴリズムを記録

**Step 14: Sync to Colab Integration**  
- メトリクスと実行データを自動的に同期
- 実行履歴をDraft版に追記

**Step 15: Commit Deliverable Records**
- 成果物情報をmainブランチに自動コミット
- 完全な監査追跡を確保

## 完全なワークフロー

### フェーズ1: 自動Draft作成
```
1. GitHub Actions シミュレーション実行
2. Step 13: ALG-ISSUE-001-ROD-001を作成
   - v1 Draft版として初期化
   - ISSUE-IDとROD番号に連動
3. main ブランチにコミット
```

### フェーズ2: Colab実行と同期
```
1. Colabノートブックで実行
2. メトリクス（精度、F1スコア）を記録
3. API呼び出し: POST /api/colab-integration
4. 自動同期: メトリクス→Draft版に記録
5. 実行履歴に追記
```

### フェーズ3a: 手動昇格
```
1. 昇格適格性確認: GET /api/deliverable-promotion?algorithmId=...
2. リクエスト作成: POST /api/deliverable-promotion
3. 承認者が確認: PUT /api/deliverable-promotion
4. Final v2 が自動生成
```

### フェーズ3b: 自動昇格
```
1. 自動チェック: GET /api/automated-promotion
2. 条件満たしたアルゴリズムを検査
3. 自動昇格: POST /api/automated-promotion
4. Final版が自動生成
5. 監査ログに記録
```

## Firestore データ構造

```
algorithm_deliverables/
├── ALG-ISSUE-001-ROD-001/
│   ├── algorithmName: "My Algorithm"
│   ├── colabUrl: "https://..."
│   ├── issueId: "ISSUE-001"
│   ├── rodNumber: "ROD-001"
│   ├── currentStatus: "draft" | "final" | "archived"
│   ├── versions/
│   │   ├── v1/  (Draft)
│   │   │   ├── status: "draft"
│   │   │   ├── colabExecutionHistory: [...]
│   │   │   ├── metrics: { accuracy, f1Score, ... }
│   │   │   └── lastSyncedAt: timestamp
│   │   └── v2/  (Final)
│   │       ├── status: "final"
│   │       ├── promotedAt: timestamp
│   │       ├── approvedBy: "system" | "user@email"
│   │       └── autoPromoted: true | false
│   ├── colab_sessions/
│   │   └── COLAB-ALG-...-{timestamp}/
│   │       ├── sessionId
│   │       ├── executionData
│   │       ├── metrics
│   │       └── syncStatus: "synced"
│   ├── promotion_requests/
│   │   └── PROMO-ALG-...-{timestamp}/
│   │       ├── status: "pending_approval" | "approved"
│   │       ├── reason
│   │       ├── requestedBy
│   │       └── approvedBy
│   └── audit_log/
│       ├── CREATE_DRAFT
│       ├── UPDATE_DRAFT  
│       ├── COLAB_SYNC
│       ├── PROMOTION_REQUESTED
│       ├── AUTO_PROMOTED
│       └── ... (all actions)
```

## 使用例

### 1. アルゴリズムを新規登録
```bash
curl -X POST http://localhost:3000/api/algorithm-deliverables \\
  -H "Content-Type: application/json" \\
  -d '{
    "algorithmName": "ML Model v1",
    "colabUrl": "https://colab.research.google.com/drive/abc123",
    "issueId": "ISSUE-001",
    "rodNumber": "ROD-001",
    "description": "Machine learning classification model",
    "tags": ["ml", "classification"]
  }'
```

### 2. Colab実行結果を同期
```bash
curl -X POST http://localhost:3000/api/colab-integration \\
  -H "Content-Type: application/json" \\
  -d '{
    "algorithmId": "ALG-ISSUE-001-ROD-001",
    "colabUrl": "https://...",
    "executionData": { "cellCount": 25 },
    "metrics": {
      "accuracy": 0.92,
      "f1Score": 0.89,
      "loss": 0.18
    }
  }'
```

### 3. 昇格適格性を確認
```bash
curl http://localhost:3000/api/deliverable-promotion?algorithmId=ALG-ISSUE-001-ROD-001
```

### 4. 手動昇格をリクエスト
```bash
curl -X POST http://localhost:3000/api/deliverable-promotion \\
  -H "Content-Type: application/json" \\
  -d '{
    "algorithmId": "ALG-ISSUE-001-ROD-001",
    "reason": "Achieved 92% accuracy on validation set",
    "requestedBy": "researcher@example.com"
  }'
```

### 5. 昇格を承認
```bash
curl -X PUT http://localhost:3000/api/deliverable-promotion \\
  -H "Content-Type: application/json" \\
  -d '{
    "algorithmId": "ALG-ISSUE-001-ROD-001",
    "promotionRequestId": "PROMO-ALG-...-123456",
    "approvedBy": "approver@example.com"
  }'
```

### 6. 自動昇格を実行
```bash
# 昇格可能なアルゴリズムを検査
curl http://localhost:3000/api/automated-promotion

# 自動昇格を実行
curl -X POST http://localhost:3000/api/automated-promotion
```

## 自動化ポイント

✅ **GitHub Actions → Deliverable**: シミュレーション完了時に自動登録  
✅ **Colab → Draft**: メトリクス自動同期  
✅ **Draft → Final**: 品質基準達成時に自動昇格  
✅ **監査ログ**: 全アクション自動記録  
✅ **コミット**: 成果物情報を自動mainブランチ反映  

## メトリクス基準（自動昇格）

| 項目 | 基準値 |
|-----|--------|
| 最小Colab実行回数 | 3回以上 |
| 最小精度（Accuracy） | 90% |
| 最小F1スコア | 85% |

※ これらの値は `automated-promotion.js` の `AUTO_PROMOTION_THRESHOLDS` で調整可能

## トラブルシューティング

**Q: 成果物が登録されない**
A: 
- ISSUE-ID と ROD-NUMBER が設定されているか確認
- Firestore接続情報が正しいか確認

**Q: Colab同期が失敗する**
A:
- algorithmId が一致しているか確認
- API エンドポイントが起動しているか確認

**Q: 昇格できない**
A:
- `GET /api/deliverable-promotion` で要件を確認
- メトリクスが記録されているか確認
- 実行回数が3回以上あるか確認
