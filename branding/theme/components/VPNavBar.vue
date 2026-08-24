<script setup lang="ts">
import { useData, useRoute } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import { onMounted, ref, watch } from 'vue'
import VPButton from './VPButton.vue'
import VPWaveform from './VPWaveform.vue'

const { theme, frontmatter } = useData()
const route = useRoute()
const isDark = ref(false)
const mobileMenuOpen = ref(false)

const nav = theme.value.nav || []

onMounted(() => {
  isDark.value = document.documentElement.classList.contains('dark')
  watch(
    () => document.documentElement.classList.contains('dark'),
    (val) => { isDark.value = val }
  )
})

const toggleDarkMode = () => {
  const html = document.documentElement
  html.classList.toggle('dark')
  localStorage.setItem('theme', html.classList.contains('dark') ? 'dark' : 'light')
  isDark.value = html.classList.contains('dark')
}
</script>

<template>
  <nav class="VPNavBar" :class="{ 'has-sidebar': $props.hasSidebar }">
    <div class="container mx-auto px-4 h-[var(--vp-nav-height)] flex items-center justify-between">
      <div class="flex items-center gap-8">
        <VPButton
          v-if="$props.hasSidebar"
          variant="ghost"
          size="icon"
          class="lg:hidden"
          @click="mobileMenuOpen = !mobileMenuOpen"
          aria-label="Toggle menu"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path v-if="!mobileMenuOpen" stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            <path v-else stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </VPButton>

        <a class="VPNavBarTitle flex items-center gap-2" :href="theme.value.logoLink || '/'">
          <VPWaveform class="waveform" />
          <span v-if="theme.value.title" class="font-logo text-xl font-bold tracking-tighter">
            {{ theme.value.title }}
          </span>
        </a>
      </div>

      <div class="hidden lg:flex items-center gap-6">
        <nav class="VPNavBarMenu flex items-center gap-1" aria-label="Main navigation">
          <a
            v-for="item in nav"
            :key="item.text"
            :href="item.link"
            class="VPNavBarItem px-3 py-2 text-sm font-medium tracking-wide text-fg-muted hover:text-fg hover:bg-bg-alt rounded-md transition-colors"
          >
            {{ item.text }}
          </a>
        </nav>

        <div class="flex items-center gap-3">
          <VPButton
            variant="ghost"
            size="icon"
            @click="toggleDarkMode"
            :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
          >
            <svg v-if="!isDark" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
            <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </VPButton>

          <slot name="nav-bar-content-after" />
        </div>
      </div>
    </div>

    <div v-show="mobileMenuOpen" class="lg:hidden border-t border-border bg-bg py-4">
      <nav class="flex flex-col gap-1">
        <a
          v-for="item in nav"
          :key="item.text"
          :href="item.link"
          class="px-4 py-3 text-base font-medium text-fg-muted hover:text-fg hover:bg-bg-alt rounded-md transition-colors"
        >
          {{ item.text }}
        </a>
      </nav>
    </div>
  </nav>
</template>