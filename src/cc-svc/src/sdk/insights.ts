/**
 * Smart Panel Insights Generation SDK
 * Uses claude-agent-sdk with structured output for type-safe JSON responses
 */

import { query } from '@anthropic-ai/claude-agent-sdk';
import { config } from '../config/index.js';
import type { InsightGenerationRequest, PlayerInsights } from '../types/insights.js';
import { PlayerInsightsSchema, validatePlayerInsights } from '../types/insights.js';
import { getCachedInsights, setCachedInsights } from '../utils/insights-cache.js';
import { logger } from '../utils/logger.js';

/**
 * Generate AI-powered player insights using Claude Agent SDK
 *
 * Uses structured output with JSON Schema to guarantee valid response format.
 * Invokes the /insights-analyzer custom command defined in .claude/commands/
 *
 * @param request Player ID and context data
 * @returns Promise<PlayerInsights> AI-generated insights
 * @throws Error if LLM generation fails or response is invalid
 */
export async function generateInsights(request: InsightGenerationRequest): Promise<PlayerInsights> {
  console.log('[insights:sdk] Initializing insights generation with structured output');

  // Check cache first
  const cached = getCachedInsights(request.playerId, request.contextData);
  if (cached) {
    console.log('[insights:sdk] Returning cached insights');
    return cached;
  }

  // Build prompt using custom command
  // The command is defined in .claude/commands/insights-analyzer.md
  const prompt = `/insights-analyzer

Player Context Data:
\`\`\`json
${JSON.stringify(request.contextData, null, 2)}
\`\`\`

Analyze this player data and return structured insights.`;

  console.log(`[insights:sdk] Calling Claude model: ${config.anthropic.haiku_model}`);
  console.log(`[insights:sdk] Starting generation`);

  try {
    // Build environment variables for the subprocess
    const subprocessEnv: Record<string, string> = {
      ...Object.fromEntries(
        Object.entries(process.env).filter((entry): entry is [string, string] => entry[1] !== undefined)
      ),
      ANTHROPIC_API_KEY: config.anthropic.authToken,
      ANTHROPIC_BASE_URL: config.anthropic.baseUrl,
    };

    // Use claude-agent-sdk query with structured output
    for await (const message of query({
      prompt,
      options: {
        model: config.anthropic.haiku_model,
        maxTurns: 5, // Allow multiple turns for tool use and refinement
        env: subprocessEnv,
        permissionMode: 'bypassPermissions',
        // Working directory - required for SDK to find .claude/commands/
        cwd: process.cwd(),
        // STRUCTURED OUTPUT - SDK guarantees JSON conforming to schema
        outputFormat: {
          type: 'json_schema',
          schema: PlayerInsightsSchema,
        },
        allowedTools: [],
        disallowedTools: ['Read', 'Grep', 'Glob', 'Skill', 'WebSearch', 'Agent', 'Write'],
      },
    })) {
      // Handle result message with structured output
      if (message.type === 'result') {
        if (message.subtype === 'success' && message.structured_output) {
          console.log('[insights:sdk] Received structured output from Claude');

          // Validate with Zod for type safety
          const insights = validatePlayerInsights(message.structured_output);

          console.log(`[insights:sdk] Successfully validated insights`);
          console.log(`  Scenario: ${insights.scenario}`);
          console.log(`  Sentiment: ${insights.sentiment.type}`);

          // Cache the validated insights
          setCachedInsights(request.playerId, request.contextData, insights);

          return insights;
        } else if (message.subtype === 'error_max_structured_output_retries') {
          throw new Error(
            'Could not generate valid structured output after retries. The AI model failed to produce a response matching the required schema.'
          );
        } else if (message.subtype.startsWith('error')) {
          const errorMessage = 'error' in message ? String(message.error) : message.subtype;
          console.error('[insights:sdk] Error subtype:', message.subtype);
          console.error('[insights:sdk] Full error message:', message);
          throw new Error(`Insights generation failed: ${errorMessage}`);
        }
      }
    }

    throw new Error('No result message received from Claude Agent SDK');
  } catch (error) {
    console.error('[insights:sdk] Error generating insights - Full details:', {
      error,
      errorMessage: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
      playerId: request.playerId,
    });

    logger.error('[insights:sdk] Error generating insights:', error, {
      playerId: request.playerId,
      operation: 'insights-generation',
    });
    throw error;
  }
}
