// // const execSync = require('child_process').execSync;
const { spawn, spawnSync } = require('node:child_process');
var waitOn = require('wait-on');

// // const arg = process.argv[2] || 'dv'; // Default value `dv` if no args provided via CLI.
const args = process.argv.slice(2);

// // execSync('dev:electron-react ' + arg, {stdio: 'inherit'});
// // execSync('npm run format', {stdio:[0, 1, 2]});

// devElectron.
console.log('dev:electron:webpack');
const devElectronWebpack = spawnSync('npm', ['run', 'dev:electron:webpack', ...args], {stdio: 'inherit', shell: true});
console.log(devElectronWebpack.status);
if(devElectronWebpack.status != 0) {
    process.exit(devElectronWebpack.status);
}

console.log('dev:electron-react');
const devElectronRect = spawn('npm', ['run', 'dev:electron-react', ...args], {stdio: 'inherit', shell: true});

console.log('start:electron');
// const devElectron = spawn('npm', ['run', 'start:electron'], {stdio: 'inherit'});
spawnSync('npm', ['run', 'start:electron'], {stdio: 'inherit', shell: true});

process.kill(devElectronRect.pid);

while(devElectronRect.status == null) {
    // nothing
}

// while(devElectronRect.exitCode === null && devElectron.exitCode === null) {
//     // console.log('devElectronRect.exitCode', devElectronRect.exitCode);
//     // console.log('devElectron.exitCode', devElectron.exitCode);
// }
