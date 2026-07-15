<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  totalCount: number
  failedCount: number
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'retry'): void
}>()

const btnText = computed(() => {
  return props.failedCount > 0 ? '重试' : '关闭'
})
const handleFinish = () => {
  if (props.failedCount > 0) {
    emit('retry')
  } else {
    emit('close')
  }
}
</script>

<template>
  <div class="fuf-upload-done">
    <div class="fuf-upload-done__icon">✅</div>
    <div class="fuf-upload-done__message">
      全部传完啦！共传了 {{ totalCount - failedCount }} 张照片
    </div>
    <div class="fuf-upload-done__fail-info" v-if="failedCount > 0">
      （{{ failedCount }} 张上传失败）
    </div>

    <div class="fuf-upload-done__pc-guide">
      请在电脑端查看已上传的照片
    </div>
    <van-button
      class="fuf-upload-done__close-btn"
      type="primary"
      block
      @click="handleFinish"
    >
      {{ btnText }}
    </van-button>
  </div>
</template>
