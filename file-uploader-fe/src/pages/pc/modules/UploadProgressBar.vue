<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  totalCount: number
  doneCount: number
  currentFileProgress: number
}>()

const emit = defineEmits<{
  stop: []
}>()

const overallProgress = computed(() =>
  Math.round((props.doneCount * 100 + props.currentFileProgress) / props.totalCount)
)

const labelText = computed(() =>
  props.doneCount < props.totalCount
    ? `正在上传 ${props.doneCount + 1} / 共 ${props.totalCount} 个文件`
    : `已完成 ${props.totalCount} 个文件`
)
</script>

<template>
  <div class="fuf-upload-progress-bar">
    <span class="fuf-upload-progress-bar__label">{{ labelText }}</span>
    <el-progress
      class="fuf-upload-progress-bar__progress"
      :percentage="overallProgress"
      :stroke-width="6"
      :show-text="false"
    />
    <span class="fuf-upload-progress-bar__pct">{{ overallProgress }}%</span>
    <el-button size="small" type="danger" plain @click="emit('stop')">停止上传</el-button>
  </div>
</template>
