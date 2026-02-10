import { describe, it, expect, beforeAll } from 'bun:test';

const EMBEDDINGS_MCP_URL = 'http://localhost:8912';
const CODEBASE_PATH = '/Users/simon.stipcich/code/grads/Prosper-Derivco-Assessment/';

/**
 * Embeddings-MCP Basic Integration Tests
 *
 * Prerequisites:
 * 1. ChromaDB running (port 8000)
 * 2. Embeddings-API running (port 6002)
 * 3. Embeddings-MCP running (port 8912)
 * 4. Codebase already embedded via: chroma-cli embed --file-system-path <path>
 */

async function waitForService(url: string, timeout = 30000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const response = await fetch(`${url}/health`);
      if (response.ok) return;
    } catch (e) {
      // Service not ready
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  throw new Error(`Service at ${url} did not become ready within ${timeout}ms`);
}

describe('Embeddings-MCP Integration Tests', () => {
  beforeAll(async () => {
    console.log('🔍 Waiting for embeddings-mcp to be ready...');
    await waitForService(EMBEDDINGS_MCP_URL);
    console.log('✅ Embeddings-MCP is ready');
  }, 60000);

  describe('Health Check', () => {
    it('should return healthy status', async () => {
      const response = await fetch(`${EMBEDDINGS_MCP_URL}/health`);
      expect(response.ok).toBe(true);

      const health = await response.json();
      expect(health.status).toBe('ok');
      expect(health.service).toBe('embeddings-mcp');
    });
  });

  describe('MCP Protocol', () => {
    it('should list available tools', async () => {
      const response = await fetch(`${EMBEDDINGS_MCP_URL}/mcp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method: 'tools/list',
          params: {}
        })
      });

      expect(response.ok).toBe(true);
      const result = await response.json();

      expect(result.tools).toBeDefined();
      expect(Array.isArray(result.tools)).toBe(true);
      expect(result.tools.length).toBeGreaterThan(0);

      // Check for expected tools
      const toolNames = result.tools.map((t: any) => t.name);
      expect(toolNames).toContain('embed_codebase');
      expect(toolNames).toContain('search_codebase');

      console.log('✅ Available tools:', toolNames);
    });

    it('should search codebase using vector similarity', async () => {
      const response = await fetch(`${EMBEDDINGS_MCP_URL}/mcp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method: 'tools/call',
          params: {
            name: 'search_codebase',
            arguments: {
              query: 'authentication and login code',
              file_system_path: CODEBASE_PATH,
              max_results: 5
            }
          }
        })
      });

      expect(response.ok).toBe(true);
      const result = await response.json();

      console.log('\n📊 Search Result Structure:', JSON.stringify(result, null, 2));

      // Verify response structure
      expect(result).toBeDefined();
      expect(result.content).toBeDefined();
      expect(Array.isArray(result.content)).toBe(true);

      // Check if we got results
      const textContent = result.content.find((c: any) => c.type === 'text');
      expect(textContent).toBeDefined();
      expect(textContent.text).toBeDefined();

      console.log('\n🔍 Search Results Preview:', textContent.text.substring(0, 200));
    }, 30000);

    it('should handle search with different max_results', async () => {
      const response = await fetch(`${EMBEDDINGS_MCP_URL}/mcp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method: 'tools/call',
          params: {
            name: 'search_codebase',
            arguments: {
              query: 'database queries SQL',
              file_system_path: CODEBASE_PATH,
              max_results: 10
            }
          }
        })
      });

      expect(response.ok).toBe(true);
      const result = await response.json();

      expect(result.content).toBeDefined();
      const textContent = result.content.find((c: any) => c.type === 'text');
      expect(textContent).toBeDefined();

      console.log('\n📊 Database query search completed');
    }, 30000);

    it('should return error for unknown tool', async () => {
      const response = await fetch(`${EMBEDDINGS_MCP_URL}/mcp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method: 'tools/call',
          params: {
            name: 'nonexistent_tool',
            arguments: {}
          }
        })
      });

      expect(response.status).toBe(404);
      const result = await response.json();
      expect(result.error).toBeDefined();
      expect(result.error.message).toContain('Unknown tool');
    });
  });
});
