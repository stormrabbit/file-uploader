## Context

Electron 桌面应用打包路线图（`docs/electron-packaging.md`）的 P1 第二步。Electron 主进程 fork NestJS 后需要轮询一个端点判断后端就绪，再 `loadFile` 加载前端，避免 1-3 秒启动延迟内出现连接拒绝。

server 当前没有任何健康检查端点。最接近的可用接口是 `GET /files/list`，但它依赖数据库与业务逻辑，不适合作为就绪探针。

## Goals / Non-Goals

**Goals:**
- 提供轻量、无业务依赖的就绪探测端点
- 响应格式可被外部进程稳定解析
- 与现有全局拦截器（`DataInterceptor`、`TransformInterceptor`）兼容

**Non-Goals:**
- 不实现 liveness vs readiness 区分（单端点足够）
- 不暴露版本号、git commit、构建时间等信息（这些可加在后续 change，本次仅最小可用）
- 不实现数据库健康检查（`HealthController` 故意不依赖业务模块）
- 不引入 `@nestjs/terminus` 等健康检查框架（依赖过重，本场景不需要）

## Decisions

### D1: 独立 `HealthModule`，不挂在 `FilesController` 上
- `FilesController` 上挂会引入业务依赖，违反"无业务依赖"目标
- 独立模块未来便于扩展（如加 `/ready`、`/live` 子路由）

### D2: 不注入任何 service
即使数据库连接失败，`/health` 也应返回 200——它的语义是"HTTP 进程已 ready，能响应请求"，不是"全链路健康"。全链路健康检查留给后续 change。

### D3: 响应格式 `{ status: 'ok' }`
- 简单、稳定、易解析
- 可被 `DataInterceptor` 包装（典型 NestJS 包装会变成 `{ data: { status: 'ok' }, code: 0 }` 或类似结构），外部进程可通过任意层级的 `status === 'ok'` 或仅 HTTP 200 判断
- 不返回时间戳避免缓存命中误判

### D4: 不加鉴权
默认就该公开。即使后续重新引入鉴权，`/health` 也应保留为白名单端点。

## Risks / Trade-offs

**[全局拦截器包装后外部进程解析失败]**
→ Mitigation：tasks 中明确要求验证"通过现有拦截器后，HTTP 200 + 响应体可被 `JSON.parse` 后从某层级取到 `status === 'ok'`"；如果发现拦截器破坏了响应结构，临时方案是在 `HealthController` 上加 `@SkipInterceptors()` 装饰器或等价机制。
