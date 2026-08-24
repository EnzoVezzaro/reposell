<script setup lang="ts">
import { ref, onBeforeUnmount } from 'vue'

defineProps<{ cmd?: string }>()

const copied = ref(false)
let resetTimer = null

async function copy(cmd: string) {
  try {
    await navigator.clipboard.writeText(cmd)
    copied.value = true
    clearTimeout(resetTimer)
    resetTimer = setTimeout(() => (copied.value = false), 1600)
  } catch {
    /* clipboard unavailable */
  }
}

onBeforeUnmount(() => clearTimeout(resetTimer))
</script>

<template>
  <button type="button" class="lx-cmdchip" @click="copy(cmd ?? '')">
    <span class="p">$&nbsp;</span><span>{{ cmd }}</span>
    <span class="cp">{{ copied ? '✓ copied' : '⧉ copy' }}</span>
  </button>
</template>

<style scoped>
.lx-cmdchip {
  font-family: inherit;
}
</style>
