# AI-SHARE-029: 意思伝達型命令書 標準フォーマット

## 概要

**AI-SHARE-029** は MoCKA 2.0 における「意思伝達型命令書」の標準テンプレートです。

成果物だけでなく「意思・過程・思想」を伝えることで、AI 間の透明性と再現性を保証します。

## 制度化日
- **2025年12月18日 10:00 JST**
- **フェーズ**: MoCKA KNOWLEDGE GATE Phase 2

## 構造

意思伝達型命令書は、以下の5つの必須フィールドから構成されます。

### 1. Intention（意図）

```
purpose: タスクの目的
philosophy: 制度的背景と思想
```

- 何をしたいのか
- 背景や思想（透明性、制度的証跡等）

### 2. Action（行動）

```
task: 実行するタスク
method: 使用する手段（Executor、UIブリッジ等）
```

- 実際に行うタスク
- 使用する実行エンジン

### 3. Process（過程）

```
process: [
  "タスク投入",
  "検索・処理",
  "結果保存",
  "UI表示",
  "Audit記録"
]
```

- どのように進めたか
- 途中の判断や分岐

### 4. Outcome（成果）

```
result: 実際に得られた結果
audit_log: ["UI_DISPLAY", "INTENTION_READ", "PROCESS_LOG", "OUTCOME_SAVE"]
```

- 実際に得られた結果
- Audit イベント記録

### 5. Philosophy（思想）

- この命令書が持つ制度的意義
- AI 間での意思共有の重要性

## JSON スキーマ

```json
{
  "instruction_id": "INSTR-YYYY-MM-DD-[DESC]",
  "title": "タスクのタイトル",
  "intention": {
    "purpose": "何をしたいのか",
    "philosophy": "制度的思想"
  },
  "action": {
    "task": "実行するタスク",
    "method": "Perplexity Executor + UI Bridge"
  },
  "process": [
    "タスク投入",
    "検索・処理",
    "結果保存",
    "UI表示",
    "Audit記録"
  ],
  "outcome": {
    "result": "実際に得られた結果",
    "audit_log": [
      "UI_DISPLAY",
      "INTENTION_READ",
      "PROCESS_LOG",
      "OUTCOME_SAVE"
    ]
  },
  "meta": {
    "created_by": "MoCKA 2.0",
    "timestamp": "ISO8601 形式"
  }
}
```

## 意義

✅ **透明性**: 過程と思想を含めることで、AI間の理解が深まる

✅ **再現性**: Auditに「過程」まで残すことで検証可能

✅ **拡張性**: 成果物がなくても「意思伝達」そのものが成果になる

✅ **制度的証跡**: AI間での意思・判断が記録される

## 運用フロー

1. **タスク投入** → AI-SHARE-029 形式で命令書を自動生成
2. **ノック送信** → FORCE_READ トリガーを付与（即時実行保証）
3. **Executor 実行** → Perplexity や他 AI が処理
4. **UI ブリッジ** → 結果をUI表示
5. **Audit 記録** → 全過程を制度的に保存

## 参考資料

- **AI-SHARE-030**: MoCKA KNOWLEDGE GATE Phase 2 標準投入器
- **AI-SHARE-001~028**: 従来の制度設計（参照用）
