## Purpose

PC 端局域网连接二维码功能，允许用户通过扫码快速在手机端打开上传页面。

## Requirements

### Requirement: PC 端展示局域网连接二维码
PC 端 SHALL 提供「连接」按钮，点击后从服务端获取局域网 IP，拼接为手机上传页 URL，在弹层中展示二维码，供手机扫码直达上传页。

#### Scenario: 点击连接按钮打开二维码弹层
- **WHEN** 用户点击 PC 端工具栏的「连接」按钮
- **THEN** 弹出 Dialog，内部显示二维码图片和提示文案「用手机扫描二维码，打开上传页面」

#### Scenario: 二维码 URL 指向正确的手机上传页
- **WHEN** 二维码生成时
- **THEN** 二维码内容为 `http://<server_lan_ip>:<VITE_API_BASE_BACKEND_PORT>/mobile`，其中 `server_lan_ip` 来自服务端接口

#### Scenario: 获取 IP 失败时展示错误提示
- **WHEN** 调用服务端接口失败（网络错误或接口不存在）
- **THEN** 弹层内显示错误提示「获取局域网地址失败，请检查服务是否运行」，不展示二维码

#### Scenario: 关闭弹层
- **WHEN** 用户点击弹层关闭按钮或遮罩层
- **THEN** 弹层关闭，状态重置
