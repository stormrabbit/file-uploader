## 1. 残留代码核查

- [x] 1.1 全局搜索 `AuthGuard|@nestjs/jwt|@nestjs/passport|passport-jwt|passport-local|JwtStrategy|LocalStrategy|jwtConstants|JWT_SECRET` 等关键字（包括 src/、test/ 与配置文件），确认无任何代码引用
- [x] 1.2 若发现引用（理论应为 0），逐项删除并在本 change 中记录
- [x] 1.3 校验 `src/app.module.ts` 不再 import `AuthModule`/`UsersModule`/`PrescriptionsModule`（应已无）

## 2. 移除 npm 依赖

- [x] 2.1 执行 `npm uninstall @nestjs/jwt @nestjs/passport passport passport-jwt passport-local`
- [x] 2.2 确认 `package.json` 中 5 个包全部消失
- [x] 2.3 确认 `package-lock.json` 自动更新
- [x] 2.4 删除 `.env` / `.env.example`（如存在）中 `JWT_SECRET` 相关条目；若同时也是 `JWT_SECRET` 占位则一并清理

## 3. 同步 CLAUDE.md

- [x] 3.1 删除"已知问题与待办"表格中 OPT-01、OPT-02、OPT-03、OPT-07 四行
- [x] 3.2 删除"环境变量"表格中 `JWT_SECRET` 行
- [x] 3.3 删除"目录结构"中已不存在的 `auth/`、`users/`、`prescriptions/` 描述
- [x] 3.4 新增"部署边界"章节：列出允许（桌面端、局域网）/ 禁止（公网）的部署场景，与 `auth-policy` spec 保持一致
- [x] 3.5 在文档中加上一句指向 `docs/electron-packaging.md` 的引用，便于追溯

## 4. 验证

- [x] 4.1 `npm install` 通过且无 peer dependency 警告
- [x] 4.2 `npm run build` 通过
- [x] 4.3 `npm run start:dev` 启动正常；上传/下载/列表/删除全部接口可用
- [x] 4.4 `npm run lint` 通过
- [x] 4.5 `node_modules/` 中已无 `@nestjs/jwt`、`passport*` 目录

## 5. 归档

- [x] 5.1 `openspec archive server-remove-auth-users` 归档本提案
