## Context

`ApiService` 有两层解包：

1. **响应拦截器** `handleResponseInterceptor`：`return response.data`（返回业务 body）
2. **`handleRequest`**：`.then((response) => response.data)`（再取一次 `.data`）

对 JSON API 而言这是 bug（CLAUDE.md 已记录），但还未修；对 blob 下载而言后果更严重——`response.data` 是 Blob，`Blob.data` 是 `undefined`，加上 `status`/`headers` 也丢失，文件名无法提取。

`download.ts` 当前已用 `new ApiService()` 实例，不是裸 axios，但绑错了方法（`axios.get` 走 `handleRequest` 导致双重解包）。

## Goals / Non-Goals

**Goals:**
- 在 `ApiService` 中新增 `download(url, config)` 方法，返回完整 `AxiosResponse<Blob>`（不解包）
- `download.ts` 改用该方法，正确提取文件名
- 不触碰 `handleRequest` 及现有 get/post/put/patch/delete，避免影响所有 JSON API

**Non-Goals:**
- 不修复 `handleRequest` 的双重解包 bug（独立 bug，独立修）
- 不重构 `download.ts` 的触发逻辑或 UI 层

## Decisions

**决策：`download` 方法直接调 `axiosInstance.request`，跳过 `handleRequest`**

```ts
public download(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<Blob>> {
  return this.axiosInstance.request<Blob>({
    method: 'GET',
    url,
    responseType: 'blob',
    ...config,
  })
  // 不加 .then(r => r.data)，直接返回整个 AxiosResponse
}
```

响应拦截器 `handleResponseInterceptor` 对 status=200 返回 `response.data`，这对 blob 下载同样会丢失 `headers`。需要让 blob 响应绕过拦截器的解包。

**方案**：在 `handleResponseInterceptor` 中检测 `responseType === 'blob'`，直接 `return response` 而非 `return response.data`：

```ts
private handleResponseInterceptor(response: AxiosResponse): AxiosResponse {
  if (response.config.responseType === 'blob') {
    return response  // blob 保留完整响应
  }
  if (response.status === 200) {
    return response.data
  }
  return response
}
```

这样 `download` 方法收到的就是完整 `AxiosResponse<Blob>`，`data`/`status`/`headers` 齐全。

**文件名正则修正**：

当前正则 `/filename\*?=["']?[^"';]+["';]?([^"';]+)/` 存在匹配歧义，`matchResult[0]` 是整个匹配串而非捕获组。改为直接匹配 `filename="xxx"` 或 RFC 5987 的 `filename*=UTF-8''xxx`：

```ts
// Content-Disposition: attachment; filename="foo.txt"
// Content-Disposition: attachment; filename*=UTF-8''foo%20bar.txt
const cd = decodeURIComponent(headers['content-disposition'] ?? '')
const name =
  cd.match(/filename\*=UTF-8''([^;]+)/i)?.[1] ||
  cd.match(/filename="?([^";]+)"?/i)?.[1] ||
  'download'
```

## Risks / Trade-offs

- **拦截器修改有全局影响**：加了 `responseType === 'blob'` 的判断，只影响 blob 响应，JSON 响应路径不变，风险低。
- **`handleRequest` 双重解包 bug 仍存在**：本次只修下载路径，其余 API 调用行为不变。
