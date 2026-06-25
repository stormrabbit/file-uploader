import { Module } from '@nestjs/common';
import { ServerInfoService } from './server-info.service';

@Module({
  providers: [ServerInfoService],
  exports: [ServerInfoService],
})
export class ServerInfoModule {}
