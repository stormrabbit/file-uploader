import {
  HttpService,
  Module,
  OnModuleInit,
  HttpModule as BaseHttpModule,
} from '@nestjs/common';
import { Logger } from 'src/utils/log4js';

@Module({
  imports: [BaseHttpModule],
  exports: [BaseHttpModule],
})
export class HttpModule implements OnModuleInit {
  constructor(private readonly httpService: HttpService) {}

  public onModuleInit(): any {
    const axios = this.httpService.axiosRef;
    axios.interceptors.request.use(function (config) {
      // 请求拦截
      config['metadata'] = { ...config['metadata'], startDate: new Date() };
      return config;
    });
    axios.interceptors.response.use(
      (response) => {
        // 响应拦截
        const { config } = response;
        config['metadata'] = { ...config['metadata'], endDate: new Date() };
        const duration =
          config['metadata'].endDate.getTime() -
          config['metadata'].startDate.getTime();
        Logger.trace(
          `${config.method.toUpperCase()} ${config.url} ${duration}ms`,
        );
        return response;
      },
      (err) => {
        Logger.error(err);
        return Promise.reject(err);
      },
    );
  }
}
