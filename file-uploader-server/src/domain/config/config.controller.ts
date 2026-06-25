import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ConfigService } from './config.service';

@Controller('config')
export class ConfigController {
  constructor(private readonly configService: ConfigService) {}

  @Get()
  getConfig() {
    return this.configService.getConfig();
  }

  @Patch()
  updateConfig(@Body() body: { storageDir: string }) {
    return this.configService.updateStorageDir(body.storageDir);
  }
}
