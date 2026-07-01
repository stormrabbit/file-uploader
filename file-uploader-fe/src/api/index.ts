import ApiService from '@/services/axios'
import type { AxiosProgressEvent } from 'axios'
const axios = new ApiService()

export const isFileExistByMd5 = (md5: string): Promise<{ fileMd5: string }> =>
  axios.get(`/files/isExist/${md5}`)
/**
 * 获取文件列表
 * @param query
 * @returns
 */
export const retrieveFiles = (
  query: {
    page: number
    page_size?: number
    limit?: number
    fileName?: string
    createDate?: string
  } = { page: 1, page_size: 10 }
) => {
  // Support both page_size and limit for flexibility
  const params = { ...query }
  if (params.limit && !params.page_size) {
    params.page_size = params.limit
  }
  
  // Validate pagination parameters
  if (params.page < 1) {
    params.page = 1
  }
  if (params.page_size && (params.page_size < 1 || params.page_size > 100)) {
    params.page_size = Math.min(Math.max(params.page_size, 1), 100)
  }
  
  return axios.get('/files/info/list', {
    params
  })
}

/**
 * 上传文件
 * @param file
 * @returns
 */
export const uploadFile = (
  file: File,
  onUploadProgress?: (progressEvent: AxiosProgressEvent) => void,
  signal?: AbortSignal
) => {
  const formData = new FormData()
  formData.append('file', file)
  return axios.post('/files/upload', formData, {
    headers: { 'content-type': 'multipart/form-data' },
    onUploadProgress,
    signal
  })
}

/**
 * 已有同文件的话更新 md5
 * @param md5 
 * @returns 
 */
export const updateFileDateByMd5 = (md5:string) => axios.patch(`/files/update/${md5}`)

/**
 * 删除
 * @param id
 * @returns
 */
export const deleteFileById = (id: number | string) =>
  axios.delete('/files/delete', {
    params: {
      id
    }
  })


/**
 * 删除全部
 * @returns
 */
export const deleteAllFiles = () =>
  axios.delete('/files/clear-all')


export const getServerInfo = (): Promise<{ ips: string[] }> =>
  axios.get('/files/ip')

export const getConfig = (): Promise<{ storageDir: string }> =>
  axios.get('/config')

export const updateStorageDir = (storageDir: string): Promise<{ storageDir: string }> =>
  axios.patch('/config', { storageDir })
