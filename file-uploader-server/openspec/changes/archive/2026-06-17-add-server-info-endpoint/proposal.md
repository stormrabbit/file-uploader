## Why

在局域网部署场景下，客户端需要知道服务器的实际 IP 地址以便直接访问静态资源或调试网络连通性，目前没有任何接口暴露该信息，需要人工登录服务器查询。

## What Changes

- 新增 `ServerInfoService`，通过 `os.networkInterfaces()` 获取服务器 IPv4 地址列表，过滤 loopback 和 APIPA（`169.254.x.x`）地址
- `FilesController.getServerIp()` 复用 `ServerInfoService`，替换原有的 `request.connection.localAddress` 实现
- 新增 `ServerInfoModule`（仅含 Service），导出供 `FilesModule` 注入
- **不新增路由**：`GET /files/ip` 是唯一的 IP 查询入口，`/server-info` 路由不对外暴露

## Capabilities

### New Capabilities

- `server-info`: 提供服务器 IPv4 地址查询能力，以共享 Service 形式供其他模块复用

### Modified Capabilities

（无）

## Impact

- 新增 `src/domain/server-info/server-info.service.ts` 和 `server-info.module.ts`
- `FilesModule` 新增对 `ServerInfoModule` 的依赖
- `FilesController` 注入 `ServerInfoService`，移除对 `@Req()` 的依赖
- 无破坏性变更，`GET /files/ip` 响应格式由 `{ serverIp }` 变更为 `{ ips: string[] }`
