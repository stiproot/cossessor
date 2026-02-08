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

View a specific collection:

```bash
chroma-cli collections --collection my-collection
```

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
