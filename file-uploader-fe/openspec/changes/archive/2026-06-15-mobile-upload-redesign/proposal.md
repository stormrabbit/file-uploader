## Why

移动端当前有文件列表、搜索、下载、删除等操作，老年用户不需要这些，增加了操作复杂度。本次改造将移动端职责收窄为"纯上传"，针对老年用户重新设计上传体验：极简界面 + 直观进度 + 强完成反馈。

## What Changes

- 移除文件列表、搜索栏、下载/删除操作、历史记录入口
- 新增串行队列上传（并发=1），支持一次选择多张图片
- 上传中展示当前图片缩略图 + 百分比进度数字
- 全部完成后展示全屏强反馈，包含引导用户去 PC 端查看的提示
- 移动端上传逻辑收敛到新的 `useUploadQueue` composable

## Capabilities

### New Capabilities

- `mobile-upload-flow`：移动端专注上传，串行队列（并发=1）、单图缩略图 + 百分比进度、全屏完成强反馈 + PC 查看引导

### Modified Capabilities

（无现有 spec 文件）

## Impact

- `src/pages/mobile/modules/Dashboard.vue`：全面重写，移除列表相关代码
- `src/compostions/upload.ts`：扩展新增 `useUploadQueue`
- 新增组件：`UploadProgress.vue`、`UploadDone.vue`
