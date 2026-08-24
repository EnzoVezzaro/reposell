<script setup>
/**
 * LandingHero — the hero is a DIFFERENT COMPONENT per theme, not the same
 * markup recolored. Content (title/subtitle/actions/chip/trust) comes from
 * slots and is identical across themes; structure, background, geometry and
 * entrance animation are the active theme's own.
 *
 *   security → terminal hero: FaultyTerminal canvas, decrypt title, chamfers
 *   shadcn   → editorial hero: hairline gradient, kicker, huge clean type
 *   canvas   → orbit hero: floating glow orbs, centered glass, gradient text
 *   cartoon  → comic hero: halftone dots, rotated sticker title, bubble
 */
import { ref, onMounted, onBeforeUnmount } from 'vue'

const theme = ref('security')
let observer = null

onMounted(() => {
  theme.value = document.documentElement.getAttribute('data-theme') || 'security'
  observer = new MutationObserver(() => {
    theme.value = document.documentElement.getAttribute('data-theme') || 'security'
  })
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
})

onBeforeUnmount(() => observer?.disconnect())
</script>

<template>
  <!-- SECURITY — terminal hero -->
  <div v-if="theme === 'security'" class="lx-hero lx-hero--security">
    <div class="lx-hero-bg"><HeroBackground /></div>
    <div class="lx-hero-overlay" />
    <div class="lx-shell">
      <slot name="title" />
      <slot name="subtitle" />
      <div class="lx-actions"><slot name="actions" /></div>
      <slot name="chip" />
      <slot name="trust" />
    </div>
  </div>

  <!-- SHADCN — editorial hero -->
  <div v-else-if="theme === 'shadcn'" class="lx-hero lx-hero--shadcn">
    <div class="lx-shell">
      <p class="lx-kicker">reposell</p>
      <div class="lx-editorial-rule" />
      <div class="lx-title lx-title--editorial"><slot name="title" /></div>
      <div class="lx-sub"><slot name="subtitle" /></div>
      <div class="lx-actions lx-actions--pill"><slot name="actions" /></div>
      <div class="lx-editorial-meta">
        <slot name="chip" />
        <slot name="trust" />
      </div>
    </div>
  </div>

  <!-- CANVAS — orbit hero -->
  <div v-else-if="theme === 'canvas'" class="lx-hero lx-hero--canvas">
    <div class="lx-orbs" aria-hidden="true"><i /><i /><i /></div>
    <div class="lx-shell lx-shell--center">
      <div class="lx-glass">
        <div class="lx-title lx-title--glow"><slot name="title" /></div>
        <div class="lx-sub"><slot name="subtitle" /></div>
        <div class="lx-actions lx-actions--center"><slot name="actions" /></div>
        <div class="lx-glass-foot">
          <slot name="chip" />
          <slot name="trust" />
        </div>
      </div>
    </div>
  </div>

  <!-- CARTOON — comic hero -->
  <div v-else class="lx-hero lx-hero--cartoon">
    <div class="lx-dots" aria-hidden="true" />
    <div class="lx-shell">
      <div class="lx-sticker"><div class="lx-title lx-title--comic"><slot name="title" /></div></div>
      <div class="lx-bubble"><div class="lx-sub"><slot name="subtitle" /></div></div>
      <div class="lx-actions lx-actions--chunky"><slot name="actions" /></div>
      <div class="lx-cartoon-meta">
        <slot name="chip" />
        <slot name="trust" />
      </div>
    </div>
  </div>
</template>
