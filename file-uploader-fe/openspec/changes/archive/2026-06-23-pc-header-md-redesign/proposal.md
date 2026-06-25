## Why

PC 端 Header 区域空白、工具栏按钮层级混乱（两个 primary 按钮并排、大小不一），整体风格偏原始。老年人使用时点击区域偏小、hover/active 反馈不明显，影响使用信心。重新设计 Header 和操作按钮，可以在不改变任何业务逻辑的前提下显著提升可用性和视觉质量。

## What Changes

- **Header 重新设计**：从纯文字标题升级为 Material Design 风格的 AppBar，左侧品牌名 + 图标，右侧承载主要操作按钮
- **操作按钮迁移**：将"上传文件"、"刷新"、"连接"、"设置（桌面端）"从 Dashboard 工具栏移入 Header 右侧
- **按钮样式统一**：采用 MD 风格 icon+label 按钮，颜色层次清晰（主操作高亮、次要操作低调）
- **"清空全部"独立处理**：从工具栏移出，改为文件区右上角的图标按钮 + el-tooltip，降低误触风险，同时保留足够大的点击区域
- **交互反馈增强**：所有按钮增加明显的 hover 背景色变化、active 下压效果（transform scale），点击区域 min-height 44px
- **Header elevation**：Header 加 box-shadow，与内容区产生层次感（MD elevation 2）
- 不改变任何 API 调用、文件上传、删除等业务逻辑
- 不修改 Mobile 端任何文件

## Capabilities

### New Capabilities

- `pc-header-appbar`: 重新设计的 PC AppBar，承载品牌标识和所有主要操作入口，MD 风格 elevation + 交互反馈

### Modified Capabilities

（无 spec 级别行为变更，纯 UI 层改动）

## Impact

- `src/pages/pc/App.vue`：Header 样式重写，引入新 AppBar 结构
- `src/pages/pc/modules/Dashboard.vue`：工具栏（toolbar）简化，清空按钮移位
- `src/style/modules/dashboard.scss`：toolbar 样式更新
- 新增样式：Header/AppBar 的 SCSS（可内联或新建 `src/style/modules/appbar.scss`）
- 无新增依赖（沿用 Element Plus、现有 icon 体系）
