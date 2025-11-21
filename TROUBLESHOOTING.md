# MoCKA 2.0 トラブルシューティング (Troubleshooting Guide)

## 一般的な問首 (Common Issues)

### Q1: "Consent Gate BLOCKED" エラーが計算される

**原因**: consent.approved = false

**解決方法**:
```yaml
# config/policy.yaml を編集
consent:
  approved: true  # ⇒ true に変更
```

### Q2: "Role Gate BLOCKED" エラー

**原因**: user roles ⊄ required roles

**解決方法**:
```json
// AI-SHARE-LOGS/Tasks/TASK-*.json
{
  "role": {
    "required": ["executor"],
    "user": ["executor", "auditor"]  // ⇒ required を含む
  }
}
```

### Q3: "SLA Gate TIMEOUT"

**原因**: 実行時間 > timeout_seconds

**解決方法**:
```yaml
# config/policy.yaml
sla:
  timeout_seconds: 7200  # ⇒ 値を増やす
```

### Q4: "Executor Not Found" (Perplexity/Gemini/Copilot 失敗)

**原因**: API キーが未設定または無効

**解決方法**:
```bash
# 環境変数を確認
export PERPLEXITY_API_KEY="your-key"
export GEMINI_API_KEY="your-key"
export COPILOT_API_KEY="your-key"
```

### Q5: "Idempotency Hash Conflict"

**原因**: 同一の task_id を複数実行

**解決方法**:
```bash
# executed_hashes.json を削除
 rm AI-SHARE-LOGS/executed_hashes.json
```

## デバッグ恋針 (Debug Tips)

### 1. コーディネーターを確認

```bash
python3 src/phase2/coordinator_v2.py --debug
```

### 2. 槻査ログを閉覧

```bash
tail -f AI-SHARE-LOGS/audit.jsonl
```

### 3. Dry-run モードでテスト

```json
{
  "dry_run": true,
  "task_id": "DRY-TEST-001"
}
```

## 針特的なコマンド (Specific Commands)

### Executor を単独実行

```bash
# Perplexity
python3 src/phase2/executor_perplexity_v2.py --task-file TASK-001.json

# Gemini
python3 src/phase2/executor_gemini_v2.py --task-file TASK-001.json

# Copilot
python3 src/phase2/executor_copilot_v2.py --task-file TASK-001.json
```

### 監査ログを整理

```bash
# JSON 形式で視须
git log --pretty=format:'%H %s' | head -20

# 何行も出力
wc -l AI-SHARE-LOGS/audit.jsonl
```

## 連絡 (Support)

**問題が解決しない場合**:
1. GitHub Issues をも開設する
2. ARCHITECTURE.md を再読し輿をう
3. 槻査ログを添付して記輔を再構成

---

**作成日**: 2025-11-21
**バージョン**: MoCKA 2.0
**ステータス**: Production Ready
