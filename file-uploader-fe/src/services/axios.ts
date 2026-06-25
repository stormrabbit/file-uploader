import { useMessage } from '@/utils/messageHelper';
import { getApiBaseUrl } from '@/utils/apiBase';
import axios, { isCancel, type AxiosInstance, type AxiosRequestConfig, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';


class ApiService {
  private axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      timeout: 3600000
    });

    this.axiosInstance.interceptors.request.use(
      this.handleRequestInterceptor.bind(this),
      (error) => Promise.reject(error),
    );

    this.axiosInstance.interceptors.response.use(
      this.handleResponseInterceptor.bind(this),
      (error) => Promise.reject(error),
    );
  }

  private handleRequestInterceptor(
    config: InternalAxiosRequestConfig,
  ): InternalAxiosRequestConfig {
    config.baseURL = getApiBaseUrl()
    return config;
  }

  private handleResponseInterceptor(response: AxiosResponse): AxiosResponse {
    if (response.config.responseType === 'blob') {
      return response
    }
    if (response.status === 200) {
      return response.data
    } else {
      console.log(response.status)
    }
    return response
  }

  private handleRequest<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    return this.axiosInstance
      .request<T>({
        method,
        url,
        data,
        ...config,
      })
      .then((response) => response.data).catch( err => {
        if (isCancel(err)) return Promise.reject(err)
        useMessage().error(err)
        return Promise.reject(err)
      });
  }

  public get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.handleRequest<T>('GET', url, undefined, config);
  }

  public post<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    return this.handleRequest<T>('POST', url, data, config);
  }

  public patch<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    return this.handleRequest<T>('PATCH', url, data, config);
  }

  public delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.handleRequest<T>('DELETE', url, undefined, config);
  }

  public put<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    return this.handleRequest<T>('PUT', url, data, config);
  }

  public download(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<Blob>> {
    return this.axiosInstance.request<Blob>({
      method: 'GET',
      url,
      responseType: 'blob',
      ...config,
    });
  }
}

export default ApiService;
