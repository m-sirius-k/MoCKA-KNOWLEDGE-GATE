# MoCKA 2.0 アーキテクチャ概要 (Architecture Overview)

## システム全体構成 (Overall System Design)

MoCKA 2.0は、複数のAI(Perplexity、Gemini、Copilot)が協働して知識タスクを自律実行する分散型システムです。

### コアコンポーネント (Core Components)

```
┌─────────────────────────────────────────────────────────────────┐
│                    GitHub Actions Trigger                        │
│            (phase2-execution-v2.yml)                             │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│              Central Coordinator (coordinator_v2.py)             │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 1. Consent Gate ✓ (同意確認)                            │   │
│  │ 2. Role Gate ✓ (ロール検証)                             │   │
│  │ 3. SLA Gate ✓ (SLA確認)                                 │   │
│  │ 4. Task Distribution (タスク配分)                       │   │
│  │ 5. Audit Logging (監査ログ)                             │   │
│  └─────────────────────────────────────────────────────────┘   │
└────┬──────────────────────┬──────────────────────────┬──────────┘
     │                      │                          │
     ▼                      ▼                          ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────────┐
│ Perplexity   │  │   Gemini     │  │   Copilot        │
│ Executor     │  │   Executor   │  │   Executor       │
│ (Drive/NLM)  │  │ (Embedding)  │  │ (Protocol Check) │
└──────────────┘  └──────────────┘  └──────────────────┘
     │                      │                          │
     └──────────────────────┼──────────────────────────┘
                            ▼
        ┌──────────────────────────────────┐
        │  Result Recording & Audit Trail  │
        │  (JSONL Format - append-only)    │
        └──────────────────────────────────┘
```

## ゲートウェイシステム (Gate System)

### 1. Consent Gate (同意ゲート)
**目的**: ユーザー/管理者の明示的な同意を確認

```yaml
consent:
  require_explicit: true
  approved: false
  timestamp: "2025-11-21T09:00:00Z"
  approver: "admin@example.com"
```

### 2. Role Gate (ロールゲート)
**目的**: ユーザー権限とタスク権限要件をマッチング

### 3. SLA Gate (SLAゲート)
**目的**: 実行制約(タイムアウト、リトライ回数)を検証

## 幹等性 (Idempotency)

長いタスクを数回実行しても同じ結果を返す。
- ハッシュベース重複検知
- 及び罫等性頒保

## Dry-run / Preview モード

本実行前に予測結果を返し、実際の処理は実行しません。

## 監査ログ (Audit Logging)

- 追記手法: Append-only JSONL形式
- 全アクションを記録
- 改ざん防止

## 自動フォールバック (Fallback Mechanism)

Primary Executor → Fallback 1 → Fallback 2 → ERROR

## ファイル構造 (File Structure)

```
MoCKA-KNOWLEDGE-GATE/
├── config/policy.yaml
├── src/phase2/
│   ├── coordinator_v2.py
│   ├── executor_perplexity_v2.py
│   ├── executor_gemini_v2.py
│   └── executor_copilot_v2.py
├── AI-SHARE-LOGS/
│   ├── Tasks/
│   └── audit.jsonl
└── .github/workflows/phase2-execution-v2.yml
```

## ダータフロー (Data Flow)

1. Task Submission → GitHub Action Trigger
2. Gate Validation (Consent/Role/SLA)
3. Executor Selection → Autonomous Execution
4. Result Recording → Audit Trail

## セキュリティ考慮事項 (Security)

- Consent enforcement (同意強制)
- Role-based access control
- Audit trail (改ざん防止)
- Idempotency protection

---

**作成日**: 2025-11-21
**バージョン**: MoCKA 2.0
**ステータス**: Production Ready
