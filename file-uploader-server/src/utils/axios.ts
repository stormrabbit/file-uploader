import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

class ApiService {
  private axiosInstance: AxiosInstance;

  constructor(baseURL: string) {
    this.axiosInstance = axios.create({
      baseURL,
    });

    // Add any default configurations, interceptors, etc. here
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
    config: AxiosRequestConfig,
  ): AxiosRequestConfig {
    // You can modify the request config here, such as adding headers or authentication tokens
    // config.headers['Authorization'] = 'Bearer your_token';

    return config;
  }

  private handleResponseInterceptor(response: AxiosResponse): AxiosResponse {
    // You can modify the response data or handle errors globally here
    return response;
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
      .then((response) => response.data);
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
}

export default ApiService;
