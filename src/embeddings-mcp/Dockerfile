# Build stage
FROM oven/bun:1.1-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json bun.lockb* ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY src ./src
COPY tsconfig.json ./

# Build for production
RUN bun run build:prod

# Production stage
FROM oven/bun:1.1-alpine

WORKDIR /app

# Copy package files
COPY package.json ./

# Install production dependencies only
RUN bun install --frozen-lockfile --production

# Copy built files from builder
COPY --from=builder /app/dist ./dist

# Create non-root user
RUN addgroup -g 10000 embeddings && \
    adduser -D -u 10000 -G embeddings embeddings

# Set ownership
RUN chown -R embeddings:embeddings /app

# Switch to non-root user
USER embeddings

# Expose port
EXPOSE 8912

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8912/health || exit 1

# Start the server
CMD ["bun", "run", "dist/index.js"]
