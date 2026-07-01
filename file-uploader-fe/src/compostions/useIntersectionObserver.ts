import { ref, onMounted, onUnmounted } from 'vue'

interface UseIntersectionObserverOptions {
  threshold?: number
  rootMargin?: string
  enabled?: boolean
}

export function useIntersectionObserver(
  callback: () => void,
  options: UseIntersectionObserverOptions = {}
) {
  const { threshold = 0.8, rootMargin = '0px', enabled = true } = options
  const targetRef = ref<HTMLElement | null>(null)
  const observerRef = ref<IntersectionObserver | null>(null)

  const setupObserver = () => {
    if (!enabled || !targetRef.value) return

    // Clean up existing observer
    if (observerRef.value) {
      observerRef.value.disconnect()
    }

    observerRef.value = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            callback()
          }
        })
      },
      {
        threshold,
        rootMargin
      }
    )

    observerRef.value.observe(targetRef.value)
  }

  const cleanup = () => {
    if (observerRef.value) {
      observerRef.value.disconnect()
      observerRef.value = null
    }
  }

  onMounted(() => {
    setupObserver()
  })

  onUnmounted(() => {
    cleanup()
  })

  // Re-setup observer when options change
  const updateObserver = () => {
    cleanup()
    setupObserver()
  }

  return {
    targetRef,
    updateObserver,
    cleanup
  }
}
