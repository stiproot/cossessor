# CC-SVC (Claude Code Service)

A service that wraps the Claude Agent SDK to provide HTTP streaming endpoints for Claude Code interactions with MCP server support and session resumption. CC-SVC includes a comprehensive **code review system** with specialized agents for security, performance, quality, and architecture analysis.

> **Note:** This service has been migrated to use **Bun** as the runtime and package manager. See the [root README](../../README.md) for mono-repo setup and Bun workspace information.

## Table of Contents

- [Overview](#overview)
- [Code Review System](#code-review-system)
- [API Usage](#api-usage)
- [Review Commands](#review-commands)
- [Agents and Skills](#agents-and-skills)
- [Examples](#examples)
- [Architecture](#architecture)

## Overview

CC-SVC provides:

- **HTTP Streaming API**: Server-Sent Events (SSE) for real-time Claude responses
- **MCP Integration**: Support for Model Context Protocol servers (embeddings, etc.)
- **Session Management**: Resume conversations across requests
- **Code Review System**: Specialized agents for comprehensive code analysis

## Code Review System

The code review system uses the Claude Agent SDK's **agents, skills, and commands** architecture to provide multi-dimensional code analysis.

### Components

1. **Skills** (Reusable Operations)
   - `vector-search-code`: Semantic code search using embeddings
   - `calculate-code-metrics`: Quantitative code analysis (complexity, LOC)
   - `scan-security-patterns`: Pattern-based vulnerability detection

2. **Agents** (Specialized Reviewers)
   - `security-reviewer`: Vulnerability analysis, OWASP Top 10, penetration testing perspective
   - `performance-reviewer`: Bottleneck identification, Big-O analysis, scalability assessment
   - `quality-reviewer`: Maintainability, SOLID principles, technical debt analysis
   - `architecture-reviewer`: System design, coupling analysis, scalability evaluation
   - `review-orchestrator`: Coordinates multi-agent reviews, synthesizes findings

3. **Commands** (User Entry Points)
   - `/review-security <path>`: Security-focused review
   - `/review-performance <path>`: Performance-focused review
   - `/review-quality <path>`: Code quality review
   - `/review-architecture <path>`: Architectural review
   - `/review-full <path>`: Comprehensive multi-aspect review
   - `/review-compare <path1> <path2>`: Compare two implementations

### Two-Phase Review Pattern

All reviews follow a consistent two-phase pattern:

1. **Discovery Phase** (Embeddings): Use vector search to find relevant code semantically
2. **Analysis Phase** (Disk): Read files for detailed analysis with full context

This approach combines breadth (discover all relevant code) with depth (detailed analysis).

## API Usage

### Endpoint

```
POST http://localhost:3010/v1/agent/stream
Content-Type: application/json
```

### Request Format

```json
{
  "chatId": "unique-chat-identifier",
  "userRequest": "/review-security /path/to/code",
  "resumeSessionId": "optional-session-id-to-resume",
  "metadata": {
    "reviewType": "pre-deployment",
    "branch": "main",
    "reviewer": "username"
  }
}
```

### Response Format

Server-Sent Events (SSE) stream:

```
event: start
data: {"chatId":"review-123","status":"starting"}

event: message
data: {"type":"text","content":"Starting security review..."}

event: message
data: {"type":"tool_use","tool":"mcp__embeddings__search_codebase"}

event: message
data: {"type":"text","content":"Found 15 security-critical files..."}

event: result
data: {"status":"success","duration":45000,"sessionId":"abc123"}

event: complete
data: {"message":"Review complete"}
```

## Review Commands

### Security Review

Identifies vulnerabilities, security risks, and compliance issues.

```bash
POST /v1/agent/stream
{
  "chatId": "sec-review-1",
  "userRequest": "/review-security /Users/simon.stipcich/code/repo/cossessor/src/cc-svc"
}
```

**Finds**:

- SQL injection, XSS, command injection
- Hardcoded secrets and credentials
- Weak cryptography (MD5, SHA1, DES)
- Authentication and authorization flaws
- OWASP Top 10 vulnerabilities

**Output**: Findings with CRITICAL/HIGH/MEDIUM/LOW severity, CVE/CWE references, remediation steps

### Performance Review

Identifies bottlenecks, algorithmic inefficiencies, and scalability concerns.

```bash
POST /v1/agent/stream
{
  "chatId": "perf-review-1",
  "userRequest": "/review-performance /Users/simon.stipcich/code/repo/cossessor/src/cc-svc"
}
```

**Finds**:

- O(n²) or worse algorithms
- N+1 query problems
- Missing database indexes
- Memory leaks
- Blocking operations
- Caching opportunities

**Output**: Performance issues with estimated improvements (e.g., "30s → 100ms, 300x faster")

### Quality Review

Assesses maintainability, readability, and adherence to best practices.

```bash
POST /v1/agent/stream
{
  "chatId": "quality-review-1",
  "userRequest": "/review-quality /Users/simon.stipcich/code/repo/cossessor/src/cc-svc"
}
```

**Finds**:

- Code smells (God functions, tight coupling)
- SOLID principle violations
- DRY violations (code duplication)
- Naming inconsistencies
- Missing tests or documentation
- Technical debt

**Output**: Maintainability score, refactoring recommendations, technical debt estimates

### Architecture Review

Evaluates system design, scalability, and long-term viability.

```bash
POST /v1/agent/stream
{
  "chatId": "arch-review-1",
  "userRequest": "/review-architecture /Users/simon.stipcich/code/repo/cossessor/src/cc-svc"
}
```

**Finds**:

- Circular dependencies
- Tight coupling between modules
- API design issues
- Scalability bottlenecks (in-memory state, etc.)
- Architectural pattern violations

**Output**: Architecture health score, dependency graphs, scalability assessment, migration paths

### Full Review

Comprehensive multi-aspect review coordinated by the orchestrator agent.

```bash
POST /v1/agent/stream
{
  "chatId": "full-review-1",
  "userRequest": "/review-full /Users/simon.stipcich/code/repo/cossessor/src/cc-svc"
}
```

**Process**:

1. Invokes all specialized agents (security, performance, quality, architecture)
2. Aggregates findings across all dimensions
3. Identifies cross-cutting concerns
4. Prioritizes issues by severity and impact
5. Generates deployment recommendation

**Output**:

- Executive summary with overall health score
- Findings organized by severity
- Prioritized action plan (Sprint 1, Sprint 2, ...)
- Deployment readiness assessment (✅ YES / 🚫 NO)

### Compare Review

Compares two implementations and recommends the better choice.

```bash
POST /v1/agent/stream
{
  "chatId": "compare-review-1",
  "userRequest": "/review-compare src/api/v1 src/api/v2"
}
```

**Output**: Side-by-side comparison matrix with recommendation and trade-offs

## Agents and Skills

### Understanding the Architecture

The Claude Agent SDK uses a three-tier architecture:

```
Commands (User Entry Points)
    ↓
Agents (Specialized Reviewers with Reasoning)
    ↓
Skills (Reusable Operations) + Tools (Read, Grep, Glob)
    ↓
Results
```

### Skills (`.claude/skills/*.md`)

**Reusable operations** that agents invoke:

- **vector-search-code**: Semantic code search using embeddings MCP
  - Input: query, codebase_path, max_results
  - Output: List of relevant files with relevance scores
  - Used by: All review agents for code discovery

- **calculate-code-metrics**: Quantitative code analysis
  - Input: file_path, metric_types
  - Output: LOC, complexity, function counts, comment ratio
  - Used by: Performance and quality reviewers

- **scan-security-patterns**: Pattern-based vulnerability detection
  - Input: codebase_path, pattern_category (secrets, injection, crypto, auth, etc.)
  - Output: Security findings with severity and remediation
  - Used by: Security reviewer for initial triage

### Agents (`.claude/agents/*.md`)

**Specialized reviewers** with domain expertise:

- **security-reviewer**: Security expert with OWASP knowledge
- **performance-reviewer**: Performance expert with algorithmic analysis skills
- **quality-reviewer**: Code quality expert with SOLID principles knowledge
- **architecture-reviewer**: System design expert with scalability focus
- **review-orchestrator**: Coordinates multi-agent reviews and synthesizes findings

Each agent:

- Has specific expertise and capabilities
- Uses skills and tools strategically
- Follows a defined review process
- Produces structured output with severity ratings

### Commands (`.claude/commands/*.md`)

**User-facing entry points** that route to agents:

- Simple commands (`/review-security`) route to single agents
- Complex commands (`/review-full`) route to orchestrator which coordinates multiple agents

## Examples

### Example 1: Pre-Deployment Security Audit

```bash
curl -X POST http://localhost:3010/v1/agent/stream \
  -H "Content-Type: application/json" \
  -d '{
    "chatId": "pre-deploy-audit",
    "userRequest": "/review-security /Users/simon.stipcich/code/repo/cossessor/src/cc-svc",
    "metadata": {
      "reviewType": "pre-deployment",
      "branch": "release-v1.2",
      "reviewer": "security-team"
    }
  }'
```

**Expected Output**:

- List of vulnerabilities with severity (CRITICAL, HIGH, etc.)
- Deployment recommendation (✅ YES / 🚫 NO)
- Estimated remediation time

### Example 2: Performance Optimization

```bash
curl -X POST http://localhost:3010/v1/agent/stream \
  -H "Content-Type: application/json" \
  -d '{
    "chatId": "perf-opt",
    "userRequest": "/review-performance /Users/simon.stipcich/code/repo/cossessor/src/cc-svc/src/routes",
    "metadata": {
      "concern": "API response times too slow"
    }
  }'
```

**Expected Output**:

- Bottlenecks with current vs. expected performance
- Concrete optimization recommendations
- Estimated performance improvements (e.g., "10x faster")

### Example 3: Technical Debt Assessment

```bash
curl -X POST http://localhost:3010/v1/agent/stream \
  -H "Content-Type: application/json" \
  -d '{
    "chatId": "tech-debt",
    "userRequest": "/review-quality /Users/simon.stipcich/code/repo/cossessor/src/cc-svc"
  }'
```

**Expected Output**:

- Maintainability score (1-10)
- Technical debt catalog with effort estimates
- Refactoring roadmap (Phase 1, Phase 2, ...)

### Example 4: Comprehensive Pre-Launch Review

```bash
curl -X POST http://localhost:3010/v1/agent/stream \
  -H "Content-Type: application/json" \
  -d '{
    "chatId": "pre-launch",
    "userRequest": "/review-full /Users/simon.stipcich/code/repo/cossessor/src/cc-svc",
    "metadata": {
      "milestone": "v1.0-launch",
      "reviewType": "comprehensive"
    }
  }'
```

**Expected Output**:

- Overall health score across all dimensions
- Prioritized action plan organized by sprints
- Deployment readiness recommendation
- Executive summary suitable for stakeholders

### Example 5: Choose Between Implementations

```bash
curl -X POST http://localhost:3010/v1/agent/stream \
  -H "Content-Type: application/json" \
  -d '{
    "chatId": "impl-compare",
    "userRequest": "/review-compare src/auth/jwt-impl.ts src/auth/session-impl.ts"
  }'
```

**Expected Output**:

- Comparison matrix (security, performance, quality, architecture)
- Clear recommendation with rationale
- Trade-offs and when to reconsider

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────┐
│                      CC-SVC API                         │
│                 (POST /v1/agent/stream)                 │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│              Claude Agent SDK Wrapper                   │
│    (wrapper.ts - MCP integration, agent loading)        │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│                 .claude/ Directory                      │
│                                                         │
│  ┌───────────┐  ┌────────────┐  ┌──────────────┐     │
│  │  Skills   │  │   Agents   │  │   Commands   │     │
│  │ (3 files) │  │ (5 files)  │  │  (6 files)   │     │
│  └───────────┘  └────────────┘  └──────────────┘     │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│                   MCP Servers                           │
│                                                         │
│  ┌──────────────────┐                                  │
│  │ Embeddings MCP   │  (Port 8912)                    │
│  │  - embed_codebase                                   │
│  │  - search_codebase                                  │
│  └──────────────────┘                                  │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│            Embeddings Infrastructure                    │
│                                                         │
│  Embeddings API (Port 8001) → ChromaDB (Port 8000)    │
│  Vector similarity search with all-MiniLM-L6-v2        │
└─────────────────────────────────────────────────────────┘
```

### File Structure

```
src/cc-svc/
├── .claude/
│   ├── agents/
│   │   ├── security-reviewer.md         (OWASP, vulnerabilities)
│   │   ├── performance-reviewer.md      (Big-O, N+1 queries)
│   │   ├── quality-reviewer.md          (SOLID, technical debt)
│   │   ├── architecture-reviewer.md     (System design, coupling)
│   │   ├── review-orchestrator.md       (Multi-agent coordination)
│   │   └── code-reviewer-agent.md       (Original general reviewer)
│   ├── skills/
│   │   ├── vector-search-code.md        (Semantic code search)
│   │   ├── calculate-code-metrics.md    (Quantitative analysis)
│   │   └── scan-security-patterns.md    (Pattern-based security scan)
│   └── commands/
│       ├── review-security.md
│       ├── review-performance.md
│       ├── review-quality.md
│       ├── review-architecture.md
│       ├── review-full.md
│       └── review-compare.md
├── src/
│   ├── routes/
│   │   ├── agent.ts                     (POST /v1/agent/stream)
│   │   └── health.ts                    (GET /health)
│   ├── sdk/
│   │   ├── wrapper.ts                   (Claude SDK integration)
│   │   └── prompts.ts
│   └── ...
├── .mcp.json                            (MCP servers config)
└── README.md                            (This file)
```

### How It Works

1. **User sends HTTP request** with command: `/review-security /path/to/code`
2. **SDK wrapper** loads agents/skills/commands from `.claude/` directory
3. **Command expands** into a prompt that routes to the appropriate agent
4. **Agent executes**:
   - Uses skills (vector-search-code, calculate-code-metrics, etc.)
   - Uses MCP tools (embeddings search)
   - Uses built-in tools (Read, Grep, Glob)
   - Applies domain expertise
5. **Results stream** back to client via Server-Sent Events
6. **Session ID returned** for resuming conversation

### Integration with Embeddings

The review system leverages the embeddings MCP for semantic code discovery:

1. **Embed codebase** (one-time): `mcp__embeddings__embed_codebase({ file_system_path: "/path" })`
2. **Search codebase** (during reviews): `mcp__embeddings__search_codebase({ query: "auth code", file_system_path: "/path", max_results: 15 })`

Embeddings enable semantic search:

- Query: "authentication logic" finds files with `login`, `JWT`, `session`, etc.
- Query: "database queries" finds ORM usage, SQL, connection pools
- Works across languages and frameworks

## Configuration

### Environment Variables

```bash
# Server
PORT=3010

# Claude API
ANTHROPIC_BASE_URL=https://api.anthropic.com
ANTHROPIC_AUTH_TOKEN=your-api-key-here
ANTHROPIC_SONNET_MODEL=claude-sonnet-4-5-20250929
ANTHROPIC_HAIKU_MODEL=claude-haiku-4-5-20251001

# Application
NODE_ENV=production
APP_VERSION=1.0.0
```

### MCP Configuration

Edit `.mcp.json` to configure MCP servers:

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

## Development

### Running Locally

```bash
# Install dependencies
bun install

# Start development server
bun run dev

# Run tests
bun test

# Build for production
bun run build:prod
```

### Testing Reviews

```bash
# Start cc-svc
bun run dev

# In another terminal, test a review
curl -X POST http://localhost:3010/v1/agent/stream \
  -H "Content-Type: application/json" \
  -d '{
    "chatId": "test-1",
    "userRequest": "/review-security /Users/simon.stipcich/code/repo/cossessor/src/cc-svc/src/routes"
  }'
```

### Adding New Agents/Skills/Commands

1. **Add Skill**: Create `.claude/skills/your-skill.md` with input/output spec
2. **Add Agent**: Create `.claude/agents/your-agent.md` with role, capabilities, process
3. **Add Command**: Create `.claude/commands/your-command.md` that routes to agent
4. **Test**: Send request with your new command

The SDK automatically discovers new files in `.claude/` - no code changes needed!

## Best Practices

### When to Use Each Review Type

- **Security**: Before deployment, after security incidents, for compliance
- **Performance**: When users report slowness, before scaling, for optimization sprints
- **Quality**: Regular intervals (monthly), before major refactoring, for technical debt planning
- **Architecture**: Before major features, when scaling, for strategic planning
- **Full**: Pre-launch, quarterly health checks, comprehensive audits
- **Compare**: When choosing between implementations, during design phase

### Review Frequency Recommendations

- **Security**: Every deployment (automated in CI/CD)
- **Performance**: Monthly or when performance issues arise
- **Quality**: Quarterly for technical debt assessment
- **Architecture**: Bi-annually or before major changes
- **Full**: Before major releases (v1.0, v2.0, etc.)

## Troubleshooting

### Issue: Review returns no findings

**Possible causes**:

- Codebase not embedded yet
- Path incorrect or doesn't exist
- Embeddings service unavailable

**Solutions**:

1. Embed codebase: Send request with `"userRequest": "Use mcp__embeddings__embed_codebase with path /your/path"`
2. Verify path is absolute and exists
3. Check embeddings-mcp service is running (port 8912)

### Issue: Review takes too long

**Possible causes**:

- Large codebase (>100 files)
- Full review invoking all agents

**Solutions**:

1. Review specific subdirectories instead of entire codebase
2. Use targeted reviews (`/review-security`) instead of full reviews
3. Increase timeout in request

### Issue: Agent not found

**Possible causes**:

- Agent file doesn't exist in `.claude/agents/`
- Typo in agent name
- SDK not configured to load from `.claude/` directory

**Solutions**:

1. Verify file exists: `ls .claude/agents/`
2. Check wrapper.ts has `settingSources: ['project']` (line 244)
3. Restart service to reload agents

## Contributing

When adding new review capabilities:

1. **Follow existing patterns**: Study existing agents/skills for structure
2. **Be educational**: Include clear explanations (this helps users learn Claude Code SDK)
3. **Provide examples**: Show concrete code examples in findings
4. **Estimate impact**: Provide measurable improvements ("10x faster", "6 weeks technical debt")
5. **Test thoroughly**: Test with real codebases, intentionally flawed code

## Resources

- [Claude Agent SDK Documentation](https://docs.anthropic.com/claude-agent-sdk)
- [Model Context Protocol (MCP)](https://modelcontextprotocol.io)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [CWE - Common Weakness Enumeration](https://cwe.mitre.org/)

## License

See root repository for license information.
