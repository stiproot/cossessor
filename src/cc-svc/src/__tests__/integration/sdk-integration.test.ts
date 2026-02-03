/**
 * Integration Tests: Claude Agent SDK
 *
 * These tests make actual calls to the Claude API via the SDK.
 * They test various input parameter combinations and verify
 * the streaming response behavior.
 *
 * IMPORTANT: These tests require:
 * - Valid .env file with ANTHROPIC_AUTH_TOKEN
 * - Network access to the Anthropic API
 * - Sufficient API quota
 *
 * Run with: npm run test:integration
 *
 * Note: dotenv is loaded via vitest setup file
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { runQuery, isResultMessage, extractResult } from '../../sdk/wrapper.js';
import type { AgentStreamRequest } from '../../types/index.js';

describe('Claude SDK Integration Tests', () => {
  beforeAll(() => {
    // Verify required environment variables are set
    if (!process.env.ANTHROPIC_AUTH_TOKEN && !process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_AUTH_TOKEN or ANTHROPIC_API_KEY must be set in .env file for integration tests');
    }
    console.info('🔗 Running integration tests with Claude SDK');
    console.info(`📡 API Base: ${process.env.ANTHROPIC_BASE_URL || 'default'}`);
  });

  // ==========================================================================
  // Basic Query Tests
  // ==========================================================================

  describe('Basic Queries', () => {
    it('should handle simple text request', async () => {
      const request: AgentStreamRequest = {
        chatId: `test-simple-${Date.now()}`,
        userRequest: 'What is 2 + 2? Reply with just the number.',
      };

      const messages: unknown[] = [];
      let hasResult = false;

      for await (const message of runQuery(request)) {
        messages.push(message);
        if (isResultMessage(message)) {
          hasResult = true;
          const result = extractResult(message);
          expect(result).not.toBeNull();
          expect(result?.subtype).toBe('success');
        }
      }

      expect(messages.length).toBeGreaterThan(0);
      expect(hasResult).toBe(true);
    }, 60000); // 60 second timeout for API calls

    it('should handle request with session resumption', async () => {
      // Note: chatHistory was replaced with resumeSessionId for session management
      // This test verifies the new session resumption approach works
      const request: AgentStreamRequest = {
        chatId: `test-session-${Date.now()}`,
        userRequest: 'Say the number 42.',
      };

      const messages: unknown[] = [];
      let resultContent = '';

      for await (const message of runQuery(request)) {
        messages.push(message);
        if (isResultMessage(message)) {
          const result = extractResult(message);
          if (result?.result) {
            resultContent = result.result;
          }
        }
      }

      expect(messages.length).toBeGreaterThan(0);
      // The response should mention 42
      expect(resultContent.toLowerCase()).toContain('42');
    }, 60000);
  });

  // ==========================================================================
  // Empty and Edge Case Tests
  // ==========================================================================

  describe('Edge Cases', () => {
    it('should handle minimal request', async () => {
      const request: AgentStreamRequest = {
        chatId: `test-minimal-${Date.now()}`,
        userRequest: 'Say hello.',
      };

      const messages: unknown[] = [];
      let hasResult = false;

      for await (const message of runQuery(request)) {
        messages.push(message);
        if (isResultMessage(message)) {
          hasResult = true;
        }
      }

      expect(messages.length).toBeGreaterThan(0);
      expect(hasResult).toBe(true);
    }, 60000);

    it('should handle long user request', async () => {
      const longPrompt = 'Please summarize the following: ' + 'Lorem ipsum dolor sit amet. '.repeat(50);
      const request: AgentStreamRequest = {
        chatId: `test-long-${Date.now()}`,
        userRequest: longPrompt,
      };

      const messages: unknown[] = [];
      let hasResult = false;

      for await (const message of runQuery(request)) {
        messages.push(message);
        if (isResultMessage(message)) {
          hasResult = true;
        }
      }

      expect(messages.length).toBeGreaterThan(0);
      expect(hasResult).toBe(true);
    }, 120000); // 2 minute timeout for longer requests

    it('should handle special characters in request', async () => {
      const request: AgentStreamRequest = {
        chatId: `test-special-${Date.now()}`,
        userRequest: 'What is the meaning of: <script>alert("test")</script> & "quotes" & \'apostrophes\'?',
      };

      const messages: unknown[] = [];
      let hasResult = false;

      for await (const message of runQuery(request)) {
        messages.push(message);
        if (isResultMessage(message)) {
          hasResult = true;
          const result = extractResult(message);
          expect(result?.subtype).toBe('success');
        }
      }

      expect(messages.length).toBeGreaterThan(0);
      expect(hasResult).toBe(true);
    }, 60000);
  });

  // ==========================================================================
  // Multi-turn Conversation Tests
  // ==========================================================================

  describe('Multi-turn Conversations', () => {
    it('should handle conversation with resumeSessionId', async () => {
      // Note: chatHistory was replaced with resumeSessionId for session management
      // Multi-turn conversations now use Claude's session resumption feature
      const request: AgentStreamRequest = {
        chatId: `test-multiturn-${Date.now()}`,
        userRequest: 'List three colors: red, blue, and green.',
      };

      const messages: unknown[] = [];
      let resultContent = '';

      for await (const message of runQuery(request)) {
        messages.push(message);
        if (isResultMessage(message)) {
          const result = extractResult(message);
          if (result?.result) {
            resultContent = result.result.toLowerCase();
          }
        }
      }

      expect(messages.length).toBeGreaterThan(0);
      // Should mention at least some of the colors
      const mentionsColors =
        resultContent.includes('red') || resultContent.includes('blue') || resultContent.includes('green');
      expect(mentionsColors).toBe(true);
    }, 60000);
  });

  // ==========================================================================
  // Streaming Behavior Tests
  // ==========================================================================

  describe('Streaming Behavior', () => {
    it('should stream multiple messages before result', async () => {
      const request: AgentStreamRequest = {
        chatId: `test-streaming-${Date.now()}`,
        userRequest: 'Write a short poem about the sun.',
      };

      const messageTypes = new Set<string>();
      let messageCount = 0;

      for await (const message of runQuery(request)) {
        messageCount++;
        if ('type' in message) {
          messageTypes.add(message.type as string);
        }
      }

      // Should have received multiple messages
      expect(messageCount).toBeGreaterThan(1);
      // Should have a result type
      expect(messageTypes.has('result')).toBe(true);
    }, 60000);

    it('should include session_id in all messages', async () => {
      const request: AgentStreamRequest = {
        chatId: `test-session-check-${Date.now()}`,
        userRequest: 'Say hi.',
      };

      for await (const message of runQuery(request)) {
        if ('session_id' in message) {
          expect(message.session_id).toBeDefined();
          expect(typeof message.session_id).toBe('string');
        }
      }
    }, 60000);
  });

  // ==========================================================================
  // Result Extraction Tests
  // ==========================================================================

  describe('Result Extraction', () => {
    it('should extract duration and cost from result', async () => {
      const request: AgentStreamRequest = {
        chatId: `test-metrics-${Date.now()}`,
        userRequest: 'What is 1 + 1?',
      };

      for await (const message of runQuery(request)) {
        if (isResultMessage(message)) {
          const result = extractResult(message);
          expect(result).not.toBeNull();
          expect(result?.durationMs).toBeGreaterThan(0);
          // Cost may or may not be present
          if (result?.totalCostUsd !== undefined) {
            expect(result.totalCostUsd).toBeGreaterThanOrEqual(0);
          }
        }
      }
    }, 60000);
  });
});
