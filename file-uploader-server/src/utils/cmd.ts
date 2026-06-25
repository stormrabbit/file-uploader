// const { spawn } = require('child_process');
import child_process = require('child_process');
const spawn = child_process.spawn;

export const exec = (cmdStr) => {
  const cmd = spawn(cmdStr);
  cmd.stdout.on('data', (data) => {
    console.log(`stdout: ${data}`);
  });
  cmd.stderr.on('data', (data) => {
    console.error(`stderr: ${data}`);
  });
  cmd.on('close', (code) => {
    console.log(`child process exited with code ${code}`);
  });
};
// const ls = spawn('ls', ['-lh', '/usr']);

// ls.stdout.on('data', (data) => {
//   console.log(`stdout: ${data}`);
// });

// ls.stderr.on('data', (data) => {
//   console.error(`stderr: ${data}`);
// });

// ls.on('close', (code) => {
//   console.log(`child process exited with code ${code}`);
// });
