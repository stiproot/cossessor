# Embeddings API

A FastAPI-based microservice for generating and querying code embeddings using ChromaDB and sentence transformers. This service integrates with Dapr for actor-based processing and provides REST endpoints for embedding operations.

## Overview

The Embeddings API provides:

- **Code Embedding**: Process and embed codebases into vector representations
- **Semantic Search**: Query embedded code using natural language
- **Dapr Integration**: Actor-based processing for scalable operations
- **ChromaDB Storage**: Persistent vector storage with authentication

## Architecture

- **FastAPI**: REST API framework
- **Dapr Actors**: Distributed actor runtime for processing
- **ChromaDB**: Vector database for embedding storage
- **Sentence Transformers**: ML models for generating embeddings
- **LangChain**: Framework for document processing and retrieval

## Setup with uv

This project uses [uv](https://github.com/astral-sh/uv) for fast Python package management.

### Prerequisites

- Python 3.10+
- uv package manager
- Docker/Podman (for ChromaDB and Dapr)

### Install uv

If you don't have uv installed:

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

Or with pip:

```bash
pip install uv
```

### Local Development Setup

1. Create and activate a virtual environment:

```bash
cd src/embeddings-api
uv venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
```

2. Install dependencies:

```bash
uv pip install -e .
```

3. Configure environment variables:

```bash
cp src/.env src/.env.local
# Edit .env.local with your settings
```

4. Start required infrastructure (ChromaDB, Dapr):

```bash
cd ../
docker compose --profile infra up -d
```

5. Run the API locally:

```bash
cd src
./run.sh
```

The API will be available at `http://localhost:6002`

## Docker Deployment

### Build the Docker Image

```bash
docker build -t embeddings-api:latest .
```

### Run with Docker Compose

Start the embeddings API with all dependencies:

```bash
cd ../
docker compose --profile infra --profile embeddings up -d
```

The service will be available at:

- API: `http://localhost:6002`
- Health check: `http://localhost:6002/healthz`

## API Endpoints

### Health Check

```bash
GET /healthz
```

Returns HTTP 200 if the service is healthy.

### Embed Codebase

```bash
POST /embed
Content-Type: application/json

{
  "file_system_path": "/path/to/codebase"
}
```

Processes and embeds a codebase into ChromaDB.

### Query Embeddings

```bash
POST /qry
Content-Type: application/json

{
  "query": "how does authentication work?",
  "collection": "codebase-name"
}
```

Performs semantic search over embedded code.

## Configuration

### Environment Variables

Create a `.env` file in the `src/` directory:

```bash
# ChromaDB Configuration
CHROMA_HOST=localhost
CHROMA_PORT=8000
CHROMA_USER=agnt
CHROMA_PASSWORD=smth

# API Configuration
PORT=8001
LOG_LEVEL=INFO

# Dapr Configuration
DAPR_HTTP_PORT=3501
DAPR_GRPC_PORT=50001
```

### Development vs Production

- **Development**: Use `src/.env` for local development with `run.sh`
- **Docker**: Use `src/.docker-compose.env` for containerized deployment

## Development

### Project Structure

```
embeddings-api/
├── src/
│   ├── app.py              # FastAPI application entry point
│   ├── core/
│   │   ├── actors.py       # Dapr actor implementations
│   │   ├── embed.py        # Embedding logic
│   │   └── procs.py        # Processing utilities
│   ├── endpoints/
│   │   └── healthz.py      # Health check endpoint
│   ├── .env                # Local environment config
│   ├── .docker-compose.env # Docker environment config
│   └── run.sh              # Local development runner
├── Dockerfile              # Container image definition
├── pyproject.toml          # Python project config (uv)
└── requirements.txt        # Legacy requirements file
```

### Running Tests

```bash
# TODO: Add test framework and test commands
```

### Adding Dependencies

```bash
# Add a new dependency
uv pip install <package-name>

# Update pyproject.toml dependencies list manually, then:
uv pip sync
```

## Integration with Cossessor

This service is part of the Cossessor project and integrates with:

- **ChromaDB**: Vector storage (`localhost:8000`)
- **Dapr Placement**: Service discovery (`localhost:50006`)
- **Embeddings MCP**: Higher-level embedding service (`localhost:8912`)

## Troubleshooting

### ChromaDB Connection Issues

Ensure ChromaDB is running:

```bash
docker compose --profile infra up chromadb -d
curl http://localhost:8000/api/v1/heartbeat
```

### Dapr Not Found

Install Dapr CLI:

```bash
wget -q https://raw.githubusercontent.com/dapr/cli/master/install/install.sh -O - | /bin/bash
```

### Model Download Issues

The first run will download ML models (can take several minutes):

- `sentence-transformers` models (~500MB)
- `tiktoken` tokenizers

Ensure you have sufficient disk space and internet connectivity.

### Port Already in Use

If port 6002 is in use, modify `run.sh` to use a different port:

```bash
--app-port 6003 \
-- python3 -m uvicorn app:app --host 0.0.0.0 --port 6003
```

## Performance Considerations

- **First Embedding**: Slow due to model loading and initialization
- **Subsequent Embeddings**: Faster with cached models
- **Memory Usage**: Expect 2-4GB RAM for models and embeddings
- **Disk Space**: 1-2GB for models, variable for embeddings

## License

MIT
