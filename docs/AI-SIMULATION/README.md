# MoCKA Ecosystem

This repository is part of the **MoCKA Civilization Research Ecosystem**.

MoCKA studies AI civilization systems including governance, consensus and institutional memory.

## Ecosystem Structure

Research Core  
MoCKA

Civilization Theory  
mocka-civilization

Knowledge System  
mocka-knowledge-gate

Transparency Layer  
mocka-transparency

Network Layer  
mocka-outfield

Civilization Core (private)  
mocka-core-private

## 概要

このリポジトリは **MoCKA AI文明研究エコシステム** の一部です。

MoCKAはAI文明の制度、合意形成、知識継承を研究するプロジェクトです。

## 文明構造

研究コア  
MoCKA

文明理論  
mocka-civilization

知識システム  
mocka-knowledge-gate

透明性  
mocka-transparency

ネットワーク  
mocka-outfield

文明コア（非公開）  
mocka-core-private

# AI Simulation Results Storage

## Overview

This directory stores Claude and OpenAI simulation results with structured metadata for tracking and retrieval.

## Directory Structure

```
AI-SIMULATION/
笏懌楳笏 README.md
笏懌楳笏 SCHEMA.md
笏懌楳笏 claude/
笏・  笏披楳笏 [ISSUE-ID]
笏・      笏懌楳笏 [rod-number]/
笏・      笏・  笏懌楳笏 simulation_[timestamp].json
笏・      笏・  笏懌楳笏 metadata.json
笏・      笏・  笏披楳笏 results_summary.md
笏・      笏披楳笏 index.json
笏懌楳笏 openai/
笏・  笏披楳笏 [ISSUE-ID]
笏・      笏懌楳笏 [rod-number]/
笏・      笏・  笏懌楳笏 simulation_[timestamp].json
笏・      笏・  笏懌楳笏 metadata.json
笏・      笏・  笏披楳笏 results_summary.md
笏・      笏披楳笏 index.json
笏披楳笏 index.json
```

## File Naming Convention

- **Directory structure**: `[MODEL]/[ISSUE-ID]/[rod-number]/`
- **Simulation files**: `simulation_[YYYY-MM-DD_HH-mm-ss].json`
- **Metadata files**: `metadata.json` (per rod-number)
- **Index files**: `index.json` (hierarchical tracking)

## Metadata Format

Each simulation includes `metadata.json` with:

```json
{
  "issue_id": "ISSUE-001",
  "rod_number": "ROD-001",
  "model": "claude-3-sonnet",
  "timestamp": "2025-11-18T15:30:00Z",
  "simulation_version": "v1.0",
  "parameters": {},
  "result_status": "completed",
  "confidence_score": 0.95
}
```

## Usage

Simulation results are automatically stored by `scripts/simulation-storage.js` with proper categorization and indexing.

See SCHEMA.md for detailed specifications.

