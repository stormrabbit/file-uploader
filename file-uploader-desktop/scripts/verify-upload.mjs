// Upload verification: launch app, wait for frontend, try uploading a file via API, screenshot
import { _electron as electron } from 'playwright-core';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as http from 'node:http';

const APP_DIR = path.resolve(new URL(import.meta.url).pathname, '..', '..');
const SHOT_DIR = '/tmp/shots';
fs.mkdirSync(SHOT_DIR, { recursive: true });
const electronBin = path.join(APP_DIR, 'node_modules/electron/dist/Electron.app/Contents/MacOS/Electron');

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function httpGet(url) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, res => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => resolve({ status: res.statusCode, body }));
    });
    req.on('error', reject);
    req.setTimeout(5000, () => { req.destroy(); reject(new Error('timeout')); });
  });
}

async function main() {
  console.log('Launching app...');
  const app = await electron.launch({
    executablePath: electronBin,
    args: [APP_DIR],
    timeout: 60_000,
  });

  const win = await app.firstWindow();
  console.log('Window opened:', win.url());

  // Wait for frontend
  console.log('Waiting for frontend (up to 35s)...');
  try {
    await win.waitForURL('**/pc/index.html', { timeout: 35_000 });
    console.log('✓ Frontend loaded:', win.url());
  } catch (e) {
    console.log('Page URL:', win.url());
  }

  await sleep(2000);
  await win.screenshot({ path: path.join(SHOT_DIR, '04-before-upload.png') });
  console.log('Screenshot 04-before-upload.png');

  // Verify server is reachable
  try {
    const health = await httpGet('http://127.0.0.1:38902/health');
    console.log('✓ Health check:', health.status, health.body.slice(0, 80));
  } catch (e) {
    console.log('✗ Health check failed:', e.message);
  }

  // Upload a test file via the API directly (multipart/form-data using curl)
  const { execSync } = await import('child_process');
  const testFile = '/tmp/test-upload.txt';
  fs.writeFileSync(testFile, 'Hello from desktop e2e test ' + new Date().toISOString());
  try {
    const result = execSync(
      `curl -s -X POST http://127.0.0.1:38902/files/upload -F "file=@${testFile}"`,
      { encoding: 'utf8', timeout: 10000 }
    );
    console.log('✓ Upload response:', result.slice(0, 200));
  } catch (e) {
    console.log('✗ Upload failed:', e.message);
  }

  await sleep(1500);

  // Reload the page to see the uploaded file
  await win.reload();
  await sleep(2000);
  await win.screenshot({ path: path.join(SHOT_DIR, '05-after-upload.png') });
  console.log('Screenshot 05-after-upload.png');

  const bodyText = await win.evaluate(() => document.body?.innerText?.slice(0, 500));
  console.log('Page text after upload:', bodyText);

  await app.close();
  console.log('App closed.');

  // Verify port released
  await sleep(1000);
  try {
    const { execSync } = await import('child_process');
    const lsof = execSync('lsof -ti :38902 2>/dev/null || echo ""', { encoding: 'utf8' }).trim();
    if (lsof) {
      console.log('✗ Port 38902 still in use by PID:', lsof);
    } else {
      console.log('✓ Port 38902 released after quit');
    }
  } catch { console.log('✓ Port 38902 released'); }

  // Verify server log
  const logPath = `${process.env.HOME}/Library/Application Support/FileUploader/logs/server.log`;
  if (fs.existsSync(logPath)) {
    const logTail = fs.readFileSync(logPath, 'utf8').slice(-300);
    console.log('✓ server.log exists. Tail:\n', logTail);
  } else {
    console.log('✗ server.log not found at:', logPath);
  }
}

main().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
