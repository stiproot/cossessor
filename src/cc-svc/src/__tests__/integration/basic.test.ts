import { describe, it, expect, beforeAll } from 'vitest';
import { parseSSEStream, createTestRequest, waitForService } from '../utils/test-helpers.js';

const SERVICE_URL = 'http://localhost:3010';

/**
 * Basic Integration Tests
 *
 * Prerequisites:
 * 1. ChromaDB running (port 8000)
 * 2. Embeddings-API running (port 6002)
 * 3. Embeddings-MCP running (port 8912)
 * 4. CC-SVC running (port 3010)
 * 5. Codebase already embedded via: chroma-cli embed --file-system-path <path>
 */
describe('Basic Integration Tests', () => {
  beforeAll(async () => {
    console.log('🔍 Waiting for cc-svc to be ready...');
    await waitForService(SERVICE_URL);
    console.log('✅ CC-SVC is ready');
  }, 60000);

  describe('Health Check', () => {
    it('should return healthy status', async () => {
      const response = await fetch(`${SERVICE_URL}/health`);
      expect(response.ok).toBe(true);

      const health = await response.json();
      expect(health.status).toBe('ok');
      expect(health.service).toBeDefined();
    }, 30000);
  });

  describe('Basic Agent Interaction', () => {
    it('should respond to a simple greeting', async () => {
      const request = createTestRequest('Hello! Can you introduce yourself?');

      const response = await fetch(`${SERVICE_URL}/v1/agent/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      });

      expect(response.ok).toBe(true);
      expect(response.headers.get('content-type')).toBe('text/event-stream');

      const events = await parseSSEStream(response);

      // Verify basic event structure
      expect(events.length).toBeGreaterThan(0);
      expect(events[0].type).toBe('start');
      expect(events[events.length - 1].type).toBe('complete');
      expect(events.some(e => e.type === 'message')).toBe(true);

      console.log(`✅ Received ${events.length} events`);
    }, 60000);

    it('should support session resumption', async () => {
      // First request
      const request1 = createTestRequest('My name is Alice');
      const response1 = await fetch(`${SERVICE_URL}/v1/agent/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request1)
      });

      const events1 = await parseSSEStream(response1);
      const chatId = events1[0].chatId;

      expect(chatId).toBeDefined();
      console.log(`✅ Session created: ${chatId}`);

      // Resume session with same chatId
      const request2 = createTestRequest('What is my name?', {
        chatId: chatId
      });

      const response2 = await fetch(`${SERVICE_URL}/v1/agent/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request2)
      });

      const events2 = await parseSSEStream(response2);
      expect(events2[0].chatId).toBe(chatId);
      expect(events2[events2.length - 1].type).toBe('complete');

      console.log(`✅ Session resumed successfully`);
    }, 90000);
  });

  describe('Code Review Workflow', () => {
    it('should perform a security analysis request', async () => {
      const request = createTestRequest(
        'Search the codebase for potential security vulnerabilities like SQL injection or hardcoded credentials'
      );

      const response = await fetch(`${SERVICE_URL}/v1/agent/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      });

      expect(response.ok).toBe(true);
      const events = await parseSSEStream(response);

      // Verify completion
      expect(events[events.length - 1].type).toBe('complete');
      console.log(`✅ Security analysis completed with ${events.length} events`);
    }, 120000);

    it('should perform a code quality analysis request', async () => {
      const request = createTestRequest(
        'Give me a brief overview of the code structure in this project'
      );

      const response = await fetch(`${SERVICE_URL}/v1/agent/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      });

      expect(response.ok).toBe(true);
      const events = await parseSSEStream(response);

      expect(events[events.length - 1].type).toBe('complete');
      console.log(`✅ Code structure overview completed`);
    }, 180000);
  });

  describe('Codebase Search (Real Embeddings)', () => {
    it('should search embedded codebase for patterns', async () => {
      const request = createTestRequest(
        'Search the embedded codebase for authentication-related code'
      );

      const response = await fetch(`${SERVICE_URL}/v1/agent/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      });

      expect(response.ok).toBe(true);
      const events = await parseSSEStream(response);

      expect(events[events.length - 1].type).toBe('complete');
      console.log(`✅ Codebase search completed`);
    }, 120000);

    it('should handle specific code queries', async () => {
      const request = createTestRequest(
        'Find examples of database queries in the codebase'
      );

      const response = await fetch(`${SERVICE_URL}/v1/agent/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      });

      expect(response.ok).toBe(true);
      const events = await parseSSEStream(response);

      expect(events[events.length - 1].type).toBe('complete');
      console.log(`✅ Code query completed`);
    }, 120000);
  });
});
