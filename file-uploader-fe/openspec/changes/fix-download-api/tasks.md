## 1. ApiService 修复

- [x] 1.1 在 `handleResponseInterceptor` 中增加 blob 检测：`response.config.responseType === 'blob'` 时直接 `return response`，跳过 `.data` 解包
- [x] 1.2 新增 `public download(url, config?)` 方法，直接调用 `this.axiosInstance.request<Blob>({ method: 'GET', responseType: 'blob', url, ...config })`，不走 `handleRequest`，返回 `Promise<AxiosResponse<Blob>>`

## 2. download.ts 修复

- [x] 2.1 将 `getBlob` 改为调用 `ApiService.download`，移除多余的 `params` 包装，直接传 `config`
- [x] 2.2 重写 `downloadBlob`：直接从 `AxiosResponse` 取 `data`（Blob）和 `headers`，删掉 `{ data: blob, status, headers }` 解构写法
- [x] 2.3 修正文件名正则：优先匹配 `filename*=UTF-8''<name>`（RFC 5987），再匹配 `filename="<name>"`，默认退化为 `'download'`
- [x] 2.4 删除 `downloadBlob` 中 `console.log` 调试语句

## 3. 验证

- [ ] 3.1 实际下载一个文件，确认浏览器保存的文件名与服务端一致（非 `temp`/`download`）
