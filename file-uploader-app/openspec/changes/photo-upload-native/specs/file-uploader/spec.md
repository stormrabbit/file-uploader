## ADDED Requirements

### Requirement: 计算文件 MD5
上传前，系统 SHALL 在独立 Isolate 中对文件字节流计算 MD5 哈希值，避免阻塞 UI 线程。

#### Scenario: MD5 计算成功
- **WHEN** 用户选择照片后触发上传流程
- **THEN** 系统在后台 Isolate 计算每张照片的 MD5，计算完成后继续下一步

#### Scenario: 文件不可读
- **WHEN** 文件路径无效或文件已被删除
- **THEN** 系统跳过该文件，继续处理下一张，并在进度 UI 中标记该文件为"失败"

### Requirement: 秒传判断
上传前，系统 SHALL 调用 `GET /files/isExist/:md5`（路径参数）判断文件是否已存在于服务端。

#### Scenario: 文件已存在（秒传）
- **WHEN** `isExist` 接口返回非空 file 对象（含 `id`、`fileUrl`）
- **THEN** 系统跳过上传，直接使用返回的 `id`、`fileUrl` 作为该文件的上传结果

#### Scenario: 文件不存在
- **WHEN** `isExist` 接口返回 `null`
- **THEN** 系统继续执行实际上传流程

#### Scenario: 接口调用失败
- **WHEN** `isExist` 接口网络异常或返回非预期格式
- **THEN** 系统降级为直接上传，不中断整体流程

### Requirement: multipart 文件上传
系统 SHALL 通过 `POST /files/upload`（multipart/form-data，字段名 `file`）上传文件，并实时上报上传进度。

#### Scenario: 上传成功
- **WHEN** 上传接口返回成功响应（含 `id`、`fileUrl`、`fileName`）
- **THEN** 系统将该文件标记为已完成，保存 `id`、`fileUrl` 至结果列表

#### Scenario: 上传失败
- **WHEN** 上传接口返回错误或网络超时
- **THEN** 系统跳过该文件，在进度 UI 中标记为"失败"，继续上传下一张

#### Scenario: 上传进度更新
- **WHEN** 文件正在上传中
- **THEN** 进度 UI 中该文件的进度条实时更新百分比（0%–100%）

### Requirement: 串行上传队列
系统 SHALL 使用最大并发数为 1 的串行队列处理所有待上传文件，确保同一时刻只有 1 张照片在上传。

#### Scenario: 多张照片排队
- **WHEN** 用户选择了 N 张照片（N > 1）
- **THEN** 系统依次串行上传，每次只有 1 张在上传，其余排队等待

#### Scenario: 单张失败不阻塞队列
- **WHEN** 某张照片上传失败
- **THEN** 该文件标记失败后，队列继续处理下一张

### Requirement: 上传 Host 配置
上传 base URL 的 host SHALL 来自用户扫码得到的 IP 地址，端口使用可配置常量（默认 `38902`）。

#### Scenario: 从扫码 URL 提取 host
- **WHEN** WebViewPage 接收到扫码 URL（如 `http://10.188.149.81:38903/...`）
- **THEN** 系统提取其中的 host（`10.188.149.81`），拼接上传端口（`38902`）构造上传 base URL

### Requirement: 原生上传进度 UI
系统 SHALL 在上传过程中展示原生进度覆盖层（BottomSheet），显示每张照片的上传状态和进度百分比。

#### Scenario: 展示上传列表
- **WHEN** 上传流程开始
- **THEN** BottomSheet 弹出，列出所有待上传照片，初始状态为"等待中"

#### Scenario: 全部完成自动收起
- **WHEN** 所有照片上传完成（含成功和失败）
- **THEN** 系统等待 1 秒后自动收起 BottomSheet，并通过 Bridge 回传结果

### Requirement: Bridge 回传上传结果
上传全部完成后，系统 SHALL 调用 `window.UploadBridge_callback(jsonString)` 将结果数组回传给 Web 端。

#### Scenario: 回传成功结果
- **WHEN** 至少一张照片上传成功
- **THEN** 回传 JSON 数组，每项包含 `{ id, fileId, fileUrl }`，其中 `fileId` 为服务端自增 ID，`fileUrl` 为服务端相对路径（失败项不包含）

#### Scenario: 全部失败
- **WHEN** 所有照片均上传失败
- **THEN** 回传空数组 `[]`，不调用 Bridge（或回传空数组，由 Web 端处理）
