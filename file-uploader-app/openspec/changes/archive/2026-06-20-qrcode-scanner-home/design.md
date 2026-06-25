## Context

App 目前是 Flutter 默认计数器脚手架，无任何业务逻辑。整个文件上传系统由三部分组成：NestJS 后端提供文件上传 API 并暴露局域网 IP，PC 前端页面展示文件列表并生成二维码，手机端（本 App）通过扫描二维码连接服务。当前手机端完全空白，需要从零建立首个可用功能。

## Goals / Non-Goals

**Goals:**
- 实现 Material Design 3 风格的主页 UI
- 主页内嵌实时摄像头取景框（二维码扫描器）
- 扫描到有效 URL 后跳转到内置 WebView 页面
- WebView 页面加载该 URL，让用户直接使用网页端上传功能
- 配置 Android/iOS 必要的摄像头权限

**Non-Goals:**
- 不实现图片原生选取功能（下一个提案负责）
- 不处理非 URL 类型的二维码（忽略或提示）
- 不做历史记录/收藏功能
- WebView 内不注入任何 JS Bridge（本期不替换网页选图）

## Decisions

**1. 二维码扫描库：`mobile_scanner` 而非 `qr_code_scanner`**

`mobile_scanner` 使用 Google ML Kit（Android）/ Apple Vision（iOS），原生性能更好，且维护更活跃；`qr_code_scanner` 底层依赖老旧的 ZXing，iOS 偶有兼容问题。选 `mobile_scanner`。

**2. WebView：`webview_flutter` 官方插件**

官方维护，稳定性有保障；`flutter_inappwebview` 功能更丰富但体积大。本期只需加载 URL，官方插件够用。

**3. 路由：`go_router` vs 手动 Navigator**

功能简单（2 个页面），手动 `Navigator.push` 即可，不引入额外路由库，减少依赖。

**4. 扫描成功后行为：直接跳转，不弹确认框**

场景单一（只扫自己服务的码），弹确认框增加摩擦感。如果 URL 无效则 WebView 会自然展示加载失败页面。

## Risks / Trade-offs

- **摄像头权限被拒** → 在主页展示权限引导文案和「去设置」按钮，`mobile_scanner` 自带权限检测回调可处理
- **WebView 加载局域网地址超时**（服务未启动）→ 浏览器默认超时提示，本期不额外处理
- **Android 低版本兼容**：`mobile_scanner` 要求 minSdkVersion ≥ 21 → `build.gradle` 确认并设置
