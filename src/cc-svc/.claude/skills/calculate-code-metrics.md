# Calculate Code Metrics Skill

A reusable skill for computing quantitative code metrics such as lines of code, cyclomatic complexity, and function statistics. Provides objective measurements to support code quality and performance assessments.

## Purpose

Calculate measurable code metrics for files to provide objective data for review decisions. Complements subjective code review with quantitative analysis.

## When to Use This Skill

- Assessing code complexity (cyclomatic complexity, nesting depth)
- Measuring code size (LOC, SLOC, file size)
- Evaluating function/method characteristics (count, average length)
- Checking documentation coverage (comment ratio)
- Identifying refactoring candidates (long functions, complex methods)
- Comparing implementations objectively

## Input Parameters

- **file_path** (required): Absolute path to the file to analyze
  - Example: `/Users/simon.stipcich/code/repo/cossessor/src/cc-svc/src/routes/agent.ts`

- **metric_types** (optional): Array of metrics to calculate
  - Options: `['all']` (default), or specific metrics:
    - `'lines'` - Line counts (total, source, comments)
    - `'complexity'` - Cyclomatic complexity (approximate)
    - `'functions'` - Function statistics
    - `'structure'` - Nesting depth, block counts
    - `'documentation'` - Comment ratio, docstring coverage

## Process

### Step 1: Read File Contents

Use the `Read` tool to load the file:

```
Read({ file_path: "/path/to/file.ts" })
```

### Step 2: Calculate Metrics

Analyze the file contents to compute metrics:

#### Lines of Code Metrics

- **Total Lines (LOC)**: All lines including blank lines
- **Source Lines (SLOC)**: Lines with actual code (excluding comments and blank lines)
- **Comment Lines**: Lines with comments (single-line and multi-line)
- **Blank Lines**: Empty lines
- **Comment Ratio**: (Comment Lines / Source Lines) * 100

#### Complexity Metrics (Approximate)

- **Cyclomatic Complexity**: Count decision points
  - Count: `if`, `else if`, `while`, `for`, `case`, `catch`, `&&`, `||`, `?`
  - Formula: Decision points + 1
  - Thresholds:
    - 1-10: Low complexity (good)
    - 11-20: Moderate complexity (acceptable)
    - 21-50: High complexity (refactor recommended)
    - 50+: Very high complexity (refactor required)

- **Nesting Depth**: Maximum depth of nested blocks
  - Thresholds:
    - 1-3: Good
    - 4-5: Acceptable
    - 6+: Too deep (refactor recommended)

#### Function Metrics

- **Function Count**: Total number of functions/methods
- **Average Function Length**: Average lines per function
- **Longest Function**: Line count of largest function
- **Functions >50 lines**: Count of long functions
- **Functions >100 lines**: Count of very long functions

#### Structure Metrics

- **Classes**: Number of class definitions
- **Interfaces/Types**: Number of type definitions
- **Imports**: Number of import statements (coupling indicator)
- **Exports**: Number of exported entities

### Step 3: Evaluate Against Thresholds

Compare metrics to industry standard thresholds and flag violations:

```typescript
// Example thresholds (adjust per language/project)
const thresholds = {
  maxFunctionLength: 50,
  maxComplexity: 15,
  maxNestingDepth: 4,
  minCommentRatio: 10,
  maxFileLength: 500
};
```

### Step 4: Format Results

Return structured output with:

- Raw metrics
- Threshold violations
- Recommendations

## Output Format

```markdown
### Code Metrics: src/routes/agent.ts

#### Lines of Code
- Total Lines: 285
- Source Lines: 220
- Comment Lines: 35
- Blank Lines: 30
- Comment Ratio: 15.9% ✓

#### Complexity
- Estimated Cyclomatic Complexity: 23 ⚠️ (HIGH - refactor recommended)
- Maximum Nesting Depth: 5 ⚠️ (acceptable but near limit)
- Decision Points: 22

#### Functions
- Function Count: 8
- Average Function Length: 27.5 lines ✓
- Longest Function: 85 lines (runQuery) ⚠️
- Functions >50 lines: 2 ⚠️
- Functions >100 lines: 0 ✓

#### Structure
- Classes: 0
- Interfaces/Types: 4
- Imports: 12
- Exports: 3

#### Threshold Violations
1. ⚠️ **High Complexity**: File complexity (23) exceeds threshold (15)
   - Recommendation: Break down complex conditional logic

2. ⚠️ **Long Function**: runQuery function (85 lines) exceeds threshold (50)
   - Recommendation: Extract helper functions for readability

3. ⚠️ **Nesting Depth**: Maximum depth (5) near threshold (4)
   - Recommendation: Consider early returns or guard clauses

#### Overall Assessment
- **Complexity Score**: 6/10 (acceptable with improvements needed)
- **Maintainability**: MODERATE
- **Priority Refactoring Targets**: runQuery function (lines 45-130)
```

## Usage Examples

### Example 1: Quality Review - Check Function Length

**Input**:

```
file_path: "/Users/simon.stipcich/code/repo/cossessor/src/cc-svc/src/sdk/wrapper.ts"
metric_types: ['functions', 'complexity']
```

**Expected Output**:

- Function count and length distribution
- Cyclomatic complexity per function
- Identification of functions >50 lines

**Next Action**: Read long functions to assess refactoring opportunities

### Example 2: Performance Review - Identify Complex Code

**Input**:

```
file_path: "/Users/simon.stipcich/code/repo/cossessor/src/cc-svc/src/routes/agent.ts"
metric_types: ['complexity', 'structure']
```

**Expected Output**:

- High complexity functions (likely performance hotspots)
- Deep nesting (may indicate nested loops)
- Decision point count

**Next Action**: Analyze complex functions for algorithmic optimization

### Example 3: Comparing Implementations

**Input** (run for both files):

```
file_path: "/path/to/implementation-a.ts"
metric_types: ['all']

file_path: "/path/to/implementation-b.ts"
metric_types: ['all']
```

**Expected Output**:

- Side-by-side metric comparison
- Objective data for decision-making

**Next Action**: Choose simpler, more maintainable implementation

## Calculation Details

### Cyclomatic Complexity (Approximate)

This skill provides an **approximation** of cyclomatic complexity by counting decision points:

```typescript
// Decision points to count:
- if statements: +1
- else if clauses: +1
- while loops: +1
- for loops: +1
- for...of / for...in: +1
- switch cases: +1 per case
- catch blocks: +1
- ternary operators (?): +1
- logical AND (&&): +1
- logical OR (||): +1
- optional chaining (?.): +1

// Base complexity: 1
// Total = 1 + (decision points)
```

**Note**: This is an approximation. For exact complexity analysis, use dedicated tools like ESLint complexity rules or SonarQube.

### Comment Ratio Calculation

```typescript
// Comment ratio = (Comment lines / Source lines) * 100

// Example:
Source lines: 200
Comment lines: 40
Ratio: (40 / 200) * 100 = 20%

// Thresholds:
0-5%: Under-documented ⚠️
5-15%: Acceptable ✓
15-30%: Well-documented ✓✓
30%+: Over-documented (may indicate code smells) ⚠️
```

### Function Length Calculation

```typescript
// For each function:
// 1. Find function declaration (function keyword, arrow function, method)
// 2. Count lines until closing brace
// 3. Exclude blank lines and pure comment lines

// Example:
function processData(input) {  // Line 1
  // Validate input          // (comment - not counted)
  if (!input) {              // Line 2
    return null;             // Line 3
  }                          // Line 4
                             // (blank - not counted)
  return transform(input);   // Line 5
}                            // Line 6

// Function length: 6 lines (total including structure)
// Effective length: 4 lines (excluding comment/blank)
```

## Best Practices

### When to Calculate Metrics

**Always Calculate**:

- Before making refactoring recommendations
- When comparing multiple implementations
- For baseline measurements in architecture reviews

**Conditionally Calculate**:

- Security reviews: Only if complexity may hide vulnerabilities
- Performance reviews: Focus on hot paths identified by vector search

**Never Skip**:

- Quality reviews: Metrics are foundational for quality assessment

### Interpreting Results

**High Complexity**:

- May indicate: Poor design, trying to do too much, missing abstractions
- Not always bad: Some algorithms are inherently complex (parsing, graph algorithms)
- Context matters: 10 simple if statements vs. 10 nested conditions

**Long Functions**:

- May indicate: Missing abstraction, violating Single Responsibility Principle
- Not always bad: Sequential steps that belong together (initialization, setup)
- Consider: Is this a God function or a coordinator?

**Low Comment Ratio**:

- May indicate: Self-documenting code (good) or missing docs (bad)
- Not always bad: Clean, obvious code doesn't need comments
- Consider: Are complex parts explained?

### Threshold Tuning

Default thresholds are based on industry standards, but should be adjusted per:

**Language**:

- Verbose languages (Java, C#): Higher LOC thresholds
- Concise languages (Python, Ruby): Lower LOC thresholds

**Project Type**:

- Libraries: Stricter complexity thresholds
- Applications: More lenient
- Prototypes: Very lenient

**Team Standards**:

- Check existing codebase for baseline
- Adjust thresholds to match team conventions

## Integration with Other Skills

### Workflow Pattern

```
1. vector-search-code → Find relevant files
2. calculate-code-metrics → Get quantitative data
3. Read → Deep dive into flagged areas
4. Agent decision → Combine metrics with expertise
```

### Example Integration

```markdown
Security Review Process:

1. Use vector-search-code to find authentication code
   → Returns 12 files

2. For each file, use calculate-code-metrics
   → Flag files with complexity >20 (may hide vulnerabilities)

3. Read flagged high-complexity files carefully
   → Analyze for security issues in complex logic

4. Provide security assessment with metrics as evidence
   → "The auth function has complexity of 35, making it difficult to audit for vulnerabilities"
```

## Limitations

### Language-Specific Parsing

This skill uses **heuristic pattern matching**, not full AST parsing:

**Works Well For**:

- JavaScript/TypeScript
- Python
- Java
- C/C++
- Go
- Rust

**Limited Support For**:

- Functional languages (Haskell, Erlang)
- Declarative languages (SQL, HTML)
- Configuration files (JSON, YAML)

**Workaround**: For unsupported languages, calculate basic line metrics only.

### Approximations vs. Exact Analysis

**This Skill**:

- Fast, good enough for reviews
- Approximates complexity
- No compilation required

**Dedicated Tools** (ESLint, SonarQube):

- Precise AST-based analysis
- Exact complexity scores
- Requires setup and configuration

**When to Use Each**:

- Code reviews: This skill (fast, integrated)
- CI/CD gates: Dedicated tools (precise, enforceable)

## Troubleshooting

### Issue: Metrics seem incorrect

**Causes**:

- File contains unusual syntax
- Language not well-supported
- Minified or generated code

**Solutions**:

1. Verify file is human-written source code
2. Check language compatibility
3. Fall back to basic line counts only

### Issue: Can't read file

**Causes**:

- Path is incorrect
- File is binary
- Permission denied

**Solutions**:

1. Verify absolute path
2. Check file extension (skip binaries)
3. Ensure file is readable

## Claude Code SDK Learning Notes

### Why This is a Skill (Not an Agent)

**Skills are operations** that:

- Take input → Produce output
- Don't make decisions
- Are deterministic
- Can be composed

This metric calculation is **pure computation**:

```
Input: file_path
Process: Read file, count patterns
Output: metrics object
```

No reasoning, no decisions, no context needed = **Skill**.

### Reusability Example

Without this skill, every agent would duplicate metric logic:

```markdown
Quality Agent (without skill):
"Let me read the file... count lines... find functions... calculate complexity..."

Performance Agent (without skill):
"Let me read the file... count lines... find functions... calculate complexity..."

Architecture Agent (without skill):
"Let me read the file... count lines... find functions... calculate complexity..."
```

With this skill, all agents reuse:

```markdown
Any Agent: "Use calculate-code-metrics skill on file X"
→ Get consistent, tested results
→ No duplication
```

### Composability with Tools

This skill **composes** Read tool with calculation logic:

```
Read tool (built-in) → Raw file contents
calculate-code-metrics (skill) → Structured metrics
Agent (reasoning) → Assessment and recommendations
```

This demonstrates **separation of concerns**:

- Tools: Low-level operations (read, search, write)
- Skills: Mid-level operations (metrics, patterns, graphs)
- Agents: High-level reasoning (security assessment, architecture review)

## Version History

- v1.0: Initial implementation with basic metrics
- Future: Add AST-based parsing for exact complexity, language-specific metrics

## Related Skills

- `vector-search-code` - Find files before calculating metrics
- `scan-security-patterns` - Combine complexity with security patterns
- `analyze-file-patterns` - Use metrics to identify inconsistent patterns

## Related Agents

- `quality-reviewer` - Primary user of this skill for refactoring recommendations
- `performance-reviewer` - Uses complexity metrics to identify optimization targets
- `architecture-reviewer` - Uses structure metrics to assess modularity
