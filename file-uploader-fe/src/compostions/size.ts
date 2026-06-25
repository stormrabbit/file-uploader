import type { ISize } from '@/data'
import { onMounted, onUnmounted, ref } from 'vue'
const height = ref(0)
const width = ref(0)
const offsetHeight = ref(0)
const scrollHeight = ref(0)

function resize() {
  height.value = document.documentElement.clientHeight
  width.value = document.documentElement.clientWidth
  offsetHeight.value = document.documentElement.offsetHeight
  scrollHeight.value = document.documentElement.scrollHeight
  if (width.value > height.value * 0.6) {
    width.value = Math.floor((430 * height.value) / 932)
  }
}
function useSize(): ISize {
  onMounted(() => {
    resize()
    window.addEventListener('resize', resize)
  })

  onUnmounted(() => {
    window.removeEventListener('resize', resize)
  })
  return {
    height,
    width,
    offsetHeight,
    scrollHeight,
    resize
  }
}

export default useSize
