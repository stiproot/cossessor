# Scan Security Patterns Skill

A reusable skill for quickly scanning codebases for common security anti-patterns using pattern matching. Provides initial triage before deep security analysis.

## Purpose

Perform rapid security pattern scanning using regex and heuristics to identify potential vulnerabilities. Acts as a "first pass" filter to focus deep analysis on suspicious code.

## When to Use This Skill

- Initial triage in security reviews (find obvious issues fast)
- Pre-screening files before deep analysis
- Quick audits of new code
- Identifying files that need careful manual review
- Finding hardcoded secrets and credentials
- Detecting common vulnerability patterns (SQL injection, XSS, etc.)

## Input Parameters

- **codebase_path** (required): Path to scan (file or directory)
  - Example: `/Users/simon.stipcich/code/repo/cossessor/src/cc-svc`

- **pattern_category** (required): Category of patterns to scan
  - Options:
    - `'secrets'` - Hardcoded credentials, API keys, tokens
    - `'injection'` - SQL injection, command injection, XSS
    - `'crypto'` - Weak cryptography, insecure random
    - `'auth'` - Authentication/authorization issues
    - `'data-exposure'` - Logging sensitive data, error messages
    - `'insecure-config'` - Security misconfigurations
    - `'all'` - Run all pattern categories

- **severity_filter** (optional): Minimum severity to report
  - Options: `'critical'`, `'high'`, `'medium'`, `'low'` (default: `'medium'`)

## Process

### Step 1: Select Pattern Definitions

Based on `pattern_category`, select relevant security patterns to search:

#### Secrets Patterns

```regex
# API Keys
(api_key|apikey|api-key)\s*[:=]\s*['"][a-zA-Z0-9]{20,}['"]

# AWS Keys
(aws_access_key_id|aws_secret_access_key)\s*[:=]

# Private Keys
-----BEGIN (RSA |DSA |EC )?PRIVATE KEY-----

# Passwords
(password|passwd|pwd)\s*[:=]\s*['"][^'"]{3,}['"]

# Tokens
(token|auth_token|access_token)\s*[:=]\s*['"][a-zA-Z0-9_-]{20,}['"]

# Database URLs with credentials
(postgres|mysql|mongodb):\/\/[^:]+:[^@]+@
```

#### Injection Patterns

```regex
# SQL Injection
(execute|query|sql)\([^)]*\+[^)]*\)
`SELECT.*\$\{.*\}`
String.*concatenation.*query

# Command Injection
(exec|spawn|system|eval)\([^)]*\+[^)]*\)
child_process\.(exec|spawn).*\$\{

# XSS (Cross-Site Scripting)
innerHTML\s*=\s*
dangerouslySetInnerHTML
document\.write\([^)]*\+

# Path Traversal
(readFile|readdir|existsSync|statSync).*\.\.[\/\\]
```

#### Crypto Patterns

```regex
# Weak Hash Algorithms
createHash\s*\(\s*['"]md5['"]
createHash\s*\(\s*['"]sha1['"]
hashlib\.(md5|sha1)

# Weak Encryption
createCipher\s*\(\s*['"]des['"]
algorithm:\s*['"]des['"]

# Insecure Random
Math\.random\(\).*password
Math\.random\(\).*token
Math\.random\(\).*secret
```

#### Auth Patterns

```regex
# Missing Authentication
router\.(post|put|delete|patch).*(?!.*auth|.*protect|.*middleware)

# Commented Out Auth
\/\/.*auth|\/\/.*authenticate|\/\/.*authorize

# Hardcoded Admin Check
(role|user)\s*===?\s*['"]admin['"]
(isAdmin|is_admin)\s*=\s*true
```

#### Data Exposure Patterns

```regex
# Logging Sensitive Data
console\.(log|error|warn).*password
logger.*\.(log|info|error).*token
print.*secret

# Verbose Error Messages
(stack|stacktrace|error\.stack).*send|response.*error
```

#### Insecure Config Patterns

```regex
# CORS Misconfiguration
cors.*origin.*\*

# Security Headers Missing
(?!.*helmet|.*csp|.*hsts).*express\(\)

# Debug Mode in Production
debug:\s*true
NODE_ENV.*development
```

### Step 2: Execute Pattern Searches

Use `Grep` tool with selected patterns:

```
Grep({
  pattern: "(api_key|apikey)\\s*[:=]\\s*['\"][a-zA-Z0-9]{20,}['\"]",
  path: "/path/to/codebase",
  output_mode: "content",
  -i: false,  // Case-sensitive for accuracy
  -n: true    // Include line numbers
})
```

### Step 3: Parse and Classify Results

For each match:

1. **Extract context**: Get surrounding lines for context (-B 2 -A 2)
2. **Classify severity**: Based on pattern type and context
3. **Filter false positives**: Check for test files, comments, documentation
4. **Determine CWE**: Map to Common Weakness Enumeration

### Step 4: Format Findings

Return structured findings with:

- File and line number
- Pattern matched
- Severity (Critical, High, Medium, Low)
- CWE reference
- Recommendation

## Output Format

```markdown
### Security Pattern Scan Results

**Category**: Secrets Detection
**Files Scanned**: 45
**Findings**: 3 issues found

---

#### CRITICAL: Hardcoded API Key
**File**: `src/config/api.ts:12`
**Pattern**: API key in source code
**CWE**: CWE-798 (Use of Hard-coded Credentials)

```typescript
11: const config = {
12:   apiKey: "sk-1234567890abcdef1234567890abcdef",
13:   endpoint: "https://api.example.com"
```

**Recommendation**: Move API key to environment variable:

```typescript
const config = {
  apiKey: process.env.API_KEY,
  endpoint: process.env.API_ENDPOINT
};

// Validate at startup
if (!config.apiKey) {
  throw new Error('API_KEY environment variable required');
}
```

**Impact**: Credential exposure in version control, unauthorized API access

---

#### HIGH: Potential SQL Injection

**File**: `src/routes/users.ts:45`
**Pattern**: String concatenation in SQL query
**CWE**: CWE-89 (SQL Injection)

```typescript
44: async function getUserById(id) {
45:   const query = `SELECT * FROM users WHERE id = ${id}`;
46:   return await db.execute(query);
```

**Recommendation**: Use parameterized queries:

```typescript
const query = 'SELECT * FROM users WHERE id = ?';
return await db.execute(query, [id]);
```

**Impact**: Complete database compromise, data theft, data destruction

---

#### MEDIUM: Weak Hash Algorithm

**File**: `src/utils/hash.ts:20`
**Pattern**: MD5 usage for password hashing
**CWE**: CWE-327 (Use of a Broken or Risky Cryptographic Algorithm)

```typescript
19: function hashPassword(password) {
20:   return crypto.createHash('md5').update(password).digest('hex');
21: }
```

**Recommendation**: Use bcrypt or argon2:

```typescript
import bcrypt from 'bcrypt';

async function hashPassword(password) {
  return await bcrypt.hash(password, 10);
}
```

**Impact**: Password cracking via rainbow tables or brute force

---

### Summary

- **Critical Issues**: 1 (require immediate action)
- **High Issues**: 1 (address before deployment)
- **Medium Issues**: 1 (plan for remediation)
- **Low Issues**: 0

**Priority Actions**:

1. Remove hardcoded API key from `src/config/api.ts`
2. Fix SQL injection in `src/routes/users.ts`
3. Replace MD5 with bcrypt in `src/utils/hash.ts`

**Files Requiring Manual Review**:

- `src/config/api.ts` - Check for other hardcoded secrets
- `src/routes/users.ts` - Review all database queries
- `src/utils/hash.ts` - Audit all cryptographic operations

```

## Usage Examples

### Example 1: Quick Secrets Scan

**Input**:
```

codebase_path: "/Users/simon.stipcich/code/repo/cossessor/src/cc-svc"
pattern_category: "secrets"
severity_filter: "medium"

```

**Expected Output**:
- Hardcoded passwords, API keys, tokens
- Database connection strings with credentials
- Private keys in source files

**Next Action**: Remove secrets, rotate exposed credentials, add to .gitignore

### Example 2: Injection Vulnerability Scan

**Input**:
```

codebase_path: "/Users/simon.stipcich/code/repo/cossessor/src/cc-svc/src/routes"
pattern_category: "injection"
severity_filter: "high"

```

**Expected Output**:
- SQL injection risks (string concatenation in queries)
- Command injection (exec with user input)
- XSS vulnerabilities (innerHTML with user data)

**Next Action**: Read flagged files for deep analysis, implement input validation

### Example 3: Complete Security Scan

**Input**:
```

codebase_path: "/Users/simon.stipcich/code/repo/cossessor/src/cc-svc"
pattern_category: "all"
severity_filter: "medium"

```

**Expected Output**:
- All security issues across all categories
- Prioritized by severity
- Comprehensive remediation guide

**Next Action**: Create security remediation backlog, address critical issues first

## Pattern Definitions

### Severity Classification

**CRITICAL**:
- Hardcoded credentials in production code
- SQL injection in user-facing endpoints
- Authentication bypass vulnerabilities
- Remote code execution vectors

**HIGH**:
- Weak cryptography for sensitive data
- Authorization logic flaws
- XSS in user input handling
- Command injection in backend code

**MEDIUM**:
- Missing security headers
- Verbose error messages with stack traces
- Insecure session management
- Path traversal vulnerabilities

**LOW**:
- Weak random number generation (non-security critical)
- Missing input validation (non-exploitable)
- Commented-out authentication code
- Debug logs in production (non-sensitive data)

### False Positive Filtering

**Automatically Exclude**:
```

# Test files

**/*.test.ts
**/*.spec.ts
**/**tests**/**

# Documentation

**/*.md
**/docs/**

# Examples and fixtures

**/examples/**
**/fixtures/**

# Third-party code

**/node_modules/**
**/vendor/**

# Generated code

**/*.generated.*
**/dist/**
**/build/**

```

**Context-Based Filtering**:
```typescript
// Example: This is NOT a real credential
const apiKey = "sk-1234..."; // ← False positive (comment indicates example)

// Environment variable (OK)
const apiKey = process.env.API_KEY; // ← Not a finding

// Test fixture (OK)
const mockToken = "test-token-123"; // ← Exclude (test file)
```

### CWE Mapping

| Pattern Category | Primary CWEs |
|-----------------|--------------|
| Secrets | CWE-798 (Hard-coded Credentials), CWE-259 (Hard-coded Password) |
| SQL Injection | CWE-89 (SQL Injection) |
| Command Injection | CWE-78 (OS Command Injection), CWE-94 (Code Injection) |
| XSS | CWE-79 (Cross-site Scripting) |
| Weak Crypto | CWE-327 (Broken Crypto), CWE-328 (Weak Hash) |
| Auth Bypass | CWE-287 (Improper Authentication), CWE-306 (Missing Authentication) |
| Data Exposure | CWE-209 (Error Info Exposure), CWE-532 (Insertion of Sensitive Information into Log) |

## Best Practices

### When to Use This Skill

**Always Use**:

- Beginning of security reviews (triage phase)
- Before reading files (identify priorities)
- Quick audits of new code
- Pre-commit hooks (find obvious issues)

**Use with Caution**:

- Generated or minified code (high false positives)
- Non-standard languages (patterns may not match)

**Don't Use**:

- As sole security validation (false negatives exist)
- Without manual follow-up (patterns are heuristic)

### Handling False Positives

**Expected False Positive Rate**: 10-30%

**Reduce False Positives**:

1. Filter test files and documentation
2. Check for "example", "test", "mock" in variable names
3. Verify context with surrounding lines
4. Cross-reference with actual usage

**Report Responsibly**:

- Mark findings as "Potential" or "Possible"
- Include context for human verification
- Don't claim certainty from pattern matching alone

### Complementing with Deep Analysis

**This Skill** (Pattern Scan):

- Fast (seconds)
- Broad coverage
- High false positive rate
- Catches obvious issues

**Agent Analysis** (Deep Review):

- Slower (minutes)
- Focused on flagged areas
- Low false positive rate
- Catches subtle issues

**Combined Workflow**:

```
1. scan-security-patterns → Flag 15 suspicious files
2. Agent reads top 5 critical files → Confirm 3 real vulnerabilities
3. Agent provides detailed remediation for confirmed issues
```

## Integration with Other Skills

### Typical Security Review Workflow

```markdown
Step 1: Vector Search
Use vector-search-code to find security-critical code:
- "authentication and authorization"
- "database queries and user input"
- "cryptographic operations"

Step 2: Pattern Scan
Use scan-security-patterns on discovered files:
- Quick identification of obvious vulnerabilities
- Prioritization by severity

Step 3: Deep Analysis
Security agent reads flagged files:
- Verify findings from pattern scan
- Find subtle vulnerabilities patterns missed
- Provide comprehensive remediation

Step 4: Metrics (if needed)
Use calculate-code-metrics on complex files:
- High complexity may hide vulnerabilities
- Large functions difficult to audit
```

## Limitations

### Pattern Matching Limitations

**Cannot Detect**:

- Business logic flaws (requires understanding context)
- Race conditions and concurrency issues
- Cryptographic protocol errors (beyond algorithm choice)
- Authorization bypass via logic errors
- Complex injection via multiple encoding layers

**May Miss**:

- Obfuscated code
- Non-standard syntax
- Framework-specific patterns
- Language-specific idioms

**Workaround**: Combine with deep agent analysis and human expertise

### Language Coverage

**Well-Supported**:

- JavaScript/TypeScript (excellent)
- Python (excellent)
- Java (good)
- Go (good)
- Ruby (good)

**Limited Support**:

- Functional languages (pattern syntax differs)
- Compiled languages (source patterns differ)
- Domain-specific languages

**Unsupported**:

- Binary files
- Minified code
- Encrypted code

## Troubleshooting

### Issue: Too many false positives

**Causes**:

- Test files included
- Example code scanned
- Pattern too broad

**Solutions**:

1. Add more exclusion patterns
2. Increase severity filter
3. Improve context checking
4. Focus on specific categories vs. "all"

### Issue: Missing known vulnerabilities

**Causes**:

- Pattern doesn't match syntax
- Code uses unfamiliar framework
- Vulnerability is logic-based, not pattern-based

**Solutions**:

1. Add custom patterns for specific framework
2. Lower severity filter
3. Combine with manual agent review
4. Use language-specific SAST tools as supplement

### Issue: Grep command fails

**Causes**:

- Path doesn't exist
- Permissions issue
- Invalid regex pattern

**Solutions**:

1. Verify path is correct and accessible
2. Check regex syntax (escape special characters)
3. Test pattern on single file first

## Claude Code SDK Learning Notes

### Why This is a Skill

**Skills encapsulate operations**:

- This skill encapsulates "security pattern scanning"
- Input: path + category
- Output: findings list
- No decision-making, pure computation

**Reusability**:

```
Without skill:
- Security agent: writes pattern scanning code
- Quality agent: writes duplicate pattern code for code smells
- Every review: re-implements same logic

With skill:
- Security agent: invoke scan-security-patterns
- Quality agent: could invoke similar scan-quality-patterns
- Consistent, tested behavior
```

### Composing Tools

This skill **composes** Grep tool with security knowledge:

```
Grep (built-in tool) → Raw pattern matches
+
Security Expertise → Pattern definitions, CWE mapping, severity
=
scan-security-patterns (skill) → Actionable security findings
```

This is **knowledge encapsulation**:

- Grep knows how to search
- Skill knows what to search for (security patterns)
- Agent knows what to do with findings (assess risk, prioritize)

### Separation of Concerns

```
Tool (Grep):
- Technical operation: Search text with regex
- No domain knowledge

Skill (scan-security-patterns):
- Domain knowledge: Security patterns, CWE, severity
- Uses tools to implement operation

Agent (security-reviewer):
- Strategic reasoning: Which files to scan, how to prioritize
- Uses skills and tools to complete mission
```

This creates a **clean abstraction hierarchy**.

## Version History

- v1.0: Initial implementation with core pattern categories
- Future: Add custom pattern support, framework-specific rules, SARIF output format

## Related Skills

- `vector-search-code` - Find security-critical files before scanning
- `calculate-code-metrics` - Identify complex code that may hide vulnerabilities
- `analyze-file-patterns` - Check consistency of security practices

## Related Agents

- `security-reviewer` - Primary user of this skill for initial triage
- `quality-reviewer` - May use for code smell detection (similar pattern approach)

## Additional Resources

### CWE References

- [CWE-798: Use of Hard-coded Credentials](https://cwe.mitre.org/data/definitions/798.html)
- [CWE-89: SQL Injection](https://cwe.mitre.org/data/definitions/89.html)
- [CWE-79: Cross-site Scripting](https://cwe.mitre.org/data/definitions/79.html)
- [CWE-327: Use of a Broken Cryptographic Algorithm](https://cwe.mitre.org/data/definitions/327.html)

### Security Pattern Resources

- OWASP Top 10
- SANS Top 25
- SEI CERT Coding Standards

### Tools for Deeper Analysis

- SonarQube (SAST)
- Semgrep (pattern-based analysis)
- ESLint security plugins
- Bandit (Python)
- Brakeman (Ruby)
