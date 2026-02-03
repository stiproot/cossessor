# import chromadb
# from chromadb.config import Settings
from cossessor_core.core.utls import ChromaHttpClientFactory

# client = chromadb.HttpClient(
#     host="localhost", port=8000, settings=Settings(allow_reset=True)
# )

client = ChromaHttpClientFactory.create_with_auth()

client.reset()
