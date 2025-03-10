/**
 * This is a utility script that forcibly terminates all test-related processes
 * Use when tests get stuck or Ctrl+C doesn't work properly
 */
const { execSync } = require('child_process');
const { platform } = require('os');
const { killServer } = require('./kill-server');

try {
  console.log('Forcibly terminating all test-related processes...');
  
  // Kill server processes
  killServer();
  
  if (platform() === 'win32') {
    // Windows commands
    console.log('Terminating node processes related to Playwright...');
    execSync('taskkill /F /IM node.exe /FI "COMMANDLINE eq *playwright*" /T', { stdio: 'inherit' });
    execSync('taskkill /F /IM node.exe /FI "COMMANDLINE eq *live-server*" /T', { stdio: 'inherit' });
    
    // Kill Chrome instances launched by Playwright
    console.log('Terminating browser processes launched by Playwright...');
    execSync('taskkill /F /IM msedge.exe /FI "WINDOWTITLE eq *playwright*" /T', { stdio: 'inherit' });
    execSync('taskkill /F /IM chrome.exe /FI "WINDOWTITLE eq *playwright*" /T', { stdio: 'inherit' });
  } else {
    // Unix-based commands
    execSync("pkill -f 'node.*playwright'", { stdio: 'inherit' });
    execSync("pkill -f 'chrome.*playwright'", { stdio: 'inherit' });
    execSync("pkill -f 'firefox.*playwright'", { stdio: 'inherit' });
    execSync("pkill -f 'webkit.*playwright'", { stdio: 'inherit' });
  }
  
  console.log('All processes should be terminated.');
} catch (error) {
  console.log('Some processes may have already been terminated.');
}
