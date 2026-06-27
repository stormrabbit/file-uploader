## Why

当前「全选」和「按日期全选」只能选中已加载到内存的照片（分页懒加载最多 80 张/页），用户点全选时实际选中数远少于影集总数，造成数据丢失。需要修复为真正意义上的"全选所有照片"。

## What Changes

- **AppBar 全选**：从"全选已加载"改为"加载全部再全选"——先拉取该影集所有 AssetEntity，再全选
- **日期分组全选**：某一天的照片可能跨越多个分页未全部加载，需先确保该日期所有照片已加载再全选
- **全选操作中增加加载进度提示**（Loading 遮罩），防止用户误以为已完成
- **全选完成后更新已加载数据**，使 UI 与实际数据一致（避免重复加载）
- **确认按钮常显 `已选/共有` 计数**（如 `确认 0/1000`），全选 Loading 期间按钮同样禁用

## Capabilities

### New Capabilities

- `photo-picker-full-select`: 相册选择器真实全选能力——支持预加载全部资产后全选，含加载态处理

### Modified Capabilities

- `photo-picker`: 修改「按日期全选」和「AppBar 全选」的行为，从操作已加载数据改为先加载再全选

## Impact

- **修改文件**：`lib/pages/photo_picker_page.dart`
  - 修改 `_toggleSelectAll`：改为先调用 `_loadAllAssets()` 加载全部照片再全选
  - 修改 `_toggleDateGroup`：改为先调用 `_loadAllAssetsForDate(date)` 确保该日期全部加载再全选
  - 新增 `_loadAllAssets()`：从 `_currentAlbum` 批量分页拉取所有照片直到取完
  - 新增 `_loadAllAssetsForDate(String date)`：加载目标日期的全部照片（复用 `_loadAllAssets` 后按日期过滤，或按需按日期增量加载）
  - 新增 `_isSelectAllLoading` 状态标志：全选加载期间显示 Loading 遮罩，AppBar 全选按钮与底部确认按钮同时禁用
  - 修改 `_buildBottomBar`：按钮文案改为 `确认 N/T`（N = 已选数，T = 影集总数），全选 Loading 期间 `onPressed` 置 null
