# AI Simulation Results Schema

## Metadata Schema Specification

### Core Metadata Structure

```json
{
  "metadata_version": "1.0",
  "issue_id": "ISSUE-001",
  "rod_number": "ROD-001",
  "model_provider": "claude",
  "model_name": "claude-3-sonnet-20250219",
  "simulation_id": "SIM-UUID",
  "timestamp": "2025-11-18T15:30:00Z",
  "simulation_version": "v1.0",
  "execution_time_ms": 1234,
  "parameters": {
    "temperature": 0.7,
    "max_tokens": 2048,
    "top_p": 1.0
  },
  "result_status": "completed",
  "confidence_score": 0.95,
  "error": null
}
```

## Field Definitions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `issue_id` | string | Yes | GitHub Issue identifier (e.g., ISSUE-001) |
| `rod_number` | string | Yes | Rod number identifier (e.g., ROD-001) |
| `model_provider` | enum | Yes | AI provider: "claude" or "openai" |
| `model_name` | string | Yes | Specific model version |
| `simulation_id` | uuid | Yes | Unique simulation identifier |
| `timestamp` | ISO8601 | Yes | UTC timestamp of simulation |
| `simulation_version` | string | Yes | Version of simulation logic |
| `execution_time_ms` | integer | Yes | Milliseconds to execute |
| `parameters` | object | Yes | Model parameters used |
| `result_status` | enum | Yes | "completed", "failed", "partial" |
| `confidence_score` | float | No | 0.0-1.0 confidence metric |
| `error` | string | No | Error message if failed |

## Simulation Result Format

### File: `simulation_[YYYY-MM-DD_HH-mm-ss].json`

```json
{
  "metadata": { ...metadata object... },
  "input": {
    "prompt": "Original prompt or query",
    "context": {}
  },
  "output": {
    "response": "Model output text",
    "tokens_used": 512,
    "finish_reason": "stop"
  },
  "results": {
    "analysis": {},
    "metrics": {},
    "tags": ["tag1", "tag2"]
  }
}
```

## Index Structure

### Per Rod-Number: `index.json`

```json
{
  "rod_number": "ROD-001",
  "issue_id": "ISSUE-001",
  "simulations": [
    {
      "simulation_id": "SIM-UUID",
      "timestamp": "2025-11-18T15:30:00Z",
      "model": "claude-3-sonnet",
      "file": "simulation_2025-11-18_15-30-00.json",
      "result_status": "completed"
    }
  ],
  "last_updated": "2025-11-18T15:30:00Z",
  "total_simulations": 1
}
```

## Directory Naming Convention

```
ai-simulation/
├── claude/
│   └── ISSUE-001/
│       ├── ROD-001/
│       ├── ROD-002/
│       └── index.json
└── openai/
    └── ISSUE-001/
        ├── ROD-001/
        ├── ROD-002/
        └── index.json
```

## Identifier Format

### Issue ID Format
- Pattern: `ISSUE-[0-9]{3,}`
- Example: `ISSUE-001`, `ISSUE-123`

### Rod Number Format
- Pattern: `ROD-[0-9]{3,}`
- Example: `ROD-001`, `ROD-456`

### Simulation ID Format
- Type: UUID v4
- Example: `550e8400-e29b-41d4-a716-446655440000`

## Timestamp Format
- ISO 8601 UTC format: `YYYY-MM-DDTHH:mm:ssZ`
- File format: `YYYY-MM-DD_HH-mm-ss`

## Validation Rules

1. **Issue ID and Rod Number**: Must follow specified patterns
2. **Model Name**: Must be registered in supported models list
3. **Status Values**: Only "completed", "failed", "partial"
4. **Confidence Score**: Must be between 0.0 and 1.0
5. **Timestamps**: Must be valid ISO 8601 dates
