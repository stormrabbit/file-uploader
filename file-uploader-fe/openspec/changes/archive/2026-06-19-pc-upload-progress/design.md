## Context

PC 端目前使用 `<common-uploader>` 组件触发上传，该组件内部有独立的 `loading` 布尔状态，不对外暴露队列进度。`useUploadQueue` composable 已具备 `totalCount`、`doneCount`、`currentTask.progress` 等状态，但 PC 端 Dashboard 完全未使用它。两套上传逻辑并行存在（已知 Bug，见 CLAUDE.md）。

## Goals / Non-Goals

**Goals:**
- 在 PC 端 `el-footer` 中显示上传进度状态栏（队列计数 + 整体进度条），不影响主内容区
- 提供「停止上传」按钮，可取消剩余待上传任务并中断当前上传
- 将 Dashboard 的上传逻辑迁移到 `useUploadQueue`，消除与 `commonUploader` 的重复

**Non-Goals:**
- 不修改 Mobile 端上传逻辑
- 不重构 `commonUploader`（仍保留供其他场景使用，但 PC Dashboard 不再依赖它）
- 不支持暂停/恢复（只支持完全停止）
- 不做字节级进度汇总（以文件数为颗粒度计算整体百分比）

## Decisions

### D1：Dashboard 直接使用 `useUploadQueue`，不再经 `<common-uploader>`

**选择**：在 Dashboard.vue 中移除 `<common-uploader>`，改用 `<el-upload>` 原生触发 + `useUploadQueue`。

**理由**：`commonUploader` 内部状态对外不可见，无法从外部读取进度；且 `useUploadQueue` 已提供完整队列语义，直接用最简洁。

**替代方案**：在 `commonUploader` 上增加 emit/expose — 可行但增加接口复杂度，且没有解决双重实现问题。

### D2：MD5 去重逻辑移入 `useUploadQueue.processTask`

**选择**：在 `processTask` 内部先计算 MD5、再判断是否秒传，保持现有业务语义。

**理由**：去重是上传业务规则，属于队列处理的一部分；放在 composable 内部比放在 UI 层更合理。

### D3：取消机制 — AbortController per task

**选择**：`useUploadQueue` 新增 `cancelQueue()` 方法：将所有 `pending` 任务标记为 `cancelled`，同时通过 `AbortController` 中断当前 `uploading` 任务。`uploadFile` API 接受可选 `signal` 参数。

**理由**：AbortController 是浏览器原生取消机制，Axios 已支持 `signal` 选项。

**替代方案**：用全局 flag 跳过队列 — 无法中断已发出的 HTTP 请求，用户体验差。

### D4：进度状态栏放在 `App.vue` 的 `el-footer`，队列通过 `provide/inject` 共享

**选择**：`App.vue` 实例化 `useUploadQueue` 并通过 `provide` 向下注入；`el-footer` 内嵌 `UploadProgressBar.vue`，上传时替换底部版权文字；`Dashboard.vue` 通过 `inject` 获取队列，负责触发上传。

**理由**：进度显示在 footer，与主内容区完全隔离，不影响 Dashboard 布局；`provide/inject` 是 Vue 3 推荐的跨层级状态共享方式，无需引入全局 store。

**替代方案**：在 Dashboard 工具栏下方插入面板 — 会占用主内容区高度，布局跳变；用全局单例 composable — MPA 场景可用但绕过了 Vue 响应式生命周期。

### D5：整体进度百分比计算

**选择**：`overallProgress = Math.round((doneCount * 100 + currentFileProgress) / totalCount)`

**理由**：文件数加权，每文件均分权重，当前文件单独贡献其进度占比，视觉平滑。

## Risks / Trade-offs

- [MD5 计算耗时] processTask 内部计算 MD5 会短暂阻塞进度显示（进度条在 0% 停顿）→ 未来可加 `status: 'hashing'` 状态，此版本暂不处理
- [秒传场景] 秒传时 progress 直接跳到 100%，进度条会瞬间跳过 → 行为符合预期，文档不需要特别处理
- [commonUploader 仍存在] Dashboard 不再使用它，但组件文件未删除，存在死代码 → 在 tasks 中标记为 low-priority cleanup，不阻塞本 PR

## Migration Plan

1. 扩展 `useUploadQueue`：增加 MD5 去重、AbortController、`cancelQueue()`、新 task 状态 `cancelled`
2. 新建 `UploadProgressBar.vue`（footer 内嵌组件）
3. 改造 `App.vue`：实例化队列、provide 向下、footer 条件渲染进度条
4. 重写 Dashboard.vue 上传区域（移除 `<common-uploader>`，inject 队列触发上传）
5. 无 API 变更，无部署步骤
