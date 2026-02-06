# Review Architecture Command

Performs a comprehensive architectural review to assess system design, scalability, and long-term viability.

## Usage

```
/review-architecture <path>
```

## What This Command Does

You are being invoked via the `/review-architecture` command.

**Task**: Perform a comprehensive architectural review of the code at the specified path.

**Target Path**: The path provided by the user after the command

**Process**:

1. Use the **architecture-reviewer** agent to perform the architectural analysis
2. The architecture-reviewer will:
   - Use vector-search-code skill to understand system structure
   - Map dependency graphs and detect circular dependencies
   - Assess architectural pattern conformance (layered, hexagonal, etc.)
   - Evaluate API design against REST/GraphQL principles
   - Review data modeling and database design
   - Assess scalability and horizontal scaling readiness
   - Analyze service boundaries and coupling
   - Evaluate technology stack fitness
3. Present findings in the architecture review format with:
   - Executive summary with architecture health score
   - Architectural pattern conformance assessment
   - Critical architectural issues (circular dependencies, scalability blockers)
   - Dependency analysis with coupling metrics
   - Scalability assessment with load estimates
   - Technology stack evaluation
   - Migration path recommendations

**Context**: This is an on-demand architectural audit triggered by the user. Focus on system design, scalability, and strategic concerns that affect long-term viability.

**Expected Output**: Comprehensive architectural assessment with strategic recommendations and migration paths.
