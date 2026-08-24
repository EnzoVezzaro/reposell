<script setup>
/**
 * HeroBackground — FaultyTerminal wrapper for the reposell hero.
 * The engine tint follows the ACTIVE theme via --lx-hero-tint and
 * re-initializes on every theme switch (no cross-theme styling).
 */
import { ref, onMounted, onBeforeUnmount } from 'vue'

const containerRef = ref(null)
let destroyFn = null
let themeObserver = null

function currentTint() {
  if (typeof getComputedStyle !== 'function') return '#0af188'
  const value = getComputedStyle(document.documentElement).getPropertyValue('--lx-hero-tint').trim()
  return value !== '' ? value : '#0af188'
}

async function mountTerminal() {
  if (containerRef.value === null) return
  destroyFn?.()
  destroyFn = null
  try {
    const { default: createFaultyTerminal } = await import('./FaultyTerminal.js')
    destroyFn = createFaultyTerminal(containerRef.value, {
      scale: 0.8,
      gridMul: [2, 1],
      digitSize: 1.5,
      timeScale: 0.3,
      scanlineIntensity: 0.3,
      glitchAmount: 1,
      flickerAmount: 1,
      noiseAmp: 0,
      chromaticAberration: 0,
      dither: 0,
      curvature: 0.2,
      tint: currentTint(),
      mouseReact: true,
      mouseStrength: 0.6,
      pageLoadAnimation: true,
      brightness: 1,
    })
  } catch (e) {
    console.warn('FaultyTerminal failed to initialize:', e)
  }
}

onMounted(async () => {
  await mountTerminal()
  themeObserver = new MutationObserver(() => {
    void mountTerminal()
  })
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme'],
  })
})

onBeforeUnmount(() => {
  themeObserver?.disconnect()
  themeObserver = null
  destroyFn?.()
  destroyFn = null
})
</script>

<template>
  <div ref="containerRef" class="hero-faulty-terminal">
    <div class="hero-fallback-grid" />
  </div>
</template>

<style scoped>
.hero-faulty-terminal {
  width: 100%;
  height: 100%;
  min-height: 400px;
  position: relative;
  overflow: hidden;
  background: var(--lx-bg, #0a0a0a);
}

.hero-fallback-grid {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    repeating-linear-gradient(
      90deg,
      color-mix(in srgb, var(--lx-hero-tint, #0af188) 4%, transparent) 0 1px,
      transparent 1px 48px
    ),
    repeating-linear-gradient(
      0deg,
      color-mix(in srgb, var(--lx-hero-tint, #0af188) 4%, transparent) 0 1px,
      transparent 1px 48px
    );
  opacity: 0.6;
}
</style>
