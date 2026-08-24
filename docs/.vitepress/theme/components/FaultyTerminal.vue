<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import FaultyTerminal from './FaultyTerminal.js'

const props = defineProps({
  scale: { type: Number, default: 1 },
  gridMul: { type: Array, default: () => [2, 1] },
  digitSize: { type: Number, default: 1.5 },
  timeScale: { type: Number, default: 0.3 },
  pause: { type: Boolean, default: false },
  scanlineIntensity: { type: Number, default: 0.3 },
  glitchAmount: { type: Number, default: 1 },
  flickerAmount: { type: Number, default: 1 },
  noiseAmp: { type: Number, default: 0 },
  chromaticAberration: { type: Number, default: 0 },
  dither: { type: [Boolean, Number], default: 0 },
  curvature: { type: Number, default: 0.2 },
  tint: { type: String, default: '#ffffff' },
  mouseReact: { type: Boolean, default: true },
  mouseStrength: { type: Number, default: 0.2 },
  dpr: { type: Number, default: undefined },
  pageLoadAnimation: { type: Boolean, default: true },
  brightness: { type: Number, default: 1 },
  className: { type: String, default: '' },
})

const containerRef = ref(null)
let instance = null

onMounted(() => {
  if (!containerRef.value) return
  instance = new FaultyTerminal(containerRef.value, {
    scale: props.scale,
    gridMul: props.gridMul,
    digitSize: props.digitSize,
    timeScale: props.timeScale,
    pause: props.pause,
    scanlineIntensity: props.scanlineIntensity,
    glitchAmount: props.glitchAmount,
    flickerAmount: props.flickerAmount,
    noiseAmp: props.noiseAmp,
    chromaticAberration: props.chromaticAberration,
    dither: props.dither,
    curvature: props.curvature,
    tint: props.tint,
    mouseReact: props.mouseReact,
    mouseStrength: props.mouseStrength,
    dpr: props.dpr,
    pageLoadAnimation: props.pageLoadAnimation,
    brightness: props.brightness,
  })
})

onBeforeUnmount(() => {
  instance?.destroy()
  instance = null
})
</script>

<template>
  <div
    ref="containerRef"
    class="faulty-terminal-container"
    :class="className"
  />
</template>

<style scoped>
.faulty-terminal-container {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
}
</style>
