# Algorithm Deliverables System Guide

## Overview

This guide describes the integrated **Colab <-> MoCKA** algorithm deliverable management system with Draft/Final versioning and bidirectional sync capabilities.

## System Architecture

### Core Components

1. **algorithm-deliverables.js** - Main deliverable management API
   - CREATE Draft versions
   - UPDATE Draft state
   - PROMOTE Draft to Final
   - Archive deliverables

2. **colab-integration.js** - Bidirectional Colab sync
   - Track Colab execution sessions
   - Automatic sync Colab -> Draft
   - Push updates Deliverable -> Colab

3. **deliverable-promotion.js** - Automated promotion workflow
   - Validate Draft eligibility
   - Manage promotion requests
   - Execute approved promotions

## Workflow

### 1. Create Algorithm Deliverable

```bash
POST /api/algorithm-deliverables
Content-Type: application/json

{
  "algorithmName": "My Algorithm",
  "colabUrl": "https://colab.research.google.com/drive/...",
  "issueId": "ISSUE-001",
  "rodNumber": "ROD-001",
  "description": "Algorithm for XYZ",
  "tags": ["ml", "optimization"]
}
```

**Response:**
```json
{
  "success": true,
  "algorithmId": "ALG-ISSUE-001-ROD-001",
  "version": "v1",
  "status": "draft",
  "colabUrl": "https://..."
}
```

### 2. Execute in Colab & Sync

From Colab notebook:

```bash
POST /api/colab-integration
Content-Type: application/json

{
  "algorithmId": "ALG-ISSUE-001-ROD-001",
  "colabUrl": "https://colab.research.google.com/drive/...",
  "executionData": {
    "cellCount": 25,
    "runtimeSeconds": 145
  },
  "metrics": {
    "accuracy": 0.92,
    "loss": 0.18,
    "f1Score": 0.89
  },
  "notebookState": {...}
}
```

**Auto-syncs to Draft version with execution history**

### 3. Check Promotion Eligibility

```bash
GET /api/deliverable-promotion?algorithmId=ALG-ISSUE-001-ROD-001
```

**Response:**
```json
{
  "algorithmId": "ALG-ISSUE-001-ROD-001",
  "canPromote": true,
  "validationIssues": [],
  "executionCount": 5,
  "lastUpdated": "2025-11-18T10:30:00Z"
}
```

### 4. Request Promotion (Draft -> Final)

```bash
POST /api/deliverable-promotion
Content-Type: application/json

{
  "algorithmId": "ALG-ISSUE-001-ROD-001",
  "reason": "Achieved stable 92% accuracy after 5 iterations",
  "requestedBy": "researcher@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "promotionRequestId": "PROMO-ALG-ISSUE-001-ROD-001-1734584400000",
  "status": "pending_approval"
}
```

### 5. Approve Promotion

```bash
PUT /api/deliverable-promotion
Content-Type: application/json

{
  "algorithmId": "ALG-ISSUE-001-ROD-001",
  "promotionRequestId": "PROMO-ALG-ISSUE-001-ROD-001-1734584400000",
  "approvedBy": "approver@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "algorithmId": "ALG-ISSUE-001-ROD-001",
  "newVersion": "v2",
  "status": "final"
}
```

## Data Structure

### Firestore Collections

```
algorithm_deliverables/
  ALG-ISSUE-001-ROD-001/
    (main document)
    ├── versions/
    ━E  ├── v1/ (Draft)
    ━E  ├── v2/ (Final)
    ━E  └── ...
    ├── colab_sessions/
    ━E  ├── COLAB-ALG-ISSUE-001-ROD-001-1734584400000/
    ━E  └── ...
    ├── promotion_requests/
    ━E  ├── PROMO-ALG-ISSUE-001-ROD-001-1734584400000/
    ━E  └── ...
    └── audit_log/
        ├── (action records)
        └── ...
```

## Validation Rules

Draft must meet ALL criteria to be eligible for promotion:

- ✁EAt least 1 Colab execution recorded
- ✁EExecution metrics captured
- ✁EValid Colab URL provided
- ✁EISSUE-ID assigned
- ✁ENo pending errors

## Audit Trail

All actions are logged in `audit_log` with:
- Action type (CREATE_DRAFT, UPDATE_DRAFT, COLAB_SYNC, PROMOTION_APPROVED, etc.)
- Timestamp
- Associated metadata
- Actor information

## Integration with GitHub Actions

Automatic triggers:

1. **Simulation Completion** -> Auto-sync to colab_integration
2. **Promotion Approval** -> Create GitHub Release/Tag
3. **Final Version** -> Commit final algorithm to repo

## Best Practices

1. Always test thoroughly in Colab before requesting promotion
2. Include meaningful execution metrics
3. Document algorithm changes in promotionReason
4. Review audit trail before final approval
5. Tag versions with issue/ROD numbers

## Troubleshooting

**Cannot promote:**
- Check validation issues in promotion status endpoint
- Ensure Colab has been executed
- Verify metrics are captured

**Sync failed:**
- Verify algorithmId matches
- Check Firestore permissions
- Review API error details

**Missing execution history:**
- Confirm POST to colab-integration was successful
- Check timestamps for expected sessions
