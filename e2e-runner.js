/**
 * E2E test runner script that handles server startup
 * and graceful shutdown regardless of test outcome
 */
const { spawn, spawnSync, execSync } = require('child_process');
const tcpPortUsed = require('tcp-port-used');
const { killServer } = require('./kill-server');
const path = require('path');
const fs = require('fs');
const os = require('os');

const PORT = 8080;
const DEBUG_MODE = process.argv.includes('--debug');
let serverProcess;
let cleanupExecuted = false;
let playwrightPIDs = [];

// PID file to track process IDs
const PID_FILE = path.join(__dirname, '.e2e-server-pid');
const PLAYWRIGHT_PID_FILE = path.join(__dirname, '.playwright-pids');

function writeProcessInfo(process, file, description) {
  if (process && process.pid) {
    fs.writeFileSync(file, `${process.pid}`, 'utf8');
    console.log(`${description} PID ${process.pid} saved to ${file}`);
    return process.pid;
  }
  return null;
}

function recordPlaywrightPID(pid) {
  if (pid) {
    playwrightPIDs.push(pid);
    fs.writeFileSync(PLAYWRIGHT_PID_FILE, playwrightPIDs.join(','), 'utf8');
    console.log(`Playwright process ${pid} recorded`);
  }
}

function cleanup() {
  if (cleanupExecuted) return;
  cleanupExecuted = true;
  
  console.log('Cleaning up resources...');
  
  // Kill Playwright report server processes
  try {
    if (fs.existsSync(PLAYWRIGHT_PID_FILE)) {
      const pids = fs.readFileSync(PLAYWRIGHT_PID_FILE, 'utf8').split(',').filter(Boolean);
      console.log(`Found ${pids.length} Playwright PIDs to terminate`);
      
      pids.forEach(pid => {
        try {
          if (os.platform() === 'win32') {
            execSync(`taskkill /F /PID ${pid} /T`);
          } else {
            process.kill(parseInt(pid, 10), 'SIGKILL');
          }
          console.log(`Terminated Playwright process ${pid}`);
        } catch (e) {
          console.log(`Failed to terminate Playwright process ${pid}: ${e.message}`);
        }
      });
      
      fs.unlinkSync(PLAYWRIGHT_PID_FILE);
    }
  } catch (err) {
    console.error('Error cleaning up Playwright processes:', err);
  }
  
  // Force kill any other node processes that might be running our server
  killServer();
  
  // Clean up PID file
  if (fs.existsSync(PID_FILE)) {
    fs.unlinkSync(PID_FILE);
    console.log(`Server PID file removed`);
  }
  
  console.log('Cleanup completed');
  
  // On Windows, make sure we kill this process completely
  if (os.platform() === 'win32') {
    process.exit(0);
  }
}

// Set up proper signal handling with priority on SIGINT for Ctrl+C
process.on('SIGINT', () => {
  console.log('\nReceived SIGINT (Ctrl+C). Cleaning up...');
  cleanup();
  
  // Force exit after a short delay in case event loop is stuck
  setTimeout(() => {
    console.log('Forcing exit...');
    process.exit(0);
  }, 500);
});

process.on('SIGTERM', () => {
  console.log('Received SIGTERM. Cleaning up...');
  cleanup();
  process.exit(0);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
  cleanup();
  process.exit(1);
});

// Ensure cleanup on normal exit
process.on('exit', () => {
  cleanup();
});

async function waitForPort(port, timeout = 30000) {
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    const inUse = await tcpPortUsed.check(port, '127.0.0.1');
    if (inUse) return true;
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  throw new Error(`Timeout waiting for port ${port}`);
}

async function runTests() {
  try {
    // First ensure no previous instances are running
    cleanup();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check if the port is already in use
    const inUse = await tcpPortUsed.check(PORT, '127.0.0.1');
    if (inUse) {
      console.log(`Port ${PORT} is already in use. Attempting to free it...`);
      killServer();
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check again
      const stillInUse = await tcpPortUsed.check(PORT, '127.0.0.1');
      if (stillInUse) {
        console.error(`Port ${PORT} is still in use. Please close the application using this port.`);
        process.exit(1);
      }
    }

    // Delete previous playwright reports
    const reportPath = path.join(__dirname, 'playwright-report');
    if (fs.existsSync(reportPath)) {
      console.log('Removing previous Playwright reports...');
      fs.rmSync(reportPath, { recursive: true, force: true });
    }

    // Start server
    console.log('Starting server...');
    serverProcess = spawn('node', ['node_modules/live-server/live-server.js', 'src', '--port=8080', '--no-browser', '--quiet'], {
      shell: true,
      detached: false // Change to false to ensure it's terminated with the parent process
    });

    // Save the server PID
    writeProcessInfo(serverProcess, PID_FILE, 'Server');

    serverProcess.stdout.on('data', (data) => {
      console.log(`Server: ${data}`);
    });

    serverProcess.stderr.on('data', (data) => {
      console.error(`Server error: ${data}`);
    });
    
    serverProcess.on('exit', (code) => {
      console.log(`Server process exited with code ${code}`);
    });

    // Wait for the server to start
    console.log('Waiting for server to be ready...');
    await waitForPort(PORT);
    console.log('Server is ready');

    // Run Playwright tests with a wrapper to capture spawned PIDs
    console.log('Starting Playwright tests...');
    const isWindows = os.platform() === 'win32';
    
    // Run a detection command to find and record Playwright reporter PIDs
    let startPlaywright;
    
    if (isWindows) {
      // For Windows, use powershell to get a list of node processes before and after
      const beforeProcesses = execSync('powershell "Get-Process node | Select-Object Id"').toString();
      
      startPlaywright = () => {
        const testCommand = DEBUG_MODE ? 'npx playwright test --debug' : 'npx playwright test --workers=4';
        console.log(`Running command: ${testCommand}`);
        
        const testResult = spawnSync(testCommand, { shell: true, stdio: 'inherit' });
        
        // Find new processes
        const afterProcesses = execSync('powershell "Get-Process node | Select-Object Id"').toString();
        
        // Parse and find differences
        const beforePIDs = new Set(beforeProcesses.match(/\d+/g) || []);
        const afterPIDs = afterProcesses.match(/\d+/g) || [];
        
        for (const pid of afterPIDs) {
          if (!beforePIDs.has(pid) && pid !== process.pid.toString()) {
            console.log(`Detected new node process: ${pid}`);
            recordPlaywrightPID(pid);
          }
        }
        
        return testResult;
      };
    } else {
      // For Unix systems
      startPlaywright = () => {
        const testCommand = DEBUG_MODE ? 'npx playwright test --debug' : 'npx playwright test --workers=4';
        
        const testResult = spawnSync(testCommand, { shell: true, stdio: 'inherit' });
        
        // Try to find the HTML reporter process
        try {
          const psOutput = execSync('ps -eo pid,command | grep "playwright.*show-report"').toString();
          const reporterPIDs = psOutput.match(/^\s*(\d+)/gm);
          if (reporterPIDs) {
            reporterPIDs.forEach(pid => {
              if (pid && pid !== process.pid.toString()) {
                recordPlaywrightPID(pid.trim());
              }
            });
          }
        } catch (e) {
          console.log('Could not detect HTML reporter process');
        }
        
        return testResult;
      };
    }
    
    const testResult = startPlaywright();

    console.log(`Test process exited with code: ${testResult.status}`);
    
    // Clean up resources
    cleanup();
    
    // Exit with the same code as the test process
    process.exit(testResult.status || 0);
  } catch (error) {
    console.error('Error running tests:', error);
    cleanup();
    process.exit(1);
  }
}

// Check if there's a leftover PID file from a previous run
if (fs.existsSync(PID_FILE) || fs.existsSync(PLAYWRIGHT_PID_FILE)) {
  console.log('Found leftover PID files. Cleaning up previous instances...');
  cleanup();
}

// Create a wrapper batch file for Windows to handle Ctrl+C better
if (os.platform() === 'win32' && !process.env.RUNNING_IN_WRAPPER) {
  const wrapperPath = path.join(__dirname, 'run-tests.bat');
  
  // Create a special batch file that handles Ctrl+C better
  fs.writeFileSync(wrapperPath, `
@echo off
set RUNNING_IN_WRAPPER=1
node e2e-runner.js %*
if errorlevel 1 exit /b %errorlevel%
  `);
  
  console.log(`Created wrapper script at ${wrapperPath}`);
  
  // Execute the batch file instead of continuing with this process
  console.log('Executing tests via wrapper script for better process control...');
  const result = spawnSync(wrapperPath, process.argv.slice(2), { 
    shell: true, 
    stdio: 'inherit' 
  });
  process.exit(result.status || 0);
} else {
  // Only run the tests if we're inside the wrapper or not on Windows
  runTests();
}
