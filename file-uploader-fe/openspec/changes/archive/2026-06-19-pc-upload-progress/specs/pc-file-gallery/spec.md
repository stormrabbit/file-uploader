## MODIFIED Requirements

### Requirement: PC 端保留上传入口，支持任意文件类型
PC 端 Dashboard SHALL 保留文件上传入口，支持上传任意类型文件，满足 PC → PC 互传场景。工具栏同时提供「连接」按钮，供用户生成手机扫码连接的二维码。上传进行中，进度状态栏在页面 footer 展示，主内容区布局不受影响；上传完成或停止后 footer 恢复版权文字。

#### Scenario: PC 端上传任意文件
- **WHEN** 用户点击 PC 端上传按钮
- **THEN** 可选择任意类型文件进行上传（图片、文档、压缩包等）

#### Scenario: 上传完成后刷新文件列表
- **WHEN** 文件上传成功
- **THEN** 文件列表自动刷新，新上传的文件出现在列表中

#### Scenario: 工具栏同时展示上传和连接入口
- **WHEN** 用户访问 PC 端 Dashboard
- **THEN** 工具栏同时显示「上传」按钮和「连接」按钮

#### Scenario: 上传进行中 footer 展示进度状态栏
- **WHEN** 用户选择文件并开始上传
- **THEN** 页面 footer 显示上传进度状态栏（计数 + 百分比 + 停止按钮），主内容区和工具栏布局不变
