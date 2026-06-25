<script setup lang="ts">
import useSize from '@/compostions/size'
const { height } = useSize()
</script>

<template>
  <div class="fuf-mobile" :style="{height: `${height}px`}">
    <RouterView />
  </div>
  
</template>