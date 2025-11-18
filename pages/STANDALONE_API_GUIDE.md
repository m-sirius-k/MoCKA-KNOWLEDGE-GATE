# MoCKA Knowledge Gate - Standalone API Guide

## Overview

MoCKA-KNOWLEDGE-GATE has been refactored to function as a **completely standalone API** with **NO external service dependencies**. All APIs use pure Node.js file-system operations for data storage and retrieval.

### Key Features
- ✅ **Self-contained**: No Firebase, no external APIs required
- ✅ **File-based storage**: JSON files for data persistence
- ✅ **CORS enabled**: Ready for cross-origin requests
- ✅ **Comprehensive indexing**: Built-in metadata and discovery APIs
- ✅ **Open format**: Easy to understand and extend

---

## Standalone APIs

### 1. Knowledge Search API
**Endpoint**: `GET /api/knowledge-search`

Search the knowledge base with advanced filtering capabilities.

**Query Parameters**:
- `q` (string): Search query term
- `type` (string): Filter by type (optional)
- `limit` (number): Maximum results (default: 50)

**Example Request**:
```bash
curl "http://localhost:3000/api/knowledge-search?q=simulation&limit=10"
```

**Response**:
```json
{
  "success": true,
  "query": "simulation",
  "results": [
    {
      "file": "item1.json",
      "path": "data/knowledge/item1.json",
      "size": 1024,
      "matches": 3
    }
  ],
  "total": 1
}
```

---

### 2. Knowledge Export API
**Endpoint**: `GET /api/knowledge-export`

Export the entire knowledge base in multiple formats.

**Query Parameters**:
- `format` (string): Export format - `json`, `csv`, or `markdown` (default: json)
- `issue` (string): Filter by ISSUE-ID (optional)
- `rod` (string): Filter by ROD number (optional)

**Example Requests**:
```bash
# Export all knowledge as JSON
curl "http://localhost:3000/api/knowledge-export?format=json"

# Export as CSV
curl "http://localhost:3000/api/knowledge-export?format=csv"

# Export as Markdown
curl "http://localhost:3000/api/knowledge-export?format=markdown"

# Export filtered by ISSUE-ID
curl "http://localhost:3000/api/knowledge-export?format=json&issue=ISSUE-001"
```

**Response** (JSON format):
```json
{
  "success": true,
  "format": "json",
  "metadata": {
    "exportDate": "2024-01-15T10:30:00Z",
    "totalRecords": 42,
    "filters": {}
  },
  "records": [
    { "file": "item1.json", "path": "...", "size": 1024 }
  ]
}
```

---

### 3. Conversations API
**Endpoint**: `/api/conversations-standalone`

Manage conversations with full CRUD operations.

**Supported Methods**:
- `GET` - Retrieve all conversations
- `POST` - Create/save a conversation
- `PUT` - Update an existing conversation
- `DELETE` - Remove a conversation

**GET All Conversations**:
```bash
curl "http://localhost:3000/api/conversations-standalone"
```

Response:
```json
{
  "success": true,
  "conversations": [
    {
      "id": "conv1",
      "title": "Discussion about AI",
      "messages": [...]
    }
  ],
  "total": 1
}
```

**POST Create/Save Conversation**:
```bash
curl -X POST "http://localhost:3000/api/conversations-standalone" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "conv1",
    "data": {
      "title": "Discussion",
      "messages": [{"role": "user", "content": "Hello"}]
    }
  }'
```

Response:
```json
{
  "success": true,
  "status": "saved",
  "id": "conv1",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**PUT Update Conversation**:
```bash
curl -X PUT "http://localhost:3000/api/conversations-standalone" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "conv1",
    "data": {"title": "Updated Discussion"}
  }'
```

**DELETE Remove Conversation**:
```bash
curl -X DELETE "http://localhost:3000/api/conversations-standalone" \
  -H "Content-Type: application/json" \
  -d '{"id": "conv1"}'
```

---

### 4. Metadata & Index API
**Endpoint**: `GET /api/metadata-index`

Get comprehensive metadata about all resources and available endpoints.

**Query Parameters**:
- `type` (string): Resource type - `all`, `conversations`, `knowledge`, or `simulations` (default: all)

**Get All Metadata**:
```bash
curl "http://localhost:3000/api/metadata-index"
```

Response:
```json
{
  "success": true,
  "timestamp": "2024-01-15T10:30:00Z",
  "api": {
    "name": "MoCKA Knowledge Gate - Standalone API",
    "version": "1.0.0",
    "description": "Decentralized knowledge sharing and information retrieval API"
  },
  "resources": {
    "conversations": {
      "count": 5,
      "size": 15360,
      "lastModified": "2024-01-15T09:45:00Z",
      "endpoint": "/api/conversations-standalone"
    },
    "knowledge": {
      "count": 42,
      "size": 102400,
      "lastModified": "2024-01-15T10:15:00Z",
      "endpoints": ["/api/knowledge-search", "/api/knowledge-export"]
    },
    "simulations": {
      "count": 3,
      "size": 51200,
      "lastModified": "2024-01-15T08:30:00Z"
    }
  },
  "availableEndpoints": [
    {
      "path": "/api/metadata-index",
      "method": "GET",
      "description": "Get metadata and index information"
    },
    {
      "path": "/api/knowledge-search",
      "method": "GET",
      "description": "Search knowledge base"
    },
    {
      "path": "/api/knowledge-export",
      "method": "GET",
      "description": "Export knowledge base"
    },
    {
      "path": "/api/conversations-standalone",
      "method": "GET|POST|PUT|DELETE",
      "description": "Manage conversations"
    }
  ]
}
```

**Get Specific Resource Type**:
```bash
curl "http://localhost:3000/api/metadata-index?type=conversations"
```

---

## Data Directory Structure

The standalone APIs use the following directory structure:

```
project-root/
├── data/
│   ├── conversations/
│   │   ├── conv1.json
│   │   ├── conv2.json
│   │   └── ...
│   ├── knowledge/
│   │   ├── item1.json
│   │   ├── item2.json
│   │   └── ...
│   └── simulations/
│       ├── sim1.json
│       └── ...
└── pages/
    └── api/
        ├── knowledge-search.js
        ├── knowledge-export.js
        ├── conversations-standalone.js
        ├── metadata-index.js
        └── ...
```

---

## CORS Configuration

All standalone APIs include CORS headers by default:

```javascript
res.setHeader('Access-Control-Allow-Origin', '*');
res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
```

This allows cross-origin requests from any domain. For production, you may want to restrict the origin.

---

## Error Handling

All APIs return consistent error responses:

```json
{
  "error": "Error description",
  "message": "Detailed error message"
}
```

Common HTTP Status Codes:
- `200`: Success
- `400`: Bad Request (missing parameters)
- `404`: Not Found (resource not found)
- `405`: Method Not Allowed
- `500`: Internal Server Error

---

## Migration from Firebase

If you were using the old Firebase-dependent endpoints, here's how to migrate:

### Old (Firebase) vs New (Standalone)

| Feature | Old Endpoint | New Endpoint |
|---------|--------------|---------------|
| Search | `/api/search` | `/api/knowledge-search` |
| Export | `/api/export` | `/api/knowledge-export` |
| Conversations | `/api/conversations` | `/api/conversations-standalone` |
| Metadata | N/A | `/api/metadata-index` |

### Data Migration Steps

1. **Export old data from Firebase**: Use the old `/api/export` endpoint
2. **Transform to new format**: Convert data to JSON files
3. **Place in data directory**: Save files to `data/` subdirectories
4. **Verify with metadata API**: Call `/api/metadata-index` to confirm

---

## Performance Considerations

- **File system caching**: File-based storage is faster for read operations
- **Scalability**: For large datasets (>10GB), consider sharding across subdirectories
- **Memory usage**: All operations use streaming where possible
- **No network latency**: Local storage eliminates external API call overhead

---

## Security Notes

⚠️ **Important**: These APIs are designed for standalone deployments:

- Implement authentication in production
- Use HTTPS for all connections
- Restrict CORS origins to trusted domains
- Validate all input parameters
- Use environment variables for sensitive data

---

## Support

For issues or questions about the standalone APIs, please refer to:
- GitHub Issues: [MoCKA-KNOWLEDGE-GATE](https://github.com/nsjpkimura-del/MoCKA-KNOWLEDGE-GATE/issues)
- API Specification: Check individual endpoint implementations in `/pages/api/`

---

**Version**: 1.0.0  
**Last Updated**: 2024  
**Status**: Production Ready ✅
