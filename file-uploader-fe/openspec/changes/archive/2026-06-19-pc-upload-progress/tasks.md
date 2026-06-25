## 1. 扩展 useUploadQueue composable

- [x] 1.1 在 `UploadTaskStatus` 中新增 `cancelled` 状态
- [x] 1.2 在 `useUploadQueue` 中添加 `abortController` ref（每次 `startQueue` 时重新创建）
- [x] 1.3 在 `processTask` 中引入 MD5 计算和秒传去重逻辑（`isFileExistByMd5` / `updateFileDateByMd5`）
- [x] 1.4 将 `AbortSignal` 传递给 `uploadFile` API 调用
- [x] 1.5 实现 `cancelQueue()` 方法：中断当前请求（`abortController.abort()`）、将所有 `pending` 任务标记为 `cancelled`
- [x] 1.6 在 `uploadFile` API 函数签名中新增可选 `signal?: AbortSignal` 参数并透传给 Axios

## 2. 新建 UploadProgressBar 组件

- [x] 2.1 创建 `src/pages/pc/modules/UploadProgressBar.vue`
- [x] 2.2 定义 props：`totalCount`、`doneCount`、`currentFileProgress`（0-100）
- [x] 2.3 计算 `overallProgress = Math.round((doneCount * 100 + currentFileProgress) / totalCount)`
- [x] 2.4 使用 `el-progress` 展示整体进度条（`type="line"`，`stroke-width` 适配 footer 高度）
- [x] 2.5 展示"正在上传 {doneCount + 1} / 共 {totalCount} 个文件"文字（完成后显示"已完成 {totalCount} 个文件"）
- [x] 2.6 添加「停止上传」`el-button`，点击时 emit `stop` 事件

## 3. 改造 App.vue — 队列 provide + footer 渲染

- [x] 3.1 在 `App.vue` 中实例化 `useUploadQueue`，通过 `provide('uploadQueue', ...)` 向下注入
- [x] 3.2 `el-footer` 中添加 `<UploadProgressBar v-if="isUploading" ...>`，绑定队列状态
- [x] 3.3 上传未进行时 footer 正常显示版权文字（`v-else`）
- [x] 3.4 监听 `isAllSettled`（watch），完成时调用 `resetQueue()`，并 emit 事件通知 Dashboard 刷新列表
- [x] 3.5 处理 `stop` 事件：调用 `cancelQueue()`，随后 `resetQueue()`

## 4. 重构 Dashboard.vue 上传区域

- [x] 4.1 移除 `<common-uploader>` 引用，改用隐藏的 `<input type="file" multiple accept="*">` 触发文件选择
- [x] 4.2 通过 `inject('uploadQueue')` 获取队列实例
- [x] 4.3 文件选择后调用 `enqueue(files)` + `startQueue()`
- [x] 4.4 上传完成（由 App.vue 通知）时调用 `retrieveFilesAction()` 刷新文件列表
- [x] 4.5 处理 stop 后的列表刷新（cancelQueue 后也需刷新已上传部分）

## 5. 验证与收尾

- [x] 5.1 手动测试：选多个文件，观察 footer 进度计数和进度条是否正确推进，主内容区布局不变
- [x] 5.2 手动测试：上传中途点击「停止上传」，确认请求中断、footer 恢复版权文字、已传文件出现在列表
- [x] 5.3 手动测试：秒传场景（重复上传同一文件），确认进度正常跳过并计入已完成
- [x] 5.4 检查 TypeScript 无编译错误（`npm run build`）
