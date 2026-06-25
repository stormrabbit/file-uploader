## 1. 存量 Bug 修复

- [x] 1.1 修复 `src/compostions/load.ts`：确认 `page`、`fileResult`、`formObj`、`loading` 等 ref 已移入 `useLoadFile` 函数内部
- [x] 1.2 修复 `src/pages/mobile/modules/Dashboard.vue`：删除确认改为 import `confirm` from `@/utils/mobileHelpers` 替换 `window.confirm`
- [x] 1.3 修复 `src/pages/mobile/modules/Dashboard.vue`：样式块 `.fuf-dashboard` 改为 `.fuf-mobile-dashboard`

## 2. 上传队列 Composable

- [x] 2.1 扩展 `src/compostions/upload.ts`，新增 `useUploadQueue`，定义 `UploadTask` 接口（`file`、`previewUrl`、`status: 'pending'|'uploading'|'done'|'failed'`、`progress: number`）；并发数定义为可配置常量 `UPLOAD_CONCURRENCY`（默认值 1）
- [x] 2.2 实现 `enqueue(files: File[])` 方法：为每个文件生成 `URL.createObjectURL` 预览 URL，推入 tasks 队列
- [x] 2.3 实现队列 `start()` 方法：按 `UPLOAD_CONCURRENCY` 控制并发，逐张执行上传（无需前端 MD5 去重，后端处理），实时更新对应 task 的 `status` 和 `progress`
- [x] 2.4 实现 `releasePreviewUrl(task)` 方法：单张完成后立即 `revokeObjectURL` 释放内存

## 3. 移动端上传页面组件

- [x] 3.1 新建 `src/pages/mobile/modules/UploadProgress.vue`：展示当前上传图片缩略图 + 居中白色百分比数字（如"42%"），底部显示「正在上传 x/N」，上传完一张自动切换下一张
- [x] 3.2 新建 `src/pages/mobile/modules/UploadDone.vue`：全屏完成提示覆盖层，显示传送数量和失败数量，包含引导用户去电脑端查看的明显提示文字，用户点击关闭按钮后 emit `done` 事件（不自动跳转）
- [x] 3.3 改造 `src/pages/mobile/modules/Dashboard.vue`：移除文件列表、搜索栏、下载/删除操作、历史记录入口；三阶段布局：① 超大上传按钮（idle 状态）→ ② `UploadProgress`（uploading 状态）→ ③ `UploadDone`（done 状态，用户手动关闭回到 ①）

## 4. 样式

- [x] 4.1 为 `UploadProgress.vue` 编写 SCSS 样式：单图居中展示、百分比数字叠加（白色，字号 ≥ 48px）、底部进度文字（BEM 命名）
- [x] 4.2 为 `UploadDone.vue` 编写 SCSS 样式：全屏覆盖、绿色背景或图标、标题字号 ≥ 28px、PC 查看引导提示字号 ≥ 18px、关闭按钮醒目大号（BEM 命名）
- [x] 4.3 为改造后的 `Dashboard.vue` 补充超大上传按钮样式：高度 ≥ 120px，字号 ≥ 20px
