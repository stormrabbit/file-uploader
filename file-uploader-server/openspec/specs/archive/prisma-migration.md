# 提案：从 json-server 迁移到 Prisma + SQLite

## 背景

本项目为个人使用的文件传输工具，主要场景是家人用手机/电脑互传照片，无用户登录、无多实例需求。

当前使用 json-server（端口 38905）作为数据持久层，存在以下问题：

- **额外进程依赖**：服务启动前必须保证 json-server 进程在线，容易忘记
- **无事务保障**：并发写入可能损坏 JSON 文件
- **total 统计低效**：当前用全量查询 1000 条来凑数（`files.service.ts:25-30`）

## 目标

用 **Prisma + SQLite** 替换 json-server，做到：
- 服务启动零外部依赖
- 数据库就是一个 `.db` 文件，和项目一起存在磁盘上

## 非目标

- 不做 MySQL 等生产级数据库迁移（本项目不需要）
- 不做历史数据迁移（测试阶段，数据可丢弃）
- 不实现用户模块（登录功能已移除）
- 不修改文件存储方式（仍用本地 `static/` 目录）

---

## 方案设计

### 1. Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model File {
  id             Int      @id @default(autoincrement())
  fileName       String
  nameSuffix     String   @default("")
  nameWithSuffix String
  fileUrl        String
  fileMd5        String
  size           Int
  status         Int      @default(0)
  createDate     DateTime @default(now())

  @@index([fileMd5])
  @@index([createDate])
}
```

字段说明：
- `fileMd5` 加索引：支持 `GET /files/isExist/:md5` 快速查重
- `nameWithSuffix` 支持模糊搜索（替代 json-server 的 `_like`）
- `parentDir` / `currentDir` / `isFileDir` 暂不纳入，当前业务未用到

### 2. 受影响文件

| 文件 | 变更 |
|------|------|
| `src/service/jserver.ts` | 删除 |
| `src/entities/Files.ts` | 删除，类型由 Prisma 生成 |
| `src/domain/files/files.service.ts` | 改用 PrismaService |
| `src/app.module.ts` | 引入 PrismaModule |
| `.env` | 新增 `DATABASE_URL` |
| `package.json` | 新增 `prisma`、`@prisma/client`；移除 json-server 相关 |

新增文件：
- `prisma/schema.prisma`
- `src/prisma/prisma.service.ts`
- `src/prisma/prisma.module.ts`

### 3. PrismaService

```ts
// src/prisma/prisma.service.ts
@Injectable()
export class PrismaService extends PrismaClient
  implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() { await this.$connect(); }
  async onModuleDestroy() { await this.$disconnect(); }
}
```

### 4. FilesService 核心方法改写

```ts
async retrieveFilesByConditions(query: QueryDTO) {
  const page = Math.max((query.page || 1) - 1, 0);
  const take = query.page_size || 10;
  const where = {
    ...(query.fileName   ? { nameWithSuffix: { contains: query.fileName } } : {}),
    ...(query.fileMd5    ? { fileMd5: query.fileMd5 }                        : {}),
    ...(query.createDate ? { createDate: { gte: new Date(query.createDate) } } : {}),
  };

  const [list, total] = await this.prisma.$transaction([
    this.prisma.file.findMany({ where, skip: page * take, take, orderBy: { createDate: 'desc' } }),
    this.prisma.file.count({ where }),
  ]);
  return { list, total, page: query.page };
}
```

---

## 实施步骤

1. 安装依赖
   ```bash
   npm install @prisma/client
   npm install -D prisma
   npx prisma init --datasource-provider sqlite
   ```

2. 编写 `prisma/schema.prisma`（见上文）

3. 生成迁移和客户端
   ```bash
   npx prisma migrate dev --name init
   npx prisma generate
   ```

4. 新建 `src/prisma/prisma.service.ts` 和 `src/prisma/prisma.module.ts`

5. 改写 `FilesService`，删除 jserver 导入

6. 更新 `AppModule`，引入 `PrismaModule`

7. 删除 `src/service/jserver.ts` 和 `src/entities/Files.ts`

---

## 环境变量

```env
# .env
DATABASE_URL="file:./data.db"
```

数据库文件 `data.db` 落在项目根目录，建议加入 `.gitignore`。
