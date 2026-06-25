<script setup name="Dashboard" lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useUploadQueue } from '@/compostions/useUploadQueue'
import UploadProgress from './UploadProgress.vue'
import UploadDone from './UploadDone.vue'

type DashboardPhase = 'idle' | 'uploading' | 'done'

const phase = ref<DashboardPhase>('idle')

const {
  currentTask,
  isAllSettled,
  totalCount,
  doneCount,
  failedCount,
  enqueue,
  startQueue,
  resetQueue
} = useUploadQueue()

// 监听队列完成 → 转入 done 阶段
watch(isAllSettled, (settled) => {
  if (settled && phase.value === 'uploading') {
    phase.value = 'done'
  }
})

function handleFileSelected(fileInfo: any): void {
  const files: File[] = Array.isArray(fileInfo)
    ? fileInfo.map((f: any) => f.file as File)
    : [(fileInfo as any).file as File]

  if (files.length === 0) return

  enqueue(files)
  phase.value = 'uploading'
  startQueue()
}

function handleClose(): void {
  resetQueue()
  phase.value = 'idle'
}

// 检测是否在 Flutter App WebView 环境中（window.UploadBridge 由 Flutter 注入）
const isInApp = ref(false)
onMounted(() => {
  isInApp.value = typeof window.UploadBridge !== 'undefined'
})

function handleAppUpload(): void {
  window.UploadBridge!.postMessage(JSON.stringify({ action: 'pickImage' }))
}
</script>

<template>
  <div class="fuf-mobile-dashboard">
    <!-- IDLE: 大圆形上传按钮 -->
    <div v-if="phase === 'idle'" class="fuf-mobile-dashboard__idle">
      <!-- 浏览器环境：使用 van-uploader 原生文件选择 -->
      <van-uploader
        v-if="!isInApp"
        result-type="file"
        multiple
        accept="image/*"
        :after-read="handleFileSelected"
      >
        <div class="fuf-mobile-dashboard__big-btn">
          <van-icon name="photograph" size="48" />
          <span>选择照片上传</span>
        </div>
      </van-uploader>

      <!-- App 环境：通过 JavaScript Bridge 通知 Flutter 侧呼起原生选图器 -->
      <div
        v-else
        class="fuf-mobile-dashboard__big-btn"
        @click="handleAppUpload"
      >
        <van-icon name="photograph" size="48" />
        <span>选择照片上传</span>
      </div>
    </div>

    <!-- UPLOADING: 单图缩略图 + 百分比 -->
    <UploadProgress
      v-else-if="phase === 'uploading'"
      :current-task="currentTask"
      :done-count="doneCount"
      :total-count="totalCount"
    />

    <!-- DONE: 全屏完成强反馈 -->
    <UploadDone
      v-else-if="phase === 'done'"
      :total-count="totalCount"
      :failed-count="failedCount"
      @close="handleClose"
    />
  </div>
</template>
