import { Module } from '@nestjs/common';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';
import { MulterModule } from '@nestjs/platform-express';
import { ServerInfoModule } from '../server-info/server-info.module';

import { diskStorage } from 'multer';
import * as nuid from 'nuid';
import * as fs from 'fs';
import * as path from 'path';
import { getStaticDir } from 'src/config/runtime-paths';
@Module({
  imports: [
    ServerInfoModule,
    MulterModule.register({
      storage: diskStorage({
        // 使用基于 DATA_DIR 的绝对路径，避免依赖进程 cwd。
        // 打包后 Electron 启动服务时 cwd 为只读的 '/'，
        // 相对路径 './static/temp' 会被解析为 '/static/temp' 而触发 EROFS。
        destination: (req, file, cb) => {
          // Multer 不会自动创建目标目录，需在写入前确保 temp 目录存在
          const tempDir = path.join(getStaticDir(), 'temp');
          if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
          }
          cb(null, tempDir);
        },
        filename: (req, file, cb) => {
          // 自定义文件名
          const filename = `${nuid.next()}`;
          return cb(null, `${filename}-${file.originalname}`);
          // return cb(null, file.originalname);
        },
      }),
    }),
  ],
  controllers: [FilesController],
  providers: [FilesService],
  exports: [],
})
export class FilesModule {}
