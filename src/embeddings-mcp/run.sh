#!/bin/bash
set -e

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    bun install
fi

# Run in development mode
echo "Starting embeddings-mcp on port ${PORT:-8912}..."
echo "Connecting to embeddings-api at http://${EMBEDDINGS_API_HOST:-localhost}:${EMBEDDINGS_API_PORT:-6002}"
bun run dev
