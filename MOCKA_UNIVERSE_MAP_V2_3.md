# MoCKA Universe Map v2.3 - 7-Layer Hierarchy & AI Organ Model

## 1. MoCKA Universe Hierarchy (7-Layer)

- **Layer 0: Environment** - NYPC_COMET / IP / ORG (The foundation)
- **Layer 1: Permissions** - MAT / Profile (The gatekeeper)
- **Layer 2: Physical Body** - MoCKA Core / Proxy (The manifestation)
- **Layer 3: External Brain** - Perplexity / Gemini / Claude / GenSpark (The cognitive organs)
- **Layer 4: Memory (PILS)** - Notion / Drive / GitHub / NotebookLM (The knowledge storage)
- **Layer 5: Creation** - v0 / Gamma / Canva (The visualization/prototyping)
- **Layer 6: Action** - browser-use / Zapier / Dify (The operational muscles)

## 2. AI Organ Model (Brain Functions)

### 前頭葉 (Think & Judge)
- **Perplexity**: Exploration, synthesis, and deep research.
- **Gemini**: Consensus building, mediation, and high-level strategy.
- **Claude**: Logical analysis, code auditing, and structure validation.
- **GenSpark**: Knowledge aggregation and rapid summarization.

### 海馬 (Memory & Consolidation)
- **Notion (PILS)**: Long-term operational memory and ritual logs.
- **Drive**: Chronological time-series archives.
- **GitHub**: Canonical artifacts, "Source of Truth" (Seiten).
- **NotebookLM**: Knowledge crystallization and semantic search.

### 運動野 (Action & Execution)
- **browser-use**: Web-based UI automation and navigation.
- **Zapier/Dify**: Multi-app synchronization and RAG-hub orchestration.

### 視覚野 (Visualization & Prototyping)
- **v0.app**: UI/UX prototyping.
- **Gamma/Canva**: Visual presentation and documentation design.

---

## 3. PILS Operational Protocols

### Reference Priority (参照優先順位)
When retrieving past context, MoCKA must follow this order:
1. **PILS (Notion)** - Current operational truth.
2. **GitHub** - Established specifications.
3. **Drive** - Raw historical data.

### Negative Knowledge (失敗の系譜)
All failures must be tagged in PILS to prevent recurrence:
- `failure_case`: General logic or execution failure.
- `blocked_by_policy`: Policy or safety constraints.
- `environment_mismatch`: UI or resolution-based errors.
- `proxy_rejected`: Connectivity or proxy-level issues.

### Deliberation Logs (合議プロセス)
Complex decisions should record the logic of each AI organ:
- `deliberation`:
  - `gemini`: Strategy/Consensus
  - `perplexity`: Research/Context
  - `claude`: Logic/Audit

### Environment Snapshots
Every write operation must include the following metadata:
- Resolution: `3440px`
- Context: `Active Window / URL`
- Phase: `Execution Phase ID`
- Ancestry ID: `Genealogy Link`
