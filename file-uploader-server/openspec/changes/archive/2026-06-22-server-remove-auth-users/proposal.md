## Why

桌面单机 + 局域网部署场景不需要鉴权（参见 `docs/electron-packaging.md` 决策 D7 与 D10）。当前实际代码中 `auth`/`users` 模块已不存在（已被先前的清理工作删除），但 `package.json` 仍残留 5 个未使用的 jwt/passport 依赖；`CLAUDE.md` 仍记录鉴权相关待办（OPT-01/02/03/07），与代码现状不一致。

本 change 完成最后的清理：移除残留依赖、更新文档、显式声明"server 不实施鉴权"作为 spec 能力，使部署边界有据可循。

## What Changes

- **BREAKING**：从 `package.json` 移除 5 个鉴权相关依赖：`@nestjs/jwt`、`@nestjs/passport`、`passport`、`passport-jwt`、`passport-local`
- 全局搜索并清理任何残留 import / 引用（实测当前为零，但作为防御性步骤保留）
- 更新 `CLAUDE.md`：移除已不适用的 OPT-01/02/03/07 待办，新增"部署边界"章节说明无鉴权策略
- 新增 `auth-policy` spec 能力，显式声明 server 不实施鉴权、桌面端 + 局域网为允许部署场景、公网部署需上游网关加鉴权

## Capabilities

### New Capabilities
- `auth-policy`: 显式声明 server 的鉴权策略——不实施任何鉴权层；规定允许 / 禁止的部署场景；为未来重新引入鉴权时提供 spec 锚点

### Modified Capabilities
（无）

## Impact

**修改代码**
- `package.json`：移除 5 个依赖
- `package-lock.json`：`npm install` 自动重生

**修改文档**
- `CLAUDE.md`：清理过时的 OPT-01/02/03/07，新增部署边界说明

**对外影响**
- **BREAKING**：HTTP 客户端如果还在发送 `Authorization: Bearer <token>` header，现在不会出错（被忽略），但任何依赖 `POST /auth/login` 之类接口的调用方早已得到 404（接口随模块删除已不存在），本 change 不改变这个状态
- npm 安装速度小幅提升、`node_modules` 体积下降（约几 MB）

**风险**
- 极小：当前依赖完全未被代码使用，`npm install` 后业务行为不变
