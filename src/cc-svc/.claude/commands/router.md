---
name: router
allowed-tools: Read, Agent
description: Route the user request to the appropriate subagent
argument-hint: [user request]
---

# Plan Command

Figure out where the user request should go, and route it to the appropriate subagent.
Your focus is to route the request, not to answer it yourself.

## Input

User Request = $1

---

## ROUTING LOGIC
Fetch all available MCP Server tools, these will be `TOOLS`.

1. Analyse the User Request for the following
   - (a) Can you respond to the user request directly?
   - (b) Can you respond to the user request using the conversation history if available?
   - (c) Do you need one of the `TOOLS` to answer the request?
   - (d) Do you have the available resources to answer the query?
   
2. If (a)==yes | (b)==yes, respond directly to the user without routing.

3. If (c)==yes, route to `@planner-agent` with the User Request and (if exists) summarized Conversation History.

4. If (d)==no, respond directly to the user with an apology and explanation.

---

⚠️ **CRITICAL**: You MUST NOT use any tools directly. 
You can EITHER respond with a single message, OR route to subagents using the `Agent` tool.
If tools are needed, invoke: `@planner-agent` with the User Request.
