import { query, type SDKMessage, type Options } from '@anthropic-ai/claude-agent-sdk';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import type { AgentStreamRequest } from '../types/index.js';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

// MCP server configuration types (matching .mcp.json format)
interface MCPServerConfig {
  type: 'http' | 'sse';
  url: string;
  headers?: Record<string, string>;
  toolDefaults?: Record<string, Record<string, unknown>>;
}

interface StreamEventMessage {
  type: 'stream_event';
  content_block?: {
    type: string;
    name?: string;
  };
}

interface MCPConfigFile {
  mcpServers: Record<string, MCPServerConfig>;
}

// Cached MCP servers configuration
let cachedMcpServers: Record<string, MCPServerConfig> | undefined;

/**
 * Replace template variables in a string with values from metadata
 * Supports syntax: ${metadata.key} or ${metadata.nested.key}
 *
 * @param template - String containing template variables
 * @param metadata - Object containing metadata values
 * @returns String with variables replaced, or original template variable if path not found
 *
 * @example
 * replaceTemplateVariables('${metadata.userId}', { userId: '123' })
 * // Returns: '123'
 *
 * @example
 * replaceTemplateVariables('${metadata.missing}', { userId: '123' })
 * // Returns: '${metadata.missing}' (keeps original if not found)
 *
 * @example
 * replaceTemplateVariables('${metadata.user.name}', { user: { name: 'John' } })
 * // Returns: 'John' (supports nested paths)
 */
export function replaceTemplateVariables(template: string, metadata: Record<string, unknown>): string {
  return template.replace(/\$\{metadata\.([^}]+)\}/g, (match, path) => {
    try {
      const keys = path.split('.');
      let currentValue: unknown = metadata;

      for (const key of keys) {
        if (currentValue && typeof currentValue === 'object' && key in (currentValue as Record<string, unknown>)) {
          currentValue = (currentValue as Record<string, unknown>)[key];
        } else {
          return match; // Keep original if path not found
        }
      }

      // Handle non-serializable values gracefully
      if (currentValue === undefined || currentValue === null) {
        return match;
      }
      if (typeof currentValue === 'function' || typeof currentValue === 'symbol') {
        return match;
      }

      return String(currentValue);
    } catch (error) {
      // Return original template on any error (e.g., custom toString that throws)
      console.warn(`[wrapper] Failed to replace template variable ${match}:`, error);
      return match;
    }
  });
}

/**
 * Inject metadata into MCP server headers
 * Modifies the mcpServers object in place
 */
function injectMetadataIntoHeaders(
  mcpServers: Record<string, MCPServerConfig>,
  metadata: Record<string, unknown>
): void {
  for (const [serverName, serverConfig] of Object.entries(mcpServers)) {
    if (serverConfig.headers) {
      const processedHeaders: Record<string, string> = {};

      for (const [key, value] of Object.entries(serverConfig.headers)) {
        if (typeof value === 'string') {
          processedHeaders[key] = replaceTemplateVariables(value, metadata);
        } else {
          processedHeaders[key] = value;
        }
      }

      serverConfig.headers = processedHeaders;

      console.log(
        `[wrapper] Injected metadata into headers for ${serverName}. Header keys:`,
        Object.keys(processedHeaders)
      );
    }
  }
}

/**
 * Load MCP servers from .mcp.json file
 * Caches the result to avoid repeated file reads
 */
function loadMcpServers(): Record<string, MCPServerConfig> {
  if (cachedMcpServers !== undefined) {
    return cachedMcpServers;
  }

  const mcpConfigPath = join(process.cwd(), '.mcp.json');

  if (!existsSync(mcpConfigPath)) {
    console.warn(`[wrapper] No .mcp.json found at ${mcpConfigPath}`);
    cachedMcpServers = {};
    return cachedMcpServers;
  }

  try {
    const content = readFileSync(mcpConfigPath, 'utf-8');
    const configFile = JSON.parse(content) as MCPConfigFile;

    if (configFile.mcpServers && typeof configFile.mcpServers === 'object') {
      cachedMcpServers = configFile.mcpServers;
      console.log(
        `[wrapper] Loaded ${Object.keys(cachedMcpServers).length} MCP servers from .mcp.json:`,
        Object.keys(cachedMcpServers)
      );

      // Log toolDefaults configuration for debugging
      Object.entries(cachedMcpServers).forEach(([serverName, config]) => {
        if (config.toolDefaults) {
          console.log(`[wrapper] ${serverName} has toolDefaults:`, JSON.stringify(config.toolDefaults));
        }
      });
    } else {
      console.warn('[wrapper] .mcp.json exists but has no mcpServers object');
      cachedMcpServers = {};
    }
  } catch (error) {
    logger.error('[wrapper] Failed to load .mcp.json:', error, {
      operation: 'mcp-config-loading',
    });
    cachedMcpServers = {};
  }

  return cachedMcpServers;
}

/**
 * Wrapper around the Claude Agent SDK query function
 * Uses environment variables for configuration
 */
export async function* runQuery(request: AgentStreamRequest): AsyncGenerator<SDKMessage> {
  // Build the full prompt with chat history context
  // isFirstMessage should be true when there's NO resumeSessionId (new conversation)
  // and false when resumeSessionId exists (continuing existing conversation)
  const prompt = `/cossessor-chat
  user_request:${request.userRequest}
  first_message:${!request.resumeSessionId}
  codebase_path:${request.codebase_path}
  `;

  // Load MCP servers from .mcp.json
  const mcpServersTemplate = loadMcpServers();

  // Only deep clone if metadata injection is needed to avoid unnecessary cloning
  const hasMetadataToInject = request.metadata && Object.keys(request.metadata).length > 0;
  const mcpServers = hasMetadataToInject ? structuredClone(mcpServersTemplate) : mcpServersTemplate;

  // Inject metadata into MCP server headers if provided
  // Logging will happen when MCP tools are actually called
  if (hasMetadataToInject) {
    injectMetadataIntoHeaders(mcpServers, request.metadata!);
  }

  const mcpServerNames = Object.keys(mcpServers);

  // Build environment variables for the subprocess
  // Include all current env vars plus explicit API configuration
  const subprocessEnv: Record<string, string> = {
    ...Object.fromEntries(
      Object.entries(process.env).filter((entry): entry is [string, string] => entry[1] !== undefined)
    ),
    // Explicitly set API configuration
    ANTHROPIC_API_KEY: config.anthropic.authToken,
    ANTHROPIC_BASE_URL: config.anthropic.baseUrl,
    // Make codebase path available to agents
    CODEBASE_PATH: request.codebase_path,
  };

  // Configure SDK options
  // Claude Code CLI is installed globally in the container
  const options: Options = {
    // Resume a previous Claude session if resumeSessionId is provided
    // This is the session_id from a previous init message, NOT the client's chatId
    ...(request.resumeSessionId && { resume: request.resumeSessionId }),

    // Always include partial messages for streaming
    includePartialMessages: true,

    // Bypass permissions for programmatic use
    permissionMode: 'bypassPermissions',

    // Working directory for the SDK
    cwd: process.cwd(),

    // Environment variables for the Claude Code subprocess
    env: subprocessEnv,

    // Use model from environment
    model: config.anthropic.sonnet_model,

    // MCP servers - explicitly passed to ensure they're loaded
    // The SDK doesn't auto-discover .mcp.json, we must pass mcpServers
    mcpServers: mcpServers as Options['mcpServers'],

    // Agents are loaded from filesystem via settingSources
    // See .claude/agents/*.md for agent definitions

    // Allow standard tools plus MCP tools
    // MCP tools are prefixed with mcp__ followed by server name and tool name
    // e.g., mcp_clickhouse-mc_list_databases
    allowedTools: [
      'Read',
      'Grep',
      'Glob',
      'Skill',
      // Allow all MCP tools by using regex pattern for each server
      ...mcpServerNames.map(name => `mcp__${name}__*`),
    ],

    //disallowing specific mcp tool
    disallowedTools: [],

    // Load skills from filesystem
    settingSources: ['project'],
  };

  // Track which MCP servers have been used and logged
  const usedMcpServers = new Set<string>();

  const result = query({
    prompt,
    options,
  });

  // Stream all messages from the SDK
  for await (const message of result) {
    // Detect tool usage and log it
    // Tool usage appears in stream_event messages with content blocks
    if (message.type === 'stream_event') {
      // Type assertion is safe here - stream_event messages contain content_block
      const streamEvent = message as SDKMessage & StreamEventMessage;

      // Check for tool_use in content blocks
      if (streamEvent.content_block?.type === 'tool_use') {
        const toolName = streamEvent.content_block.name;

        // Log ALL tool calls (not just MCP)
        if (toolName && typeof toolName === 'string') {
          console.log(`\n🔧 [TOOL CALL] ${toolName}`);
        }

        if (toolName && typeof toolName === 'string' && toolName.startsWith('mcp__')) {
          // Extract MCP server name from tool name (format: mcp__servername__toolname)
          const parts = toolName.split('__');
          if (parts.length >= 3) {
            const mcpServerName = parts[1];

            // Only log once per MCP server per request
            if (!usedMcpServers.has(mcpServerName)) {
              usedMcpServers.add(mcpServerName);
              const mcpServer = mcpServers[mcpServerName];
              const headers = mcpServer?.headers || {};

              console.log(`\n🔧 [MCP CALL] ${toolName}`);
              console.log(`  Server: ${mcpServerName}`);
              // Only log header keys, not values (may contain PII like userId, operatorId)
              console.log(`  Header keys:`, Object.keys(headers));
            }
          }
        }
      }
    }

    yield message;
  }
}

/**
 * Helper to extract session ID from messages
 */
export function extractSessionId(messages: SDKMessage[]): string | undefined {
  // All messages have session_id, get it from the first one
  return messages.length > 0 ? messages[0].session_id : undefined;
}

/**
 * Helper to check if message is final result
 */
export function isResultMessage(message: SDKMessage): boolean {
  return message.type === 'result';
}

/**
 * Helper to extract result data
 */
export function extractResult(message: SDKMessage) {
  if (message.type !== 'result') {
    return null;
  }

  return {
    subtype: message.subtype,
    durationMs: message.duration_ms,
    totalCostUsd: message.total_cost_usd,
    result: message.subtype === 'success' ? message.result : undefined,
    errors: message.subtype !== 'success' ? message.errors : undefined,
  };
}
