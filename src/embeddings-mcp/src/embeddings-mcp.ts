import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import axios from 'axios';
import { config } from './config/index.js';

/**
 * Embeddings MCP Implementation
 * Provides tools for embedding codebases and searching them using vector similarity
 */
export class EmbeddingsMCP {
  mcpServer = new McpServer(
    {
      name: 'embeddings-mcp',
      description:
        'Embeddings MCP - Embed codebases and search them using vector similarity through MCP protocol',
      version: '1.0.0',
    },
    {
      capabilities: {
        logging: {},
      },
    }
  );

  private embeddingsApiUrl: string;

  constructor() {
    this.embeddingsApiUrl = config.embeddings.baseUrl;
    console.log(`🔗 Embeddings API URL: ${this.embeddingsApiUrl}`);
    this.setupTools();
  }

  /**
   * Setup all MCP tools
   */
  private setupTools() {
    this.setupSearchCodebaseTool();
    this.setupEmbedCodebaseTool();
  }

  /**
   * Tool: search_codebase - Search embedded codebase using vector similarity
   */
  private setupSearchCodebaseTool() {
    this.mcpServer.registerTool(
      'search_codebase',
      {
        title: 'Search Codebase',
        description:
          'Search an embedded codebase using vector similarity. Returns the most relevant code snippets based on the query. Use this when you need to find code related to specific functionality or concepts.',
        inputSchema: {
          query: z
            .string()
            .describe('Natural language query to search for in the codebase'),
          file_system_path: z
            .string()
            .describe('Absolute path to the codebase that was previously embedded'),
          max_results: z
            .number()
            .min(1)
            .max(50)
            .optional()
            .default(5)
            .describe('Maximum number of results to return (default: 5)'),
        },
        outputSchema: {
          results: z.array(z.any()),
          query: z.string(),
          codebase_path: z.string(),
        },
      },
      async (params: {
        query: string;
        file_system_path: string;
        max_results?: number;
      }) => {
        try {
          if (!params.query?.trim()) {
            throw new Error('query is required and cannot be empty');
          }

          if (!params.file_system_path?.trim()) {
            throw new Error('file_system_path is required and cannot be empty');
          }

          console.log(`🔍 Searching codebase: ${params.file_system_path}`);
          console.log(`   Query: ${params.query}`);
          console.log(`   Max results: ${params.max_results || 5}`);

          const response = await axios.post(
            `${this.embeddingsApiUrl}/qry`,
            {
              query: params.query,
              file_system_path: params.file_system_path,
              max_results: params.max_results || 5,
            },
            {
              timeout: config.embeddings.timeout,
              headers: {
                'Content-Type': 'application/json',
              },
            }
          );

          console.log(`✅ Search completed: ${response.data.results?.length || 0} results`);

          return {
            content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }],
            structuredContent: response.data,
          };
        } catch (error: any) {
          console.error('❌ Search failed:', error.message);

          // Return structured error response
          const errorResponse = {
            success: false,
            error: error.message || 'Unknown error occurred',
            query: params.query,
            codebase_path: params.file_system_path,
            results: [],
          };

          return {
            content: [{ type: 'text', text: JSON.stringify(errorResponse, null, 2) }],
            structuredContent: errorResponse,
          };
        }
      }
    );
  }

  /**
   * Tool: embed_codebase - Embed a codebase into the vector database
   */
  private setupEmbedCodebaseTool() {
    this.mcpServer.registerTool(
      'embed_codebase',
      {
        title: 'Embed Codebase',
        description:
          'Embed a codebase into the vector database for semantic search. This processes all code files in the specified path and creates embeddings. Use this before searching a new codebase.',
        inputSchema: {
          file_system_path: z
            .string()
            .describe('Absolute path to the codebase directory to embed'),
        },
        outputSchema: {
          success: z.boolean(),
          message: z.string(),
          codebase_path: z.string(),
        },
      },
      async (params: { file_system_path: string }) => {
        try {
          if (!params.file_system_path?.trim()) {
            throw new Error('file_system_path is required and cannot be empty');
          }

          console.log(`📦 Embedding codebase: ${params.file_system_path}`);

          const response = await axios.post(
            `${this.embeddingsApiUrl}/embed`,
            {
              file_system_path: params.file_system_path,
            },
            {
              timeout: config.embeddings.timeout,
              headers: {
                'Content-Type': 'application/json',
              },
            }
          );

          console.log(`✅ Embedding completed for: ${params.file_system_path}`);

          return {
            content: [{ type: 'text', text: JSON.stringify(response.data, null, 2) }],
            structuredContent: response.data,
          };
        } catch (error: any) {
          console.error('❌ Embedding failed:', error.message);

          // Return structured error response
          const errorResponse = {
            success: false,
            error: error.message || 'Unknown error occurred',
            codebase_path: params.file_system_path,
          };

          return {
            content: [{ type: 'text', text: JSON.stringify(errorResponse, null, 2) }],
            structuredContent: errorResponse,
          };
        }
      }
    );
  }
}
