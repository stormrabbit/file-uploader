import { ref, computed, onUnmounted } from 'vue'
import { uploadFile, isFileExistByMd5, updateFileDateByMd5 } from '@/api'
import { file2Md5 } from '@/utils/md5'
import type { AxiosProgressEvent } from 'axios'

export type UploadTaskStatus = 'pending' | 'uploading' | 'done' | 'failed' | 'cancelled'

export interface UploadTask {
  id: string
  file: File
  previewUrl: string
  status: UploadTaskStatus
  progress: number
}

const UPLOAD_CONCURRENCY = 1

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
      progress: 0
    }))
    tasks.value.push(...newTasks)
  }

  async function processTask(task: UploadTask): Promise<void> {
    if (task.status === 'cancelled') return

    task.status = 'uploading'
    task.progress = 0

    const signal = abortController.value?.signal

    try {
      const fileMd5 = await file2Md5(task.file)

      if (signal?.aborted) {
        task.status = 'cancelled'
        return
      }

      const isExist = await isFileExistByMd5(fileMd5)
      if (isExist?.fileMd5) {
        await updateFileDateByMd5(fileMd5)
      } else {
        await uploadFile(task.file, (progressEvent: AxiosProgressEvent) => {
          if (progressEvent.total) {
            task.progress = Math.round((progressEvent.loaded / progressEvent.total) * 100)
          }
        }, signal)
      }

      task.status = 'done'
      task.progress = 100
    } catch (err: any) {
      if (err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED' || signal?.aborted) {
        task.status = 'cancelled'
      } else {
        task.status = 'failed'
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
    resetQueue
  }
}
