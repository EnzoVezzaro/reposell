<script setup>
/**
 * ThemeSwitcher — floating picker + repo-owner credit + autoplay.
 *
 * - Every theme is an exclusive identity layer (own css, own motion
 *   gating); switching never mixes layers.
 * - Each transition fires a glitch burst (html.rs-glitch, 550ms).
 * - Play button auto-rotates all themes; icon shows STOP while running.
 */
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { withBase } from 'vitepress'

import { loadTheme, THEME_IDS } from '../themes/loader.js'

// Every theme identity is an npm package — credit belongs to its owner.
const themes = [
  { id: 'security', name: 'Security', owner: 'ReactBits', url: 'https://reactbits.dev/backgrounds/faulty-terminal' },
  { id: 'shadcn', name: 'Shadcn', owner: 'shadcn', url: 'https://ui.shadcn.com' },
  { id: 'canvas', name: 'Canvas', owner: 'canvas-ui (DavidHDev)', url: 'https://www.npmjs.com/package/canvas-ui' },
  { id: 'cartoon', name: 'Cartoon', owner: 'c-comic-ui', url: 'https://c-comic-ui.vercel.app' },
]
const AUTOPLAY_MS = 4000
const GLITCH_MS = 550

const active = ref('security')
const showPicker = ref(false)
const auto = ref(false)
const showWarning = ref(false)
const warningText = ref('')

let autoTimer = null
let glitchTimer = null

function prefersReducedMotion() {
  return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function glitch() {
  if (prefersReducedMotion()) return
  document.documentElement.classList.add('rs-glitch')
  clearTimeout(glitchTimer)
  glitchTimer = setTimeout(() => {
    document.documentElement.classList.remove('rs-glitch')
  }, GLITCH_MS)
}

function applyTheme(id) {
  active.value = id
  document.documentElement.setAttribute('data-theme', id)
  loadTheme(id)
}

function setTheme(id) {
  if (!themes.some((t) => t.id === id)) return
  applyTheme(id)
  glitch()
  showPicker.value = false
}

function nextTheme() {
  const index = themes.findIndex((t) => t.id === active.value)
  const next = themes[(index + 1) % themes.length]
  applyTheme(next.id)
  glitch()
}

function toggleAutoplay() {
  auto.value = !auto.value
  if (auto.value) {
    autoTimer = setInterval(nextTheme, AUTOPLAY_MS)
  } else {
    clearInterval(autoTimer)
    autoTimer = null
  }
}

// Every landing starts on the default theme (ReactBits / security).
onMounted(() => {
  applyTheme('security')
})

onBeforeUnmount(() => {
  clearInterval(autoTimer)
  clearTimeout(glitchTimer)
})

const currentTheme = () => themes.find((t) => t.id === active.value)
</script>

<template>
  <!-- Credit badge — npm package owner of the active theme -->
  <div class="rs-theme-credit">
    <span class="rs-theme-dot" />
    <span class="rs-theme-credit-label">theme by</span>
    <a class="rs-theme-credit-owner" :href="currentTheme()?.url" target="_blank" rel="noopener" :title="'Theme: ' + currentTheme()?.name">
      {{ currentTheme()?.owner }}
    </a>
  </div>

  <!-- Theme picker trigger -->
  <button class="rs-theme-trigger" @click="showPicker = !showPicker" title="Switch theme">
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-1 0v-1A.5.5 0 0 1 8 1zm3.293 1.293a.5.5 0 0 1 .707.707l-.708.707a.5.5 0 1 1-.707-.707l.708-.707zM13 8a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 0 1h-1A.5.5 0 0 1 13 8zM4.293 12.293a.5.5 0 0 1 .707-.707l.707.708a.5.5 0 0 1-.707.707l-.707-.708zM4 8a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1 0-1h1A.5.5 0 0 1 4 8zm-2-3a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 0-1h-1A.5.5 0 0 1 2 5zm7.707-3.707a.5.5 0 0 1 0-.707l-.707-.708a.5.5 0 1 1 .707-.707l.707.708zM8 4a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-1 0v-1A.5.5 0 0 1 8 4z"/>
    </svg>
  </button>

  <!-- Autoplay: play / stop -->
  <button
    class="rs-theme-trigger rs-theme-autoplay"
    :class="{ running: auto }"
    :title="auto ? 'Stop theme autoplay' : 'Auto-rotate themes'"
    @click="toggleAutoplay"
  >
    <svg v-if="!auto" width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M4 2.5v11a.6.6 0 0 0 .92.505l8.6-5.5a.6.6 0 0 0 0-1.01l-8.6-5.5A.6.6 0 0 0 4 2.5z" />
    </svg>
    <svg v-else width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <rect x="3" y="3" width="10" height="10" rx="1.5" />
    </svg>
  </button>

  <!-- Theme picker dropdown -->
  <Transition name="picker">
    <div v-if="showPicker" class="rs-theme-picker">
      <div class="rs-theme-picker-title">Theme</div>
      <button
        v-for="t in themes"
        :key="t.id"
        class="rs-theme-opt"
        :class="{ active: active === t.id }"
        :title="t.name + ' theme'"
        @click="setTheme(t.id)"
      >
        <span class="rs-theme-dot" :class="'dot-' + t.id" />
        {{ t.owner }}
      </button>
    </div>
  </Transition>
</template>

<style scoped>
/* Credit badge — bottom-left floating */
.rs-theme-credit {
  position: fixed;
  bottom: 16px;
  left: 16px;
  z-index: 9990;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: color-mix(in srgb, var(--lx-bg, #0a0a0a) 88%, transparent);
  backdrop-filter: blur(8px);
  border: 1px solid var(--lx-line, rgba(240,240,240,0.1));
  border-radius: 0;
  clip-path: polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px));
  font-family: var(--lx-font-mono, 'Geist Mono', ui-monospace, monospace);
  font-size: 10px;
  letter-spacing: 0.06em;
  color: var(--lx-text-2, #a0a0a0);
}
.rs-theme-credit a {
  text-decoration: none !important;
  transition: color 150ms ease;
}
.rs-theme-credit-owner:hover {
  color: var(--lx-accent, #0af188);
}
.rs-theme-credit-label {
  opacity: 0.55;
}

.rs-theme-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--lx-accent, #0af188);
}
.dot-security { background: #0af188; }
.dot-shadcn { background: #fafafa; }
.dot-canvas { background: #e94560; }
.dot-cartoon { background: #ffde21; }

/* Trigger buttons — bottom-right */
.rs-theme-trigger {
  position: fixed;
  bottom: 16px;
  right: 16px;
  z-index: 9991;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: color-mix(in srgb, var(--lx-bg, #0a0a0a) 88%, transparent);
  backdrop-filter: blur(8px);
  border: 1px solid var(--lx-line, rgba(240,240,240,0.1));
  border-radius: 0;
  clip-path: polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px));
  color: var(--lx-text-2, #a0a0a0);
  cursor: pointer;
  transition: color 150ms ease, border-color 150ms ease;
}
.rs-theme-trigger:hover {
  color: var(--lx-accent, #0af188);
  border-color: color-mix(in srgb, var(--lx-accent, #0af188) 30%, transparent);
}

.rs-theme-autoplay {
  right: 60px;
}
.rs-theme-autoplay.running {
  color: var(--lx-accent, #0af188);
  border-color: color-mix(in srgb, var(--lx-accent, #0af188) 45%, transparent);
  animation: rs-autoplay-pulse 1.6s ease infinite;
}

@keyframes rs-autoplay-pulse {
  0%, 100% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--lx-accent, #0af188) 35%, transparent); }
  50% { box-shadow: 0 0 0 5px transparent; }
}

/* Picker dropdown */
.rs-theme-picker {
  position: fixed;
  bottom: 60px;
  right: 16px;
  z-index: 9991;
  min-width: 140px;
  padding: 6px;
  background: color-mix(in srgb, var(--lx-bg, #0a0a0a) 94%, transparent);
  backdrop-filter: blur(12px);
  border: 1px solid var(--lx-line, rgba(240,240,240,0.1));
  border-radius: 0;
  clip-path: polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px));
}

.rs-theme-picker-title {
  font-family: var(--lx-font-mono, 'Geist Mono', ui-monospace, monospace);
  font-size: 9px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--lx-text-3, #6b6b6b);
  padding: 4px 8px 6px;
}

.rs-theme-opt {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 7px 8px;
  background: transparent;
  border: none;
  color: var(--lx-text-2, #a0a0a0);
  font-family: var(--lx-font-body, 'Geist', ui-sans-serif, sans-serif);
  font-size: 12px;
  cursor: pointer;
  text-align: left;
  transition: color 120ms ease, background 120ms ease;
}
.rs-theme-opt:hover {
  color: var(--lx-text, #f0f0f0);
  background: rgba(240, 240, 240, 0.05);
}
.rs-theme-opt.active {
  color: var(--lx-accent, #0af188);
}

/* Transitions */
.picker-enter-active, .picker-leave-active {
  transition: opacity 120ms ease, transform 120ms ease;
}
.picker-enter-from, .picker-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
</style>
