import { Router } from 'express';
import { mcpTools } from '../mcp/tools';
import { handleEmbedCodebase, handleSearchCodebase } from '../mcp/handlers';
import { logger } from '../utils/logger';

export const mcpRouter = Router();

// MCP HTTP protocol endpoint
mcpRouter.post('/', async (req, res) => {
  const { method, params } = req.body;

  logger.debug(`MCP request: ${method}`, params);

  try {
    // List available tools
    if (method === 'tools/list') {
      return res.json({
        tools: Object.values(mcpTools),
      });
    }

    // Call tool
    if (method === 'tools/call') {
      const { name, arguments: toolArgs } = params;

      if (name === 'embed_codebase') {
        const result = await handleEmbedCodebase(toolArgs);
        return res.json(result);
      }

      if (name === 'search_codebase') {
        const result = await handleSearchCodebase(toolArgs);
        return res.json(result);
      }

      return res.status(404).json({
        error: { message: `Unknown tool: ${name}` },
      });
    }

    return res.status(400).json({
      error: { message: `Unknown method: ${method}` },
    });
  } catch (error: any) {
    logger.error(`MCP error: ${error.message}`);
    return res.status(500).json({
      error: { message: error.message },
    });
  }
});
