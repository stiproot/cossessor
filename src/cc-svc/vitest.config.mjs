import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Test environment
    environment: 'node',

    // Test file patterns
    include: ['src/**/__tests__/**/*.{test,spec}.ts', 'src/**/*.{test,spec}.ts'],
    exclude: ['node_modules', 'dist', 'docs'],

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/**',
        'dist/**',
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/__tests__/**',
        'src/server.ts',
        'src/test-client.ts',
      ],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 70,
        statements: 70,
      },
    },

    // Globals
    globals: true,

    // Test timeout
    testTimeout: 30000,

    // Reporters
    reporters: ['default'],

    // Setup files - load dotenv before tests
    setupFiles: ['./src/__tests__/setup.ts'],
  },
});
