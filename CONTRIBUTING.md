# 贡献指南

感谢你对本项目的关注！以下是参与贡献的完整流程。

## 本地开发环境

**环境要求**：Node.js v22.22.0、npm 10.9.4

```bash
# 1. Fork 并克隆仓库
git clone https://github.com/<your-username>/file-uploader-fe.git
cd file-uploader-fe

# 2. 安装依赖
npm install

# 3. 配置环境变量
cp .env.example .env

# 4. 启动开发服务器
npm run dev
# 访问 http://localhost:38903/pc（PC 端）
# 访问 http://localhost:38903/mobile（Mobile 端）
```

## 代码规范

提交前请确保以下命令通过：

```bash
npm run lint        # ESLint 检查
npm run format      # Prettier 格式化
npm run type-check  # TypeScript 类型检查
npm run test:unit   # 单元测试
```

## 提交 Pull Request

1. 从 `main` 分支创建功能分支：`git checkout -b feat/your-feature`
2. 完成修改并确保所有检查通过
3. 提交 commit，message 格式参考：
   - `feat: 添加某功能`
   - `fix: 修复某 Bug`
   - `docs: 更新文档`
   - `refactor: 重构某模块`
4. 推送分支并创建 Pull Request，填写 PR 模板中的内容

## 提交 Issue

- **Bug 报告**：请使用 Bug Report 模板，提供复现步骤、预期行为、实际行为和环境信息
- **功能请求**：请使用 Feature Request 模板，描述使用场景和期望功能

## 项目结构

```
src/
├── pages/pc/        # PC 端页面（Element Plus）
├── pages/mobile/    # Mobile 端页面（Vant）
├── api/             # API 请求定义
├── services/        # Axios 封装
├── compostions/     # 共享 Composables
└── utils/           # 工具函数
```
