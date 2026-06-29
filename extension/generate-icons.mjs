/**
 * Generates Plumbum extension icons and logo assets by executing the Python helper.
 */
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function run() {
  const scriptPath = path.join(__dirname, 'generate-icons.py');
  
  // Try running with 'python'
  try {
    execSync(`python "${scriptPath}"`, { stdio: 'inherit' });
    return;
  } catch (err) {
    // If 'python' fails, try 'python3'
  }
  
  try {
    execSync(`python3 "${scriptPath}"`, { stdio: 'inherit' });
    return;
  } catch (err) {
    console.error('Error: Could not execute Python script. Please ensure Python is installed and added to your PATH.');
    process.exit(1);
  }
}

run();
