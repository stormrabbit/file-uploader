## Context

当前实现：用户在 WebView 触发 `pickImage` → Flutter 跳转 `PhotoPickerPage` → 选完照片后回传本地文件路径 `{ id, uri }` → Web 端期望 `{ id, base64 }`，双方协议错配。

改为 App 原生上传后，Web 端只需接收轻量的服务端结果（如 `{ id, fileId, url }`），Flutter 侧负责全部上传逻辑。

上传服务端接口（端口 38902，host 来自扫码 URL），所有接口均返回包装结构 `{ code, data, message }`：
- `GET  /files/isExist/:md5`（路径参数）
  - `data` 为完整 file 对象（含 `id`）→ 文件已存在，可秒传
  - `data` 为空对象 `{}` → 文件不存在，需要上传
- `POST /files/upload`（multipart/form-data，字段名 `file`）→ `data` 为完整 file 对象（含 `id`、`fileUrl`、`fileName`）
- 注意：`fileUrl` 是服务端相对路径（如 `/static/2024-01-01/photo.jpg`），回传给 Web 时拼接 base URL 构造完整地址

## Goals / Non-Goals

**Goals:**
- App 侧完成 MD5 计算 → 秒传判断 → 上传全流程
- 最大并发 1（串行队列），上传失败跳过继续
- 原生进度 UI（百分比），不依赖 WebView
- 上传完成后通过 Bridge 回传结果给 Web 端
- 上传 host 动态取自扫码 IP，端口可配置（默认 38902）

**Non-Goals:**
- 断点续传 / 分片上传
- 上传历史记录持久化
- iOS 支持（当前项目以 Android 为主）

## Decisions

### 1. 串行队列而非真并发

用 `Queue`（`package:async`）实现最大并发为 1 的串行队列，而不是 `Isolate` 或多线程。

**理由**：移动端同一 WiFi 下串行上传避免带宽争抢，且实现简单，扩展时只改 `maxConcurrent` 参数即可。

### 2. 使用 `dio` 而非 `http`

`dio` 原生支持 `onSendProgress` 回调，无需额外封装；`http` 包不原生支持上传进度，需要手动分块流式写入，复杂度高。

**替代方案**：`http` + 手动分块 → 放弃，实现复杂且不稳定。

### 3. 上传进度 UI：BottomSheet 覆盖层

在 `WebViewPage` 上弹出一个持久 `BottomSheet`，展示每张照片的上传进度条和状态（等待中 / 上传中 / 成功 / 失败）。

**理由**：不跳转新页面，用户可感知进度全貌；全部完成后自动收起，体验连贯。

**替代方案**：SnackBar → 只能显示单条消息，无法展示多张并行状态。

### 4. 上传端口配置

扫码得到的 URL 形如 `http://10.188.149.81:38903/...`，从中提取 host（`10.188.149.81`），替换端口为 `38902`，构造上传 base URL。端口作为常量 `kUploadPort = 38902` 定义在配置文件中。

### 5. MD5 计算

使用 `crypto` 包计算 MD5。**MD5 计算在串行上传队列内执行（每张上传前计算 1 次），不单独开启 Isolate**。

**理由**：
- 串行队列已保证每次只处理 1 张图，MD5 计算将1张照片（平均因内存映射仅几帧， <10ms），不会卡顿 UI
- 启动 100 个 `compute()` Isolate 本身就有 ~几十ms 对象创建开销，且同时占用多核 CPU
- 若未来单文件超大（>50MB）导致 MD5 明显卡顿，再考虑切换到 `Isolate.spawn` 池方案

**放弃的方案**：每张图独立 `compute()` → 100 张就开 100 个 Isolate，内存和调度开销当远大于计算没本身。

## Risks / Trade-offs

- **大文件 MD5 阻塞 UI**：手机照片通常 3–10MB，串行队列内同步计算 <10ms，不影响 UI；若未来出现超大文件（>50MB）导致明显卡顿，再引入 `Isolate.spawn` 池处理
- **上传超时**：弱网环境单文件上传时间过长 → 设置 `dio` connectTimeout / receiveTimeout（默认 30s）
- **秒传接口不存在**：若 `/files/isExist` 返回非预期格式 → 捕获异常，降级为直接上传
- **Bridge 注入时机**：上传完成后 WebView 可能已导航离开 → 在 `runJavaScript` 前检查 `mounted`

## Migration Plan

1. 新增 `lib/services/upload_service.dart`（上传核心逻辑）
2. 新增 `lib/widgets/upload_progress_sheet.dart`（进度 UI）
3. 修改 `lib/pages/webview_page.dart`：`_openPhotoPicker` 串联上传流程
4. 新增配置常量 `lib/config/upload_config.dart`
5. `pubspec.yaml` 添加 `dio`、`crypto` 依赖
6. 无需数据库迁移，无 breaking API 变更

## Open Questions

- `UploadBridge_callback` 期望的字段名待 Web 端确认（建议回传 `{ id, fileId, fileUrl }`，其中 `fileUrl` 为相对路径，Web 端自行拼 host）
