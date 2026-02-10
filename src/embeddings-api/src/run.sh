dapr run --app-id cossessor-embeddings-api \
    --placement-host-address localhost:50006 \
    --resources-path ../../dapr/components.localhost/ \
    --config ../../dapr/configuration/config.yaml \
    --app-port 6002 \
    -- python3 -m uvicorn app:app --host localhost --port 6002 --reload
