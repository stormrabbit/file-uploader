// Playwright-based driver for file-uploader-desktop Electron app
// Runs on macOS without xvfb
import { _electron as electron } from 'playwright-core';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as readline from 'node:readline';

const APP_DIR = path.resolve(new URL(import.meta.url).pathname, '..', '..', '..');
const SHOT_DIR = process.env.SCREENSHOT_DIR || '/tmp/shots';
fs.mkdirSync(SHOT_DIR, { recursive: true });

const electronBin = path.join(APP_DIR, 'node_modules/electron/dist/Electron.app/Contents/MacOS/Electron');

let app = null;
let page = null;

const COMMANDS = {
  async launch() {
    if (app) return console.log('already launched');
    console.log('Launching Electron from:', APP_DIR);
    app = await electron.launch({
      executablePath: electronBin,
      args: [APP_DIR],
      timeout: 60_000,
    });
    // Wait for the app to start up (loading page first)
    page = await app.firstWindow();
    console.log('launched. windows:', app.windows().length);
    for (const w of app.windows()) console.log(' ', w.url());
  },

  async ss(name) {
    if (!page) return console.log('ERROR: launch first');
    const f = path.join(SHOT_DIR, (name || `ss-${Date.now()}`) + '.png');
    await page.screenshot({ path: f, fullPage: true });
    console.log('screenshot:', f);
  },

  async wait(sel) {
    if (!page) return console.log('ERROR: launch first');
    try {
      await page.waitForSelector(sel, { timeout: 35_000 });
      console.log('found:', sel);
    } catch {
      console.log('TIMEOUT:', sel);
    }
  },

  async text(sel) {
    if (!page) return console.log('ERROR: launch first');
    console.log(await page.evaluate(
      s => (s ? document.querySelector(s) : document.body)?.innerText ?? '(null)',
      sel || null));
  },

  async eval(expr) {
    if (!page) return console.log('ERROR: launch first');
    try { console.log(JSON.stringify(await page.evaluate(expr))); }
    catch (e) { console.log('ERROR:', e.message); }
  },

  async windows() {
    if (!app) return console.log('ERROR: launch first');
    for (const w of app.windows()) console.log(' url:', w.url());
  },

  async 'wait-fe'() {
    // Wait for the frontend to load (health check passes, page switches)
    if (!page) return console.log('ERROR: launch first');
    console.log('Waiting for frontend page (up to 35s)...');
    try {
      // The page URL will change from file:///loading.html to file:///pages/pc/index.html
      await page.waitForURL('**/pc/index.html', { timeout: 35_000 });
      console.log('Frontend loaded!', page.url());
    } catch {
      // Page may reload - try getting current page again
      page = app.windows().find(w => !w.url().includes('loading')) ?? page;
      console.log('Current URL:', page.url());
    }
  },

  async quit() {
    if (app) await app.close().catch(() => {});
    app = null;
    page = null;
  },

  help() {
    console.log('commands:', Object.keys(COMMANDS).join(', '));
  },
};

const stdin = fs.createReadStream(null, { fd: fs.openSync('/dev/stdin', 'r') });
const rl = readline.createInterface({ input: stdin, output: process.stdout, prompt: 'driver> ' });

rl.on('line', async line => {
  const [cmd, ...rest] = line.trim().split(/\s+/);
  if (!cmd) return rl.prompt();
  const fn = COMMANDS[cmd];
  if (!fn) { console.log('unknown:', cmd, '— try: help'); return rl.prompt(); }
  try { await fn(rest.join(' ')); } catch (e) { console.log('ERROR:', e.message); }
  if (cmd === 'quit') { rl.close(); process.exit(0); }
  rl.prompt();
});
rl.on('close', async () => { await COMMANDS.quit(); process.exit(0); });

console.log('file-uploader-desktop driver — "help" for commands, "launch" to start');
rl.prompt();
