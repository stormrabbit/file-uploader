## Context

项目是一个 NestJS v7 个人文件管理服务。`FilesController` 原有 `GET /files/ip` 接口通过 `request.connection.localAddress` 获取 IP，返回单个地址且依赖 HTTP 连接上下文，不够可靠。新增 `ServerInfoService` 封装 `os.networkInterfaces()` 逻辑，以共享 Service 形式供 FilesController 复用，不单独暴露路由。

## Goals / Non-Goals

**Goals:**
- 封装 `os.networkInterfaces()` 为可复用的 `ServerInfoService`
- 只返回有效 IPv4 地址（过滤 loopback、APIPA）
- `FilesController.getServerIp()` 复用该 Service，统一实现

**Non-Goals:**
- 不新增 `/server-info` 路由（无独立 Controller）
- 不返回 IPv6、CPU、内存等其他系统信息

## Decisions

### 以共享 Service 而非独立路由的形式实现

**决策**：`ServerInfoModule` 只有 Service，导出后注入 `FilesModule`，不注册 Controller。

**理由**：`GET /files/ip` 已是既有入口，客户端已在使用；新增 `/server-info` 路由会造成功能重叠。将逻辑下沉到 Service 层，既复用了代码，又避免引入冗余接口。

### 只保留 IPv4，过滤 APIPA

**决策**：`family === 'IPv4'`、`internal === false`、非 `169.254.x.x`。

**理由**：客户端只关心可达的局域网地址；IPv6 link-local、VPN tunnel（utun*）、Apple 虚拟接口（awdl0、llw0）等对局域网访问无意义，全部剔除。

### 响应结构

`GET /files/ip` 返回：
```json
{ "ips": ["192.168.x.x"] }
```

平铺数组，简单直接，客户端取第一个即可。

## Risks / Trade-offs

- [Docker/容器环境] 容器内返回虚拟网卡地址，不是宿主机 IP → 当前 pm2 本地部署无此问题
- [响应格式变更] 原 `{ serverIp }` 改为 `{ ips: string[] }`，已有调用方需同步更新 → 个人项目可接受
