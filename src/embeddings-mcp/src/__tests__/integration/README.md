# Embeddings-MCP Integration Tests

## Overview

These integration tests verify the complete flow from embeddings-mcp → embeddings-api → ChromaDB.

## Prerequisites

Before running these tests, ensure all services are running:

### 1. Start ChromaDB

```bash
docker-compose --profile infra up -d chromadb
```

ChromaDB runs on port 8000.

### 2. Start Embeddings-API

```bash
cd ../embeddings-api && ./run.sh
```

Embeddings-API runs on port 6002.

### 3. Embed Your Codebase

Ensure the test codebase is embedded:

```bash
chroma-cli embed --file-system-path /Users/simon.stipcich/code/grads/Prosper-Derivco-Assessment/
```

### 4. Start Embeddings-MCP

```bash
cd ../embeddings-mcp && bun run dev
```

Embeddings-MCP runs on port 8912.

## Running Tests

### Run All Integration Tests

```bash
bun run test:integration
```

### Run Specific Test

```bash
bun test src/__tests__/integration/basic.test.ts
```

### Run with Specific Filter

```bash
bun test src/__tests__/integration/basic.test.ts -t "should search codebase"
```

## Test Coverage

The integration tests verify:

1. **Health Check** - Service availability
2. **MCP Protocol** - `tools/list` endpoint
3. **Vector Search** - `search_codebase` tool functionality
4. **Parameter Handling** - `max_results` parameter
5. **Error Handling** - Unknown tool errors

## Debugging

### Check Service Health

```bash
# Embeddings-MCP
curl http://localhost:8912/health

# Embeddings-API
curl http://localhost:6002/healthz

# ChromaDB
curl http://localhost:8000/api/v1/heartbeat
```

### Manual MCP Tool Call

Test the MCP endpoint manually:

```bash
curl -X POST http://localhost:8912/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "method": "tools/call",
    "params": {
      "name": "search_codebase",
      "arguments": {
        "query": "authentication code",
        "file_system_path": "/Users/simon.stipcich/code/grads/Prosper-Derivco-Assessment/",
        "max_results": 5
      }
    }
  }'
```

### Check Embeddings-API Logs

While running tests, watch the embeddings-api logs to verify requests are being received:

```bash
# In the embeddings-api terminal, you should see:
== APP == INFO:     POST /qry
```

## Troubleshooting

### Tests Timeout

1. Verify all services are running
2. Check service ports (8912, 6002, 8000)
3. Increase timeout in test if needed

### No Results from Search

1. Verify codebase is embedded: Check ChromaDB collections
2. Check collection name mapping in embeddings-api
3. Verify file_system_path matches embedded path exactly

### Connection Errors

1. Check `.env` configuration in embeddings-mcp
2. Verify `EMBEDDINGS_API_HOST` and `EMBEDDINGS_API_PORT`
3. Check network connectivity between services

## Expected Output

Successful test run should show:

```
✅ Embeddings-MCP is ready
✅ Available tools: [ 'embed_codebase', 'search_codebase' ]
📊 Search Result Structure: { ... }
🔍 Search Results Preview: ...
📊 Database query search completed
```

## What These Tests Validate

- ✅ Embeddings-MCP HTTP server is running
- ✅ MCP protocol endpoints respond correctly
- ✅ Embeddings-API is reachable from embeddings-mcp
- ✅ Vector search returns results
- ✅ ChromaDB contains embedded codebase
- ✅ End-to-end request flow works

Once these tests pass, we know the embeddings stack is working correctly, and we can focus on cc-svc integration.
