# MoCKA Knowledge Gate — Institutional Memory Layer

<p align="center">
  <img src="https://raw.githubusercontent.com/m-sirius-k/MoCKA/main/docs/images/mocka_overview.svg" width="800">
</p>

> **This is not a database. Not a knowledge base. Not a search index.**
> It is the layer that records HOW knowledge was formed —
> hypothesis → attempt → validation → correction → retry —
> as reproducible, verifiable artifacts.
>
> Its purpose is not to make AI smarter.
> Its purpose is to historicize trial and error.

---

## Position in mocka_Movement

<p align="center">
  <img src="https://raw.githubusercontent.com/m-sirius-k/MoCKA/main/docs/images/mocka_architecture_v2.svg" width="720">
</p>
```
MoCKA (core · heart)
      ↓
[ mocka-knowledge-gate ]   ← ② Record — YOU ARE HERE
      ↓
mocka-transparency         ③ Incident · ④ Recurrence
      ↓
mocka-external-brain       ⑥ Decision
      ↓
mocka-civilization         ⑧ Institutionalize
```

**Loop step: ② Record**
Upstream: MoCKA core → sends structured events
Downstream: mocka-transparency → verifies records

---

## What this repository does

<p align="center">
  <img src="https://raw.githubusercontent.com/m-sirius-k/MoCKA/main/docs/images/mocka_loop_v2.svg" width="720">
</p>

mocka-knowledge-gate preserves the evolution of reasoning itself.

Each entry anchors:
- Hypothesis formation
- Experimental attempts
- Validation results
- Corrective adjustments
- Subsequent retries

By structuring reasoning traces over time, this layer enables:
- Historically accountable AI cognition
- Reproducible reasoning pathways
- Cross-agent knowledge continuity
- Long-term institutional memory for verifiable systems

---

## acceptor:infield

This layer IS the infield.
```
mocka_Receptor receives stimulus
      ↓
acceptor:infield    ← knowledge-gate stores here
(store · memory · accumulate)
      ↓
mocka_insight_system (mocka_Movement + shadow_Movement)
```

infield = what the civilization remembers.
The same event can also flow to acceptor:outfield for external sharing.

---

## A single event — end to end
```
Human sends intent via control panel
      ↓
mocka_Receptor receives the stimulus
      ↓
acceptor:infield stores it as a structured 5W1H event
      ↓
ledger.json seals it with SHA256 chain
      ↓
mocka-seal anchors it to governance/anchor_record.json
      ↓
verify_all confirms: ALL CHECKS PASSED
      ↓
The event is now part of institutional memory — forever.
```

---

## Quick Start
```powershell
# Step 1 — Verify the system is intact
mocka-check
# → LEDGER OK + ALL CHECKS PASSED

# Step 2 — Seal a new institutional memory entry
mocka-seal "your knowledge entry here"
# → ANCHOR UPDATED AND COMMITTED
# → ALL CHECKS PASSED
```

---

## Status

**v1.0.0 — Active Development**
Part of the MoCKA deterministic governance architecture.
Loop position: ② Record
All governance checks passing.

---

## 日本語

### MoCKA Knowledge Gateとは何か

データベースではありません。ナレッジベースでもありません。
知識がどのように形成されたかを記録する層です：
仮説 → 試行 → 検証 → 修正 → 再試行
すべてが再現可能なアーティファクトとして保存されます。

目的はAIを賢くすることではありません。
AIの試行錯誤を歴史化することです。

### mocka_Movementにおける位置づけ
```
MoCKA（コア・心臓部）
      ↓
[ mocka-knowledge-gate ]   ← ② Record — ここです
      ↓
mocka-transparency         ③ Incident · ④ Recurrence
      ↓
mocka-external-brain       ⑥ Decision
      ↓
mocka-civilization         ⑧ 制度化
```

**ループステップ：② Record（記録）**
上流：MoCKA（コア）→ 構造化イベントを送信
下流：mocka-transparency → 記録を検証

### このリポジトリの役割

推論の進化そのものを保存します。

各エントリは以下を固定します：
- 仮説形成
- 実験的試行
- 検証結果
- 修正過程
- 再試行

本リポジトリは以下を実現します：
- 歴史的責任を伴うAI思考
- 再現可能な推論経路
- エージェント間の知識連続性
- 検証可能なシステムのための長期制度的記憶

### acceptor:infield

このレイヤーがinfield（内部記憶）そのものです。

infield = 文明が記憶する場所。
同じイベントがacceptor:outfieldにも流れ、外部共有が可能です。

---

Part of the [MoCKA Deterministic Governance Architecture](https://github.com/m-sirius-k/MoCKA).
