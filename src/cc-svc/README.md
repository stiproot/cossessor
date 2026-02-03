# CC-SVC (Claude Code Service)

A service that wraps the Claude Agent SDK to provide HTTP streaming endpoints for Claude Code interactions with MCP server support and session resumption.

> **Note:** This service has been migrated to use **Bun** as the runtime and package manager. See the [root README](../../README.md) for mono-repo setup and Bun workspace information.

## Service Overview

**Service Type:** AI Agent Gateway
**Port:** 3010 (nginx) → 3000 (Bun internal)
**Technology Stack:** Bun 1.1+, TypeScript, Express, Claude Agent SDK
**Process Manager:** Bun Runtime (native)

### Purpose

cc-svc provides a streaming HTTP interface to the Claude Agent SDK. It spawns Claude Code CLI as a subprocess for each request, streams responses via Server-Sent Events (SSE), and supports session resumption for multi-turn conversations. MCP servers and agents are configured via filesystem-based configuration.

### Responsibilities

- Accept HTTP POST requests with chat messages
- Stream Claude Code responses via SSE
- Manage session resumption for multi-turn conversations
- Load MCP server configurations from `.mcp.json`
- Load agent definitions from `.claude/agents/*.md`
- Load skill/slash command definitions from `.claude/commands/*.md`
- Apply prompt templates for routing and control flow
- Handle graceful shutdown and error recovery

## Architecture

### Directory Structure

```txt
src/
├── server.ts                   # Express server entry point
├── config/
│   ├── env.ts                 # Environment configuration
│   └── index.ts               # Configuration exports
├── routes/
│   ├── agent.ts               # /agent/stream endpoint
│   ├── health.ts              # /health endpoint
│   └── index.ts               # Route exports
├── sdk/
│   ├── wrapper.ts             # Claude Agent SDK wrapper
│   ├── prompts.ts             # Prompt templates and routing logic
│   └── index.ts               # SDK exports
├── types/
│   ├── request.ts             # Request types
│   ├── response.ts            # Response types
│   └── index.ts               # Type exports
└── __tests__/
    ├── unit/                  # Unit tests
    └── integration/           # Integration tests

.claude/
├── agents/                     # Agent definitions (markdown)
│   ├── clickhouse-agent.md    # ClickHouse analytics specialist
│   ├── github-issues-agent.md # GitHub issue management
│   └── planner-agent.md       # Task planning agent
├── commands/                   # Skills/slash commands (markdown)
│   ├── router.md              # Request routing
│   ├── executor.md            # Plan execution
│   ├── analyze.md             # Request analysis
│   ├── plan.md                # Plan creation
│   └── insights-analyzer.md   # Player insights analysis
└── skills/                     # Skill definitions
    ├── aurora-assistant/      # Aurora assistant skill
    └── color-picker/          # Color picker skill
```

### Dependencies

**Infrastructure:**

- `@anthropic-ai/claude-code` - Claude Code CLI (installed globally in container)
- `@anthropic-ai/claude-agent-sdk` - SDK for spawning Claude Code

**External Services:**

- Anthropic API (via proxy) - For Claude model access
- MCP Servers - github-issues, clickhouse (configured in `.mcp.json`)

### Data Flow

```txt
[Client Request] → POST /agent/stream → [cc-svc]
                                            ↓
                                    [Prompt Templates]
                                            ↓
                                    [Claude Agent SDK]
                                            ↓
                                  Spawn Claude Code CLI
                                            ↓
                              ┌─────────────┼─────────────┐
                              ↓             ↓             ↓
                        [MCP Servers]  [Agents]     [Skills]
                              ↓             ↓             ↓
                              └─────────────┼─────────────┘
                                            ↓
                                    Stream SSE Events
                                            ↓
                                      [Client SSE]
```

## Getting Started

### Prerequisites

- Bun >= 1.1.0
- Docker & Docker Compose (for containerized deployment)
- Anthropic API key (or proxy URL)
- GitHub PAT for `@derivco` scoped packages

### Local Development Setup

1. **Install dependencies (from repo root)**

   ```bash
   cd ../../  # Navigate to repo root
   bun install
   ```

2. **Navigate to service directory**

   ```bash
   cd src/cc-svc
   ```

3. **Configure environment**

   ```bash
   cp .env.example .env
   # Edit .env with your settings
   ```

4. **Start the service**

   ```bash
   bun run dev
   ```

The service will be available at `http://localhost:3010`

### Docker Development

Use the project-level docker-compose for local development:

```bash
# From project root
docker-compose -f src/docker-compose.yml up cc-svc
```

## Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `PORT` | Service port | `3010` | No |
| `ANTHROPIC_AUTH_TOKEN` | Anthropic API key | - | Yes |
| `ANTHROPIC_BASE_URL` | API proxy URL | `https://api.anthropic.com` | No |
| `ANTHROPIC_MODEL` | Model to use | `claude-sonnet-4-5-20250929` | No |

### MCP Server Configuration

MCP servers are configured in `.mcp.json` at the project root. Claude Code CLI automatically loads this file.

```json
{
  "mcpServers": {
    "github-issues": {
      "type": "http",
      "url": "http://github-issues-mcp:8901/mcp",
      "headers": {}
    },
    "clickhouse": {
      "type": "http",
      "url": "http://clickhouse-mcp:8910/mcp",
      "headers": {},
      "toolDefaults": {
        "list_tables": {
          "database": "reporting"
        }
      }
    }
  }
}
```

**Security Note**: The `list_databases` tool is disallowed via `disallowedTools` in the SDK wrapper to restrict access to the "reporting" database only.

### Agent Configuration

Agents are defined as markdown files in `.claude/agents/`:

- `clickhouse-agent.md` - ClickHouse analytics specialist
- `github-issues-agent.md` - GitHub issue management agent
- `planner-agent.md` - Task planning and decomposition

Agents are auto-discovered via `settingSources: ['project']` in the SDK options.

### Skill Configuration

Skills (slash commands) are defined in `.claude/commands/`:

- `router.md` - Request routing and planning with decision framework
- `executor.md` - Execute approved plans step by step
- `analyze.md` - Analyze requests and determine approach
- `plan.md` - Create detailed execution plans
- `insights-analyzer.md` - Smart Panel player insights analysis (generates PlayerInsights from context data)

Skills can be invoked via slash commands (e.g., `/router`, `/insights-analyzer`) or by referencing them in requests.

## API Versioning

All API endpoints are versioned to ensure backward compatibility. The current version is **v1**.

**Versioning Strategy:**
- Path-based versioning: `/v1/<endpoint>`
- Health endpoint is unversioned (infrastructure endpoint)
- Breaking changes will introduce new versions (e.g., `/v2/...`)
- Old versions remain supported for backward compatibility

**Current Endpoints:**
- `POST /v1/agent/stream` - Agent streaming endpoint
- `POST /v1/insights/generate` - Smart Panel insights generation
- `GET /health` - Health check (unversioned)

## API Documentation

### POST /v1/agent/stream

Stream a conversation with Claude Code via Server-Sent Events.

**Request Body:**

```json
{
  "chatId": "client-chat-123",
  "userRequest": "What files are in this project?",
  "resumeSessionId": "optional-session-id-from-previous-response",
  "metadata": {
    "userId": "user-123",
    "operatorId": "operator-456",
    "repoOwner": "Derivco",
    "repoName": "nebula-aurora"
  }
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `chatId` | string | Yes | Client-side chat identifier for tracking |
| `userRequest` | string | Yes | The user's message/prompt |
| `resumeSessionId` | string | No | Claude `session_id` from previous init message to resume |
| `metadata` | object | No | Context arguments to inject into MCP server headers |

**Note**: Chat history is not passed explicitly. Use `resumeSessionId` to resume a previous Claude session with full context stored server-side.

### Metadata and Context Args

The `metadata` field allows passing context arguments that are automatically injected into MCP server HTTP headers using template variable replacement. This enables MCP servers to receive user/operator context without the AI agent needing to manage these details.

**How it works:**

1. Client sends request with `metadata` containing context values
2. cc-svc replaces template variables in `.mcp.json` headers with metadata values
3. MCP servers receive context via HTTP headers (e.g., `X-User-Id`, `X-Operator-Id`)
4. MCP middleware extracts headers and injects into tool call arguments

**Example `.mcp.json` configuration:**

```json
{
  "mcpServers": {
    "github-issues": {
      "type": "http",
      "url": "http://github-issues-mcp:8901/mcp",
      "headers": {
        "X-User-Id": "${metadata.userId}",
        "X-Operator-Id": "${metadata.operatorId}",
        "X-Repo-Owner": "${metadata.repoOwner}",
        "X-Repo-Name": "${metadata.repoName}"
      }
    }
  }
}
```

**Supported template syntax:**
- `${metadata.key}` - Simple key lookup
- `${metadata.nested.key}` - Nested object path lookup

**Response (SSE):**

```
event: start
data: {"started":true,"chatId":"client-chat-123","resuming":false,"timestamp":"..."}

event: message
data: {"message":{"type":"init","session_id":"claude-session-xyz",...},"timestamp":"..."}

event: message
data: {"message":{"type":"assistant","content":"Here are the files..."},"timestamp":"..."}

event: result
data: {"subtype":"success","durationMs":1234,"totalCostUsd":0.001,"result":"..."}

event: complete
data: {"complete":true,"timestamp":"..."}
```

**Session Resumption:**

1. Save the `session_id` from the `init` message in your first response
2. Pass it as `resumeSessionId` in subsequent requests to continue the conversation
3. Claude will resume with full context from the previous session

### GET /health

Health check endpoint.

**Response:**

```json
{
  "status": "ok",
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

### POST /v1/insights/generate

Generate AI-powered player insights for Smart Panel integration.

**Authentication:** Internal service-to-service only (called via agent-proxy-svc)

**Request Body:**

```json
{
  "playerId": "player-123",
  "contextData": {
    "paymentEvents": [
      { "type": "deposit", "status": "failed", "amount": 100, "timestamp": "..." }
    ],
    "gameEvents": [
      { "type": "win", "amount": 5000, "multiplier": 50 }
    ],
    "sessionData": { "lastLogin": "2025-01-15T10:00:00Z" },
    "playerProfile": { "kycStatus": "pending", "registeredAt": "..." }
  }
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `playerId` | string | Yes | Unique player identifier |
| `contextData` | object | Yes | Player context data for AI analysis (flexible schema) |

**Response (200 OK):**

```json
{
  "playerId": "player-123",
  "scenario": "FAILED_DEPOSITS",
  "sentiment": {
    "emoji": "😔",
    "label": "Frustrated",
    "type": "frustrated"
  },
  "statusText": "3 deposits failed in last hour",
  "statusDetails": "Player experiencing repeated payment failures",
  "insight": {
    "icon": "💳",
    "text": "Check payment method validity and account limits"
  },
  "recommendedAction": "Verify payment method and contact support if issue persists",
  "dataSource": "Payment events analysis",
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

**Scenario Types:**

| Scenario | Description | Typical Sentiment |
|----------|-------------|-------------------|
| `FAILED_DEPOSITS` | Multiple failed payment attempts | frustrated 😔 |
| `BIG_WIN` | Significant winning event | excited 🎉 |
| `KYC_PENDING` | Verification required | anxious 😰 |
| `DORMANT` | Previously inactive player returning | neutral 😐 |
| `RG_ALERT` | Responsible gambling indicators | warning ⚠️ |
| `NEW_PLAYER` | Recently registered player | excited 😊 |
| `NO_DATA` | Insufficient data for analysis | neutral 😐 |

**Error Responses:**

| Status | Error | Description |
|--------|-------|-------------|
| `400` | Validation Error | Missing playerId or malformed contextData |
| `500` | LLM Generation Error | AI model failed to generate insights |
| `500` | Internal Server Error | Unexpected server error |

**Performance:**

- Expected latency: 1-10 seconds (AI generation)
- Timeout: 12 seconds
- Client-side caching recommended (5 min TTL)

**Validation Notes:**

- `recommendedAction` and `dataSource` fields are optional in AI response
- If omitted, defaults are applied: "Review player context and assist as needed" / "Available player data"
- All other fields are required and validated via Zod schema

## Testing

```bash
# Run all tests with Bun's test runner
bun test

# Run tests in watch mode
bun test --watch

# Run integration tests
bun run test:integration

# Test with Vitest (fallback)
bun run test:vitest

# Test with UI (Vitest)
bun run test:ui

# Test with coverage
bun test --coverage
```

### Manual Testing

**Using curl:**

```bash
curl -N -X POST http://localhost:3010/v1/agent/stream \
  -H "Content-Type: application/json" \
  -d '{"chatId":"test-1","userRequest":"What is 2+2?"}'
```

**Using PowerShell test script:**

```powershell
# Run specific test
.\.tmp\query-cc-svc.ps1 t1

# Run all tests
.\.tmp\query-cc-svc.ps1 all

# Available tests:
# t1 - List available MCP servers and tools
# t2 - ClickHouse analyst query via subagent
# t3 - GitHub issues count via subagent
# t4 - Color picker skill invocation
# t5 - Router slash command (simple)
# t6 - Router slash command (complex multi-step)
# t7 - Resume session and approve plan
```

## Docker Deployment

### Build

```bash
# Requires GitHub PAT as build secret
DOCKER_BUILDKIT=1 docker build \
  --secret id=npm_token,env=NODE_AUTH_TOKEN \
  --build-arg APP_VERSION=1.0.0 \
  -t cc-svc:latest \
  .
```

### Run

```bash
docker run -d \
  -p 3010:3010 \
  -e ANTHROPIC_AUTH_TOKEN=your-token \
  -e ANTHROPIC_BASE_URL=https://your-proxy.com/ \
  cc-svc:latest
```

### Container Architecture

- Multi-stage Bun Alpine build (`oven/bun:1.1-alpine`)
- Claude Code CLI installed globally via Bun
- Bun runtime with Nginx reverse proxy (no PM2)
- Health check on `/health` endpoint
- Runs as non-root `bun` user (UID 10000)
- 40-50% smaller image size vs Node.js
