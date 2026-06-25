# 文件传输助手

局域网文件/照片同步工具。手机端一键上传，PC 端即时浏览查看，专为家庭场景设计，老人也能轻松使用。

## 功能特性

- **秒传去重**：客户端 MD5 校验，重复文件秒传不占带宽
- **双端适配**：Mobile 端极简上传界面；PC 端图片网格预览 + 灯箱大图
- **局域网二维码**：PC 端展示访问二维码，手机扫码直达上传页
- **Flutter WebView 支持**：可嵌入 App，通过 JavaScript Bridge 调用原生选图器
- **串行上传队列**：单文件逐张上传，进度反馈清晰
- **批量管理**：PC 端支持批量删除、一键清空

## 技术栈

| 分类 | 技术 |
|------|------|
| 框架 | Vue 3 + TypeScript + Vite |
| PC UI | Element Plus |
| Mobile UI | Vant |
| 路由 | Vue Router 4 |
| MD5 | SparkMD5（分块计算） |
| 构建 | Vite MPA（多页应用） |

## 快速上手

**环境要求**：Node.js v22.22.0、npm 10.9.4

```bash
# 1. 克隆项目
git clone <repo-url>
cd file-uploader-fe

# 2. 安装依赖
npm install

# 3. 复制环境变量
cp .env.example .env
# 按需修改 .env 中的端口配置

# 4. 启动开发服务器（端口 38903）
npm run dev
```

> 需配合后端服务使用，后端默认端口 38902。

## 部署

### 构建

```bash
npm run build
```

### 访问地址

- PC 端访问：`http://<server-ip>:38903/pc`
- Mobile 端访问：`http://<server-ip>:38903/mobile`


## 项目架构

MPA（多页应用）结构，PC 和 Mobile 完全隔离：

```
src/
├── pages/
│   ├── pc/          # PC 端（Element Plus）
│   └── mobile/      # Mobile 端（Vant）
├── api/             # 共享 API 层
├── services/        # Axios 封装
├── compostions/     # 共享 Composables
└── utils/           # 工具函数
```

## 开发命令

```bash
npm run dev          # 开发服务器，端口 38903
npm run build        # 类型检查 + 构建
npm run test:unit    # 单元测试
npm run lint         # ESLint 检查
npm run format       # Prettier 格式化
```

## 贡献

欢迎提交 Issue 和 Pull Request，请先阅读 [CONTRIBUTING.md](../CONTRIBUTING.md)。

## 许可证

[MIT](../LICENSE)
