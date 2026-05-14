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
  
  NODE_OPTIONS='--max-old-space-size=1536' node node_modules/.bin/next dev -p 3000 &
  SERVER_PID=$!
  
  # Wait for server to be ready
  echo "[DEV] Waiting for server to be ready..."
  for i in $(seq 1 30); do
    if curl -s -o /dev/null http://localhost:3000/ --max-time 2 2>/dev/null; then
      echo "[DEV] Server is ready! (PID: $SERVER_PID)"
      break
    fi
    sleep 1
  done
  
  # Wait for the server process to exit
  wait $SERVER_PID 2>/dev/null
  EXIT_CODE=$?
  
  echo "[DEV] Server exited with code $EXIT_CODE. Restarting in 3 seconds..."
  sleep 3
  
  # Clean up any zombie processes
  pkill -f "next-server" 2>/dev/null || true
  sleep 1
done
