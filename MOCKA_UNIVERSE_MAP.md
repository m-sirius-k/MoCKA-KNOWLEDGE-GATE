# MoCKA Universe Map & Architecture (v2.3 Evolution)

## 血 1. MoCKA Universe Hierarchical Structure (7 Layers)

AI components and human agents must align their actions according to this hierarchy:

| Layer | Type | Domain | Primary Entities |
|-------|------|--------|------------------|
| **L0** | Environment | 繧､繝ｳ繝輔Λ | NYPC_COMET, IP, Desktop (3440px), OS Specs |
| **L1** | Permissions | 讓ｩ髯・| MAT (Master Access Token), Profiles, Roles |
| **L2** | Body | 霄ｫ菴・| MoCKA Core, Proxy, browser-use, UI Interaction |
| **L3** | External Brain | 諤晁・| Perplexity, Gemini, Claude, GenSpark |
| **L4** | Memory | 險俶・ | **PILS (Notion)**, GitHub (Canon), Drive, NotebookLM |
| **L5** | Creation | 蜑ｵ騾 | v0.app, Gamma, Canva |
| **L6** | Action | 陦悟虚 | Zapier, Dify, Webhooks, API Orchestration |

---

## ｧ 2. AI Organ Model (Division of Labor)

To optimize cognitive load, each AI acts as a specific organ in the MoCKA collective brain:

### 蜑埼ｭ闡・(Think & Judge)
- **Perplexity**: Exploration, synthesis, and deep research.
- **Gemini**: Consensus building, mediation, and high-level strategy.
- **Claude**: Logical analysis, code auditing, and structure validation.
- **GenSpark**: Knowledge aggregation and rapid summarization.

### 豬ｷ鬥ｬ (Memory & Consolidation)
- **Notion (PILS)**: Long-term operational memory and ritual logs.
- **Drive**: Chronological time-series archives.
- **GitHub**: Canonical artifacts, "Source of Truth" (Seiten).
- **NotebookLM**: Knowledge crystallization and semantic search.

### 驕句虚驥・(Action & Execution)
- **browser-use**: Web-based UI automation and navigation.
- **Zapier/Dify**: Multi-app synchronization and RAG-hub orchestration.

### 隕冶ｦ夐㍽ (Visualization & Prototyping)
- **v0.app**: UI/UX prototyping.
- **Gamma/Canva**: Visual presentation and documentation design.

---

## 糖 3. PILS Operational Protocols

### Reference Priority (蜿ら・蜆ｪ蜈磯・ｽ・
When retrieving past context, MoCKA must follow this order:
1. **PILS (Notion)** - Current operational truth.
2. **GitHub** - Established specifications.
3. **Drive** - Raw historical data.

### Negative Knowledge (螟ｱ謨励・邉ｻ隴・
All failures must be tagged in PILS to prevent recurrence:
- `failure_case`: General logic or execution failure.
- `blocked_by_policy`: Policy or safety constraints.
- `environment_mismatch`: UI or resolution-based errors.
- `proxy_rejected`: Connectivity or proxy-level issues.

### Environment Snapshots
Every write operation must include the following metadata:
- Resolution: `3440px`
- Context: `Active Window / URL`
- Phase: `Execution Phase ID`
- Ancestry ID: `Genealogy Link`

---

**Status**: MoCKA 2.3 Official Canonical Map  
**Last Updated**: 2026-02-04  
**Authority**: MoCKA Hierarchy L1 (User Sovereign) via L2 (Comet Assistant)
