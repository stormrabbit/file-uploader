## MODIFIED Requirements

### Requirement: PC 端保留上传入口，支持任意文件类型
PC 端 Dashboard SHALL 保留文件上传入口，支持上传任意类型文件，满足 PC → PC 互传场景。工具栏同时提供「连接」按钮，供用户生成手机扫码连接的二维码。

#### Scenario: PC 端上传任意文件
- **WHEN** 用户点击 PC 端上传按钮
- **THEN** 可选择任意类型文件进行上传（图片、文档、压缩包等）

#### Scenario: 上传完成后刷新文件列表
- **WHEN** 文件上传成功
- **THEN** 文件列表自动刷新，新上传的文件出现在列表中

#### Scenario: 工具栏同时展示上传和连接入口
- **WHEN** 用户访问 PC 端 Dashboard
- **THEN** 工具栏同时显示「上传」按钮和「连接」按钮
