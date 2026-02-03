#!/bin/sh
set -e

# Ensure Nginx directories have correct permissions
mkdir -p /var/lib/nginx/tmp/client_body /var/lib/nginx/tmp/proxy /var/lib/nginx/tmp/fastcgi \
    /var/lib/nginx/tmp/uwsgi /var/lib/nginx/tmp/scgi /var/lib/nginx/logs

# Start Bun app in background
bun run dist/server.js &
BUN_PID=$!

# Verify Bun process started successfully
sleep 1
if ! kill -0 $BUN_PID 2>/dev/null; then
    echo "ERROR: Bun app failed to start" >&2
    exit 1
fi

# Wait for app to be ready
# Poll health endpoint until ready (max 30s)
READY=0
for i in $(seq 1 60); do
    if curl -sf http://localhost:3000/health > /dev/null; then
        READY=1
        break
    fi
    sleep 0.5
done

if [ "$READY" -eq 0 ]; then
    echo "ERROR: Bun app did not become ready in time." >&2
    kill $BUN_PID 2>/dev/null || true
    exit 1
fi

echo "Bun app started successfully (PID: $BUN_PID)"

# Start Nginx in foreground
exec nginx -g 'daemon off;'
