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
    """List of collections."""
    
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

if __name__ == '__main__':
    cli()
