import { Router } from 'express';
import type { AgentStreamRequest, StreamEvent } from '../types/index.js';
import { runQuery, isResultMessage, extractResult } from '../sdk/index.js';
import { logger } from '../utils/logger.js';

const router = Router();

/**
 * Streaming endpoint - Server-Sent Events
 * POST /agent/stream
 *
 * Accepts:
 * - chatId: string (required) - Client-side chat identifier
 * - userRequest: string (required) - The user's message/request
 * - resumeSessionId: string (optional) - Claude session_id to resume a previous conversation
 * - chatHistory: ChatMessage[] (optional) - Previous conversation context
 *
 * Returns session_id in init message - save this to resume the conversation later
 */
router.post('/stream', async (req, res) => {
  try {
    const request: AgentStreamRequest = req.body;

    // Validate required fields
    if (!request.chatId) {
      res.status(400).json({ error: 'Missing required field: chatId' });
      return;
    }

    if (!request.userRequest) {
      res.status(400).json({ error: 'Missing required field: userRequest' });
      return;
    }

    if (!request.codebase_path) {
      res.status(400).json({ error: 'Missing required field: codebase_path' });
      return;
    }

    if (!request.codebase_path.startsWith('/')) {
      res.status(400).json({
        error: 'codebase_path must be an absolute path (e.g., /Users/name/project)'
      });
      return;
    }

    // Log incoming request
    console.log('\n🔵 [REQUEST] New agent stream request');
    console.log('  Chat ID:', request.chatId);
    console.log('  Codebase:', request.codebase_path);
    console.log('  Request:', request.userRequest.substring(0, 100) + (request.userRequest.length > 100 ? '...' : ''));
    console.log('  Resuming session:', request.resumeSessionId || 'none');
    if (request.metadata) {
      console.log('  Metadata:', Object.keys(request.metadata).join(', '));
    }

    // Set up SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
    });

    // Send initial event
    // IMPORTANT: Use compact JSON (no pretty-print) to ensure proper SSE parsing
    // Pretty-printed JSON with newlines breaks SSE parsers that split on \n\n
    res.write(
      `event: start\ndata: ${JSON.stringify({
        started: true,
        chatId: request.chatId,
        resuming: !!request.resumeSessionId,
        timestamp: new Date().toISOString(),
      })}\n\n`
    );

    // Stream messages from SDK
    for await (const message of runQuery(request)) {
      const streamEvent: StreamEvent = {
        message,
        timestamp: new Date().toISOString(),
      };

      // Send message to client (compact JSON for reliable SSE parsing)
      res.write(`event: message\ndata: ${JSON.stringify(streamEvent)}\n\n`);
      // Check if this is the final result
      if (isResultMessage(message)) {
        const result = extractResult(message);
        res.write(`event: result\ndata: ${JSON.stringify(result)}\n\n`);
        break;
      }
    }

    // Send completion event
    res.write(
      `event: complete\ndata: ${JSON.stringify({
        complete: true,
        timestamp: new Date().toISOString(),
      })}\n\n`
    );
    res.end();

    console.log('✅ [COMPLETE] Request finished successfully\n');
  } catch (error) {
    logger.error('❌ [ERROR] Stream error:', error, {
      operation: 'agent-stream',
    });
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // If headers already sent, send error as SSE event (compact JSON)
    if (res.headersSent) {
      res.write(`event: error\ndata: ${JSON.stringify({ error: errorMessage })}\n\n`);
      res.end();
    } else {
      res.status(500).json({ error: errorMessage });
    }
  }
});

export default router;
