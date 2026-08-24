<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  size?: number
  animate?: boolean
}>()

const width = computed(() => props.size || 32)
</script>

<template>
  <svg
    class="waveform animate-wave"
    :style="{ width: `${width}px`, height: `${width * 0.625}px` }"
    viewBox="0 0 32 20"
    fill="none"
    aria-hidden="true"
  >
    <rect x="2"  y="10" width="4" height="10" rx="2" fill="currentColor" style="animation-delay: 0ms" />
    <rect x="9"  y="6"  width="4" height="14" rx="2" fill="currentColor" style="animation-delay: 100ms" />
    <rect x="16" y="2"  width="4" height="18" rx="2" fill="currentColor" style="animation-delay: 200ms" />
    <rect x="23" y="6"  width="4" height="14" rx="2" fill="currentColor" style="animation-delay: 300ms" />
    <rect x="30" y="10" width="4" height="10" rx="2" fill="currentColor" style="animation-delay: 400ms" />
  </svg>
</template>
