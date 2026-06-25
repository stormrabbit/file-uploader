import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response } from 'express';
import { Logger } from 'src/utils/log4js';

// 这里是创建中间件时 nest 提供的标准写法
@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: () => void) {
    const code = res.statusCode;
    next();
    // 组装日志信息
    const logFormat = `Method: ${req.method} \n Request original url: ${req.originalUrl} \n IP: ${req.ip} \n Status code: ${code} \n`;
    // 根据状态码，进行日志类型区分
    if (code >= 500) {
      Logger.error(logFormat);
    } else if (code >= 400) {
      Logger.warn(logFormat);
    } else {
      Logger.access(logFormat);
      Logger.log(logFormat);
    }
  }
}

// 这是函数式写法，二选一即可
export function logger(
  req: Request,
  // @Body() body,
  res: Response,
  next: () => any,
) {
  const code = res.statusCode;
  next();
  const logFormat = ` >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
    Request original url: ${req.originalUrl}
    Method: ${req.method}
    IP: ${req.ip}
    Status code: ${code}
    Parmas: ${JSON.stringify(req.params)}
    Query: ${JSON.stringify(req.query)}
    Body: ${JSON.stringify(
      req.body,
    )} \n  >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
  `;
  if (code >= 500) {
    Logger.error(logFormat);
  } else if (code >= 400) {
    Logger.warn(logFormat);
  } else {
    Logger.access(logFormat);
    // Logger.log(logFormat);
  }
}
