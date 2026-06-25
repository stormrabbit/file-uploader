## Why

Electron 桌面应用主进程在 fork NestJS 子进程后，需要一种**轻量、无副作用**的方式探测后端就绪，再加载前端 BrowserWindow，避免出现 ERR_CONNECTION_REFUSED 白屏。同时该接口对独立部署场景（K8s、Docker、PM2 健康检查、负载均衡探针）也是通用基础设施。当前 server 没有任何健康检查端点。

## What Changes

- 新增 `src/health/` 模块（`HealthModule` + `HealthController`），提供 `GET /health` 接口返回 `{ status: 'ok' }`
- `AppModule` 注册 `HealthModule`
- `HealthController` 不依赖任何业务模块（不注入 `PrismaService`、`FilesService` 等），保证即使数据库不可用 `/health` 仍能响应
- 接口对 `DataInterceptor` 等全局拦截器友好（外部进程能从响应中稳定识别"就绪"状态）

## Capabilities

### New Capabilities
- `health-check`: 提供 `GET /health` 健康检查能力，返回 200 + 状态 JSON，不依赖业务模块，供 Electron 主进程、K8s、PM2 等外部进程探测就绪

### Modified Capabilities
（无）

## Impact

**新增代码**
- `src/health/health.module.ts`
- `src/health/health.controller.ts`

**修改代码**
- `src/app.module.ts`：imports 中加入 `HealthModule`

**对外影响**
- 新增公开接口 `GET /health`，无鉴权要求
- 接口响应不含敏感信息（无路径、连接串、版本号等）

**风险**
- 无（纯增量接口）
