# Review Performance Command

Performs a comprehensive performance review to identify bottlenecks, algorithmic inefficiencies, and scalability concerns.

## Usage

```
/review-performance <path>
```

## What This Command Does

You are being invoked via the `/review-performance` command.

**Task**: Perform a comprehensive performance review of the code at the specified path.

**Target Path**: The path provided by the user after the command

**Process**:

1. Use the **performance-reviewer** agent to perform the performance analysis
2. The performance-reviewer will:
   - Use vector-search-code skill to find performance-critical code (API endpoints, database queries, algorithms)
   - Use calculate-code-metrics skill to identify complex algorithms
   - Analyze Big-O complexity of algorithms
   - Identify N+1 query problems
   - Check for memory leaks and resource management issues
   - Provide measurable performance improvements with estimates
3. Present findings in the performance review format with:
   - Executive summary
   - Critical performance issues with expected improvements (e.g., "30s → 100ms")
   - Algorithmic complexity analysis
   - Database optimization recommendations
   - Scalability assessment

**Context**: This is an on-demand performance audit triggered by the user. Focus on identifying bottlenecks that affect user experience, throughput, or scalability.

**Expected Output**: Comprehensive performance assessment with concrete optimization recommendations and estimated improvements.
