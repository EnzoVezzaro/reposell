<script setup>
import { ref, watch, watchEffect, onMounted, onBeforeUnmount } from 'vue'
import { useData, withBase } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import { initLandingMotion } from './landingMotion'
import pkg from '../../../package.json'

const Layout = DefaultTheme.Layout

const { page } = useData()

const LIGHT_THEMES = new Set(['cartoon'])

function activeTheme() {
  if (typeof document === 'undefined') return 'security'
  return document.documentElement.getAttribute('data-theme') || 'security'
}

let forcedDark = false
watchEffect(() => {
  if (!('document' in globalThis)) return
  const el = document.documentElement
  const isHome = page.value.relativePath === 'index.md'
  el.classList.toggle('rs-home', isHome)
  // Light themes must run their home in LIGHT mode or dark-styled
  // components become unreadable (dark text on dark surfaces).
  const wantsDark = !LIGHT_THEMES.has(activeTheme())
  if (isHome) {
    if (wantsDark && !el.classList.contains('dark')) {
      el.classList.add('dark')
      forcedDark = true
    } else if (!wantsDark) {
      el.classList.remove('dark')
      el.classList.add('light')
      forcedDark = false
    }
  } else if (forcedDark) {
    forcedDark = false
    el.classList.remove('dark')
    try {
      const pref = localStorage.getItem('vitepress-theme-appearance')
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      if (pref === 'dark' || ((pref === null || pref === 'auto') && prefersDark)) {
        el.classList.add('dark')
      }
    } catch {
      /* storage unavailable */
    }
  }
})

const stars = ref('')
const version = ref('')

const fallbackVersion = `v${pkg.version}`

function formatStars(n) {
  return n >= 1000 ? (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k' : String(n)
}

let stopMotion = null

function startMotionIfHome() {
  stopMotion?.()
  stopMotion = null
  if (page.value.relativePath !== 'index.md') return
  // Landing choreography belongs to the security (lab) theme only; other
  // themes animate via their own CSS. The boot-hide pre-paint class MUST be
  // cleared for them or the hero content stays invisible.
  if (activeTheme() !== 'security') {
    document.documentElement.classList.remove('lx-boot')
    return
  }
  stopMotion = initLandingMotion()
}

onMounted(() => {
  startMotionIfHome()
  fetchStars()
  fetchVersion()
})

watch(
  () => page.value.relativePath,
  () => startMotionIfHome(),
)

onBeforeUnmount(() => {
  stopMotion?.()
  stopMotion = null
})

async function fetchVersion() {
  try {
    const cached = sessionStorage.getItem('rs-version')
    if (cached) {
      version.value = cached
      return
    }
    const res = await fetch('https://api.github.com/repos/EnzoVezzaro/reposell/releases/latest', {
      headers: { Accept: 'application/vnd.github+json' },
    })
    if (!res.ok) return
    const data = await res.json()
    const tag = data.tag_name
    if (tag) {
      version.value = tag
      sessionStorage.setItem('rs-version', tag)
    }
  } catch {
    /* offline or rate-limited */
  }
}

async function fetchStars() {
  try {
    const cached = sessionStorage.getItem('rs-stars')
    if (cached) {
      stars.value = cached
      return
    }
    const res = await fetch('https://api.github.com/repos/EnzoVezzaro/reposell', {
      headers: { Accept: 'application/vnd.github+json' },
    })
    if (!res.ok) return
    const data = await res.json()
    // SAFETY: GitHub repo API returns numeric stargazers_count; guarded before use.
    const count = Number(data.stargazers_count)
    if (Number.isFinite(count) && count > 0) {
      stars.value = formatStars(count)
      sessionStorage.setItem('rs-stars', stars.value)
    }
  } catch {
    /* offline or rate-limited — pill falls back to "GitHub" */
  }
}
</script>

<template>
  <Layout>
    <template #nav-bar-title-before>
      <span class="rs-mark" aria-hidden="true">
        <img
          class="rs-logo-brand"
          :src="withBase('/branding/icon.png')"
          alt=""
          width="26"
          height="26"
        />
      </span>
    </template>

    <template #nav-bar-content-after>
      <div class="rs-nav-extra">
        <a class="rs-pill rs-pill--ver" href="https://github.com/EnzoVezzaro/reposell/releases" target="_blank" rel="noopener">{{ version || fallbackVersion }}</a>
        <a class="rs-pill rs-pill--star" href="https://github.com/EnzoVezzaro/reposell" target="_blank" rel="noopener" aria-label="Star reposell on GitHub">
          <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            <path d="M8 .8l2.1 4.6 5 .5-3.7 3.4 1 4.9L8 11.7l-4.4 2.5 1-4.9L.9 5.9l5-.5L8 .8z" />
          </svg>
          <span>{{ stars || 'GitHub' }}</span>
        </a>
        <a class="rs-navcta" :href="withBase('/guide/quick-start.html')">Get Started</a>
      </div>
    </template>

    <template #nav-screen-content-after>
      <div class="rs-screen-extra">
        <a class="rs-navcta rs-navcta--wide" :href="withBase('/guide/quick-start.html')">Get Started</a>
      </div>
    </template>
  </Layout>
  <ThemeSwitcher />
</template>

<style scoped>
.rs-mark {
  display: inline-flex;
  align-items: center;
  margin-right: 10px;
}

.rs-logo-brand {
  display: block;
  border-radius: 6px;
}

.rs-nav-extra {
  display: flex;
  align-items: center;
  gap: 8px;
}

.rs-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11.5px;
  line-height: 1;
  padding: 5px 9px;
  border-radius: 999px;
  border: 1px solid var(--lx-line, rgb(255 255 255 / 0.12));
  color: var(--lx-text-2, #a8aebb);
  background: color-mix(in srgb, var(--lx-bg, #0a0a0a) 55%, transparent);
  text-decoration: none !important;
  white-space: nowrap;
  transition: border-color 160ms ease, color 160ms ease, background-color 160ms ease;
}

.rs-pill:hover {
  border-color: color-mix(in srgb, var(--lx-accent, #0af188) 45%, transparent);
  color: var(--lx-text, #f2f4f8);
}

.rs-pill--star svg {
  color: var(--lx-accent, #0af188);
}

.rs-pill--star span {
  font-variant-numeric: tabular-nums;
}

.rs-navcta {
  display: inline-flex;
  align-items: center;
  padding: 7px 14px;
  border-radius: 8px;
  background: var(--lx-accent, #0af188);
  color: var(--lx-accent-ink, #13151a);
  font-size: 13px;
  font-weight: 600;
  letter-spacing: -0.01em;
  text-decoration: none !important;
  box-shadow: 0 4px 18px -6px rgb(10 241 136 / 0.55);
  transition: transform 160ms cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 160ms ease, background-color 160ms ease;
}

.rs-navcta:hover {
  background: #5cf2a8;
  transform: translateY(-1px);
  box-shadow: 0 8px 24px -8px rgb(10 241 136 / 0.65);
}

.rs-navcta:active {
  transform: translateY(0);
}

@media (max-width: 1239px) {
  .rs-pill--ver { display: none; }
}

@media (max-width: 1099px) {
  .rs-pill--star { display: none; }
}
</style>
