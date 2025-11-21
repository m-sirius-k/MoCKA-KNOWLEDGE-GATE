# MoCKA 2.0 テストシナリオ (Test Scenarios)

## 概要 (Overview)

MoCKA 2.0の全機能を検証するためのテストシナリオ集。

## テストカテゴリー (Test Categories)

### 1. Consent Gate テスト

#### TC1.1: Consent Approved
- **条件**: consent.approved = true
- **期待結果**: 実行を進める
- **検証手法**: Role Gateへ進む

#### TC1.2: Consent Denied
- **条件**: consent.approved = false
- **期待結果**: BLOCKED
- **検証手法**: エラーメッセージを記録

### 2. Role Gate テスト

#### TC2.1: Role Match
- **条件**: user roles ⊇ required roles
- **期待結果**: SLA Gateへ進む

#### TC2.2: Role Mismatch
- **条件**: user roles ⊆ required roles
- **期待結果**: BLOCKED

### 3. SLA Gate テスト

#### TC3.1: Within SLA
- **条件**: timeout, max_retries を満たす
- **期待結果**: Executorを選択し実行

#### TC3.2: Timeout Exceeded
- **条件**: 実行時間 > timeout
- **期待結果**: TIMEOUTエラー記録

### 4. Idempotency テスト

#### TC4.1: First Execution
- **条件**: task hash 未登録
- **期待結果**: 実行して結果を記録

#### TC4.2: Duplicate Execution
- **条件**: task hash 既に登録
- **期待結果**: キャッシュ結果を返す (skip)

### 5. Fallback テスト

#### TC5.1: Primary Success
- **条件**: Primary executor 成功
- **期待結果**: 実行完了

#### TC5.2: Primary Failure -> Fallback 1
- **条件**: Primary 失敗, Fallback 1 成功
- **期待結果**: Fallback 1 結果を返す

#### TC5.3: All Executors Fail
- **条件**: Primary, Fallback 1, Fallback 2 全て失敗
- **期待結果**: EXECUTION_FAILED

### 6. Dry-run / Preview テスト

#### TC6.1: Dry-run Mode
- **条件**: dry_run = true
- **期待結果**: DRY-RUN-PREVIEW ステータス、実行なし

#### TC6.2: Normal Mode
- **条件**: dry_run = false
- **期待結果**: EXECUTED

### 7. Audit Logging テスト

#### TC7.1: Event Recording
- **条件**: タスク実行
- **期待結果**: audit.jsonl に記録

#### TC7.2: Append-only Integrity
- **条件**: 複数のタスク実行
- **期待結果**: 各行が記録され、刺つわり町るような記録不可

## 実行方法 (Execution)

### 手動テスト

```bash
# 全テスト実行
cd MoCKA-KNOWLEDGE-GATE
python3 -m pytest tests/ -v

# 特定テストのみ
 python3 -m pytest tests/test_gates.py::TestConsentGate::test_consent_approved -v
```

### CI/CD統合

```yaml
# .github/workflows/test.yml
name: Test Suite
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-python@v2
        with:
          python-version: '3.9'
      - run: pip install pytest
      - run: pytest tests/ -v
```

## 自動テスト (Automated Testing)

### テストフィクスャ (Test Fixtures)

```python
@pytest.fixture
def sample_task():
    return {
        'task_id': 'TEST-001',
        'executor': 'perplexity',
        'consent': {'approved': True},
        'role': {'required': ['executor']},
        'sla': {'timeout_seconds': 3600}
    }
```

## 期待している結果 (Expected Results Summary)

| Test | Condition | Result | Status |
|------|-----------|--------|--------|
| TC1.1 | Approved | Proceed | ✅ |
| TC1.2 | Denied | Blocked | ✅ |
| TC2.1 | Match | Proceed | ✅ |
| TC2.2 | Mismatch | Blocked | ✅ |
| TC3.1 | Within SLA | Execute | ✅ |
| TC3.2 | Timeout | Error | ✅ |
| TC4.1 | First Run | Execute | ✅ |
| TC4.2 | Duplicate | Skip | ✅ |
| TC5.1 | Primary OK | Complete | ✅ |
| TC5.2 | Fallback | Use FB1 | ✅ |
| TC5.3 | All Fail | Error | ✅ |
| TC6.1 | Dry-run | Preview | ✅ |
| TC6.2 | Normal | Execute | ✅ |
| TC7.1 | Audit | Logged | ✅ |
| TC7.2 | Append | Integrity | ✅ |

---

**作成日**: 2025-11-21
**バージョン**: MoCKA 2.0
**ステータス**: Production Ready
