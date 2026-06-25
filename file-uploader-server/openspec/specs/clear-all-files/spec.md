# Spec: 清空所有文件

## Purpose

提供一键清空所有文件 DB 记录的能力，用于重置数据库状态而不影响磁盘上的物理文件。

## Requirements

### Requirement: 清空所有文件 DB 记录
系统 SHALL 提供 `DELETE /files/clear-all` 端点，删除数据库中全部文件记录；磁盘文件不受影响。

#### Scenario: 正常清空
- **WHEN** 客户端发送 `DELETE /files/clear-all`
- **THEN** 系统删除所有 DB 文件记录，返回 HTTP 200 及 `{ deletedRecords: <number> }`，磁盘文件保持不变

#### Scenario: 数据库已为空时调用
- **WHEN** 数据库中没有任何文件记录，客户端发送 `DELETE /files/clear-all`
- **THEN** 系统正常返回 HTTP 200，`deletedRecords` 为 0
