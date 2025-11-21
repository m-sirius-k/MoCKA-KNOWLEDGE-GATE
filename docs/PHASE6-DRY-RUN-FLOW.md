# Phase 6: Claude External Audit AI - Dry-Run Flow Documentation

## Overview

Phase 6 introduces **Claude** as an external audit role to MoCKA 2.0. This document describes the Dry-run flow, which allows validation of the external audit system without modifying permanent state.

## Architecture

### Components

1. **executor_claude.py** - External audit executor
   - Role: External Reviewer & Governance Auditor
   - Location: `src/phase2/executor_claude.py`
   - Function: Re-validate audit logs, generate improvement proposals

2. **Q-Claude.json** - Claude task queue
   - Location: `AI-SHARE-LOGS/Queues/Q-Claude.json`
   - Function: Distributes tasks to Claude executor
   - Supports dry-run mode (Preview status)

3. **Sample Tasks** - Phase 6 validation tasks
   - Task ID: `TASK-2025-11-21-CLAUDE-001`
   - Location: `AI-SHARE-LOGS/Tasks/`
   - Mode: Preview (Dry-run)

4. **Audit Logs** - Execution records
   - Location: `AUDIT/audit-log.jsonl`
   - Records: DRY_RUN, TASK_EXECUTE, QUEUE_UPDATED events

## Dry-Run Execution Flow

### Step 1: Prepare Queue Configuration

Load `Q-Claude.json` with sample task at Preview status:

```json
{
  "tasks": [
    {
      "task_id": "TASK-2025-11-21-CLAUDE-001",
      "status": "Preview"
    }
  ]
}
```

### Step 2: Execute executor_claude.py

```bash
python src/phase2/executor_claude.py
```

### Step 3: Monitor Dry-Run Behavior

**Expected Output:**

```
============================================================
MoCKA 2.0 Phase 6 - External Audit AI (Claude) Executor
Role: External Reviewer & Governance Auditor
Execution Start: 2025-11-21T11:00:00.123456
============================================================
[DRY_RUN] Processing TASK-2025-11-21-CLAUDE-001
[INFO] No tasks to process or all tasks already completed
============================================================
Execution Complete: 2025-11-21T11:00:00.234567
Result: SUCCESS
============================================================
```

### Step 4: Verify Audit Trail

Check `AUDIT/audit-log.jsonl` for DRY_RUN records:

```json
{
  "actor": "Claude",
  "role": "external_review",
  "action": "DRY_RUN",
  "target": "TASK-2025-11-21-CLAUDE-001",
  "result": "ok",
  "timestamp": "2025-11-21T11:00:00.123456",
  "executor": "executor_claude.py"
}
```

## Key Features

### 1. Preview Mode (Dry-Run)

- **Status**: `Preview`
- **Behavior**: Audit-only, no queue state modification
- **Audit Record**: `DRY_RUN` action logged
- **Queue State**: Unchanged after execution

### 2. Comprehensive Audit Checks

During external review, Claude validates:

- Trust score integrity
- SLA compliance
- Idempotency verification
- Improvement recommendations
- Phase 6 readiness

### 3. Institutional Governance

Generated recommendations include:

- SLA rate enhancement
- Idempotency key re-validation
- Looker/BigQuery monitoring integration
- External auditor access (Firebase invitation codes)
- README-MOCKA2.md documentation updates

### 4. Dual-Verification Model

```
Internal Audit (Copilot) + External Audit (Claude) = Institutional Dual-Verification
```

## Phase 6 Readiness Tracking

Phase 6 milestone includes validation of:

1. **Looker Integration**: Pending (BQ connection required)
2. **AI Review Chain**: Completed (Copilot + Claude active)
3. **External Access Model**: Implemented (Firebase invitation codes)
4. **Documentation**: In progress (README-MOCKA2.md expansion)

## Execution Scenarios

### Scenario 1: Successful Dry-Run

```
Queue Status: Preview
    ↓
executor_claude.py reads Q-Claude.json
    ↓
Detects Preview status → DRY_RUN mode
    ↓
Records audit entry (DRY_RUN action)
    ↓
No queue state modification
    ↓
Execution complete: SUCCESS
```

### Scenario 2: Production Execution (Ready Status)

```
Queue Status: Ready
    ↓
executor_claude.py reads Q-Claude.json
    ↓
Generates comprehensive audit checks
    ↓
Saves results to AI-SHARE-LOGS/Results/
    ↓
Records audit entry (TASK_EXECUTE action)
    ↓
Updates queue status to Completed
    ↓
Execution complete: SUCCESS
```

## Integration Points

### Firebase External Auditor Role

```javascript
{
  "role": "external_auditor",
  "permissions": [
    "read:audit-logs",
    "read:results",
    "read:queue-status"
  ],
  "invitation_code_required": true
}
```

### Looker Dashboard Connection

- KPI Tracking: Task completion rate, SLA compliance, re-entry rate
- Data Source: AI-SHARE-LOGS/Results/ + AUDIT/audit-log.jsonl
- Refresh: Real-time streaming

## Troubleshooting

### Issue: DRY_RUN not recorded

**Check:**
- Q-Claude.json status = "Preview"
- AUDIT directory exists
- File permissions allow write access

### Issue: Queue file not found

**Check:**
- Q-Claude.json exists in AI-SHARE-LOGS/Queues/
- Path is correctly configured in executor_claude.py

## Next Steps

1. **Execute dry-run** with TASK-2025-11-21-CLAUDE-001
2. **Verify audit trail** in AUDIT/audit-log.jsonl
3. **Validate README-MOCKA2.md** integration
4. **Configure Looker** dashboard for external visibility
5. **Implement Firebase** external auditor role
6. **Complete Phase 6** with external auditor onboarding

## References

- executor_claude.py: External audit AI implementation
- Q-Claude.json: Queue configuration
- TASK-2025-11-21-CLAUDE-001.json: Sample task
- AUDIT/audit-log.jsonl: Execution records

---

**Phase 6 Status**: External Audit Integration - Active ✓
**Last Updated**: 2025-11-21
**Version**: 1.0
