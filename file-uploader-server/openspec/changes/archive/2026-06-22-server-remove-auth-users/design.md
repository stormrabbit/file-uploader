## Context

`docs/electron-packaging.md` P1 第三步（也是最后一步）。此前的代码清理（参见 `git log`）已经删除了 `src/domain/auth/`、`src/domain/users/`、`src/domain/prescriptions/` 目录与 `app.module.ts` 中的注册，但漏掉了 `package.json` 中 5 个 npm 依赖：

- `@nestjs/jwt`
- `@nestjs/passport`
- `passport`
- `passport-jwt`
- `passport-local`

并且 `CLAUDE.md` 中仍保留以下已经不适用的待办：

- OPT-01：JWT 密钥硬编码（鉴权代码已不存在）
- OPT-02：FilesController AuthGuard 被注释（已不存在）
- OPT-03：UsersController 修改/删除接口无鉴权（UsersController 已不存在）
- OPT-07：UsersService 所有方法返回 null（UsersService 已不存在）

本 change 完成清理收尾，并通过 spec 显式记录鉴权策略，避免未来重新引入。

## Goals / Non-Goals

**Goals:**
- 清理未使用的 npm 依赖
- 同步 CLAUDE.md 与代码现状
- 通过 spec 显式声明鉴权策略与部署边界

**Non-Goals:**
- 不重新引入鉴权（即使是可选开关）
- 不修改任何业务代码
- 不改 HTTP 接口契约（依赖移除对接口零影响）
- 不在网关 / 反向代理层加鉴权（部署侧自决）

## Decisions

### D1: 一次性删除 5 个依赖，不分批
全部依赖互相关联（@nestjs/passport 依赖 passport，passport-jwt 依赖 passport），分批删除会出现中间状态包构建失败。一次性 `npm uninstall` 五个包并提交一次 lockfile 变更。

### D2: 用 spec 而非 README 声明鉴权策略
将"server 不实施鉴权"作为正式 spec capability，等同于功能性需求：
- 明确"什么不做"和"为什么不做"
- 未来若需要加鉴权，必须通过新 change 修改本 spec，避免悄悄加上
- 与 OpenSpec 的"specs 是真理之源"理念一致

### D3: 不实现可选鉴权开关
即使提供 `AUTH_ENABLED=true/false` 也会引入维护成本（两份代码路径、测试覆盖、文档）。当前阶段单一实现 + 部署侧用反向代理加鉴权（nginx basic-auth、Cloudflare Access、Tailscale 等）是更小的总复杂度。未来真有公网部署需求时，再起新 change 引入。

### D4: CLAUDE.md 增加"部署边界"章节
显式列出允许/禁止的部署场景，让任何接手的人不需要读 spec 也能在 30 秒内理解约束。

## Risks / Trade-offs

**[未来若需要公网部署，需要重新引入鉴权]**
→ Mitigation：本 change 不增加重新引入的成本（鉴权代码本来就要从 0 写起，依赖也要重装）；spec 中显式记录"未来引入鉴权时需新建 change 修改本 spec"，避免遗忘。

**[CLAUDE.md 与代码现状的漂移问题持续存在]**
→ Mitigation：本 change 修复一次；后续在新 change 的 tasks 中养成"修改业务代码时同步检查 CLAUDE.md"的习惯。
