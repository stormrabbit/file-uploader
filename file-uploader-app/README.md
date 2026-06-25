# File Uploader App

扫码连接 PC，原生上传照片到本地服务器的 Flutter Android 应用。

## 功能特性

- **扫码连接**：扫描 PC 端展示的二维码，自动获取服务器地址
- **WebView 嵌入**：在 App 内打开 PC 端 Web 界面，保持完整交互体验
- **原生照片上传**：通过 JS Bridge 触发系统相册选择器，绕过 WebView 上传限制
- **秒传去重**：上传前计算 MD5，服务端已有相同文件时直接复用，无需重复传输
- **串行进度展示**：底部弹层实时显示每张照片的上传进度与结果

## 架构说明

```
┌─────────────────────────┐        ┌──────────────────────────┐
│   Android App (Flutter) │        │   PC 端 Web + 服务端      │
│                         │        │                          │
│  ① 扫码获取服务器地址    │        │  提供二维码（含 URL）      │
│  ② WebView 加载 Web UI  │◄──────►│  提供 Web 前端页面        │
│  ③ JS Bridge 收到指令   │        │  /files/isExist/:md5     │
│  ④ 原生选图 + 上传      │───────►│  /files/upload           │
└─────────────────────────┘        └──────────────────────────┘
```

> **注意**：本 App 依赖自行部署的配套服务端。服务端需实现下方描述的两个 API 接口，App 才能正常工作。

## 服务端 API 契约

App 从扫码 URL 中提取 host，并固定使用端口 `38902` 访问服务端。

### GET /files/isExist/:md5

秒传判断。上传前先查询服务端是否已存在相同文件。

**响应示例（文件已存在）：**
```json
{
  "code": 0,
  "data": {
    "id": 42,
    "fileName": "photo.jpg",
    "fileUrl": "/static/2024-01-01/photo.jpg",
    "fileMd5": "d41d8cd98f00b204e9800998ecf8427e"
  },
  "message": "ok"
}
```

**响应示例（文件不存在）：**
```json
{
  "code": 0,
  "data": {},
  "message": "ok"
}
```

### POST /files/upload

multipart/form-data 上传。字段名为 `file`。

**响应示例：**
```json
{
  "code": 0,
  "data": {
    "id": 43,
    "fileName": "photo.jpg",
    "fileUrl": "/static/2024-01-01/photo.jpg",
    "fileMd5": "d41d8cd98f00b204e9800998ecf8427e"
  },
  "message": "ok"
}
```

上传完成后，App 通过 JS Bridge 将结果回传给 Web 页面：

```js
// Web 端监听方式
window.UploadBridge_callback = function(jsonString) {
  const results = JSON.parse(jsonString);
  // results: [{ id: "assetId", fileId: 43, fileUrl: "/static/..." }, ...]
};
```

## 构建与运行

**环境要求：**
- Flutter 3.7.0（SDK `>=3.0.5 <4.0.0`）
- Android SDK 21+（minSdkVersion 21）
- 已部署配套服务端

**步骤：**

```bash
# 1. 安装依赖
flutter pub get

# 2. 连接 Android 设备或启动模拟器，然后运行
flutter run

# 3. 构建 release APK
flutter build apk --release
```

## Android 权限

| 权限 | 用途 |
|------|------|
| `CAMERA` | 扫描 PC 端二维码 |
| `READ_MEDIA_IMAGES` | 读取相册照片用于上传（Android 13+） |
| `READ_EXTERNAL_STORAGE` | 读取相册照片用于上传（Android 12 及以下） |

## 网络安全说明

`android/app/src/main/res/xml/network_security_config.xml` 中配置了 `cleartextTrafficPermitted="true"`（全局允许 HTTP 明文流量）。

这是**有意为之的设计**：本 App 的使用场景为局域网内连接自建服务器，服务器地址为内网 IP，通常不具备 TLS 证书。如需在公网环境使用，建议为服务端配置 HTTPS 并移除此配置。

## License

[MIT](../LICENSE)
