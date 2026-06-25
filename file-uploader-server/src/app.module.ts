import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { FilesModule } from './domain/files/files.module';
import { ServerInfoModule } from './domain/server-info/server-info.module';
import { HealthModule } from './health/health.module';
import { ConfigModule } from './domain/config/config.module';

@Module({
  imports: [
    PrismaModule,
    FilesModule,
    ServerInfoModule,
    HealthModule,
    ConfigModule,
  ],
  controllers: [],
  providers: [],
  exports: [],
})
export class AppModule {}
