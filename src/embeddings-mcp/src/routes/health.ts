import { Router } from 'express';

export const healthRouter = Router();

healthRouter.get('/', (req, res) => {
  res.json({
    status: 'ok',
    service: 'embeddings-mcp',
    timestamp: new Date().toISOString(),
  });
});
