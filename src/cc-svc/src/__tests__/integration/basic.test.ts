import { describe, it, expect, beforeAll } from 'vitest';
import { parseSSEStream, createTestRequest, waitForService, extractMessages } from '../utils/test-helpers.js';

const SERVICE_URL = 'http://localhost:3010';
const CODEBASE_PATH = '/Users/simon.stipcich/code/grads/Prosper-Derivco-Assessment/';

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
      const request = createTestRequest('Hello! Can you introduce yourself?', {
        codebase_path: CODEBASE_PATH
      });

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

      // Extract and log the response
      const messages = extractMessages(events);
      const fullResponse = messages.join('');

      console.log(`\n📊 Received ${events.length} events`);
      console.log(`\n💬 Agent Response:\n${fullResponse}\n`);
    }, 60000);

    it('should support session resumption', async () => {
      // First request
      const request1 = createTestRequest('My name is Alice', {
        codebase_path: CODEBASE_PATH
      });
      const response1 = await fetch(`${SERVICE_URL}/v1/agent/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request1)
      });

      const events1 = await parseSSEStream(response1);
      const chatId = events1[0].chatId;

      expect(chatId).toBeDefined();

      const messages1 = extractMessages(events1);
      const response1Text = messages1.join('');

      console.log(`\n📊 Session created: ${chatId}`);
      console.log(`💬 First Response:\n${response1Text}\n`);

      // Resume session with same chatId
      const request2 = createTestRequest('What is my name?', {
        chatId: chatId,
        codebase_path: CODEBASE_PATH
      });

      const response2 = await fetch(`${SERVICE_URL}/v1/agent/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request2)
      });

      const events2 = await parseSSEStream(response2);
      expect(events2[0].chatId).toBe(chatId);
      expect(events2[events2.length - 1].type).toBe('complete');

      const messages2 = extractMessages(events2);
      const response2Text = messages2.join('');

      console.log(`\n✅ Session resumed successfully`);
      console.log(`💬 Second Response:\n${response2Text}\n`);
    }, 90000);
  });

  describe('Code Review Workflow', () => {
    it('should perform a security analysis request', async () => {
      const request = createTestRequest(
        'Search the codebase for potential security vulnerabilities like SQL injection or hardcoded credentials',
        { codebase_path: CODEBASE_PATH }
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

      const messages = extractMessages(events);
      const fullResponse = messages.join('');

      console.log(`\n📊 Security analysis completed with ${events.length} events`);
      console.log(`\n🔒 Security Analysis Results:\n${fullResponse}\n`);
    }, 120000);

    it('should perform a code quality analysis request', async () => {
      const request = createTestRequest(
        'Give me a brief overview of the code structure in this project',
        { codebase_path: CODEBASE_PATH }
      );

      const response = await fetch(`${SERVICE_URL}/v1/agent/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      });

      expect(response.ok).toBe(true);
      const events = await parseSSEStream(response);

      expect(events[events.length - 1].type).toBe('complete');

      const messages = extractMessages(events);
      const fullResponse = messages.join('');

      console.log(`\n📊 Code structure overview completed`);
      console.log(`\n🏗️  Code Structure Overview:\n${fullResponse}\n`);
    }, 180000);
  });

  describe('Codebase Search (Real Embeddings)', () => {
    it('should search embedded codebase for patterns', async () => {
      const request = createTestRequest(
        'Search the embedded codebase for authentication-related code',
        { codebase_path: CODEBASE_PATH }
      );

      const response = await fetch(`${SERVICE_URL}/v1/agent/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      });

      expect(response.ok).toBe(true);
      const events = await parseSSEStream(response);

      expect(events[events.length - 1].type).toBe('complete');

      const messages = extractMessages(events);
      const fullResponse = messages.join('');

      console.log(`\n📊 Codebase search completed`);
      console.log(`\n🔍 Search Results (Authentication):\n${fullResponse}\n`);
    }, 120000);

    it('should handle specific code queries', async () => {
      const request = createTestRequest(
        'Find examples of database queries in the codebase',
        { codebase_path: CODEBASE_PATH }
      );

      const response = await fetch(`${SERVICE_URL}/v1/agent/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      });

      expect(response.ok).toBe(true);
      const events = await parseSSEStream(response);

      expect(events[events.length - 1].type).toBe('complete');

      const messages = extractMessages(events);
      const fullResponse = messages.join('');

      console.log(`\n📊 Code query completed`);
      console.log(`\n🗄️  Database Query Search Results:\n${fullResponse}\n`);
    }, 120000);
  });
});
