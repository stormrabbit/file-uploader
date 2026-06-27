## Context

P4 已交付完整的开发模式联调链路。打包涉及两个新问题：
1. **路径变化**：electron-builder 将源文件打入 asar 归档，`__dirname` 不再指向项目根目录，而是 asar 虚拟文件系统内部；`resources/` 目录（server 产物、web 产物）则放在 asar 外的 `process.resourcesPath` 下
2. **Prisma native 二进制**：`.node` 文件无法在 asar 内被 `require`（mmap 失败），必须通过 `asarUnpack` 释放到 `app.asar.unpacked/`

**文件布局对比**：

| | 开发模式 | 打包后 |
|---|---|---|
| `__dirname`（electron/main.js） | `<repo>/electron/` | asar 内 `/electron/` |
| server 产物 | `<repo>/resources/server/` | `<appPath>/Contents/Resources/resources/server/` |
| web 产物 | `<repo>/resources/web/` | `<appPath>/Contents/Resources/resources/web/` |
| Prisma .node | `resources/server/node_modules/.prisma/client/*.node` | 同上，但通过 asarUnpack 释放到 `app.asar.unpacked/` |
| `process.resourcesPath` | `<repo>` | `<appPath>/Contents/Resources/` |

## Goals / Non-Goals

**Goals:**
- `npm run dist:mac` 产出可安装的 `.dmg`
- 安装后首次启动完成数据库迁移、加载前端、上传文件全链路可用
- 开发模式（`npm start`）不受影响

**Non-Goals:**
- 代码签名 / Apple Notarization（需 Apple Developer 账号）
- Windows 打包（P6）
- 自动更新（未规划）
- App icon 设计（使用 electron-builder 默认图标）

## Decisions

### D-P1: 路径常量通过 `app.isPackaged` 区分

**选择**：
```js
const RESOURCES = app.isPackaged
  ? path.join(process.resourcesPath, 'resources')
  : path.join(__dirname, '..', 'resources');
```
`loading.html` / `preload.js` / `error.html` 在 asar 内，用 `__dirname` 仍可访问（Electron 支持从 asar 内读取这些文件）。只有需要被 Node `require` 的 `.js` 和 `.node` 文件才必须在 asar 外。

**备选**：`extraResources` 把整个 `resources/` 放到 asar 外 → 可行，但与现有 `files` 规则重复，不如直接用 `process.resourcesPath`。

### D-P2: electron-builder files 规则打包 resources/ 而非依赖 extraResources

**选择**：在 `files` 数组中包含 `resources/**`，让 electron-builder 将其打入 app 包（asar 外，因为 `resources/` 里有 .node 文件，electron-builder 会自动将包含 .node 的目录或文件通过 asarUnpack 处理）。

**asarUnpack 规则**：
```yaml
asarUnpack:
  - "resources/server/node_modules/.prisma/client/*.node"
  - "resources/server/node_modules/prisma/*.node"
```
这样 Prisma engine 会释放到 `app.asar.unpacked/resources/server/...`，Prisma Client 运行时能通过文件系统路径加载。

### D-P3: Prisma migrate deploy 路径在打包后也需适配

打包后 `prisma migrate deploy` 使用的 CLI 路径和 `migrations/` 目录都在 `process.resourcesPath` 下，`runMigrate()` 函数的 `cwd` 和 bin 路径需随 `RESOURCES` 常量一起切换。

### D-P4: identity: null 免签名

**选择**：`electron-builder.yml` 中设 `identity: null`，禁用代码签名。

**影响**：macOS Gatekeeper 会在首次运行时拦截，用户需右键→打开→仍然打开来绕过。自用场景完全可接受；分发给他人时留意。

### D-P5: dist:mac 脚本在 build 之后执行

**选择**：`scripts.dist:mac` 定义为 `npm run build && electron-builder --mac`，确保每次打包前 resources/ 产物是最新的。

## Risks / Trade-offs

| 风险 | 缓解 |
|---|---|
| Prisma engine 在 asar 内 require 失败 | asarUnpack 规则覆盖两个路径（.prisma/client + prisma）；打包后首次启动若失败，server.log 会记录加载错误 |
| `app.isPackaged` 在开发模式下为 false，路径切换逻辑需两套都测试 | dist:mac 完成后安装验证；开发模式由现有 npm start 覆盖 |
| resources/ 体积大（server node_modules ~200MB），打包耗时长 | 接受；P5 是一次性打包操作，不在热路径上 |
| Gatekeeper 阻止首次运行 | 文档化"右键→打开"步骤；不影响功能 |
| electron-builder 版本与 electron 30.x 的兼容性 | electron-builder 24.x 支持 electron 30.x；已在 devDependencies 中锁定 |

## Migration Plan

- `electron/main.js` 的路径常量修改向后兼容（通过 `app.isPackaged` 分支，开发模式行为不变）
- 无数据迁移

## Open Questions

无。
