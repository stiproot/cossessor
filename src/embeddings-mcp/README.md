# Embeddings MCP Server

MCP (Model Context Protocol) server for codebase embeddings and vector similarity search. This service exposes tools that enable Claude to embed codebases and perform semantic search using vector databases.

## Overview

The Embeddings MCP Server is a thin HTTP wrapper around the [embeddings-api](../embeddings-api) that exposes MCP tools for Claude Code integration. It provides two main capabilities:

1. **Embed Codebase**: Process and embed an entire codebase into a vector database
2. **Search Codebase**: Perform semantic search on embedded codebases

## Architecture

```
┌────────────────────────────────────┐
│      CC-SVC (Claude Service)       │
│      Loads .mcp.json config        │
└────────────┬───────────────────────┘
             │ HTTP (MCP Protocol)
             ↓
┌────────────────────────────────────┐
│    Embeddings MCP Server (This)    │
│    Port 8912, Bun/TypeScript       │
│                                    │
│  Tools:                            │
│  ├─ embed_codebase                 │
│  └─ search_codebase                │
└────────────┬───────────────────────┘
             │ HTTP (POST /embed, /qry)
             ↓
┌────────────────────────────────────┐
│      Embeddings API (Python)       │
│    FastAPI, Port 8001 (6002)       │
│    Uses: ChromaDB + Dapr actors    │
└────────────────────────────────────┘
```

## MCP Tools

### `embed_codebase`

Embed a codebase into the vector database for semantic search.

**Input Schema:**

```typescript
{
  file_system_path: string  // Absolute path to codebase directory
}
```

**Example Usage:**

```json
{
  "method": "tools/call",
  "params": {
    "name": "embed_codebase",
    "arguments": {
      "file_system_path": "/workspace/myproject"
    }
  }
}
```

**Response:**

```json
{
  "content": [{
    "type": "text",
    "text": "{\"success\":true,\"message\":\"Successfully embedded codebase at /workspace/myproject\",\"result\":{...}}"
  }]
}
```

### `search_codebase`

Search an embedded codebase using vector similarity.

**Input Schema:**

```typescript
{
  query: string              // Natural language search query
  file_system_path: string   // Path to embedded codebase
  max_results?: number       // Maximum results (default: 5)
}
```

**Example Usage:**

```json
{
  "method": "tools/call",
  "params": {
    "name": "search_codebase",
    "arguments": {
      "query": "authentication middleware",
      "file_system_path": "/workspace/myproject",
      "max_results": 5
    }
  }
}
```

**Response:**

```json
{
  "content": [{
    "type": "text",
    "text": "{\"success\":true,\"query\":\"authentication middleware\",\"results_count\":3,\"results\":[{\"rank\":1,\"source\":\"src/auth/middleware.ts\",\"content\":\"...\"}]}"
  }]
}
```

## API Endpoints

### `POST /mcp`

MCP HTTP protocol endpoint for tool discovery and execution.

**Tool Discovery:**

```bash
curl -X POST http://localhost:8912/mcp \
  -H "Content-Type: application/json" \
  -d '{"method":"tools/list","params":{}}'
```

**Tool Execution:**

```bash
curl -X POST http://localhost:8912/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "method": "tools/call",
    "params": {
      "name": "search_codebase",
      "arguments": {
        "query": "error handling",
        "file_system_path": "/workspace/myproject"
      }
    }
  }'
```

### `GET /health`

Health check endpoint.

```bash
curl http://localhost:8912/health
```

Response:

```json
{
  "status": "ok",
  "service": "embeddings-mcp",
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `8912` |
| `LOG_LEVEL` | Logging level (debug/info/warn/error) | `info` |
| `EMBEDDINGS_API_HOST` | Embeddings API hostname | `localhost` (local), `embeddings-api` (Docker) |
| `EMBEDDINGS_API_PORT` | Embeddings API port | `6002` (local), `8001` (Docker) |
| `EMBEDDINGS_API_TIMEOUT` | HTTP timeout (ms) | `60000` |
| `DEFAULT_CODEBASE_PATH` | Default codebase path | `/workspace` |

### Example .env

**For Local Development:**

```bash
PORT=8912
LOG_LEVEL=info
EMBEDDINGS_API_HOST=localhost
EMBEDDINGS_API_PORT=6002
EMBEDDINGS_API_TIMEOUT=60000
DEFAULT_CODEBASE_PATH=/workspace
```

**For Docker:**

```bash
PORT=8912
LOG_LEVEL=info
EMBEDDINGS_API_HOST=embeddings-api
EMBEDDINGS_API_PORT=8001
EMBEDDINGS_API_TIMEOUT=60000
DEFAULT_CODEBASE_PATH=/workspace
```

## Development

### Prerequisites

- Bun >= 1.1.0
- Running embeddings-api service
- Running ChromaDB instance

### Quick Start (Local Development)

```bash
cd src/embeddings-mcp
./run.sh
```

The `run.sh` script will:

- Load environment variables from `.env`
- Install dependencies if needed
- Start the development server with hot reload

### Manual Setup

```bash
# Install dependencies
cd src/embeddings-mcp
bun install

# Create .env file
cp .env.example .env
# Edit .env with your configuration (use localhost:6002 for local dev)

# Run type checking
bun run type-check

# Build the project
bun run build

# Start development server with hot reload
bun run dev

# Test endpoints
curl http://localhost:8912/health
curl -X POST http://localhost:8912/mcp \
  -H "Content-Type: application/json" \
  -d '{"method":"tools/list","params":{}}'
```

### Testing

```bash
# Run tests
bun test

# Test with coverage
bun test --coverage

# Type check
bun run type-check
```

## Docker Deployment

### Quick Start (Docker)

```bash
cd src/embeddings-mcp
./run-docker.sh
```

The `run-docker.sh` script will:

- Start embeddings-mcp via docker-compose with the embeddings profile
- Show access URL and helpful commands

### Manual Docker Commands

**Build:**

```bash
docker build -t embeddings-mcp:latest .
```

**Run:**

```bash
docker run -d \
  -p 8912:8912 \
  -e EMBEDDINGS_API_HOST=embeddings-api \
  -e EMBEDDINGS_API_PORT=8001 \
  --name embeddings-mcp \
  embeddings-mcp:latest
```

### Docker Compose

This service is included in the main `docker-compose.yml` with the `embeddings` profile:

```yaml
embeddings-mcp:
  build:
    context: ./embeddings-mcp
    dockerfile: Dockerfile
  ports:
    - "8912:8912"
  environment:
    - EMBEDDINGS_API_HOST=embeddings-api
    - EMBEDDINGS_API_PORT=8001
  depends_on:
    - embeddings-api
  profiles:
    - embeddings
```

**Start the full stack:**

```bash
# From repository root
docker-compose --profile infra --profile embeddings up -d
```

## Integration with CC-SVC

Register this MCP server in cc-svc's `.mcp.json`:

```json
{
  "mcpServers": {
    "embeddings": {
      "type": "http",
      "url": "http://embeddings-mcp:8912/mcp",
      "headers": {}
    }
  }
}
```

Claude will discover tools as:

- `mcp__embeddings__embed_codebase`
- `mcp__embeddings__search_codebase`

## Troubleshooting

### Connection Refused to embeddings-api

**Error:** `ECONNREFUSED` or `connect ECONNREFUSED`

**Solution:**

1. Verify embeddings-api is running: `curl http://localhost:6002/healthz`
2. Check `.env` has correct `EMBEDDINGS_API_HOST` and `EMBEDDINGS_API_PORT`:
   - Local dev: `localhost:6002`
   - Docker: `embeddings-api:8001`
3. Restart the embeddings-mcp service

### MCP Server Not Discovered by CC-SVC

**Solution:**

1. Verify embeddings-mcp is running: `curl http://localhost:8912/health`
2. Check cc-svc's `.mcp.json` has correct URL:
   - Local: `http://localhost:8912/mcp`
   - Docker: `http://embeddings-mcp:8912/mcp`
3. Restart cc-svc after configuration changes

### Wrong Port Configuration

If you see connection errors, ensure ports match your deployment:

- **Local Development:**
  - embeddings-mcp: `8912`
  - embeddings-api: `6002` (external)
- **Docker:**
  - embeddings-mcp: `8912`
  - embeddings-api: `8001` (internal)

## Error Handling

The service handles errors gracefully:

### Network Errors

- 60-second timeout for HTTP calls
- Graceful degradation with error messages
- Axios error handling with detailed messages

### Validation Errors

- Input validation using Zod schemas
- Clear error messages for missing/invalid parameters

### API Errors

- Wraps embeddings-api errors with context
- Logs errors at appropriate levels
- Returns structured error responses

## Logging

Logging levels:

- `debug`: HTTP calls, detailed operations
- `info`: Service startup, tool invocations, results
- `warn`: Deprecated features, recoverable errors
- `error`: Failed operations, exceptions

Configure with `LOG_LEVEL` environment variable.

## Performance

- **Startup**: < 1 second (Bun runtime)
- **Tool Discovery**: < 10ms
- **Embedding**: 30-120 seconds (depends on codebase size)
- **Search**: 1-5 seconds (vector similarity search)
- **Memory**: ~50MB base, scales with request concurrency

## License

MIT
