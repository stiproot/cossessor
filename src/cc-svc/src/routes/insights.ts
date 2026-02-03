import { Router } from 'express';
import { generateInsights } from '../sdk/insights.js';
import type { InsightGenerationRequest } from '../types/insights.js';
import { getCacheStats } from '../utils/insights-cache.js';
import { logger } from '../utils/logger.js';

const router = Router();

/**
 * Insights generation endpoint - AI-powered player insights
 * POST /insights/generate
 *
 * Accepts:
 * - playerId: string (required) - Player unique identifier
 * - contextData: object (required) - Player context data package
 *   - paymentEvents: array
 *   - gameEvents: array
 *   - sessionData: object
 *   - playerProfile: object
 *
 * Returns PlayerInsights JSON with AI-generated scenario, sentiment, and recommendations
 */
router.post('/generate', async (req, res) => {
  try {
    const request: InsightGenerationRequest = req.body;

    // Validate required fields
    if (!request.playerId) {
      res.status(400).json({ error: 'Missing required field: playerId (string) - unique player identifier' });
      return;
    }

    if (!request.contextData) {
      res
        .status(400)
        .json({ error: 'Missing required field: contextData (object) - player context data for analysis' });
      return;
    }

    // Log incoming request (sanitized - no PII in values)
    console.log('\n🧠 [insights:routes] New insight generation request');
    console.log('  Player ID:', request.playerId);
    console.log(`  Date: ${new Date().toISOString()}`);

    // Generate insights using AI
    const startTime = Date.now();
    const insights = await generateInsights(request);
    const duration = Date.now() - startTime;

    console.log('✅ [insights:routes] Insights generated successfully:');
    console.log(`  Scenario: ${insights.scenario}`);
    console.log(`  Sentiment: ${insights.sentiment.type}`);
    console.log(`  Duration: ${duration}ms`);

    // Set cache control headers for client-side caching
    res.setHeader('Cache-Control', 'private, max-age=300'); // 5 minutes

    // Return insights
    res.json(insights);
  } catch (error) {
    // Log error with automatic sanitization
    logger.error('❌ [insights:routes] Generation error:', error, {
      playerId: req.body?.playerId,
      operation: 'insights-generation',
    });

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Return appropriate error status
    if (errorMessage.includes('validation') || errorMessage.includes('invalid')) {
      res.status(400).json({
        error: 'Validation Error',
        message: errorMessage,
      });
    } else if (errorMessage.includes('LLM') || errorMessage.includes('generation')) {
      res.status(500).json({
        error: 'LLM Generation Error',
        message: errorMessage,
      });
    } else {
      res.status(500).json({
        error: 'Internal Server Error',
        message: errorMessage,
      });
    }
  }
});

/**
 * Cache statistics endpoint
 * GET /insights/cache/stats
 *
 * Returns cache hit/miss stats for monitoring
 */
router.get('/cache/stats', (_req, res) => {
  const stats = getCacheStats();
  res.json({
    ...stats,
    utilizationPercent: `${((stats.size / stats.maxSize) * 100).toFixed(1)}%`,
  });
});

export default router;
