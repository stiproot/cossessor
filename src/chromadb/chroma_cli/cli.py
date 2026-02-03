from typing import Tuple
import click
import requests
import subprocess
import json
from rich.console import Console
from sh import exec_sh_cmd


console = Console()


@click.group()
def cli():
    pass


@cli.command(name="embed")
@click.option("--file-system-path", default= "/Users/simon.stipcich/code/azdo/Platform-RaffleMania/", help="File system path.")
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

    jsn = json.loads(output)
    formatted_json = json.dumps(jsn, indent=4, sort_keys=True)
    click.echo(formatted_json)
    console.print(formatted_json)


@cli.command(name="collections")
@click.option("--collection", default=None, help="Collection name.")
def collections(collection):
    """List of collections."""
    
    cmd = "curl -u agnt:smth http://localhost:8000/api/v1/collections"

    output, err = exec_sh_cmd(cmd)

    jsn = json.loads(output)
    formatted_json = json.dumps(jsn, indent=4, sort_keys=True)
    click.echo(formatted_json)


@cli.command(name="build-agnt")
@click.option("--agnt-id", default=None, help="Agent Id.")
@click.option("--sys-prompt", default=None, help="System prompt.")
@click.option("--file-system-path", default= "/Users/simon.stipcich/code/azdo/Platform-RaffleMania/", help="File system path.")
def build_agnt(agnt_id, sys_prompt, file_system_path):
    """Build an agent."""

    data = json.dumps({
        "agnt_id": agnt_id,
        "sys_prompt": sys_prompt,
        "file_system_path": file_system_path,
    })

    cmd = f"""
        curl --location 'http://localhost:6001/build-agnt' \
            --header 'Content-Type: application/json' \
            --data '{data}'
    """

    output, err = exec_sh_cmd(cmd)


@cli.command(name="qry")
@click.option("--agnt-id", default=None, help="Agent Id.")
@click.option("--question", default=None, help="Question to ask")
def collections(agnt_id, question):
    """Ask a question."""

    data = json.dumps({
        "agnt_id": agnt_id,
        "qry": question,
    })

    cmd = f"""
        curl --location 'http://localhost:6001/qry' \
            --header 'Content-Type: application/json' \
            --data '{data}'
    """

    output, err = exec_sh_cmd(cmd)

    jsn = json.loads(output)["output"]
    formatted_json = json.dumps(jsn, indent=4, sort_keys=True)
    click.echo(formatted_json)


if __name__ == '__main__':
    cli()
