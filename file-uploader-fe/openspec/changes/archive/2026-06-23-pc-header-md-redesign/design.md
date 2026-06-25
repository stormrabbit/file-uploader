## Context

PC 端使用 Element Plus 的 `<el-container>` / `<el-header>` 布局。当前 Header 仅渲染纯文字"简单存储"，宽度和高度默认由 Element Plus 决定（60px）。Dashboard 内有独立的 `.fuf-dashboard__toolbar` 存放所有操作按钮，导致视觉层次扁平。

技术约束：
- Vue 3 + TypeScript，Element Plus 组件库
- 无全局状态管理，操作按钮所需的事件需通过 `inject` / `provide` 或 prop 传递到 Header
- 桌面端（Electron）才有"设置"入口，需保持 `v-if="isDesktop"` 判断
- 清空全部依赖当前文件列表长度判断 disabled 状态，该状态在 Dashboard 层

## Goals / Non-Goals

**Goals:**
- Header 承载品牌名 + 全部主要操作按钮（上传、刷新、连接、设置、清空）
- Material Design AppBar 风格：elevation shadow、清晰配色层次
- 所有按钮点击区域 ≥ 44px，hover/active 反馈明显
- 不改变任何业务逻辑和 API 调用

**Non-Goals:**
- 不引入 Material Design 库（如 Vuetify），仅用 CSS 模拟 MD 风格
- 不做暗色模式
- 不改动 Mobile 端
- 不做组件拆分重构（如把 Header 独立为新组件）

## Decisions

**决策 1：操作按钮放在哪一层？**

App.vue 的 Header 目前没有 inject 到 uploadQueue 等状态。最简单的方案是把工具栏 HTML 直接移入 App.vue 的 Header 模板，同时把 `provide('uploadQueue')` 提升——但这会让 App.vue 混入业务逻辑。

**选择方案**：保留 Dashboard.vue 管理业务状态，将工具栏 HTML 物理移入 Header 区域，但通过在 `App.vue` 中用 `<slot>` 或直接把整个 Header 渲染委托给 Dashboard 来解决。具体实现：**App.vue 的 `<el-header>` 内容改为 `<slot name="header" />`，Dashboard.vue 通过 `<template #header>` 填充**。这样业务状态完全留在 Dashboard，Header 样式由 App.vue 控制，内容由 Dashboard 提供。

替代方案：把 toolbar 提升到 App.vue 并通过 inject 获取队列状态——耦合度更高，排除。

**决策 2：MD 风格如何实现？**

不引入 Vuetify 等重型库。通过以下 CSS 手段模拟 MD3 AppBar 效果：
- `box-shadow: 0 2px 4px -1px rgba(0,0,0,.2), 0 4px 5px rgba(0,0,0,.14)` (MD elevation 2)
- Header 背景用品牌主色（`#1a73e8`，参考 Google MD 蓝），文字白色
- 按钮用透明背景 + 白色文字，hover 时 `background: rgba(255,255,255,0.15)`，active 时 `transform: scale(0.96)`
- 图标 + 文字的 icon-label 按钮布局（Element Plus `el-button` + `el-icon` 组合）

**决策 3：清空全部按钮的位置和形式**

从工具栏最右侧独立出来，保留在 Header 右侧但用分隔线和颜色（半透明红/橙）与其他按钮区分，配 `el-tooltip` 说明操作含义。不改为 icon-only（老年人需要文字标签辅助理解）。

**决策 4：按钮标签用图标+文字还是纯文字？**

保留文字标签（图标可选），因为目标用户中 PC 端使用者（子女、管理者）可能不熟悉图标语义。主操作（上传文件）可以加图标增强视觉辨识度，次要操作（刷新/连接/设置）加小图标降低纯文字的枯燥感。

## Risks / Trade-offs

- **slot 方案增加了 App.vue / Dashboard.vue 的耦合**：Dashboard 现在需要知道 App 的 slot 名称。→ 缓解：slot 名固定为 `header`，语义清晰，后续如拆分为独立组件也容易迁移。
- **Header 高度增加**：从 60px 增到约 64px，文件网格可用高度略减（<5px），可接受。
- **Element Plus `el-button` 默认样式覆盖**：在彩色 Header 背景上需要重置 el-button 的背景、边框、颜色，可能需要较多 `:deep()` 穿透。→ 考虑用原生 `<button>` + 自定义样式替代 `el-button`，减少覆盖成本。
