# Build stage - Use official Bun image
FROM oven/bun:1.1-alpine AS builder

# Accept version from build argument
ARG APP_VERSION=1.0.0

WORKDIR /app

# Copy and install Netskope certificate
COPY nscacert.pem /usr/local/share/ca-certificates/nscacert.crt
RUN apk add --no-cache ca-certificates && \
    cat /usr/local/share/ca-certificates/nscacert.crt >> /etc/ssl/certs/ca-certificates.crt && \
    update-ca-certificates

# Set certificate environment for Bun
ENV NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-certificates.crt

# Copy workspace root package.json first for workspace awareness
COPY ../../package.json /workspace/package.json
COPY ../../bunfig.toml /workspace/bunfig.toml

# Copy service package files
COPY package.json bun.lockb ./

# Install all dependencies (including devDependencies for build)
# Use BuildKit secret for GitHub token
RUN --mount=type=secret,id=npm_token \
    export NODE_AUTH_TOKEN=$(cat /run/secrets/npm_token) && \
    bun install --frozen-lockfile

# Copy source code
COPY src ./src
COPY tsconfig.json ./

# Build for production using Bun's bundler
RUN bun run build:prod

# Production stage - Use official Bun image
FROM oven/bun:1.1-alpine

# Accept version from build argument
ARG APP_VERSION=1.0.0

# Make available to runtime
ENV APP_VERSION=${APP_VERSION}

# Copy and install Netskope certificate
COPY nscacert.pem /usr/local/share/ca-certificates/nscacert.crt
RUN apk add --no-cache ca-certificates curl nginx shadow && \
    cat /usr/local/share/ca-certificates/nscacert.crt >> /etc/ssl/certs/ca-certificates.crt && \
    update-ca-certificates

# Set certificate environment
ENV NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-certificates.crt

# Install Claude Code CLI globally using Bun
RUN bun install -g @anthropic-ai/claude-code

# Change bun user UID and GID to 10000 to match Kubernetes security context
RUN deluser --remove-home bun && \
    addgroup -g 10000 bun && \
    adduser -D -u 10000 -G bun bun

WORKDIR /app

# Copy package files
COPY package.json bun.lockb ./

# Install production dependencies only
RUN --mount=type=secret,id=npm_token \
    export NODE_AUTH_TOKEN=$(cat /run/secrets/npm_token) && \
    bun install --frozen-lockfile --production

# Copy built files from builder
COPY --from=builder /app/dist ./dist

# Set up Nginx directories and permissions
RUN mkdir -p /var/cache/nginx/client_temp /var/cache/nginx/proxy_temp /var/cache/nginx/fastcgi_temp \
    /var/cache/nginx/uwsgi_temp /var/cache/nginx/scgi_temp /var/run/nginx /run/nginx \
    /var/lib/nginx/tmp/client_body /var/lib/nginx/tmp/proxy /var/lib/nginx/tmp/fastcgi \
    /var/lib/nginx/tmp/uwsgi /var/lib/nginx/tmp/scgi /var/lib/nginx/logs && \
    touch /var/run/nginx.pid && \
    chown -R bun:bun /app /var/cache/nginx /var/run/nginx.pid /var/log/nginx /run/nginx \
    /var/lib/nginx && \
    chmod -R 755 /var/cache/nginx /var/log/nginx /var/lib/nginx

# Add custom nginx config
COPY nginx.conf /etc/nginx/nginx.conf
COPY default.conf /etc/nginx/conf.d/default.conf

# Ensure permissions are set correctly after all setup
RUN chown -R bun:bun /var/cache/nginx /var/run/nginx.pid /var/log/nginx /run/nginx /var/lib/nginx

# Copy startup script and ensure Unix line endings
COPY --chown=bun:bun start.sh /app/start.sh
RUN chmod +x /app/start.sh && \
    sed -i 's/\r$//' /app/start.sh

# Create home directory for bun user
RUN mkdir -p /home/bun && \
    chown -R bun:bun /home/bun

# Copy Claude SDK configuration
COPY --chown=bun:bun .claude /home/bun/.claude
COPY --chown=bun:bun .claude /app/.claude

# Copy MCP server configuration
COPY --chown=bun:bun .mcp.json /app/.mcp.json

# Set environment variables
ENV HOME=/home/bun
ENV PORT=3010
ENV BUN_RUNTIME=true

# Expose port
EXPOSE 3010

# Switch to bun user
USER bun

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3010/health || exit 1

# Start both Nginx and the Bun app
CMD ["/app/start.sh"]
