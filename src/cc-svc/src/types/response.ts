import type { SDKMessage } from '@anthropic-ai/claude-agent-sdk';

/**
 * Streaming event sent to client via SSE
 */
export interface StreamEvent {
  /**
   * The SDK message
   */
  message: SDKMessage;

  /**
   * Timestamp when message was received
   */
  timestamp: string;
}

/**
 * Health check response
 */
export interface HealthResponse {
  status: 'ok';
  service: string;
  version: string;
  timestamp: string;
}

/**
 * Result data extracted from SDK result message
 */
export interface ResultData {
  subtype: string;
  durationMs?: number;
  totalCostUsd?: number;
  result?: string;
  errors?: string[];
}
