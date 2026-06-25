## 1. 创建 ServerInfo 模块文件

- [x] 1.1 新建 `src/domain/server-info/server-info.service.ts`，使用 `os.networkInterfaces()` 过滤 internal、APIPA 地址，只返回 IPv4 地址数组
- [x] 1.2 新建 `src/domain/server-info/server-info.module.ts`，声明并导出 ServerInfoService（无 Controller）

## 2. 复用到 FilesModule

- [x] 2.1 `FilesModule` 引入 `ServerInfoModule`
- [x] 2.2 `FilesController` 注入 `ServerInfoService`，`GET /files/ip` 改用 `getIpv4Addresses()` 返回 `{ ips: string[] }`

## 3. 注册到 AppModule

- [x] 3.1 在 `src/app.module.ts` 的 `imports` 数组中添加 `ServerInfoModule`
