# Review Quality Command

Performs a comprehensive code quality review to assess maintainability, readability, and adherence to best practices.

## Usage

```
/review-quality <path>
```

## What This Command Does

You are being invoked via the `/review-quality` command.

**Task**: Perform a comprehensive code quality review of the code at the specified path.

**Target Path**: The path provided by the user after the command

**Process**:

1. Use the **quality-reviewer** agent to perform the quality analysis
2. The quality-reviewer will:
   - Use vector-search-code skill to understand existing patterns
   - Use calculate-code-metrics skill for quantitative quality metrics
   - Assess SOLID principles adherence
   - Identify code smells and anti-patterns
   - Check for DRY violations (code duplication)
   - Review naming conventions and readability
   - Evaluate error handling consistency
   - Review testing coverage and quality
   - Assess documentation completeness
3. Present findings in the quality review format with:
   - Executive summary with maintainability score
   - Critical quality issues (God functions, tight coupling)
   - Technical debt catalog with estimated effort
   - Code consistency analysis
   - Refactoring roadmap

**Context**: This is an on-demand code quality audit triggered by the user. Focus on maintainability, readability, and long-term sustainability of the codebase.

**Expected Output**: Comprehensive quality assessment with refactoring recommendations and technical debt estimates.
