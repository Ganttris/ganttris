/**
 * Simplified E2E test runner that avoids using a batch wrapper
 */
const { spawn, spawnSync } = require('child_process');
const { killServer } = require('./kill-server');

// Kill any existing processes first
killServer();

// Start the server
console.log('Starting server directly...');
const serverProcess = spawn('node', ['node_modules/live-server/live-server.js', 'src', '--port=8080', '--no-browser', '--quiet'], {
  shell: true,
  stdio: 'inherit'
});

// Give the server a moment to start
console.log('Waiting for server to initialize...');
setTimeout(() => {
  console.log('Running Playwright tests...');
  
  // Run the tests
  const isDebugMode = process.argv.includes('--debug');
  const testCommand = isDebugMode ? 'npx playwright test --debug' : 'npx playwright test';
  
  const testResult = spawnSync(testCommand, { 
    shell: true, 
    stdio: 'inherit' 
  });
  
  // Shut down the server
  console.log('Tests completed, shutting down server...');
  killServer();
  serverProcess.kill();
  
  // Exit with the test result code
  process.exit(testResult.status || 0);
}, 3000);

// Handle interruptions
process.on('SIGINT', () => {
  console.log('\nProcess interrupted. Cleaning up...');
  killServer();
  if (serverProcess) {
    serverProcess.kill();
  }
  process.exit(1);
});
