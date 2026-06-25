## ADDED Requirements

### Requirement: AppBar 承载品牌标识
PC 端顶部 AppBar 的左侧 SHALL 显示应用品牌名称"简单存储"，配合一个上传类图标，字体白色、字重 500。

#### Scenario: 页面加载后显示品牌名
- **WHEN** 用户打开 PC 端页面
- **THEN** Header 左侧显示"简单存储"文字和图标，字色为白色

### Requirement: AppBar 主要操作按钮区
AppBar 右侧 SHALL 提供以下操作按钮（从左到右）：上传文件、刷新、连接、设置（仅桌面端）。每个按钮点击区域 SHALL 不小于 44px 高度。

#### Scenario: 上传文件按钮触发文件选择
- **WHEN** 用户点击"上传文件"按钮
- **THEN** 系统弹出系统文件选择对话框，支持多选

#### Scenario: 刷新按钮重新加载文件列表
- **WHEN** 用户点击"刷新"按钮
- **THEN** 系统重新请求文件列表 API 并更新页面

#### Scenario: 连接按钮打开二维码弹窗
- **WHEN** 用户点击"连接"按钮
- **THEN** 弹出手机扫码连接对话框

#### Scenario: 设置按钮仅在桌面端显示
- **WHEN** 应用运行在 Electron 桌面端（`window.electronAPI.isDesktop === true`）
- **THEN** AppBar 显示"设置"按钮；否则该按钮不渲染

#### Scenario: 设置按钮打开存储位置弹窗
- **WHEN** 用户在桌面端点击"设置"按钮
- **THEN** 弹出存储位置设置对话框

### Requirement: 清空全部按钮与危险操作区分
AppBar 右侧 SHALL 有一个"清空全部"按钮，视觉上与主操作按钮有明显区分（使用警告色或分隔线），当文件列表为空时 SHALL 处于 disabled 状态。

#### Scenario: 有文件时清空按钮可点击
- **WHEN** 文件列表中至少有一个文件
- **THEN** "清空全部"按钮处于 enabled 状态，用户可点击触发清空确认

#### Scenario: 无文件时清空按钮禁用
- **WHEN** 文件列表为空
- **THEN** "清空全部"按钮处于 disabled 状态，点击无反应

#### Scenario: 清空按钮触发确认弹窗
- **WHEN** 用户点击启用状态的"清空全部"按钮
- **THEN** 系统弹出确认弹窗，用户确认后删除全部文件

### Requirement: AppBar 视觉层次（MD elevation）
AppBar SHALL 使用品牌主色背景（`#1a73e8`）、白色文字，并应用 Material Design elevation 2 级阴影，使其在视觉上浮于内容区之上。

#### Scenario: AppBar 阴影与内容区分离
- **WHEN** 文件网格内容滚动或页面初始加载
- **THEN** AppBar 始终显示在内容区上方，阴影可见，形成层次感

### Requirement: 按钮 hover / active 交互反馈
AppBar 内所有操作按钮 SHALL 在鼠标悬停时显示明显的背景高亮（半透明白色覆盖层），在按下时显示下压效果（轻微缩放），以向用户明确传达可点击状态。

#### Scenario: 鼠标悬停按钮时背景高亮
- **WHEN** 用户将鼠标移至任意 AppBar 按钮上
- **THEN** 按钮背景显示半透明白色高亮（rgba(255,255,255,0.15) 或更明显）

#### Scenario: 鼠标按下按钮时有下压效果
- **WHEN** 用户按下任意 AppBar 按钮（mousedown）
- **THEN** 按钮轻微缩小（transform: scale(0.95)），松开后恢复

### Requirement: Dashboard 工具栏移除
原 Dashboard 工具栏（`.fuf-dashboard__toolbar`）SHALL 被移除，不再在内容区顶部渲染额外的按钮行，内容区直接从文件网格开始。

#### Scenario: 内容区无冗余工具栏
- **WHEN** 用户查看 PC 端主页面
- **THEN** 文件网格区域直接从 Header 下方开始，无额外按钮行占用垂直空间
