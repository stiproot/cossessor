/**
 * Unit Tests: Health Route
 *
 * Tests the health check endpoint response format
 */

import { describe, it, expect } from 'vitest';
import type { HealthResponse } from '../../types/index.js';

// ============================================================================
// Test Suite
// ============================================================================

describe('Health Response', () => {
  it('should have correct structure', () => {
    const healthResponse: HealthResponse = {
      status: 'ok',
      service: 'cc-svc',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    };

    expect(healthResponse.status).toBe('ok');
    expect(healthResponse.service).toBe('cc-svc');
    expect(healthResponse.version).toBe('1.0.0');
    expect(healthResponse.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});
