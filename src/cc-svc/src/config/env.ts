import dotenv from 'dotenv';

// In development, override system env vars with .env values (avoids conflicts with user's shell)
// In production, respect existing env vars (set by K8s, Docker, etc.)
const isDevelopment = process.env.NODE_ENV == 'development';
dotenv.config({ override: isDevelopment });

/**
 * Environment configuration for Claude Agent SDK
 * Loads and validates environment variables
 *
 * MCP servers are configured in config/mcp-servers.json
 */
export const config = {
  // Service configuration
  port: parseInt(process.env.PORT || '3010', 10),

  // Claude/Anthropic API configuration
  anthropic: {
    baseUrl: process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com',
    authToken: process.env.ANTHROPIC_AUTH_TOKEN || '',
    sonnet_model: process.env.ANTHROPIC_SONNET_MODEL || 'claude-sonnet-4-5-20250929',
    haiku_model: process.env.ANTHROPIC_HAIKU_MODEL || 'claude-haiku-4-5-20251001',
  },
} as const;

/**
 * Validates required environment variables are set
 */
export function validateConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!config.anthropic.authToken) {
    errors.push('ANTHROPIC_AUTH_TOKEN is required');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Alias for backwards compatibility
 */
export const env = config;

export type Config = typeof config;
