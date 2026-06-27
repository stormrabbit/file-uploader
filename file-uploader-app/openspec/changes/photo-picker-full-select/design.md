## Context

`PhotoPickerPage` 当前使用分页懒加载（每页 80 张），`_toggleSelectAll` 和 `_toggleDateGroup` 均只操作已存入 `_dateGroups` 的照片。当影集总量超过已加载页数时，「全选」实际只选中了内存中的部分数据，导致用户认知与实际选中数不一致。

现有关键字段：

- `_currentAlbum`：当前影集（`AssetPathEntity`）
- `_dateGroups`：已加载并按日期分组的照片（`List<_DateGroup>`）
- `_loadedCount` / `_totalCount`：已加载数 / 影集总数
- `_pageSize = 80`：每页大小

## Goals / Non-Goals

**Goals:**

- `_toggleSelectAll` 改为：若 `_loadedCount < _totalCount`，先加载全部剩余照片再全选
- `_toggleDateGroup` 改为：若该日期照片可能存在未加载项，先补全加载再全选
- 全选加载过程中显示 Loading 遮罩，按钮不可重复点击
- 加载完成后 `_dateGroups` / `_loadedCount` 同步更新，UI 与数据一致

**Non-Goals:**

- 不改变逐张选择逻辑
- 不改变分页懒加载的正常滚动行为
- 不引入新依赖

## Decisions

### D1：_loadAllAssets() — 加载全部照片

新增工具方法，核心逻辑：

```dart
Future<void> _loadAllAssets() async {
  if (_currentAlbum == null) return;
  // 已全部加载则跳过
  if (_loadedCount >= _totalCount) return;

  // 循环分页直到拉完
  while (_loadedCount < _totalCount) {
    final page = _loadedCount ~/ _pageSize;
    final assets = await _currentAlbum!.getAssetListPaged(page: page, size: _pageSize);
    if (assets.isEmpty) break;
    _loadedCount += assets.length;
    final newGroups = _groupByDate(assets);
    _mergeGroups(newGroups);  // 复用现有方法
  }
}
```

方法不调用 `setState`，由调用方统一 setState 刷新。

### D2：_loadAllAssetsForDate(String date) — 按日期按需加载

日期分组全选的难点：某一天的照片可能在中间某页，分散在多个 page。由于 `photo_manager` 没有按日期过滤的分页 API，**最简可行方案是复用 `_loadAllAssets()`**——先加载全部，再从 `_dateGroups` 中找目标日期。

这样无需额外实现，也避免引入复杂的日期过滤逻辑。代价是首次按日期全选会预加载全影集，但实际场景中用户既然点了全选，全量加载是预期行为。

### D3：_isSelectAllLoading — Loading 状态

新增 `bool _isSelectAllLoading = false` 标志：

- 全选/日期全选操作开始时置 `true`，显示全屏半透明遮罩 + `CircularProgressIndicator`
- 加载完成后置 `false`，移除遮罩并执行选中逻辑
- 遮罩期间 AppBar 全选按钮与底部确认按钮 `onPressed` 同时置 null，防止重复触发

### D4：UI 结构调整

在 `build()` 的 `Scaffold` 外用 `Stack` 包裹，叠加 Loading 遮罩层：

```
Stack
├── Scaffold（原有结构）
└── if (_isSelectAllLoading)
    ModalBarrier + CircularProgressIndicator（居中）
```

不使用 `showDialog` 而用 Stack 内联遮罩，避免 context 生命周期问题。

### D5：底部确认按钮文案

按钮文案改为常显 `确认 N/T` 格式：

- `N`：`_selectedList.length`（已选数）
- `T`：`_totalCount`（影集总数，初始化后可直接读取）

全选 Loading 期间 `onPressed` 置 null，避免用户在加载中提前确认导致数据不完整。

## Risks / Trade-offs

- **按日期全选会触发全量加载**：当用户只想全选某一天但影集很大时，会加载全部照片。可接受——点全选本身意味着用户愿意等待；且加载后数据缓存在 `_dateGroups` 中，不会重复加载。
- **`_loadAllAssets` 期间 `_loading` 与 `_isSelectAllLoading` 并存**：`_loading` 控制列表底部加载指示器，`_isSelectAllLoading` 控制全屏遮罩，两者语义不同，需确保 `_loadAllAssets` 执行期间不修改 `_loading`，避免底部 loading 指示器闪烁。
- **界面流畅性**：`getAssetListPaged` 是平台层 IO 操作，`await` 会 yield event loop，**不会阻塞 UI 线程**。需注意 `_loadAllAssets` 内部循环不应每批次调用 `setState`，否则几百张照片的影集会触发数十次 rebuild 导致界面抖动。应在全部加载完成后由调用方统一 `setState` 一次刷新。
