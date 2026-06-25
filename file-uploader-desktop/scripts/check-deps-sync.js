'use strict';

// NOTE: desktop 的 dependencies 不需要与 server 保持同步。
// server 以独立子进程运行，所有依赖来自 resources/server/node_modules/，
// desktop 本身只需要 electron / electron-builder / cross-env。
// 此脚本仅校验兄弟目录存在，确保 prepare-resources.js 能正常找到源码。

const fs = require('fs');
const path = require('path');

const serverDir = path.join(__dirname, '..', '..', 'file-uploader-server');
const feDir = path.join(__dirname, '..', '..', 'file-uploader-fe');

const missing = [];
if (!fs.existsSync(serverDir)) missing.push(serverDir);
if (!fs.existsSync(feDir)) missing.push(feDir);

if (missing.length > 0) {
  console.error('[check-deps] ERROR: required sibling repos not found:');
  missing.forEach(p => console.error(`  - ${p}`));
  console.error('  Ensure file-uploader-server and file-uploader-fe are siblings of file-uploader-desktop.');
  process.exit(1);
}

console.log('[check-deps] sibling repos OK');
