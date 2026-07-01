interface FileListResult {
  list: {
    createDate: string
    fileMd5: string
    fileName: string
    fileUrl: string
    id: number
    nameSuffix: string
    nameWithSuffix: string
    size: number
  }[]
  page: number
  total: number
  hasMore?: boolean
}
import { computed, onMounted, ref } from 'vue'
import { retrieveFiles, deleteFileById } from '@/api'
import { downloadBlob } from '@/utils/download'
import { formatFileSize } from '@/utils/format'

/** 批次分组时间阈值（秒），可配置 */
const BATCH_TIME_THRESHOLD_SECONDS = 60

function useLoadFile() {
  const PAGE_SIZE = 9999
  const page = ref(1)
  const fileResult = ref<FileListResult>({
    list: [],
    total: 0,
    page: 1
  })

  const loading = ref(false)

  const sortMode = ref<'time' | 'batch'>('time')

  /** 按时间降序排序 */
  function sortByTime(files: FileListResult['list']): FileListResult['list'] {
    return [...files].sort((a, b) =>
      new Date(b.createDate).getTime() - new Date(a.createDate).getTime()
    )
  }

  /** 按批次排序：createDate 相差 ≤ 阈值的归为同一批次，批次降序，组内按时间排序 */
  function sortByBatch(files: FileListResult['list']): FileListResult['list'] {
    if (files.length === 0) return []

    // 先按时间降序排列
    const sorted = [...files].sort((a, b) =>
      new Date(b.createDate).getTime() - new Date(a.createDate).getTime()
    )

    // 从最新到最旧，将相邻时间差 ≤ 阈值的归为同一批次
    const batches: FileListResult['list'][] = []
    let currentBatch: FileListResult['list'] = [sorted[0]]

    for (let i = 1; i < sorted.length; i++) {
      const prevTime = new Date(sorted[i - 1].createDate).getTime()
      const currTime = new Date(sorted[i].createDate).getTime()
      const diffSeconds = (prevTime - currTime) / 1000

      if (diffSeconds <= BATCH_TIME_THRESHOLD_SECONDS) {
        currentBatch.push(sorted[i])
      } else {
        batches.push(currentBatch)
        currentBatch = [sorted[i]]
      }
    }
    batches.push(currentBatch)

    // 批次已是降序，展平返回
    return batches.flat()
  }

  /** 排序后的文件列表 */
  const sortedFiles = computed(() => {
    const files = fileResult.value.list
    if (sortMode.value === 'batch') {
      return sortByBatch(files)
    }
    return sortByTime(files)
  })

  async function retrieveFilesAction() {
    loading.value = true
    try {
      fileResult.value = (await retrieveFiles({
        page: 1,
        page_size: PAGE_SIZE
      })) as FileListResult
    } finally {
      loading.value = false
    }
  }

  async function retrieveFilesPaginated(page: number = 1, pageSize: number = 20) {
    loading.value = true
    try {
      const result = (await retrieveFiles({
        page,
        limit: pageSize
      })) as FileListResult
      
      if (page === 1) {
        fileResult.value = result
      } else {
        fileResult.value = {
          ...fileResult.value,
          list: [...fileResult.value.list, ...result.list],
          hasMore: result.hasMore
        }
      }
      
      return result
    } finally {
      loading.value = false
    }
  }

  async function handleDownload(row: { id: number | string }) {
    await downloadBlob(row.id)
  }

  async function handleDelete(id: string | number) {
    try {
      await deleteFileById(id)
      await retrieveFilesAction()
    } catch (error) {
      console.log(error)
    }
  }

  function formatFileSizeAction(size: number) {
    return formatFileSize(size)
  }

  onMounted(async () => {
    retrieveFilesAction()
  })

  return {
    fileResult,
    loading,
    sortMode,
    sortedFiles,
    retrieveFilesAction,
    retrieveFilesPaginated,
    handleDownload,
    handleDelete,
    formatFileSizeAction
  }
}

export default useLoadFile
