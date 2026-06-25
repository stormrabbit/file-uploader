## 1. 仓库元数据（repo-metadata）

- [x] 1.1 在仓库根目录新建 `LICENSE` 文件，内容为 MIT License 全文，填入当前年份和作者名
- [x] 1.2 在 `package.json` 中添加 `description` 字段（一句话描述项目用途）
- [x] 1.3 在 `package.json` 中添加 `author` 字段
- [x] 1.4 在 `package.json` 中添加 `"license": "MIT"` 字段
- [x] 1.5 在 `package.json` 中添加 `repository` 字段，填入 git 仓库地址

## 2. .gitignore 清理（gitignore-cleanup）

- [x] 2.1 在 `.gitignore` 末尾追加 `.claude/` 规则
- [x] 2.2 在 `.gitignore` 末尾追加 `.windsurf/` 规则
- [x] 2.3 执行 `git status` 验证已追踪文件无意外变化

## 3. README 重写（readme-oss）

- [x] 3.1 在 README 顶部（标题下方）添加安全边界警告 blockquote（无鉴权、不可暴露公网）
- [x] 3.2 补充项目简介段落（一段话说明这是什么、解决什么问题）
- [x] 3.3 添加架构说明段落，描述 Electron + NestJS fork 子进程 + Vue 3 静态服务的三层结构及端口（38902/38903）
- [x] 3.4 添加多仓库目录结构代码块（展示三个兄弟仓库的父目录关系）
- [x] 3.5 更新"前置条件"章节：Node.js 版本要求、npm 版本要求
- [x] 3.6 更新"构建步骤"章节，替换 P3 阶段描述为完整的端到端命令（install → build → dist:mac）
- [x] 3.7 保留开发命令章节（`npm start`、`npm run check-deps`）并修正描述
- [x] 3.8 在末尾添加 License 章节，引用 LICENSE 文件

## 4. 贡献指南（contributing-guide）

- [x] 4.1 新建 `CONTRIBUTING.md`，首节说明多仓库目录结构要求和克隆步骤
- [x] 4.2 添加本地开发启动流程（三仓库分别安装依赖、启动开发模式命令）
- [x] 4.3 添加 `check-deps-sync.js` 的用途说明（防止 server/desktop 依赖漂移）
- [x] 4.4 添加 PR 提交规范（分支命名约定、commit message 格式建议）
