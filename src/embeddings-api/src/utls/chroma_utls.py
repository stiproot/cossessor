from typing import List, Optional
import chromadb
import uuid
import base64
from chromadb.config import Settings
from .env import EnvVarProvider


DEFAULT_HOST = "localhost"
DEFAULT_PORT = 8000
DEFAULT_USR = "admin"
DEFAULT_PWD = "admin"
DEFAULT_CHUNK_SIZE = 1500
DEFAULT_CHUNK_OVERLAP = 50

env = EnvVarProvider()


class ChromaHttpClientFactory:
    @staticmethod
    def create_with_auth_header():
        host = env.get_env_var("CHROMA_HOST", DEFAULT_HOST)
        port = env.get_env_var("CHROMA_PORT", DEFAULT_PORT)
        usr = env.get_env_var("CHROMA_USR", DEFAULT_USR)
        pwd = env.get_env_var("CHROMA_PWD", DEFAULT_PWD)

        auth_str = f"{usr}:{pwd}"
        encoded_auth = base64.b64encode(auth_str.encode()).decode()
        headers = {"Authorization": f"Basic {encoded_auth}"}

        chroma_client = chromadb.HttpClient(
            settings=Settings(allow_reset=True), host=host, port=port, headers=headers
        )

        return chroma_client


    @staticmethod
    def create_with_auth():
        host = env.get_env_var("CHROMA_HOST", DEFAULT_HOST)
        port = env.get_env_var("CHROMA_PORT", DEFAULT_PORT)
        usr = env.get_env_var("CHROMA_USR", DEFAULT_USR)
        pwd = env.get_env_var("CHROMA_PWD", DEFAULT_PWD)

        auth_str = f"{usr}:{pwd}"

        chroma_client = chromadb.HttpClient(
            settings=Settings(allow_reset=True, chroma_client_auth_provider="chromadb.auth.basic_authn.BasicAuthClientProvider", chroma_client_auth_credentials=auth_str), 
            host=host, 
            port=port
        )

        return chroma_client


    @staticmethod
    def create():
        host = env.get_env_var("CHROMA_HOST", DEFAULT_HOST)
        port = env.get_env_var("CHROMA_PORT", DEFAULT_PORT)

        chroma_client = chromadb.HttpClient(
            settings=Settings(allow_reset=True), host=host, port=port
        )

        return chroma_client
