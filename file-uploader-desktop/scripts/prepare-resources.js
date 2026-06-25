'use strict';

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const serverDir = path.join(root, '..', 'file-uploader-server');
const feDir = path.join(root, '..', 'file-uploader-fe');
const resourcesServerDir = path.join(root, 'resources', 'server');
const resourcesWebDir = path.join(root, 'resources', 'web');

function checkPreconditions() {
  const missing = [];
  if (!fs.existsSync(serverDir)) missing.push(serverDir);
  if (!fs.existsSync(feDir)) missing.push(feDir);
  if (missing.length > 0) {
    console.error('[prepare-resources] ERROR: required sibling repos not found:');
    missing.forEach(p => console.error(`  - ${p}`));
    console.error('  Ensure file-uploader-server and file-uploader-fe are siblings of file-uploader-desktop.');
    process.exit(1);
  }
}

function buildServer() {
  console.log('\n[prepare-resources] Building server...');
  execSync('npm run build', { cwd: serverDir, stdio: 'inherit' });
  console.log('[prepare-resources] Server build complete.');
}

function buildFrontend() {
  console.log('\n[prepare-resources] Building frontend (VITE_API_BASE_URL=http://127.0.0.1:38902/)...');
  execSync('npm run build', {
    cwd: feDir,
    stdio: 'inherit',
    env: { ...process.env, VITE_API_BASE_URL: 'http://127.0.0.1:38902/' },
  });
  console.log('[prepare-resources] Frontend build complete.');
}

function pruneServerDeps() {
  console.log('\n[prepare-resources] Pruning server devDependencies (npm ci --omit=dev)...');
  execSync('npm ci --omit=dev', { cwd: serverDir, stdio: 'inherit' });
  console.log('[prepare-resources] Server devDependencies pruned.');
}

function restoreServerDeps() {
  console.log('\n[prepare-resources] Restoring server devDependencies (npm install)...');
  execSync('npm install', { cwd: serverDir, stdio: 'inherit' });
  console.log('[prepare-resources] Server devDependencies restored.');
}

function copyServer() {
  console.log('\n[prepare-resources] Copying server resources...');
  if (fs.existsSync(resourcesServerDir)) {
    fs.rmSync(resourcesServerDir, { recursive: true, force: true });
  }
  fs.mkdirSync(resourcesServerDir, { recursive: true });

  for (const dir of ['dist', 'node_modules', 'prisma']) {
    const src = path.join(serverDir, dir);
    if (fs.existsSync(src)) {
      // dereference: true 摊平相对软链（主要是 .bin/ 下的 shim）。
      // 默认行为会把相对软链改写成构建机的绝对路径，包到别的机器上断链。
      fs.cpSync(src, path.join(resourcesServerDir, dir), { recursive: true, dereference: true });
    } else {
      console.warn(`[prepare-resources] WARNING: ${src} not found, skipping.`);
    }
  }
  console.log('[prepare-resources] Server resources copied to resources/server/');
}

function copyFrontend() {
  console.log('\n[prepare-resources] Copying frontend resources...');
  if (fs.existsSync(resourcesWebDir)) {
    fs.rmSync(resourcesWebDir, { recursive: true, force: true });
  }
  fs.mkdirSync(resourcesWebDir, { recursive: true });

  const feDist = path.join(feDir, 'dist');
  if (!fs.existsSync(feDist)) {
    console.error(`[prepare-resources] ERROR: frontend dist not found at ${feDist}`);
    process.exit(1);
  }
  fs.cpSync(feDist, resourcesWebDir, { recursive: true });
  console.log('[prepare-resources] Frontend resources copied to resources/web/');
  fixHtmlAssetPaths();
}

// Vite builds with absolute paths (/assets/...) which break under file:// protocol.
// Rewrite paths in every page's index.html to be relative to its own location.
function fixHtmlAssetPaths() {
  const pagesDir = path.join(resourcesWebDir, 'pages');
  if (!fs.existsSync(pagesDir)) return;

  const pages = fs.readdirSync(pagesDir);
  for (const page of pages) {
    const htmlPath = path.join(pagesDir, page, 'index.html');
    if (!fs.existsSync(htmlPath)) continue;

    let html = fs.readFileSync(htmlPath, 'utf8');
    // pages/<page>/index.html → assets are at ../../assets/
    html = html.replace(/(href|src)="\/assets\//g, '$1="../../assets/');
    html = html.replace(/(href|src)="\/favicon\.ico"/g, '$1="../../favicon.ico"');
    // Remove crossorigin attribute: file:// protocol has no CORS headers,
    // so crossorigin on <script type="module"> / <link rel="modulepreload"> blocks loading.
    html = html.replace(/\s+crossorigin/g, '');
    fs.writeFileSync(htmlPath, html);
    console.log(`[prepare-resources] Fixed asset paths in pages/${page}/index.html`);
  }
}

function main() {
  checkPreconditions();
  buildServer();
  buildFrontend();
  pruneServerDeps();
  copyServer();
  restoreServerDeps();
  copyFrontend();
  console.log('\n[prepare-resources] All resources prepared successfully.');
}

main();
