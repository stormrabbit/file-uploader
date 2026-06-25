# file-uploader-server

个人文件上传/管理服务端，支持文件上传、下载、删除、列表查询。基于 NestJS + Prisma + SQLite 构建，面向桌面端（Electron）或局域网部署场景。

## 技术栈

- **框架**: NestJS v7
- **文件处理**: multer（本地磁盘存储）
- **数据持久化**: Prisma + SQLite
- **API 文档**: Swagger（`/api-doc`）

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

```bash
cp .env.example .env
```

按需修改 `.env` 中的配置项（默认值可直接使用）。

### 3. 初始化数据库

```bash
npm run prisma:migrate
```

### 4. 配置存储目录（可选）

```bash
cp config.json.example config.json
```

编辑 `config.json`，将 `storageDir` 设置为文件存储根目录（默认使用项目根目录）。

### 5. 启动服务

```bash
# 开发模式（watch）
npm run start:dev

# 生产构建后运行
npm run build && npm run start:node

# pm2 托管（进程名 fu-server）
npm run start:prod
```

服务默认监听 `http://localhost:38902`，API 文档访问 `http://localhost:38902/api-doc`。

## 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `PORT` | 服务监听端口 | `38902` |
| `DATABASE_URL` | Prisma SQLite 连接字符串 | `file:./data.db` |
| `DATA_DIR` | 持久化数据根目录（`static/` 归档路径） | 项目根目录 |

## 主要接口

| 方法 | 路径 | 说明 |
|------|------|------|
| `POST` | `/files/upload` | 上传文件 |
| `GET` | `/files` | 文件列表 |
| `GET` | `/files/download?id=` | 下载文件 |
| `DELETE` | `/files/:id` | 删除文件 |
| `GET` | `/static/*` | 直接访问静态文件 |

## 部署边界

本服务**不包含任何鉴权层**，所有端点对能访问到该端口的客户端开放。

**适用场景：**
- 桌面 Electron 应用（依赖 OS 用户隔离）
- 家庭 / 办公室局域网（NAS、Docker、可信网络）

**不适用场景：**
- 直接暴露于公网
- 不可信的多用户网络

如需公网部署，请在上游网关层实施鉴权（nginx basic-auth、Cloudflare Access、Tailscale 等）。

## Docker 部署

```bash
docker-compose up -d
```

## License

[MIT](../LICENSE)
