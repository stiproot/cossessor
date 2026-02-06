# Review Security Command

Performs a comprehensive security review of code to identify vulnerabilities, security risks, and compliance issues.

## Usage

```
/review-security <path>
```

## What This Command Does

You are being invoked via the `/review-security` command.

**Task**: Perform a comprehensive security review of the code at the specified path.

**Target Path**: The path provided by the user after the command

**Process**:

1. Use the **security-reviewer** agent to perform the security analysis
2. The security-reviewer will:
   - Use vector-search-code skill to discover security-critical code
   - Use scan-security-patterns skill for quick vulnerability detection
   - Read and analyze files for security issues
   - Provide detailed findings with severity ratings (CRITICAL, HIGH, MEDIUM, LOW)
3. Present findings in the security review format with:
   - Executive summary
   - Critical vulnerabilities with remediation steps
   - Security best practices recommendations
   - Prioritized action items

**Context**: This is an on-demand security audit triggered by the user. Focus on identifying vulnerabilities that could lead to security breaches, data loss, or compliance violations.

**Expected Output**: Comprehensive security assessment with actionable remediation steps.
