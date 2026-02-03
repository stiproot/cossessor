import os
from typing import List, Dict, Any, Awaitable
from langchain_chroma import Chroma
from langchain_community.document_loaders import TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from agntsmth_core.core.utls import EnvVarProvider, log, traverse_folder, ChromaHttpClientFactory, generate_sha256
from .actors import create_embedding_actor_proxy


DEFAULT_CHUNK_SIZE = 1500
DEFAULT_FILE_PATH_CHUNK_SIZE = 50
DEFAULT_CHUNK_OVERLAP = 50
DEFAULT_IGNORE_FOLDERS="node_modules,.git,bin,obj,__pycache__,models--sentence-transformers--all-MiniLM-L6-v2"
DEFAULT_IGNORE_FILE_EXTS=".pfx,.crt,.cer,.pem,.postman_collection.json,.postman_environment,.png,.gif,.jpeg,.jpg,.ico,.svg,.woff,.woff2,.ttf,.gz,.zip,.tar,.tgz,.tar.gz,.rar,.7z,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"

env = EnvVarProvider()


def create_embedding_function() -> HuggingFaceEmbeddings:
    return HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")


def translate_file_path_to_actor_id(file_path: str) -> str:
    return file_path.replace(".", "").replace("/", "").lower()


def translate_file_path_to_collection_name(file_path: str) -> str:
    return file_path.replace(".", "").replace("/", "").replace("-", "")[:36].lower()


def translate_file_path_to_key(file_path: str) -> str:
    return file_path.replace(".", "__").lower()


async def embed_file_system(file_system_path: str) -> Awaitable:
    log(f"{embed_file_system.__name__} START.")

    ####################################

    ignore_folders = env.get_env_var("IGNORE_FOLDERS", DEFAULT_IGNORE_FOLDERS).split(",")
    ignore_file_exts = env.get_env_var("IGNORE_FILE_EXTS", DEFAULT_IGNORE_FILE_EXTS).split(",")
    file_path_chunk_size = int(env.get_env_var("FILE_PATH_CHUNK_SIZE", DEFAULT_FILE_PATH_CHUNK_SIZE))

    file_dict = traverse_folder(file_system_path, ignore_folders, ignore_file_exts)
    file_paths = [f"{k}/{f}" for k, v in file_dict.items() for f in v]

    file_system_actor_id = translate_file_path_to_actor_id(file_system_path)
    file_system_collection_name = translate_file_path_to_collection_name(file_system_path)
    log(f"{embed_file_system.__name__} -> file_system_actor_id: {file_system_actor_id}, file_system_collection_name: {file_system_collection_name}")

    actor = create_embedding_actor_proxy(file_system_actor_id)
    actor_state = await actor.get_state()

    # log(f"{embed_file_system.__name__} -> file_paths: {file_paths}")

    ####################################

    chunk_size = env.get_env_var("CHUNK_SIZE", DEFAULT_CHUNK_SIZE)
    chunk_overlap = env.get_env_var("CHUNK_OVERLAP", DEFAULT_CHUNK_OVERLAP)
    chunk_hash = {}

    chroma_client = ChromaHttpClientFactory.create_with_auth()

    embedding_function = create_embedding_function()

    text_splitter = RecursiveCharacterTextSplitter.from_tiktoken_encoder(
        chunk_size=chunk_size, chunk_overlap=chunk_overlap
    )
    vector_store = Chroma(
        embedding_function=embedding_function,
        client=chroma_client,
        collection_name=file_system_collection_name,
    )

    for file_path in file_paths:

        loader = TextLoader(file_path)
        docs = loader.load()

        page_content = docs[0].page_content
        hash = generate_sha256(page_content)

        if file_path in actor_state:
            if actor_state.get("file_path", {}).get("hash", None):
                log(f"{embed_file_system.__name__} SKIPPING -> {file_path} already embedded.")
                continue

        split_docs = text_splitter.split_documents(docs)
        split_texts = [doc.page_content for doc in split_docs]

        if not len(split_texts):
            continue

        embeddings = embedding_function.embed_documents(split_texts)
        ids = [f"{file_path}_{i}" for i in range(len(embeddings))]

        vector_store.add_documents(documents=split_docs, embeddings=embeddings, ids=ids)

        key = translate_file_path_to_key(file_path)

        if not actor_state.get("file_path", None):
            actor_state[key] = {}

        actor_state[key]["hash"] = hash
        await actor.set_state(actor_state)

    ####################################

    log(f"{embed_file_system.__name__} END.")
