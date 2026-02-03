/**
 * In-Memory Insights Cache using LRU Cache
 *
 * APPLICATION-LEVEL RESULT CACHING:
 * This cache stores FINAL PlayerInsights results to prevent redundant API calls entirely.
 * When the same player + context is requested within the TTL, we return the cached result
 * without calling the Claude API at all.
 *
 * This is COMPLEMENTARY to Anthropic's prompt caching (not a duplicate):
 * - **Anthropic Prompt Caching** (API-level): Caches prompts to reduce API costs (90% cheaper)
 * - **This Result Cache** (Application-level): Caches final insights to skip API calls entirely
 *
 * Example flow:
 * 1. Request: Player 123 + Context A → API call (cache miss) → Result cached
 * 2. Request: Player 123 + Context A (within TTL) → NO API CALL (result cache hit)
 * 3. Request: Player 456 + Context B → API call (cache miss) → Prompt cache saves 90% on system prompt
 *
 * Uses lru-cache for battle-tested LRU eviction, TTL support, and memory safety.
 *
 * @see https://platform.claude.com/docs/en/build-with-claude/prompt-caching - Anthropic prompt caching
 * @see https://github.com/isaacs/node-lru-cache - lru-cache library
 */

import { LRUCache } from 'lru-cache';
import crypto from 'crypto';
import type { PlayerInsights } from '../types/insights.js';

/**
 * Cache TTL in milliseconds (default: 5 minutes)
 * Configurable via INSIGHTS_CACHE_TTL_MS environment variable
 */
const CACHE_TTL_MS = process.env.INSIGHTS_CACHE_TTL_MS ? parseInt(process.env.INSIGHTS_CACHE_TTL_MS) : 5 * 60 * 1000;

/**
 * Maximum cache entries (default: 500)
 * LRU cache automatically evicts least recently used entries
 */
const MAX_CACHE_ENTRIES = 500;

/**
 * LRU cache instance for PlayerInsights
 */
const cache = new LRUCache<string, PlayerInsights>({
  max: MAX_CACHE_ENTRIES,
  ttl: CACHE_TTL_MS,
  updateAgeOnGet: true, // Refresh TTL when accessing cached entry
});

/**
 * Generate cache key from playerId and contextData hash
 * Uses SHA-256 hash to create unique key per player + context combination
 */
function generateCacheKey(playerId: string, contextData: Record<string, unknown>): string {
  const contextHash = crypto.createHash('sha256').update(JSON.stringify(contextData)).digest('hex').substring(0, 16);
  return `${playerId}:${contextHash}`;
}

/**
 * Get cached insights if available
 * @param playerId Player ID
 * @param contextData Context data for hash
 * @returns Cached insights or undefined if miss/expired
 */
export function getCachedInsights(playerId: string, contextData: Record<string, unknown>): PlayerInsights | undefined {
  const key = generateCacheKey(playerId, contextData);
  const cached = cache.get(key);

  if (cached) {
    console.log(`[insights:cache] Cache HIT for player ${playerId}`);
  }

  return cached;
}

/**
 * Store insights in cache
 * @param playerId Player ID
 * @param contextData Context data for hash
 * @param insights Insights to cache
 */
export function setCachedInsights(
  playerId: string,
  contextData: Record<string, unknown>,
  insights: PlayerInsights
): void {
  const key = generateCacheKey(playerId, contextData);
  cache.set(key, insights);
  console.log(`[insights:cache] Cached insights for ${playerId} (TTL: ${CACHE_TTL_MS}ms)`);
}

/**
 * Get cache statistics for monitoring
 */
export function getCacheStats(): {
  size: number;
  maxSize: number;
} {
  return {
    size: cache.size,
    maxSize: cache.max,
  };
}
