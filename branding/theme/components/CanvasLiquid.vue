<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

import {
  createLiquid,
  supportsHtmlInCanvas,
  type LiquidInstance,
} from '../../canvasui/LiquidVanilla'

interface Props {
  simResolution?: number
  dyeResolution?: number
  densityDissipation?: number
  velocityDissipation?: number
  pressure?: number
  pressureIterations?: number
  curl?: number
  radius?: number
  force?: number
  intensity?: number
  distortion?: number
  blend?: number
  color?: [number, number, number]
  rainbow?: boolean
}

const props = defineProps<Props>()

const sourceEl = ref<HTMLCanvasElement | null>(null)
const contentEl = ref<HTMLDivElement | null>(null)
const outputEl = ref<HTMLCanvasElement | null>(null)
const native = ref(false)
const active = ref(false)

let instance: LiquidInstance | null = null
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
  instance = createLiquid(
    { source: sourceEl.value, content: contentEl.value, output: outputEl.value },
    props,
  )
  if (native.value && !instance) {
    native.value = false
    await nextTick()
    if (disposed) return
    if (!sourceEl.value || !contentEl.value || !outputEl.value) return
    instance = createLiquid(
      { source: sourceEl.value, content: contentEl.value, output: outputEl.value },
      props,
    )
  }
  active.value = instance !== null
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
