# Compare Review Command

Compares two implementations or approaches and provides a recommendation based on multiple criteria.

## Usage

```
/review-compare <path1> <path2>
```

## What This Command Does

You are being invoked via the `/review-compare` command.

**Task**: Compare two implementations and provide a recommendation based on security, performance, quality, and architectural considerations.

**Paths**:

- **Implementation A**: First path provided by the user
- **Implementation B**: Second path provided by the user

**Process**:

1. Perform analysis on both implementations:
   - Use vector-search-code skill to understand both implementations
   - Read both files or directories thoroughly
   - Use calculate-code-metrics on both for quantitative comparison
   - Apply security, performance, quality, and architecture analysis to both
2. Compare across multiple dimensions:
   - **Security**: Which is more secure? Any vulnerabilities?
   - **Performance**: Which is faster? Algorithmic complexity comparison
   - **Quality**: Which is more maintainable? Code metrics comparison
   - **Architecture**: Which fits better with system design?
   - **Simplicity**: Which is easier to understand and modify?
   - **Test Coverage**: Which has better tests?
   - **Dependencies**: Which has fewer or better dependencies?
3. Create comparison matrix showing trade-offs
4. Provide clear recommendation with rationale

**Output Format**:

```markdown
# Implementation Comparison

## Executive Summary
[Which implementation is recommended and why]

## Comparison Matrix

| Dimension | Implementation A | Implementation B | Winner |
|-----------|------------------|------------------|--------|
| Security | [Score/Assessment] | [Score/Assessment] | [A/B/Tie] |
| Performance | [Metrics] | [Metrics] | [A/B/Tie] |
| Quality | [Score] | [Score] | [A/B/Tie] |
| Architecture | [Assessment] | [Assessment] | [A/B/Tie] |
| Simplicity | [Complexity score] | [Complexity score] | [A/B/Tie] |
| Maintainability | [Score] | [Score] | [A/B/Tie] |

## Detailed Analysis

### Implementation A
- **Strengths**: [List]
- **Weaknesses**: [List]
- **Code Metrics**: [Complexity, LOC, etc.]

### Implementation B
- **Strengths**: [List]
- **Weaknesses**: [List]
- **Code Metrics**: [Complexity, LOC, etc.]

## Recommendation

**Winner**: [Implementation A/B]

**Rationale**: [Detailed explanation of why this implementation is recommended, considering all dimensions]

**Trade-offs**: [What you gain and lose with this choice]

**When to Reconsider**: [Scenarios where the other implementation might be better]
```

**Context**: This is a comparison review to help make informed decisions between alternative implementations. Focus on objective criteria and clear trade-offs.

**Expected Output**: Side-by-side comparison with clear recommendation and rationale.

## Examples

### Example 1: Comparing Database Access Patterns

```bash
/review-compare src/repositories/user-repo-v1.ts src/repositories/user-repo-v2.ts
```

**Potential Output**:

- v1 uses raw SQL (faster, less safe)
- v2 uses ORM (slower, more safe)
- Recommendation: v2 for better maintainability despite slight performance cost

### Example 2: Comparing API Implementations

```bash
/review-compare src/api/rest-implementation src/api/graphql-implementation
```

**Potential Output**:

- REST: simpler, better caching, more endpoints
- GraphQL: flexible, fewer requests, learning curve
- Recommendation: Depends on client needs and team expertise
