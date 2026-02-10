# Vector Search Code Skill

A reusable skill for discovering relevant code files using semantic embeddings. This skill provides a standardized pattern for all agents to search codebases efficiently.

## Purpose

Use vector similarity search to find code files relevant to a specific query. This is the "discovery" phase of the two-phase pattern (discovery → analysis).

## When to Use This Skill

- Finding files related to a specific feature (e.g., "authentication logic")
- Discovering security-critical code (e.g., "database queries", "user input handling")
- Locating performance-critical paths (e.g., "API endpoints", "data processing")
- Understanding architectural patterns (e.g., "service layers", "middleware")
- Finding similar code for consistency checking

## Input Parameters

- **query** (required): Natural language or technical description of what to find
  - Examples:
    - "authentication middleware and login handlers"
    - "SQL queries and database connections"
    - "error handling and logging"
    - "React components with user input forms"

- **codebase_path** (provided in context): Absolute path to the codebase to search
  - This value is provided in your request context from the user's API request
  - When calling the MCP tool, use this value for the `file_system_path` parameter
  - The codebase at this path must have been previously embedded
  - Example: `/Users/simon.stipcich/code/repo/cossessor/src/cc-svc`

- **max_results** (optional): Number of results to return (default: 10)
  - Range: 1-50
  - Recommendation: 10-15 for focused searches, 20-30 for broad exploration

## Process

### Step 1: Call Embeddings MCP Tool

Use the `mcp__embeddings__search_codebase` tool with the provided parameters:

```
mcp__embeddings__search_codebase({
  query: "authentication middleware security",
  file_system_path: "/path/to/codebase",
  max_results: 15
})
```

### Step 2: Parse Results

The tool returns results in this format:

```json
{
  "results": [
    {
      "file_path": "src/middleware/auth.ts",
      "relevance_score": 0.92,
      "snippet": "export function authMiddleware(req, res, next) { ... }"
    }
  ]
}
```

### Step 3: Format and Return

Transform results into a clear, actionable format for the agent:

- List files by relevance (highest first)
- Include relevance scores for context
- Preserve code snippets for quick assessment
- Note if fewer results than requested were found (may indicate narrow search)

## Output Format

```markdown
### Vector Search Results

Found X relevant files for query: "<query>"

1. **src/middleware/auth.ts** (relevance: 0.92)
   ```typescript
   export function authMiddleware(req, res, next) {
     // Verify JWT token
     ...
   }
   ```

1. **src/routes/login.ts** (relevance: 0.87)

   ```typescript
   router.post('/login', async (req, res) => {
     // Handle user login
     ...
   }
   ```

[... additional results ...]

**Next Steps**: Use the `Read` tool to examine these files in detail.

```

## Usage Examples

### Example 1: Security Review - Find Authentication Code

**Input**:
```

query: "authentication middleware JWT token validation"
codebase_path: "/Users/simon.stipcich/code/repo/cossessor/src/cc-svc"
max_results: 10

```

**Expected Output**:
- Files containing JWT handling logic
- Middleware files with auth functions
- Token validation utilities
- Login/logout endpoints

**Next Action**: Read found files to analyze security vulnerabilities

### Example 2: Performance Review - Find Database Queries

**Input**:
```

query: "database queries SQL Postgres connection pool"
codebase_path: "/Users/simon.stipcich/code/repo/cossessor/src/cc-svc"
max_results: 15

```

**Expected Output**:
- Files with database connection setup
- Query execution code
- ORM usage patterns
- Connection pool configuration

**Next Action**: Read files to check for N+1 queries and missing indexes

### Example 3: Architecture Review - Understand Service Boundaries

**Input**:
```

query: "service layer business logic dependencies"
codebase_path: "/Users/simon.stipcich/code/repo/cossessor/src/cc-svc"
max_results: 20

```

**Expected Output**:
- Service class definitions
- Business logic implementations
- Inter-service dependencies
- API boundaries

**Next Action**: Use Grep to map import statements and build dependency graph

## Best Practices

### Query Crafting

**Good Queries** (specific and semantic):
- "user authentication with password hashing"
- "API rate limiting middleware"
- "database transaction handling with rollback"

**Poor Queries** (too vague):
- "security"
- "code"
- "functions"

### Result Quantity

- **Security reviews**: 15-20 results (need comprehensive coverage)
- **Performance reviews**: 10-15 results (focus on hot paths)
- **Quality reviews**: 20-30 results (broad pattern analysis)
- **Architecture reviews**: 25-40 results (understand full structure)

### Handling No Results

If the tool returns 0 results:
1. Check if the codebase has been embedded (use `mcp__embeddings__embed_codebase` first)
2. Try a broader query
3. Fall back to `Glob` with file patterns (e.g., `**/*.ts`) and `Grep` with keywords

### Combining with Other Tools

This skill is the **first step** in a workflow:

```

1. Vector Search (this skill) → Discover relevant files
2. Read → Examine file contents in detail
3. Grep → Find specific patterns within files
4. Analysis → Agent applies domain expertise

```

Never skip straight to analysis - always start with discovery!

## Integration Notes

### For Agents Using This Skill

When invoking this skill from an agent:

```markdown
I need to find authentication-related code. Let me use the vector-search-code skill.

[Use Skill tool to invoke vector-search-code with parameters]

Now that I have discovered these files, I'll read each one to analyze security:
[Use Read tool on each discovered file]
```

### For Commands Routing to Agents

Commands should pass the codebase path through to agents:

```markdown
The user has invoked /review-security with path: /path/to/code

Route to security-reviewer agent with:
- Target path: /path/to/code
- Context: On-demand security review requested by user
```

## Technical Details

### How Embeddings Work

1. **Embedding Phase** (one-time):
   - Code is chunked into pieces (~1500 tokens)
   - Each chunk is converted to a vector (384 dimensions with all-MiniLM-L6-v2)
   - Vectors stored in ChromaDB with metadata (file path, chunk index)

2. **Search Phase** (this skill):
   - Query is converted to same vector format
   - ChromaDB finds most similar vectors (cosine similarity)
   - Returns top N matches with scores

3. **Why This Works**:
   - Semantic understanding: "auth" matches "login", "authentication", "JWT"
   - Context-aware: "security middleware" finds relevant patterns even with different names
   - Language-agnostic: Works across TypeScript, Python, Go, etc.

### Performance Characteristics

- **Latency**: ~100-500ms for typical searches
- **Accuracy**: High for semantic queries, lower for exact syntax matching
- **Scalability**: Handles large codebases (100K+ files) efficiently
- **Cost**: No LLM tokens used (pure vector search)

## Troubleshooting

### Issue: No results returned

**Causes**:

- Codebase not embedded yet
- Query too specific
- Path incorrect

**Solutions**:

1. Verify embeddings: `mcp__embeddings__embed_codebase({ file_system_path: "/path/to/code" })`
2. Broaden query: "auth" instead of "JWT token validation with RSA signatures"
3. Check path is absolute and exists

### Issue: Too many irrelevant results

**Causes**:

- Query too broad
- Codebase has many similar patterns

**Solutions**:

1. Make query more specific: Add technical details, framework names, or context
2. Reduce max_results to focus on top matches
3. Use additional filters in subsequent Grep searches

### Issue: Missing expected files

**Causes**:

- Embedding chunking split relevant code
- File not included in embedding (ignored patterns)
- Query doesn't match code semantics

**Solutions**:

1. Try alternative query phrasings
2. Use Glob as fallback: `**/*auth*.ts`
3. Combine with Grep: Search for exact function/class names

## Claude Code SDK Learning Notes

### What Makes This a "Skill"?

**Skills vs Agents**:

- Skills are **operations** (do one thing, return result)
- Agents are **personas** (reason, decide, use multiple tools)
- This skill is pure operation: take query → return files

**Skills vs Commands**:

- Skills are **internal** (agents invoke them)
- Commands are **external** (users invoke them)
- This skill is never called directly by users

### Reusability Pattern

This skill demonstrates the **DRY principle** for Claude Code SDK:

```
Without skill (duplication):
- Security agent: writes embedding search code
- Performance agent: writes same embedding search code
- Quality agent: writes same embedding search code
- Architecture agent: writes same embedding search code

With skill (reuse):
- All agents: invoke vector-search-code skill
- Single source of truth for search logic
- Consistent behavior across agents
- Easy to update (change once, affects all)
```

### Composability

Skills can be composed with other skills and tools:

```
Skill: vector-search-code
  ↓
Skill: analyze-file-patterns
  ↓
Agent: security-reviewer (makes decisions)
```

This creates a **pipeline** of operations that agents orchestrate.

## Version History

- v1.0: Initial implementation with basic vector search
- Future: Add filtering by file type, date range, author

## Related Skills

- `calculate-code-metrics` - Quantitative analysis of discovered files
- `scan-security-patterns` - Quick pattern matching on discovered files
- `analyze-file-patterns` - Pattern consistency checking

## Related Agents

- `security-reviewer` - Uses this skill to find security-critical code
- `performance-reviewer` - Uses this skill to find performance hotspots
- `quality-reviewer` - Uses this skill to find pattern inconsistencies
- `architecture-reviewer` - Uses this skill to understand system structure
