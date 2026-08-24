<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

import {
  createDecryptReveal,
  supportsHtmlInCanvas,
  type DecryptRevealInstance,
} from '../../canvasui/DecryptRevealVanilla'

interface Props {
  radius?: number
  softness?: number
  cell?: number
  aspect?: number
  charset?: string
  colored?: number
  color?: string
  brightness?: number
  legibility?: number
  contrast?: number
  exposure?: number
  scramble?: number
  scrambleSpeed?: number
  edgeWidth?: number
  edgeFlicker?: number
  edgeGlow?: number
  edgeTint?: number
  aberration?: number
  passthrough?: number
  threshold?: number
  background?: string
  smoothing?: number
}

const props = withDefaults(defineProps<Props>(), {
  color: '#ffd43b',
})

const sourceEl = ref<HTMLCanvasElement | null>(null)
const contentEl = ref<HTMLDivElement | null>(null)
const outputEl = ref<HTMLCanvasElement | null>(null)
const native = ref(false)

let instance: DecryptRevealInstance | null = null
let disposed = false

function reducedMotion(): boolean {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true
}

async function boot(): Promise<void> {
  if (reducedMotion()) return
  native.value = supportsHtmlInCanvas()
  await nextTick()
  if (disposed) return
  if (!sourceEl.value || !contentEl.value || !outputEl.value) return
  instance = createDecryptReveal(
    { source: sourceEl.value, content: contentEl.value, output: outputEl.value },
    props,
  )
  if (native.value && !instance) {
    native.value = false
    await nextTick()
    if (disposed) return
    if (!sourceEl.value || !contentEl.value || !outputEl.value) return
    instance = createDecryptReveal(
      { source: sourceEl.value, content: contentEl.value, output: outputEl.value },
      props,
    )
  }
}

onMounted(() => {
  void boot()
})

onBeforeUnmount(() => {
  disposed = true
  instance?.destroy()
  instance = null
})

watch(
  () => ({ ...props }),
  (next) => instance?.setOptions(next),
  { deep: true },
)
</script>

<template>
  <div class="rs-canvas-fx" style="position: relative">
    <canvas
      v-if="native"
      ref="sourceEl"
      layoutsubtree="true"
      style="position: absolute; inset: 0; width: 100%; height: 100%"
    >
      <div ref="contentEl" style="position: relative; width: 100%; height: 100%; overflow: auto">
        <slot />
      </div>
    </canvas>
    <div
      v-if="!native"
      ref="contentEl"
      style="position: relative; width: 100%; height: 100%"
    >
      <slot />
    </div>
    <canvas
      ref="outputEl"
      aria-hidden="true"
      style="position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none"
    />
  </div>
</template>
