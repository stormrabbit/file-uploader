import { ref } from 'vue'
import { retrieveFiles } from '@/api'
import type { FileListResult } from './load'
import { usePagination } from './usePagination'
import { getPageSize, getMaxPhotosInMemory } from '@/config/pagination'

export function usePaginatedFiles() {
  const { state, startLoading, setLoadingSuccess, setLoadingError, retry, reset } = usePagination()
  const currentRequest = ref<{ page: number; controller: AbortController } | null>(null)

  async function fetchFiles(page: number = 1, pageSize?: number) {
    const actualPageSize = pageSize || getPageSize()
    const maxPhotos = getMaxPhotosInMemory()
    
    // Cancel any ongoing request for the same page
    if (currentRequest.value?.page === page) {
      currentRequest.value.controller.abort()
    }

    const controller = new AbortController()
    currentRequest.value = { page, controller }

    startLoading()

    try {
      const response = await retrieveFiles({
        page,
        limit: actualPageSize
      })

      const files = response.list || []
      const totalCount = response.total || 0
      const hasMore = files.length === actualPageSize && (state.allFiles.length + files.length) < totalCount

      // Memory management: limit photos in memory
      let processedFiles = files
      if (page > 1 && state.allFiles.length + files.length > maxPhotos) {
        // Keep only the most recent photos if we exceed the limit
        const excessCount = state.allFiles.length + files.length - maxPhotos
        processedFiles = state.allFiles.slice(excessCount).concat(files)
        setLoadingSuccess(processedFiles, hasMore, totalCount, page)
      } else {
        setLoadingSuccess(files, hasMore, totalCount, page)
      }
      return response
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        // Request was aborted, don't treat as error
        return null
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch files'
      setLoadingError(errorMessage)
      throw error
    } finally {
      if (currentRequest.value?.page === page) {
        currentRequest.value = null
      }
    }
  }

  async function fetchNextPage() {
    if (state.loading || !state.hasMore) {
      return
    }
    
    const nextPage = state.page + 1
    return fetchFiles(nextPage)
  }

  async function refresh() {
    reset()
    return fetchFiles(1)
  }

  function cancelCurrentRequest() {
    if (currentRequest.value) {
      currentRequest.value.controller.abort()
      currentRequest.value = null
    }
  }

  return {
    // State
    files: state.allFiles,
    loading: state.loading,
    hasMore: state.hasMore,
    error: state.error,
    totalCount: state.totalCount,
    currentPage: state.page,
    
    // Actions
    fetchFiles,
    fetchNextPage,
    refresh,
    retry: () => {
      if (state.error) {
        retry()
        return fetchNextPage()
      }
    },
    reset,
    cancelCurrentRequest
  }
}
