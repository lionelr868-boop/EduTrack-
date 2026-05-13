#!/bin/bash
while true; do
  if ! curl -s -o /dev/null http://localhost:3000/ --max-time 5 2>/dev/null; then
    echo "[$(date)] Server down, restarting..." >> /tmp/keep-alive.log
    pkill -f "next dev" 2>/dev/null
    pkill -f "next-server" 2>/dev/null
    sleep 3
    cd /home/z/my-project && NODE_OPTIONS="--max-old-space-size=384" node node_modules/.bin/next dev -p 3000 >> /tmp/keep-alive.log 2>&1 &
    # Wait for server to be ready
    for i in $(seq 1 20); do
      if curl -s -o /dev/null http://localhost:3000/ --max-time 2 2>/dev/null; then
        echo "[$(date)] Server is ready!" >> /tmp/keep-alive.log
        break
      fi
      sleep 1
    done
  fi
  sleep 10
done
