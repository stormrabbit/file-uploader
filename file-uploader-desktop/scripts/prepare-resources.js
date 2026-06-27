'use strict';

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const serverDir = path.join(root, '..', 'file-uploader-server');
const feDir = path.join(root, '..', 'file-uploader-fe');
const serverProdDir = path.join(root, 'server-prod');
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

/**
 * 确保原 server 目录的 .prisma/client/ 存在且为最新。
 * nest build 不包含 prisma generate，首次环境或 .prisma/ 被清除时若跳过此步，
 * 后续复制到 server-prod/ 的 engine 会缺失，导致运行时 Prisma Client 报错。
 */
function generatePrisma() {
  console.log('\n[prepare-resources] Running prisma generate in server directory...');
  execSync('npx prisma generate', { cwd: serverDir, stdio: 'inherit' });
  console.log('[prepare-resources] prisma generate complete.');
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

/**
 * 在 server-prod/ 暂存目录中组装纯生产依赖，全程不修改原 server 目录的 node_modules。
 * 流程：
 *   1. 重建 server-prod/ 并复制 package.json / dist/ / prisma/
 *   2. 在 server-prod/ 执行 npm ci --omit=dev（仅安装生产依赖）
 *   3. 将原 server 目录已生成的 .prisma/ 覆盖复制到 server-prod/node_modules/.prisma/
 *      （npm ci --omit=dev 跑完后 prisma CLI 不存在，postinstall 未执行，需手动补全 engine）
 */
function buildServerProd() {
  console.log('\n[prepare-resources] Building server-prod/ staging directory...');

  // 重建暂存目录
  if (fs.existsSync(serverProdDir)) {
    fs.rmSync(serverProdDir, { recursive: true, force: true });
  }
  fs.mkdirSync(serverProdDir, { recursive: true });

  // 复制 package.json、package-lock.json、dist/、prisma/ 到暂存目录
  // NOTE: npm ci 要求目录中必须存在 package-lock.json
  fs.cpSync(path.join(serverDir, 'package.json'), path.join(serverProdDir, 'package.json'));
  fs.cpSync(path.join(serverDir, 'package-lock.json'), path.join(serverProdDir, 'package-lock.json'));
  for (const dir of ['dist', 'prisma']) {
    const src = path.join(serverDir, dir);
    if (fs.existsSync(src)) {
      fs.cpSync(src, path.join(serverProdDir, dir), { recursive: true });
    } else {
      console.warn(`[prepare-resources] WARNING: ${src} not found, skipping.`);
    }
  }

  // 在暂存目录安装纯生产依赖
  console.log('[prepare-resources] Running npm ci --omit=dev in server-prod/...');
  execSync('npm ci --omit=dev', { cwd: serverProdDir, stdio: 'inherit' });

  // 补全 Prisma query engine（postinstall 因缺少 prisma CLI 未执行，从原 server 目录复制）
  const prismaSrc = path.join(serverDir, 'node_modules', '.prisma');
  const prismaDest = path.join(serverProdDir, 'node_modules', '.prisma');
  if (fs.existsSync(prismaSrc)) {
    console.log('[prepare-resources] Copying .prisma/ engine from server directory...');
    fs.cpSync(prismaSrc, prismaDest, { recursive: true, dereference: true });
  } else {
    console.warn('[prepare-resources] WARNING: .prisma/ not found in server node_modules, skipping.');
  }

  console.log('[prepare-resources] server-prod/ staging complete.');
}

function copyServer() {
  console.log('\n[prepare-resources] Copying server-prod/ to resources/server/...');
  if (fs.existsSync(resourcesServerDir)) {
    fs.rmSync(resourcesServerDir, { recursive: true, force: true });
  }
  // dereference: true 摊平相对软链（主要是 .bin/ 下的 shim）。
  // 默认行为会把相对软链改写成构建机的绝对路径，包到别的机器上断链。
  fs.cpSync(serverProdDir, resourcesServerDir, { recursive: true, dereference: true });
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
  generatePrisma();
  buildServerProd();
  copyServer();
  buildFrontend();
  copyFrontend();
  console.log('\n[prepare-resources] All resources prepared successfully.');
}

main();
