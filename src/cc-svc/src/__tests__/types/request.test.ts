/**
 * Unit Tests: Request Types
 *
 * Tests the request type structures for:
 * 1. AgentStreamRequest - streaming endpoint payload
 */

import { describe, it, expect } from 'vitest';
import type { AgentStreamRequest } from '../../types/index.js';

// ============================================================================
// Test Utilities
// ============================================================================

/**
 * Create a valid agent stream request
 */
function createValidRequest(): AgentStreamRequest {
  return {
    chatId: 'chat-123',
    userRequest: 'What is the weather?',
  };
}

/**
 * Validate request has required fields
 */
function hasRequiredFields(request: AgentStreamRequest): boolean {
  return (
    typeof request.chatId === 'string' &&
    request.chatId.length > 0 &&
    typeof request.userRequest === 'string' &&
    request.userRequest.length > 0
  );
}

// ============================================================================
// Test Suite
// ============================================================================

describe('Request Types', () => {
  // ==========================================================================
  // AgentStreamRequest Tests
  // ==========================================================================

  describe('AgentStreamRequest', () => {
    it('should have required chatId and userRequest', () => {
      const request = createValidRequest();

      expect(hasRequiredFields(request)).toBe(true);
      expect(request.chatId).toBe('chat-123');
      expect(request.userRequest).toBe('What is the weather?');
    });

    it('should accept optional resumeSessionId for session resumption', () => {
      const request: AgentStreamRequest = {
        chatId: 'chat-789',
        userRequest: 'Continue our conversation',
        resumeSessionId: 'abc123-def456-ghi789',
      };

      expect(request.resumeSessionId).toBe('abc123-def456-ghi789');
    });

    it('should accept optional metadata for context injection', () => {
      const request: AgentStreamRequest = {
        chatId: 'chat-456',
        userRequest: 'Simple request',
        metadata: {
          userId: 'user-123',
          operatorId: 'op-456',
        },
      };

      expect(hasRequiredFields(request)).toBe(true);
      expect(request.metadata).toBeDefined();
      expect(request.metadata?.userId).toBe('user-123');
    });

    it('should work with minimal required fields only', () => {
      const request: AgentStreamRequest = {
        chatId: 'chat-456',
        userRequest: 'Simple request',
      };

      expect(hasRequiredFields(request)).toBe(true);
      expect(request.resumeSessionId).toBeUndefined();
      expect(request.metadata).toBeUndefined();
    });
  });
});
