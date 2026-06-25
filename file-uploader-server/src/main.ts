import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { logger } from './middleware/logger.middleware';
import * as express from 'express';
import { TransformInterceptor } from './interceptor/transform.interceptor';
import { DataInterceptor } from './interceptor/data.interceptor';
import { AllExceptionFilter } from './filter/all-exception.filter';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { getStaticDir } from './config/runtime-paths';
import 'dotenv/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(express.json()); // For parsing application/json
  app.use(express.urlencoded({ extended: true }));
  // 将 static 目录映射为 /static 路径；每次请求时动态读取 storageDir，支持运行时切换
  app.use('/static', (req, res, next) => {
    express.static(getStaticDir())(req, res, next);
  });
  app.use(logger); // 引入日志中间件
  app.useGlobalInterceptors(new TransformInterceptor()); // 日志记录
  app.useGlobalInterceptors(new DataInterceptor()); // 返回值规范化
  app.useGlobalFilters(new AllExceptionFilter()); // 引入异常过滤器
  app.enableCors(); // 允许跨域
  const options = new DocumentBuilder()
    .setTitle('Gengar')
    .setDescription('Nestjs 开发基础代码')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('api-doc', app, document);
  // 监听 0.0.0.0 确保局域网 IP 也可访问，而非仅 localhost
  await app.listen(process.env.PORT || 38902, '0.0.0.0');
}
bootstrap();
