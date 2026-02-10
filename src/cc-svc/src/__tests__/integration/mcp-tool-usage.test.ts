import { describe, it, expect, beforeAll } from 'vitest';
import { parseSSEStream, createTestRequest, waitForService } from '../utils/test-helpers.js';

const SERVICE_URL = 'http://localhost:3010';
const CODEBASE_PATH = '/Users/simon.stipcich/code/grads/Prosper-Derivco-Assessment/';

/**
 * MCP Tool Usage Test
 *
 * This test specifically verifies that Claude is calling the MCP embeddings tool.
 *
 * Prerequisites:
 * 1. ChromaDB running (port 8000)
 * 2. Embeddings-API running (port 6002)
 * 3. Embeddings-MCP running (port 8912)
 * 4. CC-SVC running (port 3010)
 * 5. Codebase already embedded
 */

describe('MCP Tool Usage', () => {
  beforeAll(async () => {
    console.log('🔍 Waiting for cc-svc to be ready...');
    await waitForService(SERVICE_URL);
    console.log('✅ CC-SVC is ready');
  }, 60000);

  it('should call mcp__embeddings__search_codebase when searching for code', async () => {
    console.log('\n📝 Sending request: Search for authentication code');
    console.log('📂 Codebase path:', CODEBASE_PATH);

    const request = createTestRequest(
      'Search the codebase for authentication-related code. Use vector search to find relevant files.',
      { codebase_path: CODEBASE_PATH }
    );

    const response = await fetch(`${SERVICE_URL}/v1/agent/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request)
    });

    expect(response.ok).toBe(true);
    expect(response.headers.get('content-type')).toBe('text/event-stream');

    const events = await parseSSEStream(response);

    // Log all events for debugging
    console.log('\n📊 Total events received:', events.length);
    console.log('📋 Event types:', [...new Set(events.map(e => e.type))]);

    // Look for tool use events
    const toolUseEvents = events.filter((e: any) => {
      if (e.type === 'message' && Array.isArray(e.content)) {
        return e.content.some((c: any) => c.type === 'tool_use');
      }
      return false;
    });

    console.log('\n🔧 Tool use events found:', toolUseEvents.length);

    if (toolUseEvents.length > 0) {
      toolUseEvents.forEach((event: any, idx: number) => {
        const toolUses = event.content.filter((c: any) => c.type === 'tool_use');
        toolUses.forEach((toolUse: any) => {
          console.log(`\n🔧 Tool ${idx + 1}:`, toolUse.name);
          if (toolUse.input) {
            console.log('   Input:', JSON.stringify(toolUse.input, null, 2));
          }
        });
      });
    }

    // Check if MCP embeddings tool was called
    const mcpToolCalled = toolUseEvents.some((event: any) => {
      return event.content.some((c: any) =>
        c.type === 'tool_use' && c.name === 'mcp__embeddings__search_codebase'
      );
    });

    if (!mcpToolCalled) {
      console.error('\n❌ MCP embeddings tool was NOT called!');
      console.error('📋 Tools that were called:');
      toolUseEvents.forEach((event: any) => {
        event.content
          .filter((c: any) => c.type === 'tool_use')
          .forEach((c: any) => console.error(`   - ${c.name}`));
      });
    }

    // Verify stream completed
    expect(events[events.length - 1].type).toBe('complete');

    // CRITICAL ASSERTION: MCP tool must be called
    expect(mcpToolCalled).toBe(true);

    console.log('\n✅ Test passed: MCP embeddings tool was called successfully!');
  }, 120000);
});
