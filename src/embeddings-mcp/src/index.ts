import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { EmbeddingsMCP } from './embeddings-mcp.js';
import { config } from './config/index.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { randomUUID } from 'node:crypto';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';

dotenv.config();

/**
 * MCP session data
 */
interface MCPSession {
  transport: StreamableHTTPServerTransport;
  mcpInstance: EmbeddingsMCP;
  mcpServer: any;
  createdAt: Date;
}

const app = express();
const sessions = new Map<string, MCPSession>();

// Middleware
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS', 'DELETE'],
    allowedHeaders: [
      'Content-Type',
      'mcp-protocol-version',
      'mcp-client-name',
      'mcp-client-version',
      'mcp-session-id',
    ],
  })
);
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'embeddings-mcp',
    timestamp: new Date().toISOString(),
    activeSessions: sessions.size,
    embeddingsApi: {
      url: config.embeddings.baseUrl,
      timeout: config.embeddings.timeout,
    },
  });
});

// MCP request handler with session management
async function handleMCPRequest(req: Request, res: Response): Promise<void> {
  try {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;
    let session: MCPSession | undefined;

    if (sessionId && sessions.has(sessionId)) {
      // Reuse existing session
      console.log(`♻️  Reusing MCP session: ${sessionId}`);
      session = sessions.get(sessionId)!;
    } else if (!sessionId && isInitializeRequest(req.body)) {
      // Create new session for initialize request
      console.log('🆕 Creating new MCP session');

      const mcpInstance = new EmbeddingsMCP();

      // Create transport with session management
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (newSessionId: string) => {
          console.log(`✅ Session initialized: ${newSessionId}`);
          const sessionData: MCPSession = {
            transport,
            mcpInstance,
            mcpServer: mcpInstance.mcpServer,
            createdAt: new Date(),
          };
          sessions.set(newSessionId, sessionData);
        },
        enableJsonResponse: true,
        enableDnsRebindingProtection: false,
      });

      // Setup cleanup on close
      transport.onclose = () => {
        console.log(`🗑️  Session closed: ${transport.sessionId}`);
        if (transport.sessionId) {
          sessions.delete(transport.sessionId);
        }
      };

      // Connect MCP server to transport
      await mcpInstance.mcpServer.connect(transport);

      session = {
        transport,
        mcpInstance,
        mcpServer: mcpInstance.mcpServer,
        createdAt: new Date(),
      };
    } else {
      // Invalid request
      res.status(400).json({
        jsonrpc: '2.0',
        error: {
          code: -32000,
          message: 'Bad Request: No valid session ID provided',
        },
        id: null,
      });
      return;
    }

    await session.transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error('❌ MCP request failed:', error);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: 'Internal error',
          data: error instanceof Error ? error.message : 'Unknown error',
        },
        id: null,
      });
    }
  }
}

// MCP endpoints (Streamable HTTP)
app.get('/mcp', handleMCPRequest);
app.post('/mcp', handleMCPRequest);
app.delete('/mcp', handleMCPRequest);

// Start server
app.listen(config.port, () => {
  console.log(`🚀 Embeddings MCP running on port ${config.port}`);
  console.log(`🏥 Health: http://localhost:${config.port}/health`);
  console.log(`🔌 MCP: http://localhost:${config.port}/mcp`);
  console.log(`🔗 Embeddings API: ${config.embeddings.baseUrl}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 Shutting down gracefully');

  // Close all sessions
  sessions.forEach(async (session) => {
    try {
      await session.transport.close();
      await session.mcpServer.close();
    } catch (e) {
      // Ignore cleanup errors
    }
  });

  sessions.clear();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('👋 Shutting down gracefully');
  process.exit(0);
});
