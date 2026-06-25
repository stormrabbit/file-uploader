## ADDED Requirements

### Requirement: ServerInfoService 提供 IPv4 地址列表
系统 SHALL 提供 `ServerInfoService.getIpv4Addresses()` 方法，调用 `os.networkInterfaces()` 并返回所有非内部、非 APIPA 的 IPv4 地址数组。

#### Scenario: 正常返回有效 IPv4 地址
- **WHEN** 调用 `getIpv4Addresses()`
- **THEN** 返回字符串数组，每项均为合法 IPv4 地址（如 `192.168.x.x`）

#### Scenario: 过滤 loopback 和 APIPA
- **WHEN** 服务器存在 `127.0.0.1` 或 `169.254.x.x` 地址
- **THEN** 这些地址不出现在返回数组中

#### Scenario: 过滤 IPv6
- **WHEN** 服务器存在 IPv6 地址（包括 `fe80::` link-local）
- **THEN** 返回数组中不包含任何 IPv6 地址

#### Scenario: 无有效地址时返回空数组
- **WHEN** 所有网络接口均为内部或 APIPA 地址
- **THEN** 返回空数组 `[]`

### Requirement: GET /files/ip 复用 ServerInfoService
系统 SHALL 使 `FilesController.getServerIp()` 通过注入 `ServerInfoService` 获取 IP，不再依赖 `request.connection.localAddress`。

#### Scenario: 返回统一格式
- **WHEN** 客户端请求 `GET /files/ip`
- **THEN** 响应体为 `{ "ips": ["..."] }`，HTTP 200
