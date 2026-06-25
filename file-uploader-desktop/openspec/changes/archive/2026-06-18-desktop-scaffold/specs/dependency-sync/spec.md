## ADDED Requirements

### Requirement: 提供依赖同步校验脚本
系统 SHALL 提供 `scripts/check-deps-sync.js` 脚本，比对本仓库 `package.json.dependencies` 与同级 `../file-uploader-server/package.json.dependencies`，确保两者键集合相同且每个键的版本字符串完全相等。

#### Scenario: 依赖完全一致时退出码为 0
- **WHEN** desktop 与 server 的 `dependencies` 段键集合完全相同且版本字符串逐项相等，执行 `node scripts/check-deps-sync.js`
- **THEN** 脚本 SHALL 以退出码 `0` 退出，并输出"OK"或类似确认信息

#### Scenario: server 多出某依赖时失败
- **WHEN** server `dependencies` 包含某个键 desktop 没有
- **THEN** 脚本 SHALL 以**非零退出码**退出，并在 stderr 或 stdout 中清晰指出缺失的依赖名

#### Scenario: 版本字符串不一致时失败
- **WHEN** 同名依赖的版本字符串不严格相等（如 server 是 `^5.22.0`、desktop 是 `~5.22.0`）
- **THEN** 脚本 SHALL 以非零退出码退出，并指出不一致的依赖名与两边版本

#### Scenario: desktop 多出某依赖时失败
- **WHEN** desktop `dependencies` 包含某个键 server 没有
- **THEN** 脚本 SHALL 以非零退出码退出，并指出多余的依赖名

### Requirement: 校验脚本仅对比生产依赖
脚本 MUST NOT 比较 `devDependencies`、`peerDependencies`、`optionalDependencies`。`devDependencies` 漂移不影响打包产物运行时，纳入对比会引入不必要的失败。

#### Scenario: server devDependencies 不同不触发失败
- **WHEN** desktop 缺少 server 中存在的某个 devDependency（如 `prisma`、`@nestjs/cli`）
- **THEN** 脚本 SHALL 仍以退出码 `0` 退出（仅 `dependencies` 段一致即可）

### Requirement: 找不到 server 仓库时给出明确报错
当 `../file-uploader-server/package.json` 不存在或不可读时，脚本 SHALL 以非零退出码退出，并在 stderr 中指出预期的相对路径与排查建议（例如"请确认 file-uploader-desktop 与 file-uploader-server 位于同一父目录"）。MUST NOT 静默跳过校验或以退出码 `0` 通过。

#### Scenario: server 仓库缺失
- **WHEN** 执行脚本时同级目录不存在 `file-uploader-server`
- **THEN** 脚本 SHALL 以非零退出码退出并打印包含路径与排查建议的错误信息

### Requirement: 校验脚本绑定到 prebuild 钩子
`package.json.scripts` SHALL 定义 `prebuild` 脚本，其执行命令 SHALL 包含调用 `scripts/check-deps-sync.js`。npm 在执行 `npm run build` 时会自动先跑 `prebuild`，从而在每次构建前强制校验。

#### Scenario: npm run build 自动触发校验
- **WHEN** 执行 `npm run build`
- **THEN** npm SHALL 先执行 `prebuild`，间接执行依赖同步校验；若校验失败，build SHALL 不被执行
