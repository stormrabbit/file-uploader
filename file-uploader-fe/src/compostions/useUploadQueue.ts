import { ref, computed, onUnmounted } from 'vue'
import { uploadFile, isFileExistByMd5 } from '@/api'
import { file2Md5 } from '@/utils/md5'
import type { AxiosProgressEvent } from 'axios'
import { delayByMillisecond } from '@/utils/delay'

export type UploadTaskStatus = 'pending' | 'uploading' | 'done' | 'failed' | 'cancelled'

export interface UploadTask {
  id: string
  file: File
  previewUrl: string
  status: UploadTaskStatus
  progress: number
  retryCount: number
}

const UPLOAD_CONCURRENCY = 1
const MAX_ATTEMPTS = 3
const RETRY_DELAY = 500

export function useUploadQueue() {
  const tasks = ref<UploadTask[]>([])
  const abortController = ref<AbortController | null>(null)

  const currentTask = computed<UploadTask | null>(
    () => tasks.value.find(t => t.status === 'uploading') ?? null
  )

  const isAllSettled = computed(
    () => tasks.value.length > 0 && tasks.value.every(
      t => t.status === 'done' || t.status === 'failed' || t.status === 'cancelled'
    )
  )

  const isUploading = computed(
    () => tasks.value.length > 0 && !isAllSettled.value
  )

  const totalCount = computed(() => tasks.value.length)

  const doneCount = computed(() => tasks.value.filter(t => t.status === 'done').length)

  const failedCount = computed(() => tasks.value.filter(t => t.status === 'failed').length)

  function enqueue(files: File[]): void {
    const newTasks: UploadTask[] = files.map(file => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      file,
      previewUrl: URL.createObjectURL(file),
      status: 'pending' as UploadTaskStatus,
      progress: 0,
      retryCount: 0
    }))
    tasks.value.push(...newTasks)
  }


  // 上传 - 单独处理
  async function attemptUpload(task: UploadTask): Promise<boolean> {
    const signal = abortController.value?.signal
    let md5: string = ''
    try {
      md5 = await file2Md5(task.file)
    } catch (error) {
      md5 = ''
    }
    if (signal?.aborted) {
      throw new DOMException('aborted', 'AbortError')
    }
    if (md5) {
      try {
        const isExist = await isFileExistByMd5(md5)
        if (isExist?.fileMd5) {
          task.progress = 100
          return true
        }
      } catch (error) {

      }
    }

    try {
      await uploadFile(task.file, (progressEvent: AxiosProgressEvent) => {
        task.progress = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1))
      }, signal)
      return true
    } catch (error) {
      throw error
    }
  }


  async function processTask(task: UploadTask): Promise<void> {
    if (task.status === 'cancelled') return

    task.status = 'uploading'
    task.progress = 0

    for (; task.retryCount < MAX_ATTEMPTS; task.retryCount++) {
      try {
        await attemptUpload(task)
        task.status = 'done'
        return
      } catch (err: any) {
        if (
          err?.name === 'CanceledError' ||
          err?.name === 'AbortError' ||
          err?.code === 'ERR_CANCELED' ||
          abortController.value?.signal.aborted
        ) {
          task.status = 'cancelled'
          return
        }
        if (task.retryCount < MAX_ATTEMPTS - 1) {
          task.progress = 0
          await delayByMillisecond(RETRY_DELAY * 2 ** task.retryCount)
          continue
        }
        // 次数耗尽
        task.status = 'failed'
        return
      }
    }
  }

  async function startQueue(): Promise<void> {
    abortController.value = new AbortController()
    const pending = tasks.value.filter(t => t.status === 'pending')
    let running = 0
    let index = 0

    return new Promise<void>((resolve) => {
      function runNext(): void {
        if (index >= pending.length && running === 0) {
          resolve()
          return
        }

        while (running < UPLOAD_CONCURRENCY && index < pending.length) {
          const task = pending[index++]
          running++
          processTask(task).finally(() => {
            running--
            runNext()
          })
        }
      }

      runNext()
    })
  }

  async function retryFailed(): Promise<void> {
    const failed = tasks.value.filter(t => t.status === 'failed')
    if (failed.length === 0) return
    failed.forEach(t => {
      t.status = 'pending'
      t.retryCount = 0
      t.progress = 0
    })
    await startQueue()
  }

  function cancelQueue(): void {
    abortController.value?.abort()
    tasks.value.forEach(task => {
      if (task.status === 'pending') {
        task.status = 'cancelled'
      }
    })
  }

  function releaseAllPreviewUrls(): void {
    tasks.value.forEach(task => {
      if (task.previewUrl) {
        URL.revokeObjectURL(task.previewUrl)
      }
    })
  }

  function resetQueue(): void {
    releaseAllPreviewUrls()
    tasks.value = []
    abortController.value = null
  }

  onUnmounted(() => {
    resetQueue()
  })

  return {
    tasks,
    currentTask,
    isAllSettled,
    isUploading,
    totalCount,
    doneCount,
    failedCount,
    enqueue,
    startQueue,
    cancelQueue,
    resetQueue,
    retryFailed
  }
}
