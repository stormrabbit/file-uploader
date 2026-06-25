## 1. 新增 HealthModule

- [x] 1.1 新增 `src/health/health.controller.ts`：`@Controller('health')` 暴露 `@Get()` 方法返回 `{ status: 'ok' }`
- [x] 1.2 新增 `src/health/health.module.ts`：声明 `HealthController`，不引入任何 providers
- [x] 1.3 控制器无构造函数注入；模块无 imports

## 2. 注册到 AppModule

- [x] 2.1 修改 `src/app.module.ts`：imports 中加入 `HealthModule`
- [x] 2.2 启动后 `curl http://localhost:38902/health` 返回 HTTP 200，响应体可解析为 JSON

## 3. 验证拦截器兼容性

- [x] 3.1 验证经 `DataInterceptor`/`TransformInterceptor` 包装后的响应仍可被外部进程稳定识别（任意层级存在 `status === 'ok'` 或至少 HTTP 200 可达）
- [x] 3.2 若拦截器破坏响应结构，给 `HealthController` 加跳过机制

## 4. 验证数据库无关性

- [x] 4.1 临时改名 `data.db` 触发 Prisma 连接失败（或临时修改 `DATABASE_URL` 指向无效路径），重启服务
- [x] 4.2 `curl /health` 仍返回 200（服务能起来；如果 NestJS 启动阶段就因 Prisma 失败而崩溃，本步骤验收降级为"`/health` 在 Prisma 服务化失败但 NestJS bootstrap 通过的场景下返回 200"）

## 5. 验证

- [x] 5.1 `npm run build` 通过
- [x] 5.2 `npm run start:dev` 启动正常；`curl /health` 返回 200
- [x] 5.3 `npm run lint` 通过

## 6. 归档

- [ ] 6.1 `openspec archive server-health-check` 归档本提案
