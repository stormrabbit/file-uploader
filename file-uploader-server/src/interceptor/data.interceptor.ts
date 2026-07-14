import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class DataInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        const { message = '请求成功!', errorMsg = '' } = data || {};
        return {
          code: 200,
          data: data ?? null,  
          message: errorMsg ? errorMsg : message,
        };
      }),
    );
  }
}
