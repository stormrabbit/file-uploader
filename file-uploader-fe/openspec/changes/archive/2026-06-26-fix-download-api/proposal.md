## Why

`src/utils/download.ts` 的 `downloadBlob` 试图从响应中解构 `{ data, status, headers }` 来提取文件名，但实际收到的是裸 Blob——因为 `ApiService` 的响应拦截器已返回 `response.data`，`handleRequest` 又再次 `.then(r => r.data)`，双重解包后 `status`/`headers` 均为 `undefined`，文件名提取逻辑完全失效，下载文件名始终退化为 `temp`。

## What Changes

- **`src/services/axios.ts`**：新增 `download` 公共方法，直接调用 `axiosInstance.request`（绕过 `handleRequest` 的二次解包），返回完整 `AxiosResponse<Blob>`，继承请求拦截器的 `getApiBaseUrl()` 注入
- **`src/utils/download.ts`**：`getBlob` 改用 `ApiService.download`，`downloadBlob` 去掉无效的 `{ data, status, headers }` 解构，直接从 `AxiosResponse` 取 `data`/`headers`，并修正文件名正则

## Capabilities

### New Capabilities

（无新用户可见功能，纯内部修复）

### Modified Capabilities

- `pc-file-gallery`：下载文件时文件名现在能正确解析，不再退化为 `temp`

## Impact

- `src/services/axios.ts`：新增 `download` 方法（~10 行）
- `src/utils/download.ts`：重写 `getBlob` 和 `downloadBlob` 的解包逻辑
- 无新依赖，不影响其他 API 方法
