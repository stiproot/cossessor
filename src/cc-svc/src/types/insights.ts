/**
 * Types for Smart Panel Insights Generation
 * Simplified: Request type + AI output schema + validation
 */

import { z } from 'zod';

// ============================================================================
// REQUEST TYPE
// ============================================================================

export interface InsightGenerationRequest {
  playerId: string;
  contextData: Record<string, unknown>;
}

// ============================================================================
// AI OUTPUT SCHEMA (JSON Schema for structured output)
// ============================================================================

export const PlayerInsightsSchema = {
  type: 'object',
  properties: {
    scenario: {
      type: 'string',
      enum: ['FAILED_DEPOSITS', 'BIG_WIN', 'KYC_PENDING', 'DORMANT', 'RG_ALERT', 'NEW_PLAYER', 'NO_DATA'],
      description: 'Primary scenario affecting the player',
    },
    sentiment: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: ['frustrated', 'excited', 'anxious', 'neutral', 'warning'],
          description: 'Sentiment type based on player situation',
        },
        emoji: {
          type: 'string',
          maxLength: 4,
          description:
            'Single emoji matching sentiment type: frustrated=😔, excited=🎉, anxious=😰, neutral=😐, warning=⚠️',
        },
        label: {
          type: 'string',
          maxLength: 20,
          description: 'Human-readable sentiment label (e.g., "Frustrated", "Excited")',
        },
      },
      required: ['type', 'emoji', 'label'],
      additionalProperties: false,
    },
    statusText: {
      type: 'string',
      maxLength: 50,
      description: 'Short summary of player status (5-10 words)',
    },
    statusDetails: {
      type: 'string',
      maxLength: 150,
      description: 'Key context details (10-15 words)',
    },
    insight: {
      type: 'object',
      properties: {
        icon: {
          type: 'string',
          maxLength: 4,
          description: 'Single emoji icon based on statusText/statusDetails',
        },
        text: {
          type: 'string',
          maxLength: 200,
          description: 'Simple advice on what the player might need',
        },
      },
      required: ['icon', 'text'],
      additionalProperties: false,
    },
    recommendedAction: {
      type: 'string',
      maxLength: 120,
      description: 'Specific action for the agent to take',
    },
  },
  required: ['scenario', 'sentiment', 'statusText', 'statusDetails', 'insight', 'recommendedAction'],
  additionalProperties: false,
} as const;

// ============================================================================
// TYPESCRIPT INTERFACE (mirrors schema)
// ============================================================================

export interface PlayerInsights {
  scenario: 'FAILED_DEPOSITS' | 'BIG_WIN' | 'KYC_PENDING' | 'DORMANT' | 'RG_ALERT' | 'NEW_PLAYER' | 'NO_DATA';
  sentiment: {
    type: 'frustrated' | 'excited' | 'anxious' | 'neutral' | 'warning';
    emoji: string;
    label: string;
  };
  statusText: string;
  statusDetails: string;
  insight: {
    icon: string;
    text: string;
  };
  recommendedAction: string;
}

// ============================================================================
// VALIDATION
// ============================================================================

const PlayerInsightsZodSchema = z.object({
  scenario: z.enum(['FAILED_DEPOSITS', 'BIG_WIN', 'KYC_PENDING', 'DORMANT', 'RG_ALERT', 'NEW_PLAYER', 'NO_DATA']),
  sentiment: z.object({
    type: z.enum(['frustrated', 'excited', 'anxious', 'neutral', 'warning']),
    emoji: z.string().max(4),
    label: z.string().max(20),
  }),
  statusText: z.string().max(50),
  statusDetails: z.string().max(150),
  insight: z.object({
    icon: z.string().max(4),
    text: z.string().max(200),
  }),
  recommendedAction: z.string().max(120),
});

export function validatePlayerInsights(response: unknown): PlayerInsights {
  const result = PlayerInsightsZodSchema.safeParse(response);
  if (!result.success) {
    const issues = result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ');
    throw new Error(`AI response validation failed: ${issues}`);
  }
  return result.data;
}
