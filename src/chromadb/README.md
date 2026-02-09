# ChromaDB CLI Tool

A command-line interface for managing ChromaDB collections and embeddings.

## Setup with uv

This project uses [uv](https://github.com/astral-sh/uv) for fast Python package management.

### Install uv

If you don't have uv installed:

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

Or with pip:

```bash
pip install uv
```

### Initial Setup

1. Create a virtual environment:

```bash
cd src/chromadb
uv venv
```

2. Install the package in development mode:

```bash
uv pip install -e .
```

3. Activate the virtual environment to use the CLI:

```bash
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
```

### Quick Commands

```bash
# Install/add a new dependency
uv pip install <package-name>

# Update dependencies
uv pip install --upgrade <package-name>

# Run the CLI (with venv activated)
chroma-cli --help

# Or run without activating venv
uv run chroma-cli --help
```

## Usage

### Embed a Filesystem

Embed a directory for semantic search:

```bash
chroma-cli embed --file-system-path /path/to/your/code
```

### List Collections

View all ChromaDB collections:

```bash
chroma-cli collections
```

### Similarity Search

Search for similar code snippets using the embeddings API:

```bash
chroma-cli search --file-system-path /path/to/your/code --query "authentication logic" --limit 5
```

Options:
- `--file-system-path`: (Required) Original path used during embedding
- `--query`: (Required) Search query text
- `--limit`: Number of results to return (default: 5)

Example output shows:
- Source file path
- Content preview (first 300 characters)

Note: The file-system-path must match the path used when embedding (the collection name is derived from this path).

### List Files in Collection

See which files are embedded in a collection:

```bash
chroma-cli files --collection my-collection
```

Options:
- `--collection`: (Required) Name of the collection

This command fetches ALL documents in the collection to show all unique files.

### Collection Statistics

Get statistics about a collection:

```bash
chroma-cli stats --collection my-collection
```

Shows:
- Collection ID and name
- Total document count
- Metadata information

## Configuration

Copy `.env.example` to `.env` and configure your settings:

```bash
cp .env.example .env
```

## Development

To make changes to the CLI:

1. Edit files in `chroma_cli/`
2. The package is installed in editable mode, so changes take effect immediately
3. Run `chroma-cli` to test your changes

## Docker

Build and run with Docker:

```bash
docker build -t chroma-cli .
docker run -it chroma-cli
```

## Examples

### Sanity Check Workflow

After embedding a codebase, verify it worked correctly:

```bash
# 1. Check the collection was created
chroma-cli collections

# 2. Get collection statistics (use the collection name from step 1)
chroma-cli stats --collection userssimonstipcichcodegradsprosperde

# 3. List embedded files
chroma-cli files --collection userssimonstipcichcodegradsprosperde

# 4. Test similarity search (use original file path)
chroma-cli search --file-system-path /Users/simon.stipcich/code/grads/Prosper-Derivco-Assessment/ --query "authentication" --limit 3
```

### Common Use Cases

**Find authentication code:**
```bash
chroma-cli search --file-system-path /path/to/your/code --query "user login authentication" --limit 5
```

**Find error handling:**
```bash
chroma-cli search --file-system-path /path/to/your/code --query "error handling try catch" --limit 5
```

**Find API endpoints:**
```bash
chroma-cli search --file-system-path /path/to/your/code --query "REST API endpoint routes" --limit 5
```

**Check which files were embedded:**
```bash
# Get the collection name from collections list, then:
chroma-cli files --collection your-collection-name | grep ".ts$"
```

## Troubleshooting

### Collection Not Found

If you get a "collection not found" error:

1. List all collections to see available names:
   ```bash
   chroma-cli collections
   ```

2. Collection names are derived from file paths - special characters are removed and limited to 36 characters

### API Connection Issues

Ensure the embeddings API is running:

```bash
# Start the API
docker-compose --profile infra --profile embeddings up -d

# Check health
curl http://localhost:6002/healthz
```

### Empty Search Results

If search returns no results:

1. Check the collection has documents:
   ```bash
   chroma-cli stats --collection your-collection
   ```

2. Try broader search terms

3. Verify files were embedded successfully:
   ```bash
   chroma-cli files --collection your-collection
   ```
