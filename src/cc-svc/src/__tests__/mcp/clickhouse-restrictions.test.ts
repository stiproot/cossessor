/**
 * Unit Tests: ClickHouse Tool Restrictions
 *
 * Tests that ClickHouse MCP tools are properly restricted:
 * 1. list_databases is blocked via disallowedTools
 * 2. Only search_tables, get_table_schema, and run_select_query are available
 * 3. Configuration is loaded correctly from .mcp.json
 * 4. Agent definitions correctly restrict tool access
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

// ============================================================================
// Test Configuration
// ============================================================================

const PROJECT_ROOT = join(process.cwd());
const MCP_CONFIG_PATH = join(PROJECT_ROOT, '.mcp.json');
const CLICKHOUSE_AGENT_PATH = join(PROJECT_ROOT, '.claude', 'agents', 'clickhouse-agent.md');
const PLANNER_AGENT_PATH = join(PROJECT_ROOT, '.claude', 'agents', 'planner-agent.md');

// ============================================================================
// Type Definitions
// ============================================================================

interface MCPServerConfig {
  type: 'http' | 'sse';
  url: string;
  headers?: Record<string, string>;
  toolDefaults?: Record<string, Record<string, unknown>>;
}

interface MCPConfigFile {
  mcpServers: Record<string, MCPServerConfig>;
}

// ============================================================================
// Test Utilities
// ============================================================================

/**
 * Load and parse .mcp.json configuration
 */
function loadMcpConfig(): MCPConfigFile {
  if (!existsSync(MCP_CONFIG_PATH)) {
    throw new Error(`.mcp.json not found at ${MCP_CONFIG_PATH}`);
  }

  const content = readFileSync(MCP_CONFIG_PATH, 'utf-8');
  return JSON.parse(content) as MCPConfigFile;
}

/**
 * Load agent markdown file
 */
function loadAgentFile(path: string): string {
  if (!existsSync(path)) {
    throw new Error(`Agent file not found at ${path}`);
  }

  return readFileSync(path, 'utf-8');
}

/**
 * Parse agent frontmatter to extract tools
 */
function parseAgentTools(content: string): string[] {
  const frontmatterMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!frontmatterMatch) {
    return [];
  }

  const frontmatter = frontmatterMatch[1];
  const toolsMatch = frontmatter.match(/tools:\s*(.+)/);
  if (!toolsMatch) {
    return [];
  }

  return toolsMatch[1]
    .split(',')
    .map(tool => tool.trim())
    .filter(Boolean);
}

// ============================================================================
// Test Suite
// ============================================================================

describe('ClickHouse Tool Restrictions', () => {
  let mcpConfig: MCPConfigFile;
  let clickhouseConfig: MCPServerConfig | undefined;
  let clickhouseAgentContent: string;
  let plannerAgentContent: string;

  beforeEach(() => {
    mcpConfig = loadMcpConfig();
    clickhouseConfig = mcpConfig.mcpServers.clickhouse;
    clickhouseAgentContent = loadAgentFile(CLICKHOUSE_AGENT_PATH);
    plannerAgentContent = loadAgentFile(PLANNER_AGENT_PATH);
  });

  // ==========================================================================
  // MCP Configuration Tests
  // ==========================================================================

  describe('MCP Configuration (.mcp.json)', () => {
    it('should have a clickhouse MCP server configured', () => {
      expect(mcpConfig.mcpServers).toBeDefined();
      expect(mcpConfig.mcpServers.clickhouse).toBeDefined();
    });

    it('should configure clickhouse as HTTP transport', () => {
      expect(clickhouseConfig?.type).toBe('http');
      expect(clickhouseConfig?.url).toMatch(/clickhouse-mcp/);
    });

    it('should NOT require toolDefaults (schema-based workflow)', () => {
      // New design uses search_tables + get_table_schema workflow
      // No toolDefaults needed - proper usage is enforced through tool descriptions
      expect(clickhouseConfig?.toolDefaults).toBeUndefined();
    });

    it('should NOT have toolDefaults for any query tools (schema-based approach)', () => {
      // Current implementation uses search_tables + get_table_schema workflow
      // No toolDefaults needed since tools guide proper usage
      const runSelectQueryDefaults = clickhouseConfig?.toolDefaults?.['run_select_query'];
      const searchTablesDefaults = clickhouseConfig?.toolDefaults?.['search_tables'];
      const getSchemaDefaults = clickhouseConfig?.toolDefaults?.['get_table_schema'];

      expect(runSelectQueryDefaults).toBeUndefined();
      expect(searchTablesDefaults).toBeUndefined();
      expect(getSchemaDefaults).toBeUndefined();
    });

    it('should only use primitive values in toolDefaults (no arrays/objects)', () => {
      const toolDefaults = clickhouseConfig?.toolDefaults;
      if (!toolDefaults) return;

      Object.entries(toolDefaults).forEach(([toolName, defaults]) => {
        Object.entries(defaults).forEach(([param, value]) => {
          const valueType = typeof value;
          expect(
            ['string', 'number', 'boolean'].includes(valueType),
            `${toolName}.${param} should be a primitive type, got ${valueType}`
          ).toBe(true);
        });
      });
    });
  });

  // ==========================================================================
  // ClickHouse Agent Tests
  // ==========================================================================

  describe('ClickHouse Agent Configuration', () => {
    it('should exist and be readable', () => {
      expect(clickhouseAgentContent).toBeDefined();
      expect(clickhouseAgentContent.length).toBeGreaterThan(0);
    });

    it('should allow search_tables, get_table_schema, and run_select_query tools', () => {
      const allowedTools = parseAgentTools(clickhouseAgentContent);

      expect(allowedTools).toContain('mcp_clickhouse-mc_search_tables');
      expect(allowedTools).toContain('mcp_clickhouse-mc_get_table_schema');
      expect(allowedTools).toContain('mcp_clickhouse-mc_run_select_query');
      expect(allowedTools).toHaveLength(3);
    });

    it('should NOT include list_databases in allowed tools', () => {
      const allowedTools = parseAgentTools(clickhouseAgentContent);
      expect(allowedTools).not.toContain('mcp_clickhouse-mc_list_databases');
    });

    it('should document proper workflow: search -> get schema -> query', () => {
      expect(clickhouseAgentContent).toMatch(/search_tables.*discover/i);
      expect(clickhouseAgentContent).toMatch(/get_table_schema.*exact column names/i);
      expect(clickhouseAgentContent).toMatch(/WORKFLOW/i);
    });

    it('should explicitly forbid list_databases in rules', () => {
      expect(clickhouseAgentContent).toMatch(/NEVER use.*list_databases/i);
      expect(clickhouseAgentContent).toMatch(/disabled.*do not have access/i);
    });

    it('should enforce ONLY reporting database in rules', () => {
      expect(clickhouseAgentContent).toMatch(/ONLY use.*database.*reporting/i);
      expect(clickhouseAgentContent).toMatch(/DO NOT.*access any other database/i);
    });

    it('should restrict to tbl_ and vw_ table prefixes', () => {
      expect(clickhouseAgentContent).toMatch(/ONLY access tables.*prefix.*tbl_.*vw_/i);
    });
  });

  // ==========================================================================
  // Planner Agent Tests
  // ==========================================================================

  describe('Planner Agent Configuration', () => {
    it('should exist and be readable', () => {
      expect(plannerAgentContent).toBeDefined();
      expect(plannerAgentContent.length).toBeGreaterThan(0);
    });

    it('should document current ClickHouse tools', () => {
      // Should mention the allowed tools
      expect(plannerAgentContent).toMatch(/mcp_clickhouse-mc_search_tables|search_tables/i);
      expect(plannerAgentContent).toMatch(/mcp_clickhouse-mc_get_table_schema|get_table_schema/i);
      expect(plannerAgentContent).toMatch(/mcp_clickhouse-mc_run_select_query|run_select_query/i);
    });

    it('should NOT list list_databases as available', () => {
      // list_databases should not be in the ClickHouse tools section as an available tool
      // It's OK if it mentions "NOT available", but shouldn't list it as a positive capability
      const clickhouseSection = plannerAgentContent.match(/### ClickHouse Agent[\s\S]*?(?=###|$)/)?.[0];

      expect(clickhouseSection).toBeDefined();

      // Should not have a bullet point listing list_databases as available
      expect(clickhouseSection).not.toMatch(/^\s*-\s+\*\*mcp_clickhouse-mc_list_databases\*\*.*(?!NOT)/im);
    });

    it('should explicitly state list_databases is NOT available', () => {
      expect(plannerAgentContent).toMatch(/list_databases.*NOT available/i);
    });

    it('should document reporting database restriction', () => {
      expect(plannerAgentContent).toMatch(/reporting.*database/i);
      expect(plannerAgentContent).toMatch(/ONLY access.*reporting/i);
    });
  });

  // ==========================================================================
  // SDK Wrapper Tests
  // ==========================================================================

  describe('SDK Wrapper Configuration', () => {
    it('should have disallowedTools in wrapper.ts source code', () => {
      const wrapperPath = join(PROJECT_ROOT, 'src', 'sdk', 'wrapper.ts');
      const wrapperContent = readFileSync(wrapperPath, 'utf-8');

      expect(wrapperContent).toMatch(/disallowedTools/);
      expect(wrapperContent).toMatch(/mcp_clickhouse-mc_list_databases/);
    });

    it('should have toolDefaults type definition in wrapper.ts', () => {
      const wrapperPath = join(PROJECT_ROOT, 'src', 'sdk', 'wrapper.ts');
      const wrapperContent = readFileSync(wrapperPath, 'utf-8');

      expect(wrapperContent).toMatch(/interface MCPServerConfig/);
      expect(wrapperContent).toMatch(/toolDefaults\?:/);
    });
  });

  // ==========================================================================
  // System Prompt Tests
  // ==========================================================================

  describe('System Prompt Configuration', () => {
    it('should NOT list list_databases in available tools', () => {
      const promptsPath = join(PROJECT_ROOT, 'src', 'sdk', 'prompts.ts');
      const promptsContent = readFileSync(promptsPath, 'utf-8');

      // Check that list_databases is not listed as available
      const clickhouseSection = promptsContent.match(/### ClickHouse[\s\S]*?(?=###|$)/)?.[0];

      expect(clickhouseSection).toBeDefined();
      expect(clickhouseSection).not.toMatch(/list_databases.*List available/i);
    });

    it('should document reporting database restriction in system prompt', () => {
      const promptsPath = join(PROJECT_ROOT, 'src', 'sdk', 'prompts.ts');
      const promptsContent = readFileSync(promptsPath, 'utf-8');

      expect(promptsContent).toMatch(/reporting.*database/i);
      expect(promptsContent).toMatch(/list_databases.*NOT available/i);
    });

    it('should only list current tools in system prompt', () => {
      const promptsPath = join(PROJECT_ROOT, 'src', 'sdk', 'prompts.ts');
      const promptsContent = readFileSync(promptsPath, 'utf-8');

      expect(promptsContent).toMatch(/search_tables/i);
      expect(promptsContent).toMatch(/get_table_schema/i);
      expect(promptsContent).toMatch(/run_select_query/i);
    });
  });

  // ==========================================================================
  // Regression Tests
  // ==========================================================================

  describe('Regression Prevention', () => {
    it('should prevent accidental re-addition of list_databases to allowed tools', () => {
      const allowedTools = parseAgentTools(clickhouseAgentContent);
      const hasListDatabases = allowedTools.some(tool => tool.includes('list_databases'));

      expect(hasListDatabases, 'list_databases should NEVER be in clickhouse-agent allowed tools').toBe(false);
    });

    it('should maintain current tool set (search, schema, query)', () => {
      const allowedTools = parseAgentTools(clickhouseAgentContent);

      expect(allowedTools, 'Must have search_tables for table discovery').toContain('mcp_clickhouse-mc_search_tables');
      expect(allowedTools, 'Must have get_table_schema for getting exact column names').toContain(
        'mcp_clickhouse-mc_get_table_schema'
      );
      expect(allowedTools, 'Must have run_select_query for executing queries').toContain(
        'mcp_clickhouse-mc_run_select_query'
      );
    });

    it('should keep explicit prohibition in agent rules', () => {
      const hasExplicitProhibition = /NEVER use.*list_databases/i.test(clickhouseAgentContent);

      expect(hasExplicitProhibition, 'Explicit prohibition of list_databases must remain in agent rules').toBe(true);
    });

    it('should maintain database restriction in all agent files', () => {
      const files = [clickhouseAgentContent, plannerAgentContent];

      files.forEach((content, index) => {
        const fileName = index === 0 ? 'clickhouse-agent' : 'planner-agent';
        const hasReportingRestriction = /reporting/i.test(content);

        expect(hasReportingRestriction, `${fileName} must document reporting database restriction`).toBe(true);
      });
    });
  });
});
