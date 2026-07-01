import { useReducer } from 'vue'
import type { FileListResult } from './load'

interface PaginationState {
  page: number
  loading: boolean
  hasMore: boolean
  error: string | null
  allFiles: FileListResult['list']
  totalCount: number
}

type PaginationAction =
  | { type: 'LOADING_START' }
  | { type: 'LOADING_SUCCESS'; payload: { files: FileListResult['list']; hasMore: boolean; totalCount: number; page: number } }
  | { type: 'LOADING_ERROR'; payload: string }
  | { type: 'RETRY' }
  | { type: 'RESET' }
  | { type: 'APPEND_FILES'; payload: FileListResult['list'] }

const initialState: PaginationState = {
  page: 1,
  loading: false,
  hasMore: true,
  error: null,
  allFiles: [],
  totalCount: 0
}

function paginationReducer(state: PaginationState, action: PaginationAction): PaginationState {
  switch (action.type) {
    case 'LOADING_START':
      return {
        ...state,
        loading: true,
        error: null
      }
    
    case 'LOADING_SUCCESS':
      return {
        ...state,
        loading: false,
        error: null,
        page: action.payload.page,
        hasMore: action.payload.hasMore,
        totalCount: action.payload.totalCount,
        allFiles: action.payload.page === 1 
          ? action.payload.files 
          : [...state.allFiles, ...action.payload.files]
      }
    
    case 'LOADING_ERROR':
      return {
        ...state,
        loading: false,
        error: action.payload
      }
    
    case 'RETRY':
      return {
        ...state,
        error: null
      }
    
    case 'RESET':
      return {
        ...initialState
      }
    
    case 'APPEND_FILES':
      return {
        ...state,
        allFiles: [...state.allFiles, ...action.payload]
      }
    
    default:
      return state
  }
}

export function usePagination() {
  const [state, dispatch] = useReducer(paginationReducer, initialState)

  const startLoading = () => dispatch({ type: 'LOADING_START' })
  
  const setLoadingSuccess = (files: FileListResult['list'], hasMore: boolean, totalCount: number, page: number) => {
    dispatch({ 
      type: 'LOADING_SUCCESS', 
      payload: { files, hasMore, totalCount, page } 
    })
  }
  
  const setLoadingError = (error: string) => {
    dispatch({ type: 'LOADING_ERROR', payload: error })
  }
  
  const retry = () => dispatch({ type: 'RETRY' })
  
  const reset = () => dispatch({ type: 'RESET' })
  
  const appendFiles = (files: FileListResult['list']) => {
    dispatch({ type: 'APPEND_FILES', payload: files })
  }

  return {
    state,
    startLoading,
    setLoadingSuccess,
    setLoadingError,
    retry,
    reset,
    appendFiles
  }
}
