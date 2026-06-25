<script setup lang="ts">
import { provide, watch } from 'vue'
import { useUploadQueue } from '@/compostions/useUploadQueue'
import useSize from '@/compostions/size'
import UploadProgressBar from './modules/UploadProgressBar.vue'

const { height } = useSize()

const queue = useUploadQueue()
const { isUploading, isAllSettled, totalCount, doneCount, currentTask, cancelQueue, resetQueue } = queue

provide('uploadQueue', queue)

watch(isAllSettled, (val) => {
  if (val) resetQueue()
})

function handleStop() {
  cancelQueue()
  resetQueue()
}
</script>

<template>
  <el-container class="fuf-pc common-layout" :style="{ height: `${height}px` }">
    <el-header class="fuf-pc-header">
      <div class="fuf-pc-header__brand">
        <span class="fuf-pc-header__brand-name">简单存储</span>
      </div>
      <!-- Dashboard 通过 Teleport 把工具栏注入到这里 -->
      <div id="fuf-header-toolbar" class="fuf-pc-header__actions fuf-card"></div>
    </el-header>
    <el-main class="fuf-pc-main">
      <RouterView />
    </el-main>
    <el-footer class="fuf-pc-footer">
      <UploadProgressBar
        v-if="isUploading"
        :total-count="totalCount"
        :done-count="doneCount"
        :current-file-progress="currentTask?.progress ?? 0"
        @stop="handleStop"
      />
      <template v-else>@catwindboy</template>
    </el-footer>
  </el-container>
</template>
