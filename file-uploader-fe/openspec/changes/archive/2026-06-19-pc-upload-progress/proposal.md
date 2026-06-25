## Why

PC 端目前缺少文件上传的进度反馈：用户点击上传后无法得知正在上传第几个文件、整体完成百分比，也无法中途取消（传错文件时只能等待）。

## What Changes

- PC 端上传区域新增进度面板，显示"正在上传 N / 共 M 个文件"计数
- 显示当前文件及整体上传进度百分比（基于文件数，可选叠加字节数）
- 新增"停止上传"按钮，可随时取消剩余队列中的上传任务

## Capabilities

### New Capabilities

- `pc-upload-progress`: PC 端上传进度展示与取消控制——包括队列计数、百分比进度条和停止按钮

### Modified Capabilities

- `pc-file-gallery`: PC 端文件列表交互区域需为进度面板腾出展示位置（布局层面的 requirement 变更）

## Impact

- `src/pages/pc/` — 上传触发逻辑、UI 布局
- `src/compostions/useUpload.ts` — 需暴露队列状态（总数、已完成数、当前进度）及取消方法
- 无 API 层变更，无外部依赖新增
