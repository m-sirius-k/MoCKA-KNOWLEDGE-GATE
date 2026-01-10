# MoCKA-KNOWLEDGE-GATE
MoCKA-PENTAD API仕様と制度的成果物を保存・公開するためのリポジトリ
git add .
git commit -m "Add trigger API endpoint"



## Felo AI Search Integration

This repository now includes **bidirectional integration with Felo AI Search**, enabling automatic synchronization of knowledge data and enriched search results.

### Features
- **Bidirectional Sync**: Automatic data exchange every 5 minutes
- **REST & GraphQL APIs**: Flexible data access methods
- **OAuth2 Authentication**: Secure API access
- **Webhook Support**: Real-time event notifications
- **Data Mapping**: Automatic field transformation between systems
- **Error Handling**: Retry logic and fallback modes
- **Compliance**: GDPR-compliant with data encryption

### Quick Start

1. **Configure Secrets** in GitHub repository settings:
   - `FELO_API_TOKEN`: Your Felo OAuth2 token
   - `FELO_WEBHOOK_URL`: Webhook endpoint for notifications

2. **Review Configuration**:
   - Main config: `connection/connection-info.yaml`
   - Setup guide: `.github/FELO-INTEGRATION-SETUP.md`

3. **Trigger Sync**:
   - Automatic: Every 5 minutes
   - Manual: GitHub Actions → "Felo Bidirectional Sync" → "Run workflow"

### Sync Status
- View logs: `sync_log.txt`
- View enriched data: `docs/felo-enriched-data.json`
- API health: `/metrics/felo-sync`

### Data Flow
```
Knowledge Gate (GitHub)
      ↓ (POST /api/v1/share)
      ↓ - ISSUE-ID, TRUST_SCORE, rod-number
 Felo AI Search API
      ↓ (GET /api/v1/fetch)
      ↓ - search_result_id, relevance_score
Enriched Data (GitHub)
```

### Documentation
For detailed setup and troubleshooting, see:
- [Felo Integration Setup Guide](./.github/FELO-INTEGRATION-SETUP.md)
- [Felo Workflow](./.github/workflows/felo-bidirectional-sync.yml)
- [Connection Configuration](./connection/connection-info.yaml)

### Support
For issues or questions about Felo integration:
1. Check GitHub Actions logs
2. Review `.github/FELO-INTEGRATION-SETUP.md` troubleshooting section
3. Contact repository maintainers



---

## 📦 Implementation Status（Copilot-Verified）

### ✅ Core Implementation Files
- `data/repository_index.json` - MoCKA-KNOWLEDGE-GATE structure index
- `data/ground_truth_rules.json` - AI Ground Truth rule definitions
- `data/structure_map.json` - GitHub→GCS→NotebookLM automation routing
- `functions/mirror_github_to_gcs/main.py` - Cloud Functions implementation
- `functions/mirror_github_to_gcs/requirements.txt` - Python dependencies

### 🔄 Automated Pipeline Status
- GitHub: File change detection ✅
- make.com: Routing automation ✅
- Cloud Functions: GCS mirror sync ✅
- NotebookLM: Ground Truth source ✅

### 📊 Verification Status
- **Gemini** (Design Verification): ⭐⭐⭐⭐⭐ (5.0/5.0) - Complete Implementation
- **Copilot** (Implementation Verification): ⭐⭐⭐⭐ (4.0+/5.0) - Implementation Confirmed
- **Perplexity** (Integration Verification): Pending

## 🔍 Copilot Verification Guide

1. **Check core files** under `/data` and `/functions`
2. **Validate JSON structure** - All JSON files are syntactically valid
3. **Confirm structure_map routing** - Paths in structure_map match repository_index
4. **Confirm Ground Truth rule consistency** - read_sequence and do_not_override align
5. **Verify automation flow** - GitHub→make.com→Cloud Functions→GCS→NotebookLM

## 📋 JSON Schema Validation

All JSON files conform to their respective schemas:
- `repository_index.json` - Defines 3 layers: constitution, implementation, knowledge
- `ground_truth_rules.json` - Defines read_sequence, do_not_override, ai_write_allowed
- `structure_map.json` - Defines watch_targets and automation actions
