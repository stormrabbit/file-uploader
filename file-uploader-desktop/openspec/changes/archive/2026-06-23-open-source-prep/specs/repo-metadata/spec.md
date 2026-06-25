## ADDED Requirements

### Requirement: LICENSE 文件存在
仓库根目录 SHALL 包含 `LICENSE` 文件，内容为标准 MIT License 全文，年份和作者与实际一致。

#### Scenario: LICENSE 文件可读
- **WHEN** 访问仓库根目录
- **THEN** 存在 `LICENSE` 文件，内容包含 "MIT License" 字样及版权声明

### Requirement: package.json 包含 OSS 必要字段
`package.json` SHALL 包含 `description`、`author`、`license`、`repository` 四个字段，且 `license` 值与 `LICENSE` 文件类型一致（`"MIT"`）。

#### Scenario: license 字段与文件一致
- **WHEN** 读取 `package.json`
- **THEN** `license` 字段值为 `"MIT"`，`description` 非空字符串，`author` 非空字符串，`repository.url` 指向有效的 git 仓库地址

#### Scenario: private 字段保留防止误发布
- **WHEN** 读取 `package.json`
- **THEN** `"private": true` 字段存在，防止 `npm publish` 意外执行
