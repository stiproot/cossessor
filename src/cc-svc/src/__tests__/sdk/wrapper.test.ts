/**
 * Unit Tests: SDK Wrapper
 *
 * Tests the SDK wrapper functions for:
 * 1. buildPrompt - combining userRequest with chatHistory
 * 2. isResultMessage - detecting final result messages
 * 3. extractResult - parsing result data from messages
 */

import { describe, it, expect } from 'vitest';
import { isResultMessage, extractResult } from '../../sdk/wrapper.js';
import type { SDKMessage } from '@anthropic-ai/claude-agent-sdk';

// ============================================================================
// Test Utilities
// ============================================================================

/**
 * Create a mock SDK message
 */
function createMockMessage(type: string, overrides: Partial<SDKMessage> = {}): SDKMessage {
  return {
    type,
    session_id: 'test-session-123',
    ...overrides,
  } as SDKMessage;
}

/**
 * Create a mock result message
 */
function createMockResultMessage(
  subtype: 'success' | 'error' | 'interrupted',
  overrides: Partial<SDKMessage> = {}
): SDKMessage {
  return {
    type: 'result',
    subtype,
    session_id: 'test-session-123',
    duration_ms: 1500,
    total_cost_usd: 0.05,
    ...(subtype === 'success' ? { result: 'Test completed successfully' } : {}),
    ...(subtype !== 'success' ? { errors: ['Test error'] } : {}),
    ...overrides,
  } as SDKMessage;
}

// ============================================================================
// Test Suite
// ============================================================================

describe('SDK Wrapper', () => {
  // ==========================================================================
  // isResultMessage() Tests
  // ==========================================================================

  describe('isResultMessage', () => {
    it('should return true for result type messages', () => {
      const message = createMockMessage('result');
      expect(isResultMessage(message)).toBe(true);
    });

    it('should return false for non-result type messages', () => {
      const textMessage = createMockMessage('text');
      const toolMessage = createMockMessage('tool_use');
      const assistantMessage = createMockMessage('assistant');

      expect(isResultMessage(textMessage)).toBe(false);
      expect(isResultMessage(toolMessage)).toBe(false);
      expect(isResultMessage(assistantMessage)).toBe(false);
    });
  });

  // ==========================================================================
  // extractResult() Tests
  // ==========================================================================

  describe('extractResult', () => {
    it('should return null for non-result messages', () => {
      const message = createMockMessage('text');
      expect(extractResult(message)).toBeNull();
    });

    it('should extract success result data', () => {
      const message = createMockResultMessage('success', {
        result: 'Operation completed',
        duration_ms: 2000,
        total_cost_usd: 0.1,
      });

      const result = extractResult(message);

      expect(result).not.toBeNull();
      expect(result?.subtype).toBe('success');
      expect(result?.durationMs).toBe(2000);
      expect(result?.totalCostUsd).toBe(0.1);
      expect(result?.result).toBe('Operation completed');
      expect(result?.errors).toBeUndefined();
    });

    it('should extract error result data', () => {
      const message = createMockResultMessage('error', {
        errors: ['Error 1', 'Error 2'],
      });

      const result = extractResult(message);

      expect(result).not.toBeNull();
      expect(result?.subtype).toBe('error');
      expect(result?.errors).toEqual(['Error 1', 'Error 2']);
      expect(result?.result).toBeUndefined();
    });

    it('should handle interrupted result', () => {
      const message = createMockResultMessage('interrupted');

      const result = extractResult(message);

      expect(result).not.toBeNull();
      expect(result?.subtype).toBe('interrupted');
    });
  });
});
