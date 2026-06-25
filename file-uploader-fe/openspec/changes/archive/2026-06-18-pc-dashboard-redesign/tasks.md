## 1. FileGrid 组件

- [ ] 1.1 新建 `src/pages/pc/modules/FileGrid.vue`：接收 `files` prop，渲染文件网格；图片类型（jpg/jpeg/png/gif/webp/bmp/svg）显示 `el-image` 缩略图，非图片类型显示文件类型图标 + 文件名
- [ ] 1.2 为图片卡片接入 `el-image-viewer` 灯箱，点击图片打开全屏预览，支持左右切换所有图片
- [ ] 1.3 定义文件类型图标映射表（`pdf` / `doc/docx` / `zip/rar` / `xls/xlsx` / 其他），兜底使用通用文件图标
- [ ] 1.4 网格列数使用可配置常量：`GRID_COLS_WIDE = 6`（≥1280px）、`GRID_COLS_NARROW = 3`（<1280px）

## 2. 排序功能

- [ ] 2.1 在 `src/compostions/load.ts` 的 `useLoadFile` 中新增 `sortMode: 'time' | 'batch'` ref 和对应的排序计算逻辑
- [ ] 2.2 实现按时间排序：按 `createDate` 降序（默认）
- [ ] 2.3 实现按批次排序：将 `createDate` 相差 ≤ 60 秒的文件归为同一批次，按批次降序分组展示，组内按时间排序；60 秒阈值定义为可配置常量 `BATCH_TIME_THRESHOLD_SECONDS`

## 3. PC 端 Dashboard 改造

- [ ] 3.1 改造 `src/pages/pc/modules/Dashboard.vue`：移除 `el-table`、搜索筛选栏（文件名、日期筛选）、分页组件
- [ ] 3.2 引入 `FileGrid` 组件替换表格区域，传入排序后的文件列表
- [ ] 3.3 新增排序切换 UI（`el-radio-group` 或 `el-segmented`）：按上传时间 / 按上传批次
- [ ] 3.4 保留 `CommonUploader` 上传按钮，确认支持任意文件类型（`accept` 属性设为空或 `*`）
- [ ] 3.5 新增「清空全部」按钮，点击后弹出确认框，确认后遍历列表逐个调用 `deleteFileById`，完成后刷新列表
- [ ] 3.6 将 `style="flex: 1"` 行内样式抽为 SCSS class

## 4. 样式

- [ ] 4.1 为 `FileGrid.vue` 编写 SCSS 样式：响应式网格（列数使用可配置常量）、图片缩略图卡片、非图片类型图标卡片、hover 时显示操作浮层（下载/删除）（BEM 命名）
- [ ] 4.2 为 PC 端 `Dashboard.vue` 补充工具栏样式：排序切换和「清空全部」按钮布局
