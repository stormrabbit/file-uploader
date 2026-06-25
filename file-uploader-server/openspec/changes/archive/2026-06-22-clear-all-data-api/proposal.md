## Why

开发调试阶段需要快速清空所有已上传的文件记录，目前只能手动操作数据库，流程繁琐。提供一个专用接口，一键清空 DB 记录；磁盘文件保留，防止误触导致文件丢失。

## What Changes

- 新增 `DELETE /files/clear-all` 接口，清空 DB 中所有文件记录（磁盘文件不受影响）
- 返回本次操作删除的记录数

## Capabilities

### New Capabilities

- `clear-all-files`: 清空所有 DB 文件记录的管理接口

### Modified Capabilities

（无现有 spec 行为变更）

## Impact

- `FilesService`：新增 `clearAll()` 方法，调用 Prisma `deleteMany`
- `FilesController`：新增路由 `DELETE /files/clear-all`
- 不涉及鉴权（与现有策略一致，见 `auth-policy`）
- 无 breaking change，仅新增端点
