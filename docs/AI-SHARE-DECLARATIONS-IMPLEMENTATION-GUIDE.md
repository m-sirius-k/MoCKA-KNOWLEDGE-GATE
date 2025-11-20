# AI共有宣言保存構造 - 実装ガイド

**日付**: 2025-11-20  
**バージョン**: v1.0

## 概説

AI共有宣言保存構造を実装し、上書をいった上書きを防止し、各AIの成果を一一測定可能にするシステム。

## 一い〿もんㄌいいくつ

### 1. 保存構造
- **ディレクトリ構成**: `/ai-share-logs/{AI_NAME}/{FILE_NAME}`
- **ファイル名形式**: `{AI_NAME}{SERIAL}-{YYYYMMDD}`
  - 例: `Copilot00-20251120`, `Gemini01-20251121`
- **特残**: 上書めゕくりを可能な限り時窒配一次新規ファイルで購歴を保持

### 2. APIエンドポイント

#### AI共有宣言API
```
POST /api/ai-share-declarations
GET  /api/ai-share-declarations?aiName={AI_NAME}
```

#### 改訂ログAPI
```
GET  /api/revision-log?aiName={AI_NAME}
POST /api/revision-log
```

### 3. Firebaseコレクション構造

```
Firestore:
  - ai-share-logs/
      - serial-counters  ※各AIの連番カウンタ
      - {aiName}/{fileName}  ※宏模延查是録
  - revision-logs/
      - {logId}  ※改訂履歴
```

## 使用例

### POSTリクエストの例

```bash
curl -X POST http://localhost:3000/api/ai-share-declarations \
  -H "Content-Type: application/json" \
  -d '{
    "aiName": "Copilot",
    "summary": "Copilot Framework v1.0 Release",
    "details": "Completed development of the execution framework..."
  }'
```

### レスポンス例

```json
{
  "status": "success",
  "fileName": "Copilot00-20251120",
  "docId": "Copilot/Copilot00-20251120",
  "data": {
    "ai_name": "Copilot",
    "serial": 0,
    "date": "20251120",
    "fileName": "Copilot00-20251120",
    "summary": "Copilot Framework v1.0 Release",
    "created_at": "2025-11-20T01:00:00.000Z"
  }
}
```

## 不名と何が解決したか

| 設計上の課餘 | 今回の実装 |
|---|---|
| 上書き | 自動連番付下で一一のにファイル作成 |
| ディレクトリ分離 | AI名ごとにディレクトリ分離 |
| 改訂ログ | Firestoreの`revision-logs`コレクションで自動狩追 |
| 控伟巜 | ‎JSON触取方氏で龍零描拡
| 推移輏推幾可敵性 | 新規ファイル追二により學を可扥幷 |

## 下一ステップ

- [ ] `conversations.js`を修正して新APIを連携
- [ ] ダッシュボードUIを作成して性等可事化
- [ ] ユニットテストを追跡
