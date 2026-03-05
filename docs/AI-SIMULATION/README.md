# AI Simulation Results Storage

## Overview

This directory stores Claude and OpenAI simulation results with structured metadata for tracking and retrieval.

## Directory Structure

```
AI-SIMULATION/
├── README.md
├── SCHEMA.md
├── claude/
━E  └── [ISSUE-ID]
━E      ├── [rod-number]/
━E      ━E  ├── simulation_[timestamp].json
━E      ━E  ├── metadata.json
━E      ━E  └── results_summary.md
━E      └── index.json
├── openai/
━E  └── [ISSUE-ID]
━E      ├── [rod-number]/
━E      ━E  ├── simulation_[timestamp].json
━E      ━E  ├── metadata.json
━E      ━E  └── results_summary.md
━E      └── index.json
└── index.json
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
