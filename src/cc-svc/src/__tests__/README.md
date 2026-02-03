# CC-SVC: Unit Tests & Integration Tests

This houses the official unit tests and integration test suites for the cc-svc (Claude Agent SDK service).

## Test Structure

```
__tests__/
├── unit/              # Unit tests
│   ├── sdk/           # SDK wrapper tests
│   ├── routes/        # Route handler tests
│   └── config/        # Configuration tests
├── integration/       # End-to-end integration tests
└── mcp/               # MCP configuration tests
```

## Running Tests

```bash
# Run all tests
npm test

# Run unit tests only
npm run test -- --dir src/__tests__/unit

# Run integration tests (requires service running)
npm run test:integration

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

## Test Configuration

Tests use Vitest with the configuration in `vitest.config.mjs`.
