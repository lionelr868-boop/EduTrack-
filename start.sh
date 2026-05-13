#!/bin/bash
cd /home/z/my-project
while true; do
  echo "[$(date)] Starting Next.js dev server..."
  node node_modules/.bin/next dev -p 3000 2>&1 | tee -a /tmp/next-watchdog.log &
  SERVER_PID=$!
  
  # Wait for server to be ready
  sleep 8
  
  # Keep checking if server is alive
  while curl -s -o /dev/null http://localhost:3000/ --max-time 5 > /dev/null 2>&1; do
    sleep 10
  done
  
  echo "[$(date)] Server died, restarting..."
  kill $SERVER_PID 2>/dev/null
  sleep 2
done
