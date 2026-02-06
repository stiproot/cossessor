# Full Review Command

Performs a comprehensive multi-aspect code review covering security, performance, code quality, and architecture.

## Usage

```
/review-full <path>
```

## What This Command Does

You are being invoked via the `/review-full` command.

**Task**: Perform a comprehensive review of all aspects (security, performance, quality, architecture) of the code at the specified path.

**Target Path**: The path provided by the user after the command

**Process**:

1. Use the **review-orchestrator** agent to coordinate the comprehensive review
2. The review-orchestrator will:
   - Analyze the scope and prioritize review areas
   - Invoke specialized review agents:
     - **security-reviewer**: Identify vulnerabilities and security risks
     - **performance-reviewer**: Find bottlenecks and optimization opportunities
     - **quality-reviewer**: Assess maintainability and code quality
     - **architecture-reviewer**: Evaluate system design and scalability
   - Aggregate findings from all agents
   - Identify cross-cutting concerns (issues spanning multiple domains)
   - Resolve conflicts between recommendations
   - Prioritize issues using multi-dimensional criteria (severity, impact, effort)
   - Generate executive summary with deployment recommendation
3. Present findings in the orchestrated review format with:
   - Executive summary with overall health score
   - Findings organized by severity (CRITICAL, HIGH, MEDIUM, LOW)
   - Cross-cutting concerns analysis
   - Prioritized action plan (Sprint 1, Sprint 2, Sprint 3, ...)
   - Domain-specific summaries (security, performance, quality, architecture)
   - Success metrics (before and after fixes)
   - Deployment readiness recommendation

**Context**: This is a comprehensive code review triggered by the user. It provides a holistic view of the codebase health across all dimensions and creates a prioritized remediation roadmap.

**Expected Output**: Comprehensive multi-aspect review with synthesized findings, prioritized action plan, and executive summary suitable for technical and non-technical stakeholders.

**Note**: This review invokes multiple specialized agents and may take longer than single-aspect reviews.
