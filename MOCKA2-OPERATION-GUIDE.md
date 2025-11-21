# MoCKA 2.0 自律協働フロー（反対意見を踏まえた強化版）- 運用ガイド

## 概要

MoCKA 2.0 は、**PJL が一度課題を投入するだけで、複数の AI（Perplexity、Gemini、Copilot）が自律的に協働実行する**オーケストレーション基盤です。

### 主な特徴

- **Consent Gate＋Role Gate**：許可なく実行しない制度的保護
- **幂等性ハッシュ**：誤配布・二重実行を防止
- **Dry-run/Preview モード**：安全な先行試行
- **自動フォールバック**：障害時も部分成立
- **監査ログ完全記録**：全アクション追跡可能

---

## ファイル構成

```
AI-SHARE-LOGS/
 ├── Tasks/                    # PJL が課題を投入
 │    └── TASK-2025-11-21-001.json
 ├── Queues/                   # Coordinator が AI ごとに配布
 │    ├── Q-Perplexity.json
 │    ├── Q-Gemini.json
 │    └── Q-Copilot.json
 └── Results/                  # 各 AI の成果物
      ├── RES-xxx-Perplexity.json
      ├── RES-xxx-Gemini.json
      └── RES-xxx-Copilot.json

config/
 └── policy.yaml              # Consent/Role/SLA ポリシー

src/phase2/
 ├── coordinator_v2.py        # 中枢配布＋ゲート
 ├── executor_perplexity_v2.py # Perplexity 自律実行
 ├── executor_gemini_v2.py     # Gemini 自律実行
 └── executor_copilot_v2.py    # Copilot 自律実行

.github/workflows/
 └── phase2-execution-v2.yml   # GitHub Actions 全自動化

AUDIT/
 └── audit-log.jsonl          # 全監査ログ
```

---

## 実運用フロー（5ステップ）

### ステップ 1：課題投入（PJL 責務）

```bash
# AI-SHARE-LOGS/Tasks/TASK-2025-11-21-001.json を作成・git push
git add AI-SHARE-LOGS/Tasks/TASK-2025-11-21-001.json
git commit -m "task: Submit R-BIM phase2 analysis task"
git push origin main
```

**必須フィールド：**
- `task_id`：一意の識別子
- `title`：タスク名
- `objective`：目的
- `assigned`：AI と役割の配列
- `inputs`：入力データ（PILS ID など）
- `consent.approved: true`：Consent Gate 通過
- `status: "New"`：初期状態

### ステップ 2：自動配布（Coordinator が自動実行）

**GitHub Actions トリガー：** `AI-SHARE-LOGS/Tasks/*.json` への Push

**Coordinator の処理：**

1. **必須フィールド検証**
   - 欠落していれば `Blocked` 状態にして audit に記録

2. **Consent Gate チェック**
   - `consent.approved !== true` ⇒ ブロック

3. **Role Gate チェック**
   - 各 AI の役割が `policy.yaml` で許可されているか確認

4. **幂等性キー生成**
   - `SHA256(task_id + assigned)` で二重配布を防止

5. **各 AI 用 Queue に配布**
   - `AI-SHARE-LOGS/Queues/Q-{AI}.json` に追加
   - `status: "Ready"` または `status: "Preview"`（Dry-run の場合）

### ステップ 3：AI 自律実行（Executor が並列実行）

各 Executor は自分の Queue を監視し、自律的に実行：

**Perplexity（ingest）：**
- PILS データを Google Drive にアップロード
- NotebookLM に送信
- 失敗時は Drive のみで「Partial 成立」

**Gemini（semantic_index）：**
- テキストをベクトル化（幂等ハッシュ利用）
- 埋め込み配列を生成

**Copilot（protocol_check）：**
- ポリシー検証
- 憲章・法典チェック

### ステップ 4：結果記録（自動）

各 Executor が完了後、自動で以下を実行：

- **Results に成果物を記録**
  ```json
  {
    "result_id": "RES-PILS-2025-11-21-0002-Perplexity",
    "task_id": "TASK-2025-11-21-001",
    "ai": "Perplexity",
    "status": "Completed",
    "links": {"drive_file_id": "...", "notebooklm_id": "..."}
  }
  ```

- **Audit に記録**
  ```jsonl
  {"actor": "Perplexity", "action": "TASK_EXECUTE", "target": "TASK-2025-11-21-001", "timestamp": "2025-11-21T00:00:00Z"}
  ```

### ステップ 5：確認・監査（監査者責務）

```bash
# Audit ログをリアルタイム確認
tail -f AUDIT/audit-log.jsonl

# Results を確認
ls -la AI-SHARE-LOGS/Results/

# 各 Queue の状態確認（全タスク完了なら空）
cat AI-SHARE-LOGS/Queues/Q-Perplexity.json | jq '.tasks[] | select(.status != "Completed")'  # 残っているものだけ表示
```

---

## Dry-run（先行試行）でテスト

GitHub Actions の **workflow_dispatch** を使用：

```bash
# GitHub CLI で Dry-run トリガー
gh workflow run phase2-execution-v2.yml --input dry_run=true
```

**Dry-run の動作：**

- Coordinator：Queues に配布するが `status: "Preview"`
- Executors：Preview タスクはスキップ（実行しない）
- Audit：全ステップが記録される
- **結論：配布・ゲート・監査 まで確認でき、実行しない**

**確認後、本番実行：**

```bash
# workflow_dispatch で dry_run=false（デフォルト）
gh workflow run phase2-execution-v2.yml
```

または

```bash
# 単に git push
git push origin main
```

---

## トラブルシューティング

### Q: タスクが Blocked になった

**原因：** 必須フィールド不足、Consent Gate 失敗、Role Gate 失敗のいずれか

**確認方法：**

```bash
cat AI-SHARE-LOGS/Tasks/TASK-*.json | jq '.error'  # エラー理由を確認
grep "TASK_BLOCKED" AUDIT/audit-log.jsonl | tail -1  # 最新ブロック理由
```

**修正：** `consent.approved: true` を追加し、再度 git push

### Q: NotebookLM アップロード失敗，Partial 成立した

**原因：** NotebookLM API が一時的に利用不可

**確認方法：**

```bash
grep "NOTEBOOKLM_FAIL" AUDIT/audit-log.jsonl
```

**対応：** Drive ファイル ID は保存されているため、
後日 NotebookLM へのアップロードを手動またはリトライ

### Q: 同じタスクを 2 回実行したい

**手順：**

1. `AI-SHARE-LOGS/Tasks/TASK-*.json` の `status` を `"Requeue"` に変更
2. git push → Coordinator が自動で検出
3. 幂等性キーで重複チェック（同じ配布情報なら 2 回目は「IDEMPOTENT_SKIP」）

**異なるインプットで実行する場合：**

新しい task_id で新規投入（例：TASK-2025-11-21-002）

---

## ポリシー変更

`config/policy.yaml` を編集してから git push：

```yaml
consent:
  require_explicit: true
  allowed_actions:
    Perplexity: ["ingest", "notebooklm_save"]  # 追加OK
    Gemini: ["semantic_index", "embedding_prepare"]
    Copilot: ["protocol_check", "policy_validate"]
```

**変更有効化：** 次の Coordinator 実行時に新ポリシーが適用

---

## 参考資料

- **Consent/Role/SLA 定義**：`config/policy.yaml`
- **Coordinator ロジック**：`src/phase2/coordinator_v2.py`
- **各 Executor コード**：`src/phase2/executor_*.py`
- **GitHub Actions 全体**：`.github/workflows/phase2-execution-v2.yml`
- **監査ログ**：`AUDIT/audit-log.jsonl`
