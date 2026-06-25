## ADDED Requirements

### Requirement: 提供 GET /health 健康检查接口
系统 SHALL 暴露 `GET /health` 接口，无需鉴权，用于外部进程探测后端是否就绪。响应 SHALL 在服务初始化完成且能响应请求时返回 HTTP 200，响应体为 JSON。

#### Scenario: 服务就绪后返回 200
- **WHEN** 客户端请求 `GET /health` 且 NestJS 已完成 `app.listen()`
- **THEN** 服务 SHALL 返回 HTTP 200，响应体（经全局拦截器后）至少在某一层级可解析得到 `status === 'ok'`

#### Scenario: 响应不携带敏感信息
- **WHEN** 客户端请求 `GET /health`
- **THEN** 响应体 MUST NOT 包含数据库连接字符串、文件系统路径、用户数据、版本号、构建时间等字段

#### Scenario: 数据库不可用时仍能响应
- **WHEN** SQLite 数据库文件被锁定或不可访问，客户端请求 `GET /health`
- **THEN** 服务 SHALL 仍然返回 HTTP 200（健康检查不依赖业务模块）

### Requirement: HealthModule 独立注册且无业务依赖
系统 SHALL 通过独立的 `HealthModule`（路径 `src/health/`）提供该接口，不得复用 `FilesController` 或其他业务模块。`AppModule` MUST 显式 import `HealthModule`。`HealthController` 与 `HealthModule` 不得在 imports/providers/构造函数注入中依赖 `FilesModule`、`PrismaService`、`AuthModule`（即使将来引入）等业务模块。

#### Scenario: HealthModule 不依赖业务服务
- **WHEN** 检查 `HealthModule` 与 `HealthController` 的依赖
- **THEN** SHALL NOT 出现对 `FilesModule`、`PrismaService` 或其他业务模块的引用

#### Scenario: AppModule 显式注册
- **WHEN** 检查 `src/app.module.ts`
- **THEN** `imports` 数组 SHALL 包含 `HealthModule`
