'use strict';

const path = require('path');
const fs = require('fs');
const http = require('http');
const { fork, spawnSync } = require('child_process');
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const { startStaticServer } = require('./static-server');

const RESOURCES = app.isPackaged
  ? path.join(process.resourcesPath, 'resources')
  : path.join(__dirname, '..', 'resources');
const SERVER_MAIN = path.join(RESOURCES, 'server', 'dist', 'main.js');
const SERVER_NODE_MODULES = path.join(RESOURCES, 'server', 'node_modules');
const SERVER_PRISMA_BIN = path.join(SERVER_NODE_MODULES, 'prisma', 'build', 'index.js');
const WEB_ROOT = path.join(RESOURCES, 'web');
const WEB_INDEX = path.join(WEB_ROOT, 'pages', 'pc', 'index.html');
const LOADING_HTML = path.join(__dirname, 'loading.html');
const ERROR_HTML = path.join(__dirname, 'error.html');

// 后端 API 端口；前端页面对外服务端口（与前端 .env 的 FRONTEND_PORT 一致，供局域网/手机访问）
const BACKEND_PORT = 38902;
const FRONTEND_PORT = 38903;

let serverProcess = null;
let webServer = null;
let win = null;
let serverReady = false;

// ─── helpers ────────────────────────────────────────────────────────────────

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function getUserDataPath() {
  return app.getPath('userData');
}

function readConfig(userData) {
  const configPath = path.join(userData, 'config.json');
  try {
    return JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch {
    return {};
  }
}

function runMigrate(userData) {
  const dbUrl = `file:${path.join(userData, 'data.db')}`;
  // 打包后的 .app 启动时 PATH 不含 node，spawn('node') 会 ENOENT。
  // Electron 自身可执行文件加 ELECTRON_RUN_AS_NODE=1 等价于一个 node。
  const result = spawnSync(process.execPath, [SERVER_PRISMA_BIN, 'migrate', 'deploy'], {
    cwd: path.join(RESOURCES, 'server'),
    env: {
      ...process.env,
      ELECTRON_RUN_AS_NODE: '1',
      DATABASE_URL: dbUrl,
      PRISMA_QUERY_ENGINE_LIBRARY: '',
    },
    stdio: 'pipe',
    encoding: 'utf8',
  });
  const success = result.status === 0;
  const parts = [
    result.error ? `spawn error: ${result.error.code || ''} ${result.error.message}` : '',
    `status=${result.status} signal=${result.signal || ''}`,
    `cmd=${process.execPath} ${SERVER_PRISMA_BIN}`,
    result.stdout ? `stdout: ${result.stdout}` : '',
    result.stderr ? `stderr: ${result.stderr}` : '',
  ].filter(Boolean);
  return { success, stderr: parts.join('\n') };
}

function checkHealth() {
  return new Promise((resolve, reject) => {
    const req = http.get(`http://127.0.0.1:${BACKEND_PORT}/health`, (res) => {
      if (res.statusCode === 200) {
        res.resume();
        resolve();
      } else {
        res.resume();
        reject(new Error(`status ${res.statusCode}`));
      }
    });
    req.on('error', reject);
    req.setTimeout(1000, () => {
      req.destroy();
      reject(new Error('request timeout'));
    });
  });
}

function pollHealth(timeoutMs) {
  return new Promise((resolve, reject) => {
    const deadline = Date.now() + timeoutMs;
    let cancelled = false;

    function attempt() {
      if (cancelled) return;
      checkHealth()
        .then(resolve)
        .catch(() => {
          if (Date.now() >= deadline) {
            reject(new Error('timeout'));
          } else {
            setTimeout(attempt, 500);
          }
        });
    }

    attempt();
    return () => { cancelled = true; };
  });
}

function loadErrorPage(title, detail, logPath) {
  if (!win) return;
  let html = '';
  try {
    html = fs.readFileSync(ERROR_HTML, 'utf8');
  } catch {
    html = `<html><body><h1>${title}</h1><p>${detail}</p><p>Log: ${logPath}</p></body></html>`;
  }
  html = html
    .replace('{{TITLE}}', escapeHtml(title))
    .replace('{{DETAIL}}', escapeHtml(detail))
    .replace('{{LOG_PATH}}', escapeHtml(logPath));
  win.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html));
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  win.loadFile(LOADING_HTML);
  win.on('closed', () => { win = null; });
  return win;
}

// 启动对外的前端静态服务（绑定 0.0.0.0），供局域网设备访问页面。
async function startWebServer(logPath) {
  try {
    webServer = await startStaticServer({
      webRoot: WEB_ROOT,
      port: FRONTEND_PORT,
      host: '0.0.0.0',
    });
    fs.appendFileSync(
      logPath,
      `[web] static server listening on 0.0.0.0:${FRONTEND_PORT}\n`
    );
  } catch (err) {
    fs.appendFileSync(
      logPath,
      `[web] failed to start static server on ${FRONTEND_PORT}: ${err.message}\n`
    );
  }
}

// ─── main startup flow ───────────────────────────────────────────────────────

async function startApp() {
  const userData = getUserDataPath();
  const logDir = path.join(userData, 'logs');
  const logPath = path.join(logDir, 'server.log');
  const dbPath = path.join(userData, 'data.db');

  ensureDir(logDir);

  // 启动对外的前端静态服务（局域网可访问），供手机扫码打开 /mobile 页面。
  // 失败不应阻断主流程，仅记录日志。若已启动则跳过，避免重复监听同端口。
  if (!webServer) {
    await startWebServer(logPath);
  }

  // 后端已就绪且窗口存在时，直接加载页面（macOS 关闭窗口后重新激活的场景）。
  if (serverReady && win) {
    win.loadFile(WEB_INDEX);
    return;
  }

  // Prisma migrate on first launch
  if (!fs.existsSync(dbPath)) {
    if (!fs.existsSync(SERVER_PRISMA_BIN)) {
      loadErrorPage(
        'Resources not built',
        'Run "npm run build" before starting the app.',
        logPath
      );
      return;
    }
    const { success, stderr } = runMigrate(userData);
    if (!success) {
      loadErrorPage('Database migration failed', stderr || 'Unknown error', logPath);
      return;
    }
  }

  if (!fs.existsSync(SERVER_MAIN)) {
    loadErrorPage(
      'Server not built',
      `Could not find ${SERVER_MAIN}\nRun "npm run build" first.`,
      logPath
    );
    return;
  }

  const dbUrl = `file:${dbPath}`;
  const config = readConfig(userData);

  // 后端进程未在运行才启动；macOS 关闭窗口后应用仍在后台，进程会保留。
  if (!serverProcess) {
    // Open log file (append)
    const logStream = fs.createWriteStream(logPath, { flags: 'a' });
    logStream.write(`\n--- App started ${new Date().toISOString()} ---\n`);

    serverProcess = fork(SERVER_MAIN, [], {
      silent: true,
      env: {
        ...process.env,
        DATA_DIR: userData,
        DATABASE_URL: dbUrl,
        PORT: String(BACKEND_PORT),
        NODE_PATH: SERVER_NODE_MODULES,
        ...(config.storageDir ? { STORAGE_DIR: config.storageDir } : {}),
      },
    });

    serverProcess.stdout.pipe(logStream);
    serverProcess.stderr.pipe(logStream);

    serverProcess.on('exit', (code) => {
      if (!serverReady) {
        loadErrorPage(
          'Server failed to start',
          `Server process exited with code ${code}.`,
          logPath
        );
      }
      serverProcess = null;
      serverReady = false;
    });
  }

  try {
    await pollHealth(30000);
    serverReady = true;
    if (win) {
      win.loadFile(WEB_INDEX);
    }
  } catch (err) {
    if (!serverReady) {
      loadErrorPage(
        'Server did not become ready',
        err.message === 'timeout'
          ? 'Health check timed out after 30 seconds.'
          : String(err),
        logPath
      );
    }
  }
}

// ─── app lifecycle ───────────────────────────────────────────────────────────

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  ipcMain.handle('select-folder', async () => {
    const result = await dialog.showOpenDialog({ properties: ['openDirectory'] });
    return result.canceled ? null : result.filePaths[0];
  });
  app.whenReady().then(() => {
    createWindow();
    startApp();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
      // macOS 关闭窗口后应用仍在后台，重新打开时需重新走启动流程加载页面。
      startApp();
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  app.on('before-quit', () => {
    if (serverProcess) {
      serverProcess.kill();
      serverProcess = null;
    }
    if (webServer) {
      webServer.close();
      webServer = null;
    }
  });
}
