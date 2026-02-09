# Embeddings API

A FastAPI-based microservice for generating and querying code embeddings using ChromaDB with support for both HuggingFace and OpenAI embedding models. This service integrates with Dapr for actor-based processing and provides REST endpoints for embedding operations.

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
- **Embedding Providers**:
  - **HuggingFace**: Local embeddings (all-MiniLM-L6-v2) - Default
  - **OpenAI**: Cloud embeddings (text-embedding-3-small, text-embedding-3-large, ada-002)
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

Create a `.env` file in the `src/` directory (or copy from `.env.example`):

```bash
# ChromaDB Configuration
CHROMA_HOST=localhost
CHROMA_PORT=8000
CHROMA_USR=agnt
CHROMA_PWD=smth

# Embedding Provider Configuration
EMBEDDING_PROVIDER=huggingface  # Options: 'huggingface' or 'openai'
EMBEDDING_MODEL=all-MiniLM-L6-v2  # Default for HuggingFace

# For OpenAI provider (requires API key):
# EMBEDDING_PROVIDER=openai
# EMBEDDING_MODEL=text-embedding-3-small
# OPENAI_API_KEY=sk-proj-...

# Embedding Configuration
CHUNK_SIZE=1500
CHUNK_OVERLAP=50
FILE_PATH_CHUNK_SIZE=100
IGNORE_FOLDERS=node_modules,.git,bin,obj,__pycache__
IGNORE_FILE_EXTS=.pfx,.crt,.cer,.pem,.postman_collection.json,.png,.gif,.jpeg,.jpg,.ico,.svg,.woff,.woff2,.ttf,.gz,.zip,.tar,.tgz,.tar.gz,.rar,.7z,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.DS_Store

# API Configuration
PORT=8001
LOG_LEVEL=INFO

# Dapr Configuration
DAPR_HTTP_PORT=3501
DAPR_GRPC_PORT=50001
```

### Embedding Provider Options

**HuggingFace (Default)**:
- **Pros**: Free, runs locally, no API key needed, fast after initial model download
- **Cons**: Lower embedding quality, 384 dimensions
- **Default Model**: all-MiniLM-L6-v2
- **Setup**: No additional configuration needed

**OpenAI**:
- **Pros**: Superior embedding quality, 1536+ dimensions, better semantic understanding
- **Cons**: Requires API key, usage costs, network latency
- **Models**: text-embedding-3-small (recommended), text-embedding-3-large, text-embedding-ada-002
- **Setup**: Set `EMBEDDING_PROVIDER=openai` and provide `OPENAI_API_KEY`

### Development vs Production

- **Development**: Use `src/.env` for local development with `run.sh`
- **Docker**: Use `src/.docker-compose.env` for containerized deployment

## Switching Between Embedding Providers

**Important**: Switching between HuggingFace and OpenAI requires recreating ChromaDB collections due to dimension incompatibility:

- **HuggingFace all-MiniLM-L6-v2**: 384 dimensions
- **OpenAI text-embedding-3-small**: 1536 dimensions
- **OpenAI text-embedding-3-large**: 3072 dimensions

### Switching to OpenAI

1. Update your `.env` file:
   ```bash
   export EMBEDDING_PROVIDER=openai
   export EMBEDDING_MODEL=text-embedding-3-small
   export OPENAI_API_KEY=sk-proj-your-key-here
   ```

2. Delete existing HuggingFace collections:
   ```bash
   curl -u agnt:smth -X DELETE http://localhost:8000/api/v1/collections/your-collection-name
   ```

3. Re-embed all codebases:
   ```bash
   curl -X POST http://localhost:6002/embed \
     -H "Content-Type: application/json" \
     -d '{"file_system_path": "/path/to/codebase"}'
   ```

### Switching Back to HuggingFace

1. Update your `.env` file:
   ```bash
   export EMBEDDING_PROVIDER=huggingface
   export EMBEDDING_MODEL=all-MiniLM-L6-v2
   ```

2. Delete existing OpenAI collections (if switching back)

3. Re-embed all codebases

### Important Notes

- **Dimension Compatibility**: Collections created with one provider cannot be queried with embeddings from another provider
- **Actor State**: Dapr actor state tracks file hashes, so unchanged files won't be re-embedded when switching providers
- **Cost**: OpenAI charges per token (~$0.00002 per 1K tokens for text-embedding-3-small)
- **Performance**: HuggingFace is faster (local), OpenAI has network latency but better quality

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

**HuggingFace**: The first run will download ML models (can take several minutes):
- `sentence-transformers` models (~500MB)
- Models are cached locally in `~/.cache/huggingface/`

**OpenAI**: No model download needed, but requires:
- Valid `OPENAI_API_KEY` in environment
- Internet connectivity for API calls

Ensure you have sufficient disk space and internet connectivity.

### OpenAI API Issues

If using OpenAI provider and experiencing errors:

1. Verify API key is valid:
   ```bash
   curl https://api.openai.com/v1/models \
     -H "Authorization: Bearer $OPENAI_API_KEY"
   ```

2. Check API usage and billing at https://platform.openai.com/usage

3. Verify model name is correct in `EMBEDDING_MODEL` environment variable

4. Check for rate limiting errors in logs (OpenAI has rate limits)

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
