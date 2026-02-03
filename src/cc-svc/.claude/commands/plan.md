---
allowed-tools: Read, Write, Edit, Grep, Glob, Bash, Skill, Agent
description: Create a 3-step plan and execute it
argument-hint: [user request]
---

# Plan Command

Create a focused 3-step plan based on the user's request, then execute each step.

## Input

`$ARGUMENTS` - The user's request to plan and execute

## Planning Phase

### Create Exactly 3 Todos

Break down the request into exactly 3 actionable steps:

1. **Todo 1**: Initial step (setup, research, or preparation)
2. **Todo 2**: Core action (main task execution)
3. **Todo 3**: Finalization (verification, cleanup, or output)

### Todo Format

Each todo must have:
- **Title**: Clear, actionable description (5-10 words)
- **Description**: Detailed requirements
- **Success Criteria**: How to know it's complete

## Execution Phase

Execute each todo in sequence:

### For Each Todo:

1. **Announce**: State which todo you're starting
2. **Execute**: Perform the required actions
3. **Report**: Summarize what was accomplished
4. **Transition**: Move to next todo

### Progress Tracking

Use this format during execution:

```
## 📋 Plan Created

### Todo 1: [Title]
- Description: [details]
- Status: ⏳ Pending

### Todo 2: [Title]
- Description: [details]
- Status: ⏳ Pending

### Todo 3: [Title]
- Description: [details]
- Status: ⏳ Pending

---

## 🚀 Execution

### ✅ Todo 1: [Title]
[What was done]
[Results/Output]

### ✅ Todo 2: [Title]
[What was done]
[Results/Output]

### ✅ Todo 3: [Title]
[What was done]
[Results/Output]

---

## 📊 Summary

- **Completed**: 3/3 todos
- **Key Results**: [main outcomes]
- **Next Steps**: [if any]
```

## Guidelines

- Keep each todo focused and achievable
- If a todo fails, report the error and attempt recovery
- Use appropriate subagents for specialized tasks
- Provide clear output after each todo completion

## Example

**Input**: `/plan add error handling to the login function`

**Output**:
```
## 📋 Plan Created

### Todo 1: Analyze Current Implementation
- Read the login function
- Identify error-prone areas
- Status: ⏳ Pending

### Todo 2: Implement Error Handling
- Add try-catch blocks
- Create meaningful error messages
- Status: ⏳ Pending

### Todo 3: Verify and Document
- Test error scenarios
- Add code comments
- Status: ⏳ Pending
```
