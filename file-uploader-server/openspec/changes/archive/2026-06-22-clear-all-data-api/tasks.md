## 1. Service 层

- [x] 1.1 在 `FilesService` 中新增 `clearAll()` 方法：调用 `prisma.file.deleteMany()` 清空所有记录，返回 `{ deletedRecords }`（不操作磁盘）

## 2. Controller 层

- [x] 2.1 在 `FilesController` 新增 `@Delete('clear-all')` 路由，调用 `filesService.clearAll()`，返回结果
- [x] 2.2 添加 `@ApiOperation` Swagger 注解，说明该接口为不可逆的全量清空操作
