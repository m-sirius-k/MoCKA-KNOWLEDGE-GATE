# Mem.ai 蜿梧婿蜷醍ｵｱ蜷医ぎ繧､繝・
## 讎りｦ・
Mem.ai 縺ｨ縺ｮ **螳悟・縺ｪ蜿梧婿蜷醍ｵｱ蜷・* 繧貞ｮ溯｣・＠縲；itHub 縺ｨ Mem.ai 髢薙〒繧ｷ繝溘Η繝ｬ繝ｼ繧ｷ繝ｧ繝ｳ邨先棡縺ｨ繝翫Ξ繝・ず繧定・蜍募酔譛溘＠縺ｾ縺吶・
## Mem.ai 邨ｱ蜷医い繝ｼ繧ｭ繝・け繝√Ε

```
GitHub (main branch)
    竊・[GitHub Actions]
API Gateway (Node.js)
    笏懌楳 /api/mem-sync (蜿梧婿蜷大酔譛・
    笏懌楳 /api/mem-webhook (Webhook蜿嶺ｿ｡)
    笏懌楳 /api/mem-export (繧ｨ繧ｯ繧ｹ繝昴・繝・
    笏懌楳 /api/mem-import (繧､繝ｳ繝昴・繝・
    笏懌楳 /api/mem-collections (繧ｳ繝ｬ繧ｯ繧ｷ繝ｧ繝ｳ邂｡逅・
    笏披楳 /api/mem-metadata (繝｡繧ｿ繝・・繧ｿ邂｡逅・
        竊・[Firebase Firestore]
        竊・Mem.ai API
    笏懌楳 Notes
    笏懌楳 Collections
    笏披楳 AI Chat
```

## 蜿梧婿蜷代ヵ繝ｭ繝ｼ

### GitHub 竊・Mem.ai (Push)

```
AI Simulation螳御ｺ・    竊・ISSUE-ID & ROD逡ｪ蜿ｷ逕滓・
    竊・/api/mem-sync (POST) 蜻ｼ縺ｳ蜃ｺ縺・    竊・Note 繝輔か繝ｼ繝槭ャ繝亥､画鋤
    竊・Mem.ai 譁ｰ隕・Note 菴懈・
    竊・繧ｳ繝ｬ繧ｯ繧ｷ繝ｧ繝ｳ蜑ｲ繧雁ｽ薙※
    竊・Firestore 繝｡繧ｿ繝・・繧ｿ菫晏ｭ・```

### Mem.ai 竊・GitHub (Pull)

```
Mem.ai Note 譖ｴ譁ｰ
    竊・Webhook Event 逋ｺ轣ｫ
    竊・/api/mem-webhook 蜿嶺ｿ｡
    竊・繝｡繧ｿ繝・・繧ｿ謚ｽ蜃ｺ
    竊・AI-SIMULATION 譖ｴ譁ｰ
    竊・Git Commit & Push
    竊・逶｣譟ｻ繝ｭ繧ｰ險倬鹸
```

## Mem.ai API 邨ｱ蜷郁ｩｳ邏ｰ

### 隱崎ｨｼ譁ｹ蠑・
```javascript
// Mem.ai API Key
const memApiKey = process.env.MEM_AI_API_KEY;
const memApiEndpoint = 'https://api.mem.ai/v1';

// 繝倥ャ繝繝ｼ
const headers = {
  'Authorization': `Bearer ${memApiKey}`,
  'Content-Type': 'application/json',
  'X-Request-ID': generateUUID(),
};
```

### Note菴懈・繝輔か繝ｼ繝槭ャ繝・
```javascript
{
  title: `AI Simulation: ${issueId}-${rodNumber}`,
  content: `## 螳溯｡檎ｵ先棡\n\n${simulationData}\n\n### 繝｡繧ｿ繝・・繧ｿ\nISSUE-ID: ${issueId}\nROD: ${rodNumber}`,
  collectionId: 'ai-simulations',
  tags: [
    'ai-simulation',
    `issue-${issueId}`,
    `rod-${rodNumber}`,
    'automation'
  ],
  metadata: {
    issueId,
    rodNumber,
    source: 'MoCKA-KNOWLEDGE-GATE',
    timestamp: new Date().toISOString(),
    gitCommit: process.env.GITHUB_SHA,
  }
}
```

### Collection邂｡逅・
```javascript
// 閾ｪ蜍慕噪縺ｫ菴懈・繝ｻ邂｡逅・＆繧後ｋ
Collections:
  - ai-simulations (蜈ｨAI螳溯｡檎ｵ先棡)
  - algorithm-deliverables (謌先棡迚ｩ)
  - knowledge-base (遏･隴倥・繝ｼ繧ｹ)
  - issue-tracking (Issue騾｣謳ｺ)
  - rod-catalog (ROD 邂｡逅・
```

## 繝｡繧ｿ繝・・繧ｿ讒矩

```javascript
{
  memNoteId: 'note-uuid-xxx',
  issueId: 'ISSUE-001',
  rodNumber: 'ROD-001',
  collectionId: 'ai-simulations',
  collectionName: 'AI Simulations',
  syncId: 'sync-ISSUE-001-ROD-001-...',
  direction: 'push' | 'pull',
  status: 'synced' | 'pending' | 'conflict',
  lastSyncTime: '2025-11-18T05:00:00Z',
  sourceTimestamp: '2025-11-18T04:55:00Z',
  contentHash: 'sha256-hash',
  aiChatHistory: [
    {
      query: '...',
      response: '...',
      timestamp: '...'
    }
  ],
  collaborators: ['user1', 'user2'],
  permissions: 'private' | 'team' | 'public',
}
```

## 迺ｰ蠅・､画焚險ｭ螳・
```bash
# Mem.ai API
MEM_AI_API_KEY=xxx
MEM_AI_API_ENDPOINT=https://api.mem.ai/v1
MEM_AI_USER_ID=xxx

# Webhook
MEM_WEBHOOK_SECRET=xxx
MEM_WEBHOOK_URL=https://your-domain.com/api/mem-webhook

# Collection險ｭ螳・MEM_COLLECTION_SIMULATIONS=ai-simulations
MEM_COLLECTION_DELIVERABLES=algorithm-deliverables
MEM_COLLECTION_KNOWLEDGE=knowledge-base

# GitHub
GITHUB_TOKEN=xxx
GITHUB_REPO=m-sirius-k/MoCKA-KNOWLEDGE-GATE

# Firebase
FIREBASE_PROJECT_ID=xxx
FIREBASE_CLIENT_EMAIL=xxx
FIREBASE_PRIVATE_KEY=xxx
```

## 螳溯｣・☆繧帰PI 繧ｨ繝ｳ繝峨・繧､繝ｳ繝・
### 1. /api/mem-sync (蜿梧婿蜷大酔譛・

```javascript
// POST: Mem.ai縺ｸ繧ｨ繧ｯ繧ｹ繝昴・繝・POST /api/mem-sync
{
  issueId: 'ISSUE-001',
  rodNumber: 'ROD-001',
  simulationData: {...},
  direction: 'push' | 'pull' | 'bidirectional'
}

Response:
{
  success: true,
  memNoteId: 'note-uuid',
  syncId: 'sync-xxx',
  contentHash: 'sha256-hash'
}
```

### 2. /api/mem-webhook (繧､繝吶Φ繝亥女菫｡)

```javascript
// POST: Mem.ai Webhook
X-Mem-Signature: HMAC-SHA256
{
  eventType: 'note.updated' | 'note.created' | 'note.deleted',
  noteId: 'note-uuid',
  data: {...}
}
```

### 3. /api/mem-export (繝・・繧ｿ繧ｨ繧ｯ繧ｹ繝昴・繝・

```javascript
// POST: Mem.ai縺ｫ繧ｨ繧ｯ繧ｹ繝昴・繝・// GET: 螻･豁ｴ蜿門ｾ・```

### 4. /api/mem-import (繝・・繧ｿ繧､繝ｳ繝昴・繝・

```javascript
// POST: Mem.ai縺九ｉ繧､繝ｳ繝昴・繝・// GET: 繧､繝ｳ繝昴・繝亥ｱ･豁ｴ
```

### 5. /api/mem-collections (繧ｳ繝ｬ繧ｯ繧ｷ繝ｧ繝ｳ邂｡逅・

```javascript
// POST: 繧ｳ繝ｬ繧ｯ繧ｷ繝ｧ繝ｳ菴懈・
// GET: 繧ｳ繝ｬ繧ｯ繧ｷ繝ｧ繝ｳ荳隕ｧ
// PUT: 繧ｳ繝ｬ繧ｯ繧ｷ繝ｧ繝ｳ譖ｴ譁ｰ
```

### 6. /api/mem-metadata (繝｡繧ｿ繝・・繧ｿ邂｡逅・

```javascript
// CRUD謫堺ｽ懊〒蜷梧悄迥ｶ諷九ｒ邂｡逅・```

## GitHub Actions 邨ｱ蜷・
```yaml
# .github/workflows/ai-simulation.yml 縺ｫ霑ｽ蜉

- name: Export to Mem.ai
  if: success()
  run: |
    curl -X POST http://localhost:3000/api/mem-sync \
      -H "Content-Type: application/json" \
      -d '{
        "issueId": "${{ steps.generate_ids.outputs.ISSUE_ID }}",
        "rodNumber": "${{ steps.generate_ids.outputs.ROD_NUMBER }}",
        "simulationData": ${{ steps.simulation.outputs.RESULT }},
        "direction": "bidirectional"
      }'

- name: Create Mem.ai Collection
  run: |
    curl -X POST http://localhost:3000/api/mem-collections \
      -H "Content-Type: application/json" \
      -d '{
        "name": "${{ steps.generate_ids.outputs.ISSUE_ID }}",
        "parent": "ai-simulations"
      }'
```

## Mem.ai AI Chat 邨ｱ蜷・
```javascript
// Mem.ai 縺ｮ AI Chat 繧呈ｴｻ逕ｨ縺励※縲√す繝溘Η繝ｬ繝ｼ繧ｷ繝ｧ繝ｳ邨先棡繧定・蜍募・譫・
- 閾ｪ蜍戊ｳｪ蝠冗函謌・- 繧､繝ｳ繧ｵ繧､繝域歓蜃ｺ
- 謗ｨ螂ｨ莠矩・署譯・- 逡ｰ蟶ｸ讀懃衍

// 繝√Ε繝・ヨ螻･豁ｴ閾ｪ蜍戊ｨ倬鹸
memMetadata.aiChatHistory.push({
  query: '縺薙ｌ繧峨・邨先棡縺九ｉ菴輔′蟄ｦ縺ｹ繧九・縺具ｼ・,
  response: 'AI 縺ｫ繧医ｋ蛻・梵邨先棡...',
  timestamp: new Date().toISOString()
})
```

## 繧ｳ繝ｬ繧ｯ繧ｷ繝ｧ繝ｳ髫主ｱ､讒矩

```
ai-simulations (繝ｫ繝ｼ繝・
笏懌楳 ISSUE-001 (Issue蛻･)
笏・ 笏懌楳 ROD-001
笏・ 笏懌楳 ROD-002
笏・ 笏披楳 ROD-003
笏懌楳 ISSUE-002
笏披楳 ...

algorithm-deliverables
笏懌楳 Draft
笏懌楳 Final
笏披楳 Archived

knowledge-base
笏懌楳 Patterns
笏懌楳 Insights
笏披楳 Lessons Learned
```

## 蜷梧悄繧ｹ繝・・繧ｿ繧ｹ邂｡逅・
```javascript
Status:
- 'pending': 蜷梧悄蠕・ｩ滉ｸｭ
- 'syncing': 蜷梧悄荳ｭ
- 'synced': 蜷梧悄螳御ｺ・- 'conflict': 遶ｶ蜷域､懷・
- 'failed': 螟ｱ謨・
// 閾ｪ蜍輔Μ繝医Λ繧､
Retry:
  maxAttempts: 3
  backoffMultiplier: 2
  initialDelayMs: 1000
```

## 繧ｻ繧ｭ繝･繝ｪ繝・ぅ

- HMAC-SHA256 鄂ｲ蜷肴､懆ｨｼ
- API Key 證怜捷蛹紋ｿ晏ｭ・- 逶｣譟ｻ繝ｭ繧ｰ險倬鹸
- 繧｢繧ｯ繧ｻ繧ｹ蛻ｶ蠕｡
- 繝ｬ繝ｼ繝亥宛髯・
## Firestore 繧ｳ繝ｬ繧ｯ繧ｷ繝ｧ繝ｳ

```
mem_sync_metadata/
mem_webhook_events/
mem_exports/
mem_imports/
mem_collections/
mem_ai_chat_history/
```

## 繝・せ繝医さ繝槭Φ繝・
```bash
# Mem.ai 蜿梧婿蜷大酔譛溘ユ繧ｹ繝・curl -X POST http://localhost:3000/api/mem-sync \
  -H "Content-Type: application/json" \
  -d '{
    "issueId": "ISSUE-TEST-001",
    "rodNumber": "ROD-TEST-001",
    "direction": "bidirectional"
  }'

# 繧ｳ繝ｬ繧ｯ繧ｷ繝ｧ繝ｳ菴懈・繝・せ繝・curl -X POST http://localhost:3000/api/mem-collections \
  -H "Content-Type: application/json" \
  -d '{"name": "test-collection"}'

# 繝｡繧ｿ繝・・繧ｿ遒ｺ隱・curl -X GET "http://localhost:3000/api/mem-metadata?issueId=ISSUE-001&rodNumber=ROD-001"
```

## 螳悟・閾ｪ蜍輔ヵ繝ｭ繝ｼ

1. **AI Simulation 螳御ｺ・* 竊・GitHub Actions 繝医Μ繧ｬ繝ｼ
2. **Mem.ai 縺ｸ閾ｪ蜍輔お繧ｯ繧ｹ繝昴・繝・* 竊・Note 菴懈・ + 繧ｳ繝ｬ繧ｯ繧ｷ繝ｧ繝ｳ蜑ｲ繧雁ｽ薙※
3. **Firestore 繝｡繧ｿ繝・・繧ｿ菫晏ｭ・* 竊・蜷梧悄迥ｶ諷玖ｨ倬鹸
4. **Mem.ai Webhook** 竊・Note 譖ｴ譁ｰ讀懷・
5. **GitHub 閾ｪ蜍墓峩譁ｰ** 竊・AI-SIMULATION 繝ｪ繝ｳ繧ｯ
6. **逶｣譟ｻ繝ｭ繧ｰ險倬鹸** 竊・螳悟・縺ｪ繝医Ξ繝ｼ繧ｵ繝薙Μ繝・ぅ

## 繝医Λ繝・く繝ｳ繧ｰ

蜈ｨ縺ｦ縺ｮ謫堺ｽ懊′莉･荳九〒霑ｽ霍｡蜿ｯ閭ｽ:
- ISSUE-ID
- ROD 逡ｪ蜿ｷ
- syncId
- memNoteId
- 繧ｿ繧､繝繧ｹ繧ｿ繝ｳ繝・

