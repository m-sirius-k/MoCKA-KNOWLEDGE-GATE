# MoCKA-GATE CONNECTION TEST RITUAL

儀式的接続試験ガイド：Gemini/CopilotからMoCKA-GATEへの意思伝達型命令書送信確立

## 📋 概要

このドキュメントは、**MoCKA-GATEゲートウェイサーバー**をセットアップし、**Gemini/Copilotからの認証済みHTTP接続試験**を実行するための完全ガイドです。

**目標：** Gemini/CopilotからMoCKA-GATEへ、HMAC署名付きJWT（短期トークン）で安全にHTTP経由アクセスし、意思伝達型命令書（AI-SHARE-029）をPOSTして応答を取得する

---

## 🚀 クイックスタート

### ステップ1：必要なファイルを作成

```bash
cd gateway

# ディレクトリ構造を作成
mkdir -p src tests/curl tests/postman clients scripts openapi

# すべてのコードファイルを下記に従って作成してください
```

### ステップ2：JWT秘密鍵の生成

```bash
# 32バイト以上のランダム値を生成してBase64化
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# 出力例：
# v+FvjPyR/a2jKL9mQ8z7nHqwXYzAb1Cjz4sKpNhMiLU=

# .env ファイルに設定
echo "JWT_SECRET_BASE64=$(node -e 'console.log(require(\"crypto\").randomBytes(32).toString(\"base64\"))')" >> .env
```

### ステップ3：依存関係のインストール

```bash
npm install
```

### ステップ4：ゲートウェイサーバー起動

```bash
npm run dev
```

### ステップ5：疎通確認

```bash
curl https://staging.gateway.mocka.example.com/v1/status/ping
# 応答: 200 OK
```

---

## 📝 必要なファイル一覧

### コアファイル

- `src/server.ts` - Express ゲートウェイサーバー（リクエスト処理）
- `src/auth.ts` - JWT認証・検証
- `src/schemas.ts` - Joi スキーマ検証
- `src/logger.ts` - Pino 監査ログ
- `openapi/openapi.yaml` - OpenAPI 3.0 仕様書

### テスト・クライアント

- `tests/curl/intent_submit.sh` - Curl テストスクリプト
- `clients/gemini_client.py` - Gemini クライアント実装
- `clients/copilot_client.ts` - Copilot クライアント実装

### 設定・ユーティリティ

- `.env.example` - 環境変数テンプレート
- `package.json` - Node.js 依存関係
- `scripts/issue_token.ts` - JWT トークン発行スクリプト

---

## 🔐 認証フロー

```
Client (Gemini/Copilot)
    |
    |--- POST /v1/intent/submit
    |     Headers: {
    |       Authorization: Bearer <JWT>,
    |       X-Client-Id: gemini | copilot,
    |       X-Request-Id: <UUID>,
    |       Content-Type: application/json
    |     }
    |     Body: { intent, process, outcome, ... }
    |
    v
MoCKA-GATE
    |
    |--- 1. JWT検証 (HS256, TTL 300秒)
    |--- 2. スキーマ検証 (Joi)
    |--- 3. 監査ログ記録 (BigQuery)
    |--- 4. 応答生成
    |
    v
Response: { status: accepted, requestId, result, auditId }
```

---

## 📦 コードファイル

### 1. src/server.ts

```typescript
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { verifyJwt } from './auth';
import { intentSchema } from './schemas';
import { logger, auditLog } from './logger';

const app = express();
app.use(express.json({ limit: '1mb' }));
app.use(cors({ origin: process.env.CORS_ALLOW_ORIGINS?.split(',') || '*' }));

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: Number(process.env.RATE_LIMIT_PER_MINUTE || 60),
  standardHeaders: true,
  legacyHeaders: false
});
app.use(limiter);

app.get('/v1/status/ping', (_req, res) => res.status(200).send('OK'));

app.post('/v1/intent/submit', async (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
    const clientId = String(req.headers['x-client-id'] || '');

    if (!token) return res.status(401).json({ code: 'AUTH_MISSING', message: 'Bearer token required' });
    const jwtPayload = verifyJwt(token, clientId);

    const { error, value } = intentSchema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({ code: 'SCHEMA_INVALID', message: error.message });
    }

    const requestId = value.meta.requestId;
    const traceId = `TRACE-${Math.random().toString(36).slice(2, 10)}`;
    await auditLog({
      requestId,
      clientId,
      traceId,
      meta: value.meta,
      intent: value.intent,
      outcome_expected: value.outcome?.expected || null,
      timestamp: new Date().toISOString()
    });

    logger.info({ requestId, clientId, traceId }, 'Intent accepted');
    return res.status(200).json({
      status: 'accepted',
      requestId,
      result: {
        message: 'MoCKA-GATE接続確認完了',
        auditId: `AUD-${new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14)}-${requestId.slice(0, 6)}`
      }
    });
  } catch (e: any) {
    const traceId = `TRACE-${Math.random().toString(36).slice(2, 10)}`;
    logger.error({ err: e, traceId }, 'Intent processing failed');
    return res.status(401).json({ code: 'AUTH_INVALID', message: e.message || 'Unauthorized', traceId });
  }
});

const port = Number(process.env.PORT || 8080);
app.listen(port, () => {
  logger.info({ port }, 'MoCKA-GATE listening');
});
```

### 2. src/auth.ts

```typescript
import jwt from 'jsonwebtoken';

export function verifyJwt(token: string, clientId: string) {
  const secretBase64 = process.env.JWT_SECRET_BASE64;
  if (!secretBase64) throw new Error('JWT secret not configured');

  const secret = Buffer.from(secretBase64, 'base64');
  const alg = (process.env.JWT_ALG || 'HS256') as jwt.Algorithm;

  const payload = jwt.verify(token, secret, {
    algorithms: [alg],
    clockTolerance: 30
  }) as any;

  if (payload.clientId !== clientId) {
    throw new Error('clientId mismatch');
  }
  const ttl = Number(process.env.JWT_TTL_SECONDS || 300);
  const issuedAt = payload.iat ? payload.iat * 1000 : Date.now();
  if (Date.now() - issuedAt > ttl * 1000) {
    throw new Error('token expired by TTL');
  }
  return payload;
}
```

### 3. src/schemas.ts

```typescript
import Joi from 'joi';

export const intentSchema = Joi.object({
  meta: Joi.object({
    version: Joi.string().required(),
    clientId: Joi.string().valid('gemini', 'copilot').required(),
    requestId: Joi.string().guid({ version: 'uuidv4' }).required(),
    timestamp: Joi.string().isoDate().required()
  }).required(),
  intent: Joi.object({
    title: Joi.string().required(),
    goal: Joi.string().required(),
    philosophy: Joi.string().required()
  }).required(),
  process: Joi.object({
    steps: Joi.array().items(Joi.string()).min(1).required()
  }).required(),
  outcome: Joi.object({
    expected: Joi.string().required()
  }).required(),
  context: Joi.object({
    labels: Joi.array().items(Joi.string()).default([]),
    locale: Joi.string().default('ja-JP')
  }).default({})
});
```

### 4. src/logger.ts

```typescript
import pino from 'pino';

export const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

type AuditRecord = {
  requestId: string;
  clientId: string;
  traceId: string;
  meta: any;
  intent: any;
  outcome_expected: string | null;
  timestamp: string;
};

export async function auditLog(rec: AuditRecord) {
  logger.info({ audit: rec }, 'AUDIT_LOG');
}
```

---

## ✅ 検証チェックリスト

- [ ] `.env` ファイル設定（JWT_SECRET_BASE64）
- [ ] `npm install` 完了
- [ ] `npm run dev` でサーバー起動
- [ ] `curl /v1/status/ping` で 200 OK 確認
- [ ] JWT トークン発行（`npm run token:gemini`）
- [ ] Curl テスト実行（`tests/curl/intent_submit.sh`）
- [ ] 応答に `status: accepted` と `auditId` が含まれることを確認
- [ ] ログに `AUDIT_LOG` が出力されていることを確認

---

## 🎯 トラブルシューティング

| 問題 | 原因 | 解決策 |
|---|---|---|
| `AUTH_MISSING` | Authorization ヘッダーがない | Bearer <JWT> を指定 |
| `AUTH_INVALID` | JWT署名が無効 | JWT_SECRET_BASE64 を確認 |
| `SCHEMA_INVALID` | リクエストボディが不正 | スキーマ定義を確認 |
| 429 Too Many Requests | レート制限超過 | リクエスト数を制御 |
| タイムアウト | サーバーが遅い | タイムアウト値を増加 |

---

## 📚 参考資料

- [OpenAPI 3.0 仕様](openapi/openapi.yaml)
- [クライアント実装例](clients/)
- [テストスクリプト](tests/)

---

**最終更新：** 2025-12-18
**ステータス：** 接続試験前フェーズ


---

# 🚀 移行章 — Production Migration Ritual

このセクションは、**staging 環境から production 環境への本番移行**を制度的に実施するためのチェックリストと監査証跡フォーマットを規定します。

## 📦 本番移行チェックリスト

### 1. 環境設定

`.env` を本番用に切り替える：

```bash
NODE_ENV=production
BASE_URL=https://gateway.mocka.example.com
RATE_LIMIT_PER_MINUTE=60
LOG_LEVEL=warn
JWT_TTL_SECONDS=300
```

JWT秘密鍵を本番用に再生成（32バイト以上、Base64化）：

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 2. インフラ条件

- [ ] サーバー冗長構成（最低2ノード）
- [ ] ロードバランサー経由で公開
- [ ] BigQuery/Lookerに本番用テーブル作成（`gateway_logs_prod.intent_requests`）
- [ ] Ping監視設定（`/v1/status/ping`）、応答遅延閾値10秒以内

### 3. 認証・セキュリティ

- [ ] JWT署名アルゴリズム：HS256固定
- [ ] 時刻許容：±30秒
- [ ] 本番用トークン発行スクリプト実行（`npm run token:gemini` / `npm run token:copilot`）
- [ ] HTTPS証明書を本番ドメインに適用

### 4. 接続試験（本番環境）

```bash
# 疎通確認
curl https://gateway.mocka.example.com/v1/status/ping
# 応答: 200 OK

# Geminiクライアント試験
BASE_URL=https://gateway.mocka.example.com TOKEN=<JWT> python clients/gemini_client.py
# 応答: 200 / status: accepted / auditId 確認

# Copilotクライアント試験
BASE_URL=https://gateway.mocka.example.com TOKEN=<JWT> node clients/copilot_client.ts
# 応答: 200 / status: accepted / auditId 確認

# レート制限試験（61リクエスト/分で429応答を確認）
for i in {1..65}; do curl https://gateway.mocka.example.com/v1/status/ping; done
```

### 5. 監査・透明性

- [ ] AUDIT_LOG が本番テーブルに記録されていること
- [ ] requestId と auditId の対応が正しく保存されていること
- [ ] エラー応答が正しく返ること（`AUTH_INVALID` / `SCHEMA_INVALID` / `RATE_LIMIT_EXCEEDED`）

---

## 📜 本番移行儀式用 意思伝達型命令書（AI-SHARE-029）

以下の命令書を本番環境へ POST し、`status: accepted` と `auditId` が返れば移行完了です。

```json
{
  "meta": {
    "version": "1.0.0",
    "clientId": "copilot",
    "requestId": "REPLACE_WITH_UUID_V4",
    "timestamp": "2025-12-18T02:00:00Z"
  },
  "intent": {
    "title": "MoCKA-GATE本番移行儀式",
    "goal": "stagingからproductionへの制度的移行完了",
    "philosophy": "透明性・再現性・監査可能性の実体化"
  },
  "process": {
    "steps": [
      "環境変数切替（NODE_ENV=production）",
      "JWT秘密鍵再生成（HS256, 32バイト+）",
      "疎通確認（/v1/status/ping → 200 OK）",
      "監査ログ検証（BigQuery本番テーブル確認）",
      "エラーハンドリング検証（AUTH_INVALID / SCHEMA_INVALID）"
    ]
  },
  "outcome": {
    "expected": "本番環境でHTTP 200 / accepted応答と監査ID付与 → 移行完了宣言"
  },
  "context": {
    "labels": ["production", "migration", "audit"],
    "locale": "ja-JP"
  }
}
```

---

## 📊 監査証跡保存フォーマット

移行儀式の証跡は BigQuery に以下のフォーマットで保存されます：

```json
{
  "auditId": "AUD-20251218-000456",
  "requestId": "REPLACE_WITH_UUID_V4",
  "clientId": "copilot",
  "event": "production_migration",
  "status": "completed",
  "timestamp": "2025-12-18T02:00:00Z",
  "details": {
    "env": "production",
    "steps": [
      "環境変数切替",
      "JWT再生成",
      "疎通確認",
      "監査ログ検証"
    ],
    "outcome": "HTTP 200 / accepted 応答と監査ID付与"
  }
}
```

**フォーマット定義：**
- `auditId`：移行儀式ごとに一意に生成
- `requestId`：意思伝達型命令書の UUID
- `event`：`production_migration` 固定
- `status`：`completed` または `failed`
- `details`：移行ステップと結果を記録

---

## 🎯 移行完了の流れ

1. **GitHub コミット** → `CONNECTION_TEST_RITUAL.md` に移行章を追記
2. **意思伝達型命令書送信** → 本番環境へ POST
3. **応答確認** → `status: accepted` と `auditId` を取得
4. **監査ログ保存** → `event: production_migration` が記録される
5. **移行完了宣言** → 証跡を制度的に承認

この流れにより、MoCKA-GATE は staging から production への本番移行を**儀式的かつ監査可能な方式**で実施します。

---

**移行章作成日時：** 2025-12-18
**ステータス：** 本番移行準備完了
