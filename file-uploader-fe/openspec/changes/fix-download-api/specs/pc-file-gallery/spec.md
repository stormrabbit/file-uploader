## MODIFIED Requirements

### Requirement: PC 端文件下载时保留原始文件名
PC 端用户下载文件时，系统 SHALL 从响应头 `Content-Disposition` 中正确解析原始文件名，并以该名称保存到本地。若解析失败，SHALL 退化为 `download` 作为默认文件名，不得使用无意义的 `temp`。

#### Scenario: 下载带标准文件名的文件
- **WHEN** 用户点击文件下载，服务端响应头包含 `Content-Disposition: attachment; filename="foo.txt"`
- **THEN** 浏览器保存的文件名为 `foo.txt`

#### Scenario: 下载带 RFC 5987 编码文件名的文件
- **WHEN** 响应头包含 `Content-Disposition: attachment; filename*=UTF-8''%E7%85%A7%E7%89%87.jpg`
- **THEN** 浏览器保存的文件名为正确解码后的 `照片.jpg`

#### Scenario: 无法解析文件名时退化为默认值
- **WHEN** 响应头缺少 `Content-Disposition` 或格式无法识别
- **THEN** 下载文件名退化为 `download`，不使用 `temp`
