## 1. 依赖与权限配置

- [x] 1.1 在 `pubspec.yaml` 添加依赖：`photo_manager: ^3.3.0`，运行 `flutter pub get`
- [x] 1.2 在 `android/app/src/main/AndroidManifest.xml` 添加相册权限：`READ_MEDIA_IMAGES`（Android 13+）和 `READ_EXTERNAL_STORAGE`（maxSdkVersion=32）
- [x] 1.3 在 `ios/Runner/Info.plist` 添加 `NSPhotoLibraryUsageDescription`（iOS 目录不存在，跳过）

## 2. PhotoPickerPage 骨架

- [x] 2.1 新建 `lib/pages/photo_picker_page.dart`，定义 `PhotoPickerPage` StatefulWidget，接收可选的回调参数 `onConfirm(List<AssetEntity>)`
- [x] 2.2 在 `initState` 中请求相册权限（`PhotoManager.requestPermissionExtend`），权限拒绝时 `pop` 返回
- [x] 2.3 加载全部影集列表（`PhotoManager.getAssetPathList`），默认选中「所有照片」影集
- [x] 2.4 搭建 AppBar：左侧影集切换入口（DropdownButton 或 BottomSheet），右侧「全选」文字按钮

## 3. 照片网格实现

- [x] 3.1 按日期（`AssetEntity.createDateTime` 的年月日）对照片分组，生成有序列表结构
- [x] 3.2 使用 `CustomScrollView` + `SliverList` 渲染日期分组，每个分组含标题行和 3 列网格
- [x] 3.3 日期标题行右侧添加「全选」按钮，点击切换该日期分组的全选/全取消状态
- [x] 3.4 照片缩略图使用 `AssetEntityImage` 渲染，右上角叠加勾选角标（选中时显示带序号的蓝色圆圈）
- [x] 3.5 使用分页加载（`getAssetListPaged`，每页 80 张），滚动到底部时自动加载下一页

## 4. 多选模式交互

- [x] 4.1 实现逐张勾选：点击单张照片切换选中状态，`Set<String>` 存储选中 id，同步更新序号
- [x] 4.2 实现按日期全选：点击日期组「全选」按钮，全选/全取消该日期下所有照片
- [x] 4.3 实现按影集全选：切换影集后，AppBar 中添加「全选影集」按钮，点击全选/全取消当前影集照片
- [x] 4.4 实现一键全选：AppBar「全选」按钮全选/全取消当前加载的全部照片

## 5. 底部确认栏与回传

- [x] 5.1 底部固定「确认（N 张）」按钮，N 为已选数量，未选时 N=0 且点击时 SnackBar 提示「请至少选择一张照片」
- [x] 5.2 点击确认时 `Navigator.pop(context, selectedAssets)` 将选中的 `List<AssetEntity>` 回传

## 6. WebViewPage 改造

- [x] 6.1 修改 `_onBridgeMessage`：`pickImage` 消息改为 `Navigator.push` 到 `PhotoPickerPage`
- [x] 6.2 等待 `PhotoPickerPage` pop 回传结果，若结果非空则构造 JSON 数组（含 `id` 和 `uri`）
- [x] 6.3 调用 `_webViewController.runJavaScript("window.UploadBridge_callback('${jsonString}')")` 注入回调
- [x] 6.4 删除 `_showBridgeDialog` 方法

## 7. 验证

- [ ] 7.1 真机验证：打开 App → 扫码进入 WebView → 触发 pickImage → 相册选择器正常弹出
- [ ] 7.2 验证逐张选择、按日期全选、按影集全选、一键全选四种选择模式均正常工作
- [ ] 7.3 验证确认后 Web 端 `UploadBridge_callback` 收到正确 JSON 数据
- [ ] 7.4 验证取消选择后 WebView 状态不变，无多余回调
