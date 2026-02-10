# MCP Tool Usage Test

## Purpose

This focused test (`mcp-tool-usage.test.ts`) verifies that Claude is actually calling the `mcp__embeddings__search_codebase` tool when asked to search code.

## Why This Test Exists

We confirmed that:
- ✅ Embeddings-MCP works (integration tests pass)
- ✅ Embeddings-MCP → Embeddings-API → ChromaDB flow works
- ❓ But cc-svc wasn't calling the MCP tool

This test helps us debug **why** Claude isn't using the vector search tool.

## Running the Test

```bash
# Run just this one focused test
bun run test:mcp

# Or run it directly
bun test src/__tests__/integration/mcp-tool-usage.test.ts
```

## What the Test Does

1. Sends a request: "Search the codebase for authentication-related code"
2. Explicitly includes: "Use vector search to find relevant files"
3. Parses all SSE events from Claude's response
4. Looks for `tool_use` events with name `mcp__embeddings__search_codebase`
5. **FAILS if the MCP tool was NOT called**

## Expected Output (Success)

```
🔍 Waiting for cc-svc to be ready...
✅ CC-SVC is ready

📝 Sending request: Search for authentication code
📂 Codebase path: /Users/simon.stipcich/code/grads/Prosper-Derivco-Assessment/

📊 Total events received: 150
📋 Event types: [ 'start', 'message', 'complete' ]

🔧 Tool use events found: 1

🔧 Tool 1: mcp__embeddings__search_codebase
   Input: {
     "query": "authentication login security",
     "file_system_path": "/Users/simon.stipcich/code/grads/Prosper-Derivco-Assessment/",
     "max_results": 15
   }

✅ Test passed: MCP embeddings tool was called successfully!
```

## Expected Output (Failure - Current Issue)

```
📊 Total events received: 200
📋 Event types: [ 'start', 'message', 'complete' ]

🔧 Tool use events found: 3

🔧 Tool 1: Glob
   Input: { "pattern": "**/*.cs" }

🔧 Tool 2: Grep
   Input: { "pattern": "authentication" }

🔧 Tool 3: Read
   Input: { "file_path": "/path/to/file.cs" }

❌ MCP embeddings tool was NOT called!
📋 Tools that were called:
   - Glob
   - Grep
   - Read

Error: Expected true, received false
```

## Debugging Steps

### 1. Check cc-svc Console Output

With our updated logging, you should see:

```
🔧 [TOOL CALL] Glob
🔧 [TOOL CALL] Grep
🔧 [TOOL CALL] Read
```

Or (if working):
```
🔧 [TOOL CALL] mcp__embeddings__search_codebase
🔧 [MCP CALL] mcp__embeddings__search_codebase
  Server: embeddings
```

### 2. Check MCP Server Configuration

Verify `.mcp.json` is loaded:
```
[wrapper] Loaded 1 MCP servers from .mcp.json: [ "embeddings" ]
```

### 3. Check System Prompt

The prompt should include:
```
**CRITICAL: This codebase has been pre-embedded into a vector database. You MUST use vector search to find relevant code.**
```

### 4. Verify MCP Server is Available

```bash
curl http://localhost:8912/health
# Should return: {"status":"ok","service":"embeddings-mcp",...}
```

## Common Issues

### Issue: Claude uses Glob/Grep instead of MCP

**Possible Causes:**
1. System prompt not strong enough → Claude defaults to familiar tools
2. MCP server not in allowed tools list
3. Claude doesn't understand it should use the MCP tool
4. Tool name mismatch (check `.mcp.json` vs tool definitions)

**Solutions:**
- Make system prompt MORE directive (use CAPS, bold)
- Add examples in the prompt showing MCP tool usage
- Check `allowedTools` in `src/sdk/wrapper.ts` includes `mcp__embeddings__*`

### Issue: "MCP server not found" error

**Cause:** `.mcp.json` not loaded or malformed

**Solution:** Check that `.mcp.json` exists in cc-svc root and is valid JSON

### Issue: Tool called but no results

**Cause:** Codebase not embedded or wrong path

**Solution:** Verify collection exists in ChromaDB

## Next Steps

Once this test **passes**, we know:
- ✅ Claude is calling the MCP tool
- ✅ The full stack works end-to-end
- ✅ Vector search is being used

Then we can return to the full integration test suite.
