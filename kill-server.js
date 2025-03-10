const { exec } = require('child_process');
const { platform } = require('os');

// Get a more specific command to target only our live-server processes
const isWindows = platform() === 'win32';

function killServer() {
  const commands = [];
  
  if (isWindows) {
    // Windows-specific commands with more precise targeting
    commands.push('taskkill /F /FI "WINDOWTITLE eq live-server*" /T');
    commands.push('taskkill /F /FI "IMAGENAME eq node.exe" /FI "COMMANDLINE eq *live-server*" /T');
    commands.push('taskkill /F /FI "IMAGENAME eq node.exe" /FI "COMMANDLINE eq *localhost:8080*" /T');
  } else {
    // Unix-based commands
    commands.push("pkill -f 'live-server --port=8080'");
    commands.push("pkill -f 'node.*live-server'");
  }

  console.log('Attempting to kill server processes...');
  
  // Execute each command in sequence
  let completedCommands = 0;
  commands.forEach(command => {
    exec(command, (error, stdout, stderr) => {
      if (!error || (error && error.code === 128)) {
        console.log(`Command executed: ${command}`);
        if (stdout) console.log(`Output: ${stdout.trim()}`);
      } else {
        console.log(`Command may have failed: ${command}`);
        if (stderr) console.log(`Error: ${stderr.trim()}`);
      }
      
      completedCommands++;
      if (completedCommands === commands.length) {
        console.log('Server shutdown completed');
      }
    });
  });
}

// Run immediately when script is called directly
if (require.main === module) {
  killServer();
}

// Also export for programmatic use
module.exports = { killServer };
