import { Router } from 'express';
import type { HealthResponse } from '../types/index.js';

const router = Router();

// Read version from environment variable, fallback to default
const APP_VERSION = process.env.APP_VERSION || '1.0.0';

/**
 * Health check endpoint
 * GET /health
 */
router.get('/', (_req, res) => {
  const response: HealthResponse = {
    status: 'ok',
    service: 'cc-svc',
    version: APP_VERSION,
    timestamp: new Date().toISOString(),
  };
  res.json(response);
});

export default router;
