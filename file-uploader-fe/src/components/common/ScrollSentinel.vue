<script setup lang="ts">
interface Props {
  enabled?: boolean
}

withDefaults(defineProps<Props>(), {
  enabled: true
})

defineEmits<{
  intersect: []
}>()
</script>

<template>
  <div 
    v-if="enabled"
    class="scroll-sentinel"
    style="height: 1px; width: 100%; visibility: hidden;"
  />
</template>

<style scoped>
.scroll-sentinel {
  pointer-events: none;
}
</style>
