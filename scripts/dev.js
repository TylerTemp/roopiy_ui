// // const execSync = require('child_process').execSync;
const { spawn, spawnSync } = require('node:child_process');

// // const arg = process.argv[2] || 'dv'; // Default value `dv` if no args provided via CLI.
const args = process.argv.slice(2);

// // execSync('dev:electron-react ' + arg, {stdio: 'inherit'});
// // execSync('npm run format', {stdio:[0, 1, 2]});

// devElectron.
console.log('dev:electron:webpack');
spawnSync('npm', ['run', 'dev:electron:webpack', ...args], {stdio: 'inherit'});

console.log('dev:electron-react');
const devElectronRect = spawn('npm', ['run', 'dev:electron-react', ...args], {stdio: 'inherit'});

console.log('start:electron');
const devElectron = spawn('npm', ['run', 'start:electron'], {stdio: 'inherit'});

while(devElectronRect.exitCode === null && devElectron.exitCode === null) {
    // console.log('devElectronRect.exitCode', devElectronRect.exitCode);
    // console.log('devElectron.exitCode', devElectron.exitCode);
}
