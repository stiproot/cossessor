/**
 * Bun test setup file
 * Loads environment variables before tests run
 *
 * Note: Bun test globals (describe, test, expect, etc.) are available automatically
 * No need to import them explicitly
 */
import { config } from 'dotenv';

// Load .env file with override option to ensure local .env takes precedence
// over any global environment variables
config({ override: true });

// Disable TLS certificate verification for corporate proxy environments
// This is needed when using internal proxy endpoints with custom certificates
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Ensure ANTHROPIC_API_KEY is set if ANTHROPIC_AUTH_TOKEN is available
// The Claude SDK expects ANTHROPIC_API_KEY
if (process.env.ANTHROPIC_AUTH_TOKEN && !process.env.ANTHROPIC_API_KEY) {
  process.env.ANTHROPIC_API_KEY = process.env.ANTHROPIC_AUTH_TOKEN;
}
