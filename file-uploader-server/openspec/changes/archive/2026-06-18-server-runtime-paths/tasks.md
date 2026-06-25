## 1. 新增运行时路径模块

- [x] 1.1 新增 `src/config/runtime-paths.ts`，导出 `getDataDir()`（读 `process.env.DATA_DIR`，回退 `process.cwd()`）与 `getStaticDir()`（返回 `path.join(getDataDir(), 'static')`）
- [x] 1.2 内部使用模块级缓存避免重复读 env；导出 `__resetForTest()` 仅 NODE_ENV=test 可用
- [x] 1.3 路径处理一律走 `path.join` / `path.resolve`，不手工拼接字符串

## 2. 改造 FilesService 归档路径

- [x] 2.1 修改 `src/domain/files/files.service.ts`：归档目录拼接改用 `getStaticDir()`，删除字面量 `'static'`
- [x] 2.2 全局搜索 `'./static'` 与 `"./static"`，确认仅在新模块外不再出现（必要的常量字符串注释除外）
- [x] 2.3 单元测试覆盖：`DATA_DIR` 设置/未设置两种场景下，归档路径正确

## 3. 改造 main.ts 静态映射

- [x] 3.1 修改 `src/main.ts` 的 `express.static` 调用：根目录改为 `getStaticDir()`
- [ ] 3.2 启动后 `curl http://localhost:38902/static/<已存在文件>` 仍能正确返回

## 4. Prisma schema 多平台与文档化

- [x] 4.1 校验 `prisma/schema.prisma` 的 `datasource.url` 已为 `env("DATABASE_URL")`
- [x] 4.2 为 `generator client` 块添加 `binaryTargets = ["native", "darwin", "darwin-arm64", "windows"]`
- [x] 4.3 执行 `npx prisma generate`，确认 `node_modules/.prisma/client/` 下生成三平台（darwin / darwin-arm64 / windows）engine 二进制 + native
- [x] 4.4 在 `CLAUDE.md` 的"环境变量"表格补充 `DATA_DIR` 条目；在"启动方式"附近增加一句"打包/独立部署可通过 DATA_DIR + DATABASE_URL 注入数据存储路径"

## 5. 验证

- [x] 5.1 `npm run build` 通过
- [ ] 5.2 默认启动：`npm run start:dev` → 上传一个文件 → 文件归档到 `./static/YYYY-MM-DD/{md5}/`，行为同改造前
- [ ] 5.3 注入 `DATA_DIR=/tmp/fu-test DATABASE_URL=file:/tmp/fu-test/data.db npm run start:node` → 启动前手动跑一次 `npx prisma migrate deploy` → 上传文件 → 归档到 `/tmp/fu-test/static/YYYY-MM-DD/{md5}/`，DB 写入 `/tmp/fu-test/data.db`
- [ ] 5.4 测试包含空格的路径：`DATA_DIR='/tmp/fu test' npm run start:node` → 上传文件成功
- [x] 5.5 `npm run lint` 通过

## 6. 归档

- [ ] 6.1 `openspec archive server-runtime-paths` 归档本提案
