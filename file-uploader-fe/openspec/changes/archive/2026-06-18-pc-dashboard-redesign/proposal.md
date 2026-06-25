## Why

PC 端当前用表格展示文件，图片体验差；上传功能存在但未针对多文件类型优化。本次改造将展示层改为文件网格（图片显缩略图 + 灯箱，非图片显类型图标），同时保留并完善上传功能，支持任意文件类型，满足 PC → PC 互传场景。

## What Changes

- 展示层：`el-table` → 文件网格（`FileGrid` 组件），支持图片灯箱预览
- 保留上传入口（`CommonUploader`），支持任意文件类型
- 新增排序功能：按上传时间（默认）/ 按上传批次
- 移除搜索筛选栏和分页
- 新增「清空全部」批量删除
- 不做自动轮询，用户手动刷新

## Capabilities

### New Capabilities

- `pc-file-gallery`：PC 端文件展示升级，文件网格 + 灯箱 + 排序 + 批量删除 + 上传任意文件

### Modified Capabilities

（无现有 spec 文件）

## Impact

- `src/pages/pc/modules/Dashboard.vue`：重写展示区域，保留上传按钮，移除搜索和分页
- 新增组件：`FileGrid.vue`
