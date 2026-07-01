<script setup lang="ts">
import { RefreshRight, WarningFilled } from '@element-plus/icons-vue'

interface Props {
  visible?: boolean
  message?: string
}

withDefaults(defineProps<Props>(), {
  visible: true,
  message: '加载失败，请重试'
})

const emit = defineEmits<{
  retry: []
}>()

function handleRetry() {
  emit('retry')
}
</script>

<template>
  <div v-if="visible" class="error-message">
    <el-icon class="error-message__icon">
      <WarningFilled />
    </el-icon>
    <span class="error-message__text">{{ message }}</span>
    <el-button 
      class="error-message__retry"
      type="primary" 
      link 
      size="small"
      @click="handleRetry"
    >
      <el-icon><RefreshRight /></el-icon>
      重试
    </el-button>
  </div>
</template>

<style scoped>
.error-message {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  gap: 8px;
  color: var(--el-color-danger);
  font-size: 14px;
  transition: opacity 0.3s ease-in-out;
}

.error-message__icon {
  color: var(--el-color-danger);
  transition: opacity 0.3s ease-in-out;
}

.error-message__text {
  flex: 1;
  transition: opacity 0.3s ease-in-out;
}

.error-message__retry {
  display: flex;
  align-items: center;
  gap: 4px;
  transition: opacity 0.3s ease-in-out;
}
</style>
