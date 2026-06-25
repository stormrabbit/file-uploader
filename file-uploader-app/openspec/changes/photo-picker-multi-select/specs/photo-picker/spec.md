## ADDED Requirements

### Requirement: 展示相册网格
PhotoPickerPage SHALL 以时间倒序网格布局展示手机相册中的全部照片，每行固定 3 列，每张照片右上角显示勾选状态。

#### Scenario: 打开选择器
- **WHEN** App 收到 Bridge `pickImage` 消息且用户已授予相册权限
- **THEN** App SHALL 跳转到 PhotoPickerPage，加载并展示全部照片缩略图网格

#### Scenario: 相册权限未授予
- **WHEN** App 收到 Bridge `pickImage` 消息但用户未授予相册权限
- **THEN** App SHALL 发起相册权限请求；用户拒绝后停留在 WebView 页面，不跳转

### Requirement: 逐张勾选照片
用户 SHALL 能够点击单张照片缩略图切换其勾选状态（选中/取消选中）。

#### Scenario: 点击未选中照片
- **WHEN** 用户点击一张未勾选的照片
- **THEN** 该照片 SHALL 进入选中状态，右上角显示带序号的勾选标记

#### Scenario: 点击已选中照片
- **WHEN** 用户点击一张已勾选的照片
- **THEN** 该照片 SHALL 取消选中，其他已选照片的序号 SHALL 自动重新排列

### Requirement: 按日期全选
用户 SHALL 能够选择某一天拍摄的全部照片。

#### Scenario: 点击日期组全选按钮
- **WHEN** 用户点击照片列表中某日期分组标题旁的「全选」按钮
- **THEN** 该日期下全部照片 SHALL 进入选中状态；若已全部选中则改为全部取消

### Requirement: 按影集全选
用户 SHALL 能够通过影集选择器切换当前浏览的影集，并一键全选该影集全部照片。

#### Scenario: 切换影集
- **WHEN** 用户点击顶部影集切换入口并选择某个影集
- **THEN** 网格内容 SHALL 更新为所选影集的照片，当前勾选状态保持不变

#### Scenario: 点击影集全选
- **WHEN** 用户点击当前影集的「全选影集」按钮
- **THEN** 当前影集内全部照片 SHALL 进入选中状态；若已全部选中则改为全部取消

### Requirement: 一键全选
用户 SHALL 能够一键选中相册内全部照片。

#### Scenario: 点击「全选」
- **WHEN** 用户点击 AppBar 中的「全选」按钮
- **THEN** 当前加载的全部照片 SHALL 进入选中状态

#### Scenario: 再次点击「全选」（已全选状态）
- **WHEN** 全部照片已处于选中状态，用户再次点击「全选」按钮
- **THEN** 全部照片 SHALL 取消选中

### Requirement: 确认选择并回传数据
用户 SHALL 能够确认所选照片，App 将文件信息通过 Bridge 回传给 Web 端。

#### Scenario: 点击「确认」按钮
- **WHEN** 用户选中至少一张照片并点击底部「确认（N 张）」按钮
- **THEN** App SHALL 返回 WebViewPage，并通过 `window.UploadBridge_callback` 将已选照片的本地 URI 列表（JSON 数组）注入 WebView

#### Scenario: 未选任何照片时点击确认
- **WHEN** 用户未选中任何照片点击「确认」
- **THEN** App SHALL 提示「请至少选择一张照片」，不关闭选择器
