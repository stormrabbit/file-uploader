## 1. Git 历史清理

- [x] 1.1 执行 `rm -rf .git && git init`，清除含个人身份信息的历史提交
- [x] 1.2 配置 git user（`git config user.name` / `user.email`）为公开身份

## 2. .gitignore 修复

- [x] 2.1 在 `.gitignore` 中追加 `.env`、`config.json`、`.claude/`、`openspec/` 条目

## 3. 删除内部文件

- [x] 3.1 删除 `db.sql`（旧 MySQL schema，已被 Prisma 替代）
- [x] 3.2 删除 `CLAUDE.md`（内部 AI 协作指令）

## 4. 新增开源必备文件

- [x] 4.1 新增 `LICENSE`（MIT，填写当前年份和版权人）
- [x] 4.2 新增 `.env.example`（列出 `PORT`、`DATABASE_URL` 及说明，值使用占位符）
- [x] 4.3 新增 `config.json.example`（列出 `storageDir` 字段，值使用占位符路径）

## 5. 重写 README.md

- [x] 5.1 移除所有 MySQL 建库/建表 SQL 及明文密码内容
- [x] 5.2 移除 JWT 登录验证描述（该功能已移除）
- [x] 5.3 补充当前技术栈（NestJS v7 + Prisma + SQLite）
- [x] 5.4 补充本地启动步骤（`npm install`、复制 `.env.example` 为 `.env`、`npm run start:dev`）
- [x] 5.5 补充环境变量说明表格（`PORT`、`DATA_DIR`、`DATABASE_URL`）
- [x] 5.6 补充部署边界说明（无鉴权、仅限可信网络/Electron）

## 6. 首次提交

- [x] 6.1 `git add` 所有清理后的文件
- [x] 6.2 执行首次提交：`git commit -m "chore: initial open-source release"`
