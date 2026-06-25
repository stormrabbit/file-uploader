# Contributing

感谢参与本项目！以下是贡献前需要了解的内容。

---

## 多仓库目录结构

本工程是 `file-uploader` monorepo 的子目录之一，`scripts/` 中的构建脚本依赖相对路径 `../` 定位兄弟子目录：

```
file-uploader/               # 顶层仓库
├── file-uploader-server/    # NestJS 后端（API + SQLite）
├── file-uploader-fe/        # Vue 3 前端（PC + 移动端）
├── file-uploader-desktop/   # Electron 宿主（本仓库）
└── file-uploader-app/       # （其他子包）
```

- `scripts/prepare-resources.js`：触发 server 和前端 build，将产物拷贝到 `resources/`
- `scripts/check-deps-sync.js`：对比 `file-uploader-server/package.json` 的 `dependencies` 与本仓库是否完全一致，防止版本漂移。此检查在 `npm run build` 前自动执行

---

## 本地开发环境搭建

### 1. 克隆顶层仓库

```bash
git clone <file-uploader-url>
cd file-uploader
```

### 2. 安装依赖

```bash
# 后端
cd file-uploader-server && npm install && cd ..

# 前端
cd file-uploader-fe && npm install && cd ..

# 桌面端
cd file-uploader-desktop && npm install
```

### 3. 启动开发模式

```bash
# 在 file-uploader-server 目录：启动后端（端口 38902）
npm run start:dev

# 在 file-uploader-fe 目录：启动前端开发服务器（端口 38903）
npm run dev

# 在 file-uploader-desktop 目录：先构建资源，再启动 Electron
npm run build
npm start
```

> 开发时也可以只跑 `npm start`（跳过 build），此时 Electron 会读取上次已构建的 `resources/` 产物。

---

## 依赖同步说明

`file-uploader-desktop` 在 `package.json` 的 `dependencies` 段复制了 `file-uploader-server` 的全部生产依赖。这是因为 Electron 打包时需要在本工程下安装这些依赖（跨平台 native rebuild 需要在目标机器上执行 `npm install`，而不是直接拷贝 server 的 `node_modules`）。

每次修改 `file-uploader-server/package.json` 的依赖后，需要同步更新本仓库的 `package.json`，否则 `npm run check-deps` 会报错并阻止构建。

---

## 提交规范

### 分支命名

```
feat/<简短描述>     # 新功能
fix/<简短描述>      # Bug 修复
docs/<简短描述>     # 文档
chore/<简短描述>    # 构建/依赖/杂项
```

### Commit Message

格式：`<类型>: <描述>`，描述使用中文或英文均可。

```
feat: 添加桌面端文件夹选择功能
fix: 修复 Prisma migrate 在打包后环境中失败的问题
docs: 更新 README 构建步骤
```

### Pull Request

1. 从 `main` 分支切出功能分支
2. 确保 `npm run check-deps` 通过
3. 确保 `npm run build` 成功完成
4. 提交 PR 时描述改动原因和测试步骤
