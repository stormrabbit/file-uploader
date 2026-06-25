## ADDED Requirements

### Requirement: Server 不实施任何鉴权层
系统 SHALL NOT 在 HTTP 接口层实施任何形式的鉴权（包括但不限于 JWT、Basic Auth、Session、API Key）。所有 HTTP 端点对任何能访问到该端口的客户端开放。`package.json` MUST NOT 包含 `@nestjs/jwt`、`@nestjs/passport`、`passport`、`passport-jwt`、`passport-local` 等鉴权相关依赖。

#### Scenario: 任意 HTTP 请求无需 Authorization
- **WHEN** 客户端不提供任何 `Authorization` header 请求 `GET /files/list`
- **THEN** 服务 SHALL 返回 HTTP 200 与文件列表数据，无 401/403

#### Scenario: 错误的 Authorization 也不影响
- **WHEN** 客户端发送 `Authorization: Bearer invalid-token` 请求任意接口
- **THEN** 服务 SHALL 忽略该 header，按未鉴权流程处理

#### Scenario: 依赖清单中无鉴权包
- **WHEN** 检查 `package.json` 的 `dependencies`
- **THEN** SHALL NOT 出现任何 `passport*`、`@nestjs/jwt`、`@nestjs/passport` 字眼

### Requirement: 部署边界声明
系统的部署场景 SHALL 限定在以下范围之内：

**允许：**
- 桌面 Electron 应用（OS 用户隔离）
- 家庭 / 办公室局域网（NAS、Docker、可信网络）

**禁止：**
- 直接暴露于公网（互联网可达的端口映射 / 反向代理直连）
- 不可信的多用户网络（咖啡店 WiFi、共享办公等）

若需公网部署，鉴权 MUST 在上游网关层实施（nginx basic-auth、Cloudflare Access、Tailscale 等），server 自身仍保持无鉴权。

#### Scenario: 文档显式记录部署边界
- **WHEN** 检查 `CLAUDE.md`
- **THEN** SHALL 包含"部署边界"或等价章节，列出允许 / 禁止的部署场景

### Requirement: 重新引入鉴权需通过新 change
未来若需引入鉴权层（例如公网部署需求），SHALL 通过新建 OpenSpec change 修改本 spec 的 `auth-policy` 能力，不得直接在代码中加 `AuthGuard` 或 middleware 鉴权而不更新 spec。

#### Scenario: 重新引入鉴权需 spec 改动
- **WHEN** 任何 PR 引入 `@UseGuards()`、Authorization header 校验、API key 校验等鉴权逻辑
- **THEN** 同 PR SHALL 包含修改 `auth-policy` spec 的 change
