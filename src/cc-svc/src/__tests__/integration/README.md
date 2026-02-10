# Integration Tests for Code Review Assistant

## Overview

This directory contains integration tests for the cc-svc code review assistant. These tests verify the complete system working together: cc-svc, embeddings-mcp, embeddings-api, and ChromaDB.

## Test Structure

- `basic.test.ts` - Core integration tests covering health checks, agent interaction, code review workflows, and codebase search

## Prerequisites

All services must be running before executing integration tests:

### 1. Start ChromaDB

```bash
docker-compose --profile infra up -d chromadb
```

ChromaDB runs on port 8000.

### 2. Start Embeddings-API

```bash
cd ../embeddings-api && ./run.sh
```

Embeddings-API runs on port 6002 (external) / 8001 (Docker).

### 3. Start Embeddings-MCP

```bash
cd ../embeddings-mcp && ./run.sh
```

Embeddings-MCP runs on port 8912.

### 4. Embed Your Codebase

Before running tests, ensure your codebase is embedded:

```bash
chroma-cli embed --file-system-path /path/to/your/codebase
```

### 5. Start CC-SVC

```bash
npm run dev
```

CC-SVC runs on port 3010.

## Running Tests

### Run All Integration Tests

```bash
npm run test:integration
```

### Run Specific Test File

```bash
bun test src/__tests__/integration/basic.test.ts
```

### Run Specific Test Case

```bash
bun test src/__tests__/integration/basic.test.ts -t "should return healthy status"
```

### Watch Mode

```bash
npm run test:integration:watch
```

## Test Coverage

The integration tests verify:

- **Health Checks**: Service availability and status
- **Agent Interaction**: Basic greeting, session resumption
- **Code Review Workflows**: Security analysis, code quality analysis on real codebase
- **Codebase Search**: Real embeddings-based semantic search
- **Streaming API**: SSE event format, session management

## Test Utilities

Located in `src/__tests__/utils/test-helpers.ts`:

- `parseSSEStream()` - Parse Server-Sent Events into array of events
- `waitForEvent()` - Find specific event type in stream
- `createTestRequest()` - Create standardized test request
- `waitForService()` - Wait for service to become ready
- `extractFindings()` - Extract review findings from result event
- `extractMessages()` - Extract text messages from stream
- `hasToolUse()` - Check if MCP tools were invoked

## Timeouts

- **Default test timeout**: 30 seconds (Vitest config)
- **Simple tests**: 30-60 seconds (health checks, basic interactions)
- **Code review tests**: 90-120 seconds (complex multi-agent workflows)

## Debugging

### Enable Verbose Logging

```bash
LOG_LEVEL=debug npm run test:integration
```

### Check Service Health

Verify all services are running:

```bash
# CC-SVC
curl http://localhost:3010/health

# Embeddings-MCP
curl http://localhost:8912/health

# ChromaDB
curl http://localhost:8000/api/v1/heartbeat

# Embeddings-API
curl http://localhost:6002/health
```

### Check Service Ports

```bash
lsof -i :3010  # CC-SVC
lsof -i :8912  # Embeddings-MCP
lsof -i :8000  # ChromaDB
lsof -i :6002  # Embeddings-API
```

### Inspect SSE Events

The test helpers log events to console. Check test output for event details:

```typescript
const events = await parseSSEStream(response);
console.log('Events received:', events.length);
console.log('Event types:', events.map(e => e.type));
```

## Troubleshooting

### Tests Hang or Timeout

1. Verify cc-svc is running: `curl http://localhost:3010/health`
2. Verify embeddings-mcp is running: `curl http://localhost:8912/health`
3. Check for port conflicts (3010, 8912, 8000, 6002)
4. Increase timeouts for slower machines
5. Check logs: `LOG_LEVEL=debug npm run test:integration`

### Service Not Ready Errors

If you see "Service at http://localhost:X did not become ready", ensure:

1. Service is actually running
2. No firewall blocking the port
3. Service has fully initialized (some services take time to start)

### SSE Parsing Errors

1. Verify content-type header: `text/event-stream`
2. Check for malformed SSE data
3. Inspect raw response by adding logging to `parseSSEStream()`

### Session Resumption Fails

1. Verify sessionId is returned in start event
2. Check session storage in cc-svc
3. Confirm sessionId passed correctly in resumeSessionId

### Codebase Not Embedded

If codebase search tests fail:

```bash
# Check if collections exist
curl http://localhost:8000/api/v1/collections

# Re-embed if needed
chroma-cli embed --file-system-path /path/to/your/codebase
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Integration Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      chromadb:
        image: chromadb/chroma:0.5.16
        ports:
          - 8000:8000

    steps:
      - uses: actions/checkout@v3
      - uses: oven-sh/setup-bun@v1

      - name: Install dependencies
        run: bun install

      - name: Start embeddings-api
        run: cd ../embeddings-api && ./run.sh &

      - name: Start embeddings-mcp
        run: cd ../embeddings-mcp && ./run.sh &

      - name: Start cc-svc
        run: bun run dev &

      - name: Wait for services
        run: sleep 20

      - name: Run integration tests
        run: npm run test:integration
```

## Development

### Adding New Tests

1. Create or edit test file in `src/__tests__/integration/`
2. Import test helpers from `../utils/test-helpers.js`
3. Use `beforeAll` to ensure services are ready
4. Use `waitForService` to verify cc-svc is ready
5. Create requests with `createTestRequest`
6. Parse streams with `parseSSEStream`
7. Test against the real embedded codebase
8. Add test documentation to this README

## Performance

Expected test execution times (approximate):

- **All integration tests**: 2-5 minutes
- **basic.test.ts**: 2-5 minutes (7 tests)

Tests run sequentially (not in parallel) due to shared server state.

## Coverage Goals

- **Line coverage**: > 70% (Vitest configured)
- **Integration scenarios**: All major workflows covered
- **Error paths**: Graceful degradation verified

## Related Documentation

- [Agent SDK Documentation](https://github.com/anthropics/claude-agent-sdk)
- [MCP Protocol Specification](https://github.com/anthropics/mcp)
- [Code Review Agents](.claude/agents/)
- [Review Commands](.claude/commands/)

## Support

For issues or questions:

1. Check this README
2. Review test output and logs
3. Inspect cc-svc server logs
4. Verify all services are running and healthy
5. Open issue with reproduction steps
