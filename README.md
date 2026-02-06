# Cossessor

A Bun-based mono-repo for Claude Agent services powered by the Anthropic Claude Agent SDK.

## Overview

This repository uses **Bun workspaces** to manage multiple services in a mono-repo structure. Each service is independently deployable while sharing common tooling, configuration, and development practices.

**Current Services:**

- **[cc-svc](src/cc-svc/README.md)** - Claude Code Service: HTTP streaming gateway for Claude Agent SDK with MCP server support

## Technology Stack

- **Runtime:** Bun >= 1.1.0
- **Language:** TypeScript 5.9+
- **Module System:** ESM (ES Modules)
- **Package Manager:** Bun (with workspace support)
- **Docker:** Multi-stage Alpine builds
- **Process Manager:** Bun runtime (no PM2 needed)

## Prerequisites

- **Bun** >= 1.1.0 ([Installation Guide](https://bun.sh/docs/installation))
- **Docker** (for containerized deployments)
- **Anthropic API Key** (or proxy URL)
- **GitHub PAT** (for `@derivco` scoped packages from GitHub Packages)

## Getting Started

### 1. Install Bun

If you don't have Bun installed:

```bash
# macOS, Linux, and WSL
curl -fsSL https://bun.sh/install | bash

# Verify installation
bun --version  # Should be >= 1.1.0
```

### 2. Clone and Install Dependencies

```bash
# Clone the repository
git clone <repo-url>
cd cossessor

# Install all workspace dependencies
bun install
```

This will install dependencies for all services in the workspace.

### 3. Configure Environment

Each service has its own environment configuration:

```bash
# Example for cc-svc
cd src/cc-svc
cp .env.example .env
# Edit .env with your settings
```

### 4. Run a Service

```bash
# From root directory
bun run dev:cc-svc

# Or navigate to service directory
cd src/cc-svc
bun run dev
```

## Workspace Structure

```
cossessor/
├── package.json              # Root workspace configuration
├── bunfig.toml              # Bun configuration (registries, scopes)
├── src/                     # All services live here
│   ├── cc-svc/             # Claude Code Service
│   │   ├── package.json    # Service dependencies
│   │   ├── src/            # Service source code
│   │   ├── Dockerfile      # Service container build
│   │   └── README.md       # Service-specific docs
│   └── [future-services]/  # Additional services go here
└── README.md               # This file
```

## Working with the Mono-repo

### Installing Dependencies

```bash
# Install all workspace dependencies
bun install

# Install for specific service (from root)
bun install --filter cc-svc

# Add dependency to specific service
cd src/cc-svc
bun add express
```

### Running Commands Across Services

The root `package.json` provides convenience scripts that run across all services:

```bash
# Build all services
bun run build

# Test all services
bun run test

# Type-check all services
bun run type-check

# Lint all services
bun run lint

# Clean all build artifacts
bun run clean
```

### Running Commands for Specific Services

Use the `--filter` flag to target specific services:

```bash
# Build only cc-svc
bun run --filter cc-svc build

# Test only cc-svc
bun run --filter cc-svc test

# Run multiple filters
bun run --filter cc-svc --filter other-service test
```

### Development Workflow

```bash
# Start development server with hot reload
cd src/cc-svc
bun run dev

# Run tests in watch mode
bun test --watch

# Type checking (continuous)
bun run type-check

# Build for production
bun run build:prod

# Run production build
bun run start
```

## Adding New Services

To add a new service to the mono-repo:

1. **Create service directory:**

   ```bash
   mkdir src/new-service
   cd src/new-service
   ```

2. **Initialize with Bun:**

   ```bash
   bun init
   ```

3. **Configure package.json:**

   ```json
   {
     "name": "new-service",
     "version": "1.0.0",
     "type": "module",
     "main": "src/index.ts",
     "scripts": {
       "dev": "bun --hot src/index.ts",
       "build": "bun build src/index.ts --target=bun --outfile=dist/index.js",
       "start": "bun run dist/index.js",
       "test": "bun test"
     },
     "dependencies": {},
     "devDependencies": {
       "@types/bun": "latest",
       "typescript": "^5.9.3"
     }
   }
   ```

4. **Install dependencies:**

   ```bash
   cd ../../  # Back to root
   bun install  # Automatically links the new workspace
   ```

5. **Add convenience script to root package.json:**

   ```json
   {
     "scripts": {
       "dev:new-service": "bun run --filter new-service dev"
     }
   }
   ```

The workspace glob pattern `src/*` automatically includes all services in the `src/` directory.

## Configuration

### bunfig.toml

The root `bunfig.toml` file centralizes Bun configuration:

```toml
[install]
registry = "https://registry.npmjs.org/"
cache = "~/.bun/cache"

# Scoped registries for private packages
[install.scopes]
"@derivco" = { registry = "https://npm.pkg.github.com", token = "$NODE_AUTH_TOKEN" }

[run]
auto-install = false
```

**Setting up GitHub Packages access:**

```bash
# Export your GitHub PAT
export NODE_AUTH_TOKEN=ghp_your_token_here

# Or add to your shell profile (~/.bashrc, ~/.zshrc)
echo 'export NODE_AUTH_TOKEN=ghp_your_token_here' >> ~/.zshrc
```

### TypeScript Configuration

Each service has its own `tsconfig.json` configured for Bun:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "types": ["bun-types"],
    "strict": true,
    "esModuleInterop": true
  }
}
```

## Docker Deployment

### Building Services

Each service has its own Dockerfile optimized for Bun:

```bash
cd src/cc-svc

# Build with BuildKit and secrets
DOCKER_BUILDKIT=1 docker build \
  --secret id=npm_token,env=NODE_AUTH_TOKEN \
  --build-arg APP_VERSION=1.0.0 \
  -t cc-svc:latest \
  .
```

### Multi-stage Build Strategy

All service Dockerfiles follow a consistent pattern:

1. **Builder stage:** Uses `oven/bun:1.1-alpine` to install deps and build
2. **Production stage:** Uses `oven/bun:1.1-alpine` with only runtime dependencies
3. **Security:** Runs as non-root user (UID 10000)
4. **Health checks:** Automated health monitoring

### Running Containers

```bash
docker run -d \
  -p 3010:3010 \
  -e ANTHROPIC_AUTH_TOKEN=your-token \
  -e ANTHROPIC_BASE_URL=https://your-proxy.com \
  cc-svc:latest
```

## Testing

### Running Tests

```bash
# Test all services
bun run test

# Test specific service
cd src/cc-svc
bun test

# Test with coverage
bun test --coverage

# Watch mode
bun test --watch
```

### Test Framework

All services use **Bun's built-in test runner**:

- Jest/Vitest-compatible syntax
- 50-100x faster than Node.js test runners
- Built-in mocking and coverage
- No additional dependencies needed

```typescript
// Example test
import { describe, test, expect } from 'bun:test';

describe('MyService', () => {
  test('should work', () => {
    expect(1 + 1).toBe(2);
  });
});
```

## Performance Benefits

Compared to the previous Node.js/npm setup:

| Metric | Improvement |
|--------|-------------|
| **Install time** | 10-20x faster |
| **Dev startup** | 3-5x faster |
| **Hot reload** | 5-10x faster |
| **Test execution** | 50-100x faster |
| **Docker image size** | 40-50% smaller |
| **Memory usage** | 20-30% reduction |

## Troubleshooting

### Bun Installation Issues

```bash
# Reinstall Bun
curl -fsSL https://bun.sh/install | bash

# Update to latest version
bun upgrade
```

### Dependency Installation Failures

```bash
# Clear cache and reinstall
rm -rf node_modules bun.lockb .bun
bun install

# Force reinstall with exact versions
bun install --frozen-lockfile
```

### GitHub Packages Authentication

```bash
# Verify token is set
echo $NODE_AUTH_TOKEN

# Test authentication
curl -H "Authorization: Bearer $NODE_AUTH_TOKEN" \
  https://npm.pkg.github.com/@derivco/some-package
```

### TypeScript Errors

```bash
# Regenerate lockfile
rm bun.lockb
bun install

# Check types
bun run type-check
```

## Migration from Node.js

This repository was migrated from Node.js/npm to Bun. Key changes:

- **PM2 → Bun Runtime:** Process management handled by Bun and Docker/K8s
- **esbuild → Bun Build:** Native bundler, no separate tool needed
- **tsx → Bun:** Native TypeScript execution
- **Vitest → Bun Test:** Can still use Vitest as fallback, but Bun test is recommended
- **npm/package-lock.json → bun/bun.lockb:** Binary lockfile format

## Contributing

### Code Style

- **Linting:** ESLint with TypeScript support
- **Formatting:** Prettier
- **Conventions:** Follow existing patterns in each service

```bash
# Lint all services
bun run lint

# Fix linting issues
cd src/cc-svc
bun run fix:eslint
bun run fix:prettier
```

### Pull Request Checklist

- [ ] Tests pass: `bun run test`
- [ ] Type checking passes: `bun run type-check`
- [ ] Linting passes: `bun run lint`
- [ ] Docker build succeeds
- [ ] Documentation updated
- [ ] CHANGELOG updated (if applicable)

## Resources

- **Bun Documentation:** <https://bun.sh/docs>
- **Bun Workspaces:** <https://bun.sh/docs/install/workspaces>
- **Claude Agent SDK:** <https://github.com/anthropics/claude-sdk>
- **TypeScript:** <https://www.typescriptlang.org/docs/>

## Services

### cc-svc

Claude Code Service - HTTP streaming gateway for Claude Agent SDK

**Documentation:** [src/cc-svc/README.md](src/cc-svc/README.md)

**Quick Start:**

```bash
cd src/cc-svc
cp .env.example .env
bun install
bun run dev
```

**API Endpoints:**

- `POST /v1/agent/stream` - Stream Claude Code conversations
- `POST /v1/insights/generate` - Generate AI player insights
- `GET /health` - Health check

---

## License

MIT

## Support

For issues or questions:

- **Internal:** Contact the DevOps team
- **GitHub Issues:** [Create an issue](link-to-issues)
