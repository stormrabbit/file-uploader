<script setup name="Dashboard" lang="ts">
import { ref, inject, watch } from 'vue'
import useLoadFile from '@/compostions/load'
import { deleteAllFiles, getConfig, updateStorageDir } from '@/api'
import { useMessageBox, useMessage } from '@/utils/messageHelper'
import FileGrid from './FileGrid.vue'
import QrcodeConnectDialog from './QrcodeConnectDialog.vue'
import type { useUploadQueue } from '@/compostions/useUploadQueue'

const connectDialogVisible = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)

const {
  fileResult,
  loading,
  sortedFiles,
  retrieveFilesAction,
  handleDelete
} = useLoadFile()

const queue = inject<ReturnType<typeof useUploadQueue>>('uploadQueue')!
const { enqueue, startQueue, tasks } = queue

watch(() => tasks.value.length, (newLen, oldLen) => {
  if (oldLen > 0 && newLen === 0) {
    retrieveFilesAction()
  }
})

function handleUploadClick() {
  fileInputRef.value?.click()
}

function handleFilesSelected(event: Event) {
  const input = event.target as HTMLInputElement
  const files = Array.from(input.files ?? [])
  if (!files.length) return
  input.value = ''
  enqueue(files)
  startQueue()
}

async function handleClearAll() {
  try {
    await useMessageBox().confirm(
      { msg: '确定清空全部文件？此操作不可恢复。' },
      { type: 'warning', cancelButtonText: '取消', confirmButtonText: '确认' }
    )
    await deleteAllFiles()
    await retrieveFilesAction()
  } catch {
    // 用户取消
  }
}

function handleFileDelete(id: number) {
  handleDelete(id)
}

// ── 设置（仅桌面端）────────────────────────────────────────────────────────────
const isDesktop = !!window.electronAPI?.isDesktop
const settingsVisible = ref(false)
const currentStorageDir = ref('')
const settingsLoading = ref(false)

async function openSettings() {
  settingsVisible.value = true
  try {
    const res = await getConfig()
    currentStorageDir.value = res.storageDir
  } catch {
    currentStorageDir.value = '获取失败'
  }
}

async function handleChangeStorageDir() {
  const folder = await window.electronAPI!.selectFolder()
  if (!folder) return
  settingsLoading.value = true
  try {
    const res = await updateStorageDir(folder)
    currentStorageDir.value = res.storageDir
    useMessage().success('存储位置已更新，新文件将保存到此目录')
  } catch {
    useMessage().error('更新失败，请重试')
  } finally {
    settingsLoading.value = false
  }
}
</script>

<template>
  <div class="fuf-dashboard">
    <input
      ref="fileInputRef"
      type="file"
      multiple
      accept="*"
      style="display: none"
      @change="handleFilesSelected"
    />

    <!-- 操作按钮通过 Teleport 注入 Header -->
    <Teleport to="#fuf-header-toolbar">
      <div class="fuf-header-actions">
        <div class="fuf-pc-header__main">
          <button class="fuf-header-btn fuf-header-btn--primary" @click="handleUploadClick">
            上传文件
          </button>
          <button class="fuf-header-btn" @click="retrieveFilesAction">
            刷新
          </button>
          <button class="fuf-header-btn" @click="connectDialogVisible = true">
            连接
          </button>
          <button v-if="isDesktop" class="fuf-header-btn" @click="openSettings">
            设置
          </button>
        </div>
        <div class="fuf-pc-header__divider"></div>
        <button
          class="fuf-header-btn fuf-header-btn--danger"
          @click="handleClearAll"
          :disabled="fileResult.list.length === 0"
        >
          清空全部
        </button>
      </div>
    </Teleport>

    <!-- 文件网格 -->
    <FileGrid
      :files="sortedFiles"
      @delete="handleFileDelete"
    />

    <!-- 空状态 -->
    <div v-if="fileResult.list.length === 0 && !loading" class="fuf-dashboard__empty">
      暂无文件，请上传
    </div>

    <QrcodeConnectDialog v-model="connectDialogVisible" />

    <!-- 设置弹窗（仅桌面端渲染） -->
    <el-dialog v-if="isDesktop" v-model="settingsVisible" title="设置" width="480px">
      <div class="fuf-settings">
        <div class="fuf-settings__label">文件存储位置</div>
        <div class="fuf-settings__path">{{ currentStorageDir || '加载中…' }}</div>
        <div class="fuf-settings__hint">更改后仅影响新上传的文件，已有文件不受影响。</div>
      </div>
      <template #footer>
        <el-button @click="settingsVisible = false">关闭</el-button>
        <el-button type="primary" :loading="settingsLoading" @click="handleChangeStorageDir">
          更改位置
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.fuf-settings__label {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  margin-bottom: 6px;
}
.fuf-settings__path {
  font-size: 14px;
  word-break: break-all;
  padding: 8px 10px;
  background: var(--el-fill-color-light);
  border-radius: 4px;
  margin-bottom: 8px;
}
.fuf-settings__hint {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}
</style>
