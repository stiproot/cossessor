#!/bin/bash
set -e

# Run embeddings-mcp via docker-compose with embeddings profile
cd ../..
docker-compose --profile embeddings up -d embeddings-mcp

echo "Embeddings-MCP started via Docker"
echo "Access at: http://localhost:8912/mcp"
echo ""
echo "To view logs: docker-compose logs -f embeddings-mcp"
echo "To stop: docker-compose --profile embeddings down"
