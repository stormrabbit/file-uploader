<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { getApiBaseUrl } from '@/utils/apiBase'
import type { FileItem } from './FileGrid.vue'

interface Props {
  modelValue: boolean
  files: FileItem[]
  initialIndex?: number
}

const props = withDefaults(defineProps<Props>(), {
  initialIndex: 0
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'download', file: FileItem): void
  (e: 'delete', file: FileItem): void
}>()

const currentIndex = ref(props.initialIndex)

watch(
  () => props.modelValue,
  (visible) => {
    if (visible) {
      currentIndex.value = props.initialIndex
    }
  }
)

const currentImage = computed(() => props.files[currentIndex.value])

function combineUrl(url: string): string {
  return getApiBaseUrl() + url.substring(1)
}

function close(): void {
  emit('update:modelValue', false)
}

function prev(): void {
  if (props.files.length === 0) return
  currentIndex.value = (currentIndex.value - 1 + props.files.length) % props.files.length
}

function next(): void {
  if (props.files.length === 0) return
  currentIndex.value = (currentIndex.value + 1) % props.files.length
}

function handleDownload(): void {
  if (currentImage.value) {
    emit('download', currentImage.value)
  }
}

function handleDelete(): void {
  if (!currentImage.value) return
  const file = currentImage.value
  close()
  emit('delete', file)
}
</script>

<template>
  <div
    v-if="modelValue"
    class="fuf-image-preview"
    @click.self="close"
  >
    <button class="fuf-image-preview__close" @click="close">
      x
    </button>

    <div class="fuf-image-preview__counter">
      {{ currentIndex + 1 }} / {{ files.length }}
    </div>

    <img
      v-if="currentImage"
      class="fuf-image-preview__image"
      :src="combineUrl(currentImage.fileUrl)"
      :alt="currentImage.fileName"
    />

    <div class="fuf-image-preview__toolbar">
      <el-button size="large" @click="prev">
        <span>上一张</span>
      </el-button>
      <el-button size="large" @click="next">
        <span>下一张</span>
      </el-button>
      <el-button type="primary" size="large" @click="handleDownload">
        <span>下载</span>
      </el-button>
      <el-button type="danger" size="large" @click="handleDelete">
        <span>删除</span>
      </el-button>
    </div>
  </div>
</template>
