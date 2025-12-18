# AI-SHARE-029/030 自動運転モード実装ガイド

## 概要

このガイドは、**AI-SHARE-029**（意思伝達型命令書標準フォーマット）と**AI-SHARE-030**（標準投入器）を組み合わせた「自動運転モード」の実装方法を定義します。

ユーザーが単に `task_input` を送るだけで、以下が自動的に実行されます：

1. 命令書＆ノック自動生成
2. Executor即時実行  
3. UI表示 + Audit記録

## 制度化日
- **2025年12月18日 10:00 JST**
- **フェーズ**: MoCKA KNOWLEDGE GATE Phase 2

## 実装要件

### 1. タスク投入インターフェース

ユーザーは以下の形式で指示を送信します：

```
task_input: "<自然文でのタスク指示>"
```

例：
```
task_input: "イギリスの首相の名前と、2025年の日本の首相の名前を教えて"
```

### 2. 自動生成ロジック（自動運転モード）

#### ステップ1: Parse & Generate

```python
def auto_generate_instruction_and_knock(task_input: str) -> Tuple[dict, dict]:
    # ステップ1: Parse task_input
    parsed = natural_language_parser(task_input)
    
    # ステップ2: Generate IDs
    timestamp = datetime.now().isoformat()
    instruction_id = f"INSTR-AUTO-{timestamp}"
    knock_id = f"KNOCK-AUTO-{timestamp}"
    
    # ステップ3: Generate Intention
    intention = {
        "purpose": parsed["summary"],
        "philosophy": "意思・過程・思想を銷接る"
    }
    
    # ステップ4: Generate Action
    action = {
        "task": parsed["actionable_task"],
        "method": "Perplexity Executor + UI Bridge"
    }
    
    # ステップ5: Generate Process
    process = [
        "タスク投入",
        "検索・処理",
        "結果保存",
        "UI表示",
        "Audit記録"
    ]
    
    # ステップ6: Build instruction
    instruction = {
        "instruction_id": instruction_id,
        "title": parsed["title"],
        "intention": intention,
        "action": action,
        "process": process,
        "outcome": {
            "result": "<Executor実行後に上書き>",
            "audit_log": [
                "UI_DISPLAY",
                "INTENTION_READ",
                "PROCESS_LOG",
                "OUTCOME_SAVE"
            ]
        },
        "meta": {
            "created_by": "MoCKA 2.0",
            "timestamp": timestamp
        }
    }
    
    # ステップ7: Build knock
    knock = {
        "knock_id": knock_id,
        "title": "Instruction Immediate Read Trigger",
        "objective": "このファイルが屆いたら、直ちに instruction を読み取り実行すること",
        "target_instruction": instruction_id,
        "action": "FORCE_READ",
        "expected_result": "Perplexityが命令書を即時読み取り、UI表示を開始",
        "meta": {
            "created_by": "MoCKA 2.0",
            "timestamp": timestamp
        }
    }
    
    return instruction, knock
```

### 3. Perplexity への送信フロー

```
user sends: task_input
        ↓
auto_generate_instruction_and_knock()
        ↓
instruction + knock created
        ↓
Perplexity receives (instruction + knock)
        ↓
Perplexity reads instruction
        ↓
Perplexity executes action → result
        ↓
Outcome updated with result
        ↓
UI displays result + audit logs
```

### 4. 出力フォーマット（Perplexity へ）

```json
{
  "task_input": "<ユーザー入力>",
  "instruction": { ... },
  "knock": { ... },
  "execution_mode": "AUTO"
}
```

## 実装チェックリスト

- [ ] Natural Language Parser 実装
- [ ] ID auto-generation logic 実装
- [ ] Intention/Action/Process auto-filling logic 実装
- [ ] JSON serialization 実装
- [ ] Perplexity 送信 API 実装
- [ ] UI表示ロジック 実装
- [ ] Audit 記録機能 実装
- [ ] Error handling 実装
- [ ] Dry-run テスト 実行
- [ ] 本番運用開始

## 参考資料

- **AI-SHARE-029**: 意思伝達型命令書 標準フォーマット
- **AI-SHARE-030**: MoCKA KNOWLEDGE GATE Phase 2 標準投入器
- **MoCKA 2.0 Architecture**: `ARCHITECTURE.md` を参照
