import { Module } from '@nestjs/common';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';
import { MulterModule } from '@nestjs/platform-express';
import { ServerInfoModule } from '../server-info/server-info.module';
import * as path from 'path';
import { getStorageDir } from 'src/config/runtime-paths';
import { HashingDiskStorage } from 'src/storage/hashing-disk.storage';
@Module({
  imports: [
    ServerInfoModule,
    MulterModule.register({
      storage: new HashingDiskStorage(
        () => path.join(getStorageDir(), 'temp'),
      ),
    }),
  ],
  controllers: [FilesController],
  providers: [FilesService],
  exports: [],
})
export class FilesModule {}
