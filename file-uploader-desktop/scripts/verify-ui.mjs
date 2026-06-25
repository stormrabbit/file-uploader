// Non-REPL verification script: launch app, take screenshots, verify key states
import { _electron as electron } from 'playwright-core';
import * as fs from 'node:fs';
import * as path from 'node:path';

const APP_DIR = path.resolve(new URL(import.meta.url).pathname, '..', '..');
const SHOT_DIR = '/tmp/shots';
fs.mkdirSync(SHOT_DIR, { recursive: true });

const electronBin = path.join(APP_DIR, 'node_modules/electron/dist/Electron.app/Contents/MacOS/Electron');

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  console.log('Launching app...');
  const app = await electron.launch({
    executablePath: electronBin,
    args: [APP_DIR],
    timeout: 60_000,
  });

  const win = await app.firstWindow();
  console.log('Window opened. URL:', win.url());

  // Screenshot 1: loading page
  await sleep(1500);
  await win.screenshot({ path: path.join(SHOT_DIR, '01-loading.png') });
  console.log('Screenshot 01-loading.png taken');

  // Wait for frontend to load (health check passes → page switches)
  console.log('Waiting for frontend page switch (up to 35s)...');
  try {
    await win.waitForURL('**/pc/index.html', { timeout: 35_000 });
    console.log('✓ Frontend loaded:', win.url());
  } catch {
    // Try finding updated window
    const wins = app.windows();
    console.log('All windows:', wins.map(w => w.url()));
  }

  // Screenshot 2: frontend page
  await sleep(2000);
  const activePage = app.windows().find(w => w.url().includes('pc/index')) ?? win;
  await activePage.screenshot({ path: path.join(SHOT_DIR, '02-frontend.png') });
  console.log('Screenshot 02-frontend.png taken');

  // Check body text
  const bodyText = await activePage.evaluate(() => document.body?.innerText?.slice(0, 300));
  console.log('Page text sample:', bodyText);

  // Screenshot 3: take one more after settling
  await sleep(1000);
  await activePage.screenshot({ path: path.join(SHOT_DIR, '03-settled.png') });
  console.log('Screenshot 03-settled.png taken');

  await app.close();
  console.log('App closed.');
}

main().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
