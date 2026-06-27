## 1. 新增 _isSelectAllLoading 状态与 Loading 遮罩

- [x] 1.1 在 `_PhotoPickerPageState` 中新增 `bool _isSelectAllLoading = false` 字段
- [x] 1.2 修改 `build()` 方法：用 `Stack` 包裹 `Scaffold`，当 `_isSelectAllLoading` 为 true 时叠加半透明 `ModalBarrier`（`color: Colors.black26`）和居中 `CircularProgressIndicator`
- [x] 1.3 AppBar 全选按钮 `onPressed` 改为：`_isSelectAllLoading ? null : _toggleSelectAll`
- [x] 1.4 底部确认按钮 `onPressed` 改为：`_isSelectAllLoading ? null : _onConfirm`

## 2. 修改 _buildBottomBar() 文案格式

- [x] 2.1 按钮文案改为 `确认 N/T`：N = `_selectedList.length`，T = `_totalCount`，示例：`确认 0/1000`
- [x] 2.2 当 `_totalCount == 0` （影集未完成初始化）时文案降级为 `确认 0/--`，避免显示错误数据

## 3. 新增 _loadAllAssets() 工具方法

- [x] 3.1 新增 `Future<void> _loadAllAssets()` 方法：循环调用 `_currentAlbum!.getAssetListPaged` 直到 `_loadedCount >= _totalCount`，每批结果调用 `_groupByDate` + `_mergeGroups` 合并，不在内部 setState
- [x] 3.2 方法内 `_totalCount` 若为 0 则先通过 `_currentAlbum!.assetCountAsync` 初始化

## 4. 修改 _toggleSelectAll() 为真全选

- [x] 4.1 改为 `async` 方法：执行前 `setState(() => _isSelectAllLoading = true)`
- [x] 4.2 调用 `await _loadAllAssets()` 加载全部剩余照片
- [x] 4.3 加载完成后在 setState 内执行原有全选/全取消逻辑（操作 `_dateGroups` 中全部照片）
- [x] 4.4 finally 块中 `setState(() => _isSelectAllLoading = false)`

## 5. 修改 _toggleDateGroup() 为真全选

- [x] 5.1 改为 `async` 方法：执行前 `setState(() => _isSelectAllLoading = true)`
- [x] 5.2 先调用 `await _loadAllAssets()` 确保全部照片已加载（按日期分组将自动包含目标日期的全部照片）
- [x] 5.3 加载完成后重新从 `_dateGroups` 查找目标日期的 group（引用可能已变，需按 `group.date` 重新匹配）
- [x] 5.4 执行原有全选/全取消逻辑
- [x] 5.5 finally 块中 `setState(() => _isSelectAllLoading = false)`

## 6. 验证

- [ ] 6.1 真机验证：影集有 200 张照片（超过 80 张/页），点 AppBar「全选」→ 显示 Loading 遮罩 → 完成后已选数等于影集总数
- [ ] 6.2 验证「按日期全选」：选某一天「全选」，该日期所有照片（含未加载页）均被选中
- [ ] 6.3 验证全选后再次点击「取消全选」，所有照片取消选中，`_selectedIds` 清空
- [ ] 6.4 验证 Loading 遮罩期间 AppBar 全选按钮与底部确认按钮均不可点击
- [ ] 6.5 验证影集已全部加载时（`_loadedCount >= _totalCount`），`_loadAllAssets` 直接跳过，全选操作即时响应
- [ ] 6.6 验证确认按钮常显 `N/T` 格式：初始进入页面显示 `确认 0/1000`，选中 3 张后显示 `确认 3/1000`
