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
- `mcp_clickhouse-mc_list_tables` - List tables in a database
- `mcp_clickhouse-mc_run_select_query` - Execute SELECT queries
- `mcp_github-issues_search_issues` - Search GitHub issues
- `mcp_github-issues_get_issue` - Get issue details
- `mcp_github-issues_create_issue` - Create new issue
- `mcp_github-issues_add_comment` - Add comment to issue
- `mcp_github-issues_update_issue` - Update issue
- `mcp_github-issues_list_labels` - List available labels

**Subagents Available:**
- `clickhouse-analyst` 
  - Database queries and analytics
  - ClickHouse connections
  - Queries our clickhouse database to get information for the user regarding analytics data, player data, events, etc.
- `github-issues-manager`
  - Issue management
  - Creates issues based on user requests, if the user is unhappy with a process or feature, or if they report a bug.
  - Manages specific GitHub issues including creation, updates, and comments.

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
