<script setup lang="ts">
import { ref, computed } from 'vue'
import { downloadBlob } from '@/utils/download'
import { ElMessage } from 'element-plus'
import { getApiBaseUrl } from '@/utils/apiBase'
import ImagePreview from './ImagePreview.vue'
import LoadingIndicator from '@/components/common/LoadingIndicator.vue'
import ErrorMessage from '@/components/common/ErrorMessage.vue'
import ScrollSentinel from '@/components/common/ScrollSentinel.vue'

/** 文件项接口（与 load.ts 中 FileListResult.list item 一致） */
export interface FileItem {
  createDate: string
  fileMd5: string
  fileName: string
  fileUrl: string
  id: number
  nameSuffix: string
  nameWithSuffix: string
  size: number
}

/** 图片扩展名集合 */
const IMAGE_EXTENSIONS = new Set([
  'jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'
])

/** 网格列数常量（可配置） */
const GRID_COLS_WIDE = 6   // ≥1280px
const GRID_COLS_NARROW = 3 // <1280px

/** 文件类型图标映射 */
const FILE_ICON_MAP: Record<string, string> = {
  pdf: '📄',
  doc: '📝', docx: '📝',
  xls: '📊', xlsx: '📊',
  ppt: '📽️', pptx: '📽️',
  zip: '🗜️', rar: '🗜️', '7z': '🗜️', tar: '🗜️', gz: '🗜️',
  mp4: '🎬', avi: '🎬', mov: '🎬', mkv: '🎬',
  mp3: '🎵', wav: '🎵', flac: '🎵',
  txt: '📃',
  json: '📋',
  csv: '📊',
}

const props = defineProps<{
  files: FileItem[]
  loading?: boolean
  hasMore?: boolean
  error?: string | null
}>()

const emit = defineEmits<{
  (e: 'delete', id: number): void
  (e: 'retry'): void
  (e: 'loadMore'): void
}>()

/** 判断文件是否为图片类型 */
function isImage(file: FileItem): boolean {
  const nameSuffix = file.fileName.split('.').pop() || ''
  return IMAGE_EXTENSIONS.has(nameSuffix)
}

/** 获取文件类型图标 */
function getFileIcon(file: FileItem): string {
  const ext = file.nameSuffix.toLowerCase()
  return FILE_ICON_MAP[ext] ?? '📄'
}

/** 图片文件列表（用于大图预览） */
const imageFiles = computed(() => props.files.filter(f => isImage(f)))

/** 大图预览状态 */
const previewVisible = ref(false)
const previewIndex = ref(0)

/** 打开图片预览蒙层 */
function openPreview(file: FileItem): void {
  const index = imageFiles.value.findIndex(f => f.id === file.id)
  previewIndex.value = index >= 0 ? index : 0
  previewVisible.value = true
}

function combineUrl(url: string) {
  return getApiBaseUrl() + url.substring(1)
}


function formatFileSize(size: number): string {
  if (size < 1024) {
    return size + ' B'
  }
  if (size < 1024 * 1024) {
    return (size / 1024).toFixed(2) + ' KB'
  }
  if (size < 1024 * 1024 * 1024) {
    return (size / 1024 / 1024).toFixed(2) + ' MB'
  }
  return (size / 1024 / 1024 / 1024).toFixed(2) + ' GB'
}

/** 下载文件 */
async function handleDownload(file: FileItem) {
  try {
    await downloadBlob(file.id)
  } catch {
    ElMessage.error('下载失败')
  }
}

/** 删除文件 */
function handleDelete(file: FileItem) {
  emit('delete', file.id)
}
</script>

<template>
  <div class="fuf-file-grid">
    <div
      class="fuf-file-grid__item"
      v-for="file in files"
      :key="file.id"
    >
      <!-- 图片类型：缩略图，点击打开自定义预览蒙层 -->
      <div class="fuf-file-grid__image" v-if="isImage(file)" @click="openPreview(file)">
        <el-image
          :src="combineUrl(file.fileUrl)"
          fit="cover"
          lazy
        />
      </div>

      <!-- 非图片类型：文件图标 + 文件名 -->
      <div class="fuf-file-grid__file-icon" v-else>
        <span class="fuf-file-grid__file-icon-emoji">{{ getFileIcon(file) }}</span>
        <span class="fuf-file-grid__file-icon-name">{{ file.nameWithSuffix }}</span>
      </div>

      <!-- 文件信息 -->
      <div class="fuf-file-grid__info">
        <div class="fuf-file-grid__name">{{ file.fileName }}</div>
        <div class="fuf-file-grid__size">{{ formatFileSize(file.size) }}</div>
      </div>

      <!-- 底部操作按钮 -->
      <div class="fuf-file-grid__actions">
        <el-button
          class="fuf-file-grid__action-btn"
          type="primary"
          link
          size="small"
          @click.stop="handleDownload(file)"
        >
          下载
        </el-button>
        <div class="fuf-file-grid__actions-divider"></div>
        <el-button
          class="fuf-file-grid__action-btn"
          type="danger"
          link
          size="small"
          @click.stop="handleDelete(file)"
        >
          删除
        </el-button>
      </div>
    </div>

    <!-- Loading indicator -->
    <LoadingIndicator 
      v-if="loading && files.length > 0"
      text="加载更多..."
    />

    <!-- Error message -->
    <ErrorMessage 
      v-if="error && files.length > 0"
      :message="error"
      @retry="emit('retry')"
    />

    <!-- Scroll sentinel for infinite scroll -->
    <ScrollSentinel 
      v-if="hasMore && !loading && !error"
      @intersect="emit('loadMore')"
    />
  </div>

  <ImagePreview
    v-model="previewVisible"
    :files="imageFiles"
    :initial-index="previewIndex"
    @download="handleDownload"
    @delete="handleDelete"
  />
</template>
