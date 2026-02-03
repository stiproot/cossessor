/**
 * Error Sanitization Utilities
 * Prevents PII and sensitive data from appearing in logs
 *
 * Pattern follows: content-moderation-mcp/src/db-pool.ts
 */

/**
 * Fields that may contain PII and should never be logged
 */
const PII_FIELDS = [
  'email',
  'phone',
  'address',
  'name',
  'firstName',
  'lastName',
  'ssn',
  'password',
  'token',
  'creditCard',
  'cardNumber',
  'cvv',
  'bankAccount',
  'iban',
  'dateOfBirth',
  'dob',
];

/**
 * Sanitize error for safe logging
 * Removes stack traces and any potentially sensitive data from error objects
 *
 * @param error The error to sanitize
 * @param context Additional context (playerId, operation type)
 * @returns Safe object for logging
 */
export function sanitizeErrorForLogging(
  error: unknown,
  context: { playerId?: string; operation?: string }
): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    operation: context.operation ?? 'insights-generation',
  };

  // Only include playerId (not PII - it's an opaque identifier)
  if (context.playerId) {
    sanitized.playerId = context.playerId;
  }

  if (error instanceof Error) {
    sanitized.errorType = error.constructor.name;
    sanitized.message = sanitizeMessage(error.message);
    // DO NOT include: error.stack, error.cause (may contain sensitive data)
  } else if (typeof error === 'string') {
    sanitized.errorType = 'StringError';
    sanitized.message = sanitizeMessage(error);
  } else {
    sanitized.errorType = 'Unknown';
    sanitized.message = 'An unexpected error occurred';
  }

  return sanitized;
}

/**
 * Sanitize error message to remove potential PII patterns
 */
function sanitizeMessage(message: string): string {
  let sanitized = message;

  // Remove email patterns
  sanitized = sanitized.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL_REDACTED]');

  // Remove phone patterns (various formats)
  sanitized = sanitized.replace(/\+?\d{1,3}[-.\s]?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}/g, '[PHONE_REDACTED]');

  // Remove potential credit card numbers (13-19 digits with optional separators)
  sanitized = sanitized.replace(/\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{1,7}\b/g, '[CARD_REDACTED]');

  // Remove potential SSN patterns
  sanitized = sanitized.replace(/\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b/g, '[SSN_REDACTED]');

  // Truncate overly long messages (may contain dumped data)
  if (sanitized.length > 500) {
    sanitized = sanitized.substring(0, 500) + '... [TRUNCATED]';
  }

  return sanitized;
}

/**
 * Check if a field name might contain PII
 */
export function isPIIField(fieldName: string): boolean {
  const lowerField = fieldName.toLowerCase();
  return PII_FIELDS.some(pii => lowerField.includes(pii.toLowerCase()));
}
