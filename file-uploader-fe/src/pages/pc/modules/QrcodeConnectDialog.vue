<script setup lang="ts">
import { ref, watch } from 'vue'
import QRCode from 'qrcode'
import { getServerInfo } from '@/api'

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ (e: 'update:modelValue', val: boolean): void }>()

const mobileUrl = ref('')
const qrcodeDataUrl = ref('')
const error = ref('')
const loading = ref(false)

watch(
  () => props.modelValue,
  async (visible) => {
    if (!visible) {
      qrcodeDataUrl.value = ''
      error.value = ''
      return
    }
    loading.value = true
    error.value = ''
    try {
      const { ips:[lan_ip] } = await getServerInfo()
      const port = import.meta.env.VITE_API_BASE_FRONTEND_PORT
      const url = `http://${lan_ip}:${port}/mobile`
      mobileUrl.value = url
      qrcodeDataUrl.value = await QRCode.toDataURL(url, { width: 240, margin: 2 })
    } catch {
      error.value = '获取局域网地址失败，请检查服务是否运行'
    } finally {
      loading.value = false
    }
  }
)

function handleClose() {
  emit('update:modelValue', false)
}
</script>

<template>
  <el-dialog
    :model-value="modelValue"
    title="手机扫码连接"
    width="320px"
    @update:model-value="emit('update:modelValue', $event)"
    @closed="handleClose"
  >
    <div class="qrcode-connect">
      <div v-if="loading" class="qrcode-connect__loading">
        <span>生成中…</span>
      </div>
      <template v-else-if="qrcodeDataUrl">
        <img :src="qrcodeDataUrl" alt="连接二维码" class="qrcode-connect__img" />
        <p class="qrcode-connect__hint">用手机扫描二维码，打开上传页面</p>
        <p class="qrcode-connect__hint">或访问 <span>{{ mobileUrl }}</span></p>
      </template>
      <el-alert v-else-if="error" :title="error" type="error" :closable="false" />
    </div>
  </el-dialog>
</template>
