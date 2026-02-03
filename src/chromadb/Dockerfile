FROM chromadb/chroma:0.5.16

ENV ALLOW_RESET=True \
    IS_PERSISTENT=True \
    CHROMA_SERVER_AUTHN_CREDENTIALS_FILE=/chroma/server.htpasswd \
    CHROMA_SERVER_AUTHN_PROVIDER=chromadb.auth.basic_authn.BasicAuthenticationServerProvider

EXPOSE 8000

COPY ./server.htpasswd /chroma/server.htpasswd

CMD ["--workers", "1", \
     "--host", "0.0.0.0", \
     "--port", "8000", \
     "--proxy-headers", \
     "--log-config", "chromadb/log_config.yml", \
     "--timeout-keep-alive", "30"]
