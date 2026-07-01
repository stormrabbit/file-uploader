<script setup lang="ts">
import { Loading } from '@element-plus/icons-vue'

interface Props {
  visible?: boolean
  text?: string
}

withDefaults(defineProps<Props>(), {
  visible: true,
  text: '加载中...'
})
</script>

<template>
  <div v-if="visible" class="loading-indicator">
    <el-icon class="loading-indicator__spinner">
      <Loading />
    </el-icon>
    <span class="loading-indicator__text">{{ text }}</span>
  </div>
</template>

<style scoped>
.loading-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  gap: 8px;
  color: var(--el-text-color-secondary);
  font-size: 14px;
  transition: opacity 0.3s ease-in-out;
}

.loading-indicator__spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.loading-indicator__text {
  transition: opacity 0.3s ease-in-out;
}
</style>
