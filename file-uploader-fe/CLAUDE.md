# file-uploader-fe

局域网文件/照片同步工具。手机端上传，PC 端浏览查看。

## 技术栈

- Vue 3 + TypeScript + Vite
- PC UI：Element Plus；Mobile UI：Vant
- 路由：Vue Router 4（无全局状态管理，composable 管理局部状态）
- 客户端 MD5：SparkMD5（分块计算，支持秒传去重）
- 构建：Vite MPA，自动 glob 发现页面

## 架构

MPA（多页应用）结构，PC 和 Mobile 完全隔离：

```
src/pages/pc/      → PC 应用（Element Plus）
src/pages/mobile/  → Mobile 应用（Vant）
src/api/           → 共享 API 层
src/services/      → Axios 封装
src/compostions/   → 共享 composables
src/utils/         → 工具函数
```

## 已知 Bug

| 优先级 | 位置 | 问题 |
|--------|------|------|
| 中 | `src/compostions/size.ts` | `window.onresize = fn` 会覆盖其他监听器，应改为 `addEventListener` + `onUnmounted` 移除 |
| 中 | `src/components/commonUploader/index.vue` | 重复实现了 `useUploadQueue`（`src/compostions/useUploadQueue.ts`）的 MD5+去重+上传逻辑，维护需同步两处 |

## 优点

- Vite MPA 自动发现页面，扩展零配置
- 客户端 MD5 秒传设计合理，局域网场景实用
- 移动端三段式状态机（`idle → uploading → done`）清晰
- 串行上传队列（concurrency=1）适合老人用户，单文件进度反馈友好

## 待优化项

**短期（修 Bug）**
- `window.onresize` 改为 `addEventListener`

**中期**
- `commonUploader` 复用 `useUploadQueue` composable，删除重复代码
- PC 端文件列表支持虚拟滚动或分页（当前 `page_size: 9999` 一次拉满）
- PC 端 5s 轮询自动刷新，感知手机端新上传

**长期**
- PC 端展示局域网 QR 码，老人扫码直达上传页
- 手机端支持拍照直传（`<input capture="camera">`）
- 批量删除
- 秒传场景显示 `skipped` 状态，用户感知更好

## 开发命令

```bash
npm run dev      # 开发服务器，端口 38903
npm run build    # 类型检查 + 构建 + 重排 dist 目录
npm run test:unit
npm run lint
npm run format
```

## 部署

- `conf/` 目录含 Nginx 配置
- PC 访问 `/pc`，移动端 UA 自动跳转 `m.file-uploader.com/mobile`
- `client_max_body_size 2048`（2GB 限制）
