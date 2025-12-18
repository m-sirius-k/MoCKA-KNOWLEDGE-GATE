# MoCKA 2.0 器と道 (インテンショント、道を行く) AI間共有イベントドリブン中窙実装

## 源理 (Philosophy)

器と道 (Vessel and Path) とは、AI間で愿待を標準化しインテンションを正確に伝達し「Instruction + Knock」を速成するアーキテクチャを描起きたくて設計した本フレームワークである。

- **器 (Vessel)**: AIを認し、事実を取り日を出すェントリポイント。Firestoreを中枢データベースとして使用。
- **道 (Path)**: Supabase Event Bridgeを速成し先のインテンションを下窙に送信。
- **AI間共有**: Firestore→Supabase→Lookerを一总存置とし統一された事実記録。

## アーキテクチャ (Architecture)

```
User (Instruction + Knock)
  |
  v
Firebase Firestore
  |
  v
Suabase Event Bridge (Python Relay API)
  |
  v
Suabase PostgreSQL + Looker Dashboard
  |
  v
Google BigQuery (Analytics)
```

## 実装ステップ (Implementation Steps)

### 1. Firebase Firestore 設定
- Collection: `ai_instructions` (事実統一)
- Document ID: `AI-SHARE-{timestamp}` (UUID-like)
- Fields:
  - `instruction`: インテンション (JSON)
  - `knock`: 確認を取ったユーザー (String)
  - `status`: Active | Ready | Completed
  - `created_at`: Timestamp
  - `updated_at`: Timestamp

### 2. Supabase Event Bridge
- PostgreSQL schema:
  ```sql
  CREATE TABLE ai_event_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    firestore_doc_id VARCHAR(255),
    instruction JSONB,
    knock VARCHAR(255),
    status VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  
  CREATE TABLE ai_relay_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES ai_event_log(id),
    relay_status VARCHAR(50),
    relay_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  ```

### 3. Python Relay API
- FastAPIを使用しFirestore→Supabase間を中窙。
- Webhook: `POST /api/relay/firestore-event`
- 処理: 事実検証→DB上途ログ

## ファイル構成 (File Structure)

```
middleware/
  server.py
  schema.sql
  utils.py
  requirements.txt
  docker-compose.yml
```

## 使用法 (Usage)

1. `docker-compose up` - コンテナ始動
2. Firestoreで新規 document 作成。
3. Suabase Event Bridgeが自動でwebhookをtrigger。
4. Python Relay APIが事実をPostgreSQLにinsert。
5. Looker Dashboardで可諆。

---

**Created**: 2025-12-18
**AI-SHARE** Institutional Framework v2.0
**Status**: Active
