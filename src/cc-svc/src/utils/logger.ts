/**
 * Centralized Logger with Automatic Error Sanitization
 *
 * ALL error logging must go through this logger to ensure PII is never logged.
 * Prevents accidental exposure of sensitive data in logs.
 *
 * Usage:
 * ```typescript
 * import { logger } from '../utils/logger.js';
 *
 * logger.info('[insights] Starting generation');
 * logger.error('[insights] Generation failed', error, { playerId: '123' });
 * logger.warn('[cache] Cache size approaching limit');
 * ```
 */

import { sanitizeErrorForLogging } from './sanitize-error.js';

/**
 * Centralized logger that automatically sanitizes errors
 */
export const logger = {
  /**
   * Log informational messages
   * @param message Message to log
   * @param context Optional context data (logged as-is, be careful with PII)
   */
  info(message: string, context?: unknown): void {
    if (context !== undefined) {
      console.log(message, context);
    } else {
      console.log(message);
    }
  },

  /**
   * Log warnings
   * @param message Warning message
   * @param context Optional context data (logged as-is, be careful with PII)
   */
  warn(message: string, context?: unknown): void {
    if (context !== undefined) {
      console.warn(message, context);
    } else {
      console.warn(message);
    }
  },

  /**
   * Log errors with automatic sanitization
   * ALWAYS use this for error logging - never use console.error directly
   * @param message Error message
   * @param error The error object (will be sanitized)
   * @param context Additional context (playerId, operation, etc.)
   */
  error(message: string, error: unknown, context?: { playerId?: string; operation?: string }): void {
    const sanitized = sanitizeErrorForLogging(error, context ?? {});
    console.error(message, sanitized);
  },

  /**
   * Log debug messages (only in development)
   * @param message Debug message
   * @param context Optional context data
   */
  debug(message: string, context?: unknown): void {
    if (process.env.NODE_ENV !== 'production') {
      if (context !== undefined) {
        console.debug(message, context);
      } else {
        console.debug(message);
      }
    }
  },
};
