<script setup lang="ts">
import type { UploadTask } from '@/compostions/useUploadQueue'

defineProps<{
  currentTask: UploadTask | null
  doneCount: number
  totalCount: number
}>()
</script>

<template>
  <div class="fuf-upload-progress">
    <div class="fuf-upload-progress__thumbnail" v-if="currentTask">
      <img :src="currentTask.previewUrl" alt="" />
    </div>
    <div class="fuf-upload-progress__percentage" v-if="currentTask">
      {{ currentTask.progress }}%
    </div>
    <div class="fuf-upload-progress__status">
      正在上传 {{ doneCount + 1 }}/{{ totalCount }}
    </div>
  </div>
</template>
