---
description: Analyze user request to determine complexity and required tools
argument-hint: [user request]
---

# Analyze Command

Analyze the user's request to determine task complexity, required tools, and create a structured plan.

## Input

`$ARGUMENTS` - The user's request to analyze

## Analysis Process

### Step 1: Request Classification

1. Classify the request into one of these categories:
   - **Simple**: Single action, no external tools needed
   - **Moderate**: Multiple steps, may need file operations
   - **Complex**: Requires external tools (MCP), multiple subagents, or multi-step workflows

2. If its **Simple**, like
   - a conversational message or question, 
   - a straightforward question with a direct answer, 
   - or you have the information in the session history
  respond immediately to the users request

3. If **Moderate** or **Complex**, proceed to Step 2: Tool Assessment
   - NB, if the user requests a rewrite of the plan, that would always be either moderate or complex depending on the original plan complexity

### Step 2: Tool Assessment

Check which tools might be needed:

**MCP Tools Available:**
- `mcp_embeddings_embed_codebase` - Embed a codebase into vector database for semantic search
- `mcp_embeddings_search_codebase` - Search embedded codebase using vector similarity

**Subagents Available:**
- `planner-agent`
  - Task planning and decomposition
  - Creates structured plans for complex requests
- `code-reviewer-agent`
  - Code review and quality analysis
  - Identifies potential issues and suggests improvements

### Step 3: Plan Generation

1. **How complex is the plan**
  - for moderate plans we want to use 3 steps, 4 steps maximum
  - for complex plans we want to use 5 steps, maximum 7 steps

2. Create a step-by-step plan with:
   - Step number
   - Action description
   - Required tools/subagents
   - Expected output

## Output Format

```
## 📊 The Proposed Plan

This appears to be a [Moderate/Complex] ask, requiring [number] steps to complete.

### Execution Plan
1. **[Step Title]**
   - Action: [description]
   - Tool: [tool name]
   - Subagent: [subagent name]
   - Output: [expected result]

2. **[Step Title]**
   - Action: [description]
   - Tool: [tool name]
    - Subagent: [subagent name]
   - Output: [expected result]

Would you like to proceed with this plan?
```

## Notes

- For **Simple** requests
  - Respond directly without creating a plan
- For **Moderate** and **Complex** requests
  - Do NOT execute the plan, only analyze and report
  - If the request is ambiguous, ask clarifying questions
  - Always identify the minimum set of tools needed
