/**
 * 扩展 Multer File 类型，添加 md5 属性
 * 用于在类型系统中识别带有 md5 属性的文件对象
 * 前提是是使用了 hashing-disk.storage.ts
 */
declare global {
  namespace Express {
    namespace Multer {
      interface File {
        md5: string;
      }
    }
  }
}

export {};
