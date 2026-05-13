const { spawn } = require('child_process');
const http = require('http');

let currentServer = null;
let restartCount = 0;

function startServer() {
  restartCount++;
  console.log(`[${new Date().toISOString()}] Starting Next.js dev server (attempt #${restartCount})...`);
  
  currentServer = spawn('node', ['node_modules/.bin/next', 'dev', '-p', '3000'], {
    cwd: '/home/z/my-project',
    env: { ...process.env, NODE_OPTIONS: '--max-old-space-size=384' },
    stdio: ['ignore', 'pipe', 'pipe']
  });

  currentServer.stdout.on('data', (data) => {
    process.stdout.write(data);
  });

  currentServer.stderr.on('data', (data) => {
    process.stderr.write(data);
  });

  currentServer.on('exit', (code, signal) => {
    console.log(`[${new Date().toISOString()}] Server exited (code=${code}, signal=${signal}), restarting in 3s...`);
    currentServer = null;
    setTimeout(startServer, 3000);
  });

  currentServer.on('error', (err) => {
    console.error(`[${new Date().toISOString()}] Server error:`, err.message);
    currentServer = null;
    setTimeout(startServer, 3000);
  });
}

startServer();

// Health check every 20 seconds - restart if dead
setInterval(() => {
  const req = http.get('http://localhost:3000/', { timeout: 5000 }, (res) => {
    res.resume(); // drain response
    console.log(`[${new Date().toISOString()}] ✓ Health: HTTP ${res.statusCode}`);
  });
  
  req.on('error', (err) => {
    console.log(`[${new Date().toISOString()}] ✗ Health FAILED: ${err.message}`);
    if (currentServer) {
      console.log(`[${new Date().toISOString()}] Force-killing unresponsive server...`);
      try { currentServer.kill('SIGKILL'); } catch(e) {}
      currentServer = null;
    }
  });
  
  req.on('timeout', () => {
    req.destroy();
    console.log(`[${new Date().toISOString()}] ✗ Health TIMEOUT`);
    if (currentServer) {
      try { currentServer.kill('SIGKILL'); } catch(e) {}
      currentServer = null;
    }
  });
}, 20000);

// Graceful shutdown
process.on('SIGTERM', () => { if (currentServer) currentServer.kill(); process.exit(0); });
process.on('SIGINT', () => { if (currentServer) currentServer.kill(); process.exit(0); });
