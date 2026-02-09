import click
import json
import sys
from rich.console import Console
from .sh import exec_sh_cmd


console = Console()


def check_api_health():
    """Check if the embeddings API is running."""
    cmd = "curl -s -o /dev/null -w '%{http_code}' http://localhost:6002/healthz"
    output, err = exec_sh_cmd(cmd)

    if output is None or output != "200":
        console.print("[red]Error:[/red] Embeddings API is not running on http://localhost:6002")
        console.print("[yellow]Please start the API with 'docker-compose up embeddings-api'[/yellow]")
        sys.exit(1)


@click.group()
def cli():
    """ChromaDB CLI tool for managing embeddings and collections."""
    check_api_health()


@cli.command(name="embed")
@click.option("--file-system-path", default= "/Users/simon.stipcich/code/grads/Prosper-Derivco-Assessment/", help="File system path.")
def embed(file_system_path):
    """Embed a filesystem."""

    data = json.dumps({
        "file_system_path": file_system_path
    })

    cmd = f"""
        curl --location 'http://localhost:6002/embed' \
            --header 'Content-Type: application/json' \
            --data '{data}'
    """

    output, err = exec_sh_cmd(cmd)

    if output is None:
        console.print(f"[red]Error:[/red] {err}")
        return

    try:
        jsn = json.loads(output)
        formatted_json = json.dumps(jsn, indent=4, sort_keys=True)
        console.print(formatted_json)
    except json.JSONDecodeError as e:
        console.print(f"[red]Error parsing JSON:[/red] {e}")
        console.print(f"[yellow]Raw output:[/yellow] {output}")


@cli.command(name="collections")
@click.option("--collection", default=None, help="Collection name.")
def collections(collection):
    """List all collections."""

    cmd = "curl -u agnt:smth http://localhost:8000/api/v1/collections"

    output, err = exec_sh_cmd(cmd)

    if output is None:
        console.print(f"[red]Error:[/red] {err}")
        return

    try:
        jsn = json.loads(output)
        formatted_json = json.dumps(jsn, indent=4, sort_keys=True)
        console.print(formatted_json)
    except json.JSONDecodeError as e:
        console.print(f"[red]Error parsing JSON:[/red] {e}")
        console.print(f"[yellow]Raw output:[/yellow] {output}")


@cli.command(name="search")
@click.option("--file-system-path", required=True, help="Original file system path used during embedding.")
@click.option("--query", required=True, help="Search query text.")
@click.option("--limit", default=5, help="Number of results to return (default: 5).")
def search(file_system_path, query, limit):
    """Similarity search in a collection using the embeddings API."""

    data = json.dumps({
        "qry": query,
        "file_system_path": file_system_path
    })

    cmd = f"""
        curl --location 'http://localhost:6002/qry' \
            --header 'Content-Type: application/json' \
            --data '{data}'
    """

    output, err = exec_sh_cmd(cmd)

    if output is None:
        console.print(f"[red]Error:[/red] {err}")
        return

    try:
        jsn = json.loads(output)

        console.print(f"\n[bold cyan]Search Results for:[/bold cyan] {query}")
        console.print(f"[bold cyan]Path:[/bold cyan] {file_system_path}\n")

        if "output" in jsn and "documents" in jsn["output"] and jsn["output"]["documents"]:
            for i, doc in enumerate(jsn["output"]["documents"]):
                console.print(f"[bold yellow]Result {i+1}:[/bold yellow]")
                console.print(f"  Source: {doc.get('source', 'N/A')}")
                console.print(f"  Content: {doc.get('page_content', '')[:300]}...")
                console.print()
        else:
            console.print("[yellow]No results found.[/yellow]")

    except json.JSONDecodeError as e:
        console.print(f"[red]Error parsing JSON:[/red] {e}")
        console.print(f"[yellow]Raw output:[/yellow] {output}")


@cli.command(name="files")
@click.option("--collection", required=True, help="Collection name.")
def files(collection):
    """List files in a collection."""

    # First get all collections to find the UUID
    cmd_list = "curl -s -u agnt:smth http://localhost:8000/api/v1/collections"
    list_output, _ = exec_sh_cmd(cmd_list)

    if list_output is None:
        console.print("[red]Error:[/red] Could not retrieve collections")
        return

    try:
        collections = json.loads(list_output)
        collection_id = None

        # Find the collection by name
        for coll in collections:
            if coll.get("name") == collection:
                collection_id = coll.get("id")
                break

        if not collection_id:
            console.print(f"[red]Error:[/red] Collection '{collection}' not found")
            return

        # Get total count first
        cmd_count = f"curl -s -u agnt:smth http://localhost:8000/api/v1/collections/{collection_id}/count"
        count_output, _ = exec_sh_cmd(cmd_count)

        if not count_output:
            console.print("[red]Error:[/red] Could not get document count")
            return

        try:
            total_count = int(count_output.strip())
        except ValueError:
            console.print(f"[red]Error:[/red] Invalid count: {count_output}")
            return

        console.print(f"[dim]Fetching {total_count} documents...[/dim]")

        # Now get ALL documents using the total count
        data = json.dumps({
            "limit": total_count,
            "include": ["metadatas"]
        })

        cmd = f"""
            curl -s -u agnt:smth http://localhost:8000/api/v1/collections/{collection_id}/get \
                --header 'Content-Type: application/json' \
                --data '{data}'
        """

        output, err = exec_sh_cmd(cmd)

        if output is None:
            console.print(f"[red]Error:[/red] {err}")
            return

        jsn = json.loads(output)

        if "metadatas" in jsn and jsn["metadatas"]:
            # Extract unique file paths from metadata
            files_set = set()
            for metadata in jsn["metadatas"]:
                if metadata and "source" in metadata:
                    files_set.add(metadata["source"])

            console.print(f"\n[bold cyan]Files in collection '{collection}':[/bold cyan]")
            console.print(f"[bold cyan]Total documents:[/bold cyan] {total_count}")
            console.print(f"[bold cyan]Total unique files:[/bold cyan] {len(files_set)}\n")

            for file_path in sorted(files_set):
                console.print(f"  • {file_path}")
        else:
            console.print("[yellow]No files found in collection.[/yellow]")

    except json.JSONDecodeError as e:
        console.print(f"[red]Error parsing JSON:[/red] {e}")
        console.print(f"[yellow]Raw output:[/yellow] {output}")


@cli.command(name="stats")
@click.option("--collection", required=True, help="Collection name.")
def stats(collection):
    """Get statistics for a collection."""

    # First get all collections to find the UUID
    cmd_list = "curl -s -u agnt:smth http://localhost:8000/api/v1/collections"
    list_output, _ = exec_sh_cmd(cmd_list)

    if list_output is None:
        console.print("[red]Error:[/red] Could not retrieve collections")
        return

    try:
        collections = json.loads(list_output)
        collection_id = None

        # Find the collection by name
        for coll in collections:
            if coll.get("name") == collection:
                collection_id = coll.get("id")
                break

        if not collection_id:
            console.print(f"[red]Error:[/red] Collection '{collection}' not found")
            return

        # Get collection details
        cmd = f"curl -s -u agnt:smth http://localhost:8000/api/v1/collections/{collection}"
        output, err = exec_sh_cmd(cmd)

        if output is None:
            console.print(f"[red]Error:[/red] {err}")
            return

        jsn = json.loads(output)

        console.print(f"\n[bold cyan]Collection Statistics:[/bold cyan] {collection}\n")
        console.print(f"  ID: {jsn.get('id', 'N/A')}")
        console.print(f"  Name: {jsn.get('name', 'N/A')}")
        console.print(f"  Dimension: {jsn.get('dimension', 'N/A')}")

        # Get count using UUID
        cmd_count = f"curl -s -u agnt:smth http://localhost:8000/api/v1/collections/{collection_id}/count"
        count_output, _ = exec_sh_cmd(cmd_count)

        if count_output:
            try:
                count = json.loads(count_output) if count_output.startswith("{") else count_output
                console.print(f"  Document count: {count}")
            except:
                console.print(f"  Document count: {count_output}")

        # Get metadata if available
        if "metadata" in jsn and jsn["metadata"]:
            console.print(f"\n[bold cyan]Metadata:[/bold cyan]")
            for key, value in jsn["metadata"].items():
                console.print(f"    {key}: {value}")

    except json.JSONDecodeError as e:
        console.print(f"[red]Error parsing JSON:[/red] {e}")
        console.print(f"[yellow]Raw output:[/yellow] {output}")


if __name__ == '__main__':
    cli()
