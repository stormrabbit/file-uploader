## 1. App.vue Header 重构

- [x] 1.1 将 `<el-header>` 高度从默认 60px 调整为 64px，添加 MD elevation 2 阴影和品牌主色背景（`#1a73e8`）
- [x] 1.2 在 Header 左侧添加品牌区：上传图标 + "简单存储"文字（白色，font-weight 500）
- [x] 1.3 在 Header 右侧添加 `<slot name="toolbar" />`，供 Dashboard 注入操作按钮
- [x] 1.4 编写 `.fuf-pc-header` 新样式：flexbox 布局、左右分区、按钮交互样式（hover 背景、active scale）

## 2. Dashboard.vue 工具栏迁移

- [x] 2.1 将"上传文件"按钮移入 `<template #toolbar>`，样式改为 Header 风格（白色文字、透明背景）
- [x] 2.2 将"刷新"按钮移入 `<template #toolbar>`，降低视觉权重（加图标、去掉 type="primary"）
- [x] 2.3 将"连接"按钮移入 `<template #toolbar>`
- [x] 2.4 将"设置"按钮（`v-if="isDesktop"`）移入 `<template #toolbar>`
- [x] 2.5 将"清空全部"按钮移入 `<template #toolbar>` 右侧，加分隔线与主操作区分，保留 disabled 逻辑
- [x] 2.6 删除 `.fuf-dashboard__toolbar` 整块 HTML 及对应 SCSS

## 3. 样式完善

- [x] 3.1 更新 `src/style/modules/dashboard.scss`：移除 toolbar 相关样式，调整文件网格顶部间距
- [x] 3.2 在 `App.vue` 或新建 `src/style/modules/appbar.scss` 中补充所有 AppBar 按钮样式：min-height 44px、hover/active 效果、清空按钮警告色
- [x] 3.3 验证 Header 在 1280px 以下窗口宽度的响应式显示（按钮不换行、不溢出）

## 4. 验证

- [ ] 4.1 启动开发服务器，逐一点击所有按钮（上传、刷新、连接、设置、清空），确认业务逻辑正常
- [ ] 4.2 确认文件列表为空时"清空全部"处于 disabled 状态，有文件时可点击并弹出确认
- [ ] 4.3 确认 hover/active 效果在所有按钮上正常触发
- [ ] 4.4 确认 Electron 桌面端"设置"按钮正常显示，Web 端不显示
