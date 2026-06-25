'use strict';

// 零依赖静态文件服务：对外（局域网）提供打包后的前端页面（resources/web）。
// 开发环境下该角色由 Vite dev server（host 0.0.0.0，端口 38903）承担；
// 打包后 Electron 用 file:// 加载 PC 页面，缺少对外的页面 HTTP 服务，
// 因此手机扫码访问 http://<lan_ip>:38903/mobile 会连不上。此模块用于补齐该能力。

const http = require('http');
const fs = require('fs');
const path = require('path');

// 常见静态资源的 MIME 映射
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.map': 'application/json; charset=utf-8',
};

// 页面路由：与 Vite dev server 的 history 重写规则保持一致。
// 二维码生成的地址为 http://<lan_ip>:<port>/mobile。
const PAGE_ROUTES = {
  '/': 'pages/pc/index.html',
  '/pc': 'pages/pc/index.html',
  '/mobile': 'pages/mobile/index.html',
};

/**
 * 处理单个请求：先匹配页面路由，否则按静态资源路径读取文件。
 * @param {string} webRoot 前端资源根目录（resources/web）
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse} res
 */
function handleRequest(webRoot, req, res) {
  let urlPath;
  try {
    urlPath = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  } catch {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Bad Request');
    return;
  }

  // 去掉末尾斜杠（根路径除外），保证 /mobile 与 /mobile/ 等价
  const normalized =
    urlPath.length > 1 && urlPath.endsWith('/') ? urlPath.slice(0, -1) : urlPath;

  // 命中页面路由则返回对应 HTML，否则作为静态资源路径处理
  const relative = PAGE_ROUTES[normalized] || urlPath.replace(/^\/+/, '');
  const filePath = path.join(webRoot, relative);

  // 防止路径穿越：解析后的路径必须仍在 webRoot 之内
  const rootWithSep = webRoot.endsWith(path.sep) ? webRoot : webRoot + path.sep;
  if (filePath !== webRoot && !filePath.startsWith(rootWithSep)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Forbidden');
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not Found');
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
    });
    res.end(data);
  });
}

/**
 * 启动静态文件服务。
 * @param {object} options
 * @param {string} options.webRoot 前端资源根目录
 * @param {number} options.port 监听端口
 * @param {string} [options.host] 监听地址，默认 0.0.0.0（供局域网访问）
 * @returns {Promise<import('http').Server>} 启动成功后的 server 实例
 */
function startStaticServer({ webRoot, port, host = '0.0.0.0' }) {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      handleRequest(webRoot, req, res);
    });
    server.once('error', reject);
    server.listen(port, host, () => {
      server.removeListener('error', reject);
      resolve(server);
    });
  });
}

module.exports = { startStaticServer };
