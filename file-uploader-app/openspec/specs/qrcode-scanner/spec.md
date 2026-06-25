## Requirements

### Requirement: 主页展示二维码扫描器
App 启动后 SHALL 直接显示主页，主页 SHALL 包含全屏或大面积摄像头取景框用于扫描二维码，界面风格 SHALL 遵循 Material Design 3。

#### Scenario: 正常启动显示扫描界面
- **WHEN** 用户打开 App 且已授予摄像头权限
- **THEN** 主页显示实时摄像头画面和扫描框覆盖层

#### Scenario: 未授权摄像头时的引导
- **WHEN** 用户打开 App 但未授予摄像头权限
- **THEN** 主页显示权限说明文案和「授权摄像头」按钮，点击后触发系统权限请求或跳转设置

### Requirement: 扫码识别 URL 并跳转
扫描器 SHALL 持续检测画面中的 QR Code；识别到内容为有效 HTTP/HTTPS URL 时，SHALL 立即停止扫描并导航到 WebView 页面。

#### Scenario: 扫描到有效 URL
- **WHEN** 摄像头画面中出现包含 HTTP/HTTPS URL 的二维码
- **THEN** App 在 300ms 内停止扫描，并跳转到 WebView 页面加载该 URL

#### Scenario: 扫描到非 URL 内容
- **WHEN** 摄像头画面中出现非 URL 内容的二维码
- **THEN** App 继续扫描，不做任何跳转，可选展示短暂提示"非有效地址"

### Requirement: WebView 页面加载目标 URL
WebView 页面 SHALL 加载扫码获得的 URL，提供返回主页的导航按钮（AppBar 返回箭头）。

#### Scenario: 成功加载页面
- **WHEN** WebView 页面打开且 URL 可访问
- **THEN** 页面内容正常渲染，用户可交互使用网页

#### Scenario: 返回主页重新扫码
- **WHEN** 用户点击 AppBar 返回按钮
- **THEN** App 返回主页，摄像头重新激活并开始扫描
