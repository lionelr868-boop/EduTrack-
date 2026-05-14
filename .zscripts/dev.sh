#!/bin/bash
# EduTrack dev script with auto-restart watchdog
cd /home/z/my-project

# Install deps if needed
if [ ! -d "node_modules" ]; then
  echo "[DEV] Installing dependencies..."
  bun install
fi

# Setup database if needed
if [ ! -f "db/custom.db" ] || [ ! -s "db/custom.db" ]; then
  echo "[DEV] Setting up database..."
  bun run db:push
fi

# Generate Prisma client
bun run db:generate 2>/dev/null || true

echo "[DEV] Starting EduTrack with auto-restart..."

# Watchdog loop - restart server if it dies
RESTART_COUNT=0
while true; do
  RESTART_COUNT=$((RESTART_COUNT + 1))
  echo "[DEV] Starting Next.js dev server (attempt #$RESTART_COUNT)..."

  NODE_OPTIONS='--max-old-space-size=1536' node node_modules/.bin/next dev -p 3000 --webpack 2>&1 &
  SERVER_PID=$!

  # Wait for server to be ready (up to 60 seconds)
  echo "[DEV] Waiting for server to be ready..."
  READY=0
  for i in $(seq 1 60); do
    if curl -s -o /dev/null http://localhost:3000/ --max-time 3 2>/dev/null; then
      echo "[DEV] Server is ready! (PID: $SERVER_PID)"
      READY=1
      break
    fi
    # Check if server process is still alive
    if ! kill -0 $SERVER_PID 2>/dev/null; then
      echo "[DEV] Server process died during startup"
      break
    fi
    sleep 1
  done

  if [ $READY -eq 0 ]; then
    echo "[DEV] Server failed to become ready"
  fi

  # Wait for the server process to exit
  wait $SERVER_PID 2>/dev/null
  EXIT_CODE=$?

  echo "[DEV] Server exited with code $EXIT_CODE. Restarting in 5 seconds..."
  sleep 5

  # Clean up any zombie processes on port 3000
  fuser -k 3000/tcp 2>/dev/null || true
  pkill -9 -f "next-server" 2>/dev/null || true
  pkill -9 -f "next dev" 2>/dev/null || true
  sleep 2
done
