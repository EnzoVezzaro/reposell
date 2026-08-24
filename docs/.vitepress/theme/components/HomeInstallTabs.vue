<script setup>
import { ref } from 'vue'

const TABS = [
  { id: 'npm', label: 'npm', cmd: 'npm install -g @reposell/cli' },
  { id: 'pnpm', label: 'pnpm', cmd: 'pnpm add -g @reposell/cli' },
  { id: 'bun', label: 'bun', cmd: 'bun add -g @reposell/cli' },
  { id: 'npx', label: 'npx', cmd: 'npx @reposell/cli init' },
]

const active = ref('npm')
const copied = ref(false)
let resetTimer = null

function pick(id) {
  active.value = id
  copied.value = false
}

async function copy() {
  const cmd = TABS.find((t) => t.id === active.value)?.cmd ?? ''
  try {
    await navigator.clipboard.writeText(cmd)
    copied.value = true
    clearTimeout(resetTimer)
    resetTimer = setTimeout(() => (copied.value = false), 1600)
  } catch {
    /* clipboard unavailable */
  }
}
</script>

<template>
  <div class="it-tabs">
    <div class="it-tablist" role="tablist" aria-label="Package manager">
      <button
        v-for="tab in TABS"
        :key="tab.id"
        type="button"
        role="tab"
        class="it-tab"
        :class="{ 'is-active': active === tab.id }"
        :aria-selected="active === tab.id"
        @click="pick(tab.id)"
      >
        {{ tab.label }}
      </button>
    </div>

    <div class="it-panel" role="tabpanel">
      <code class="it-cmd"><span class="it-prompt">$ </span>{{ TABS.find((t) => t.id === active)?.cmd }}</code>
      <button type="button" class="it-copy" @click="copy">
        {{ copied ? '✓ copied' : '⧉ copy' }}
      </button>
    </div>

    <p class="it-note">Node 18+. No daemons, no accounts — the CLI talks straight to Git and Stripe.</p>
  </div>
</template>

<style scoped>
.it-tabs {
  border: 1px solid rgb(255 255 255 / 0.08);
  background: #101218;
  border-radius: 14px;
  overflow: hidden;
}

.it-tablist {
  display: flex;
  gap: 2px;
  padding: 8px 8px 0;
  border-bottom: 1px solid rgb(255 255 255 / 0.07);
}

.it-tab {
  appearance: none;
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  color: #7d8496;
  font-family: inherit;
  font-size: 13px;
  font-weight: 500;
  padding: 8px 14px 10px;
  cursor: pointer;
  transition: color 140ms ease, border-color 140ms ease;
}

.it-tab:hover {
  color: #c9cdd6;
}

.it-tab.is-active {
  color: #0af188;
  border-bottom-color: #0af188;
}

.it-tab:focus-visible {
  outline: 2px solid #0af188;
  outline-offset: -2px;
  border-radius: 6px;
}

.it-panel {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 16px 14px;
}

.it-cmd {
  flex: 1;
  min-width: 0;
  overflow-x: auto;
  white-space: nowrap;
  font-family: var(--font-mono);
  font-size: 13.5px;
  color: #eef0f4;
}

.it-prompt {
  color: #0af188;
  user-select: none;
}

.it-copy {
  flex-shrink: 0;
  appearance: none;
  background: transparent;
  border: 1px solid rgb(255 255 255 / 0.12);
  border-radius: 7px;
  color: #a8aebb;
  font-family: var(--font-mono);
  font-size: 11.5px;
  padding: 5px 9px;
  cursor: pointer;
  transition: color 140ms ease, border-color 140ms ease;
}

.it-copy:hover {
  color: #f2f4f8;
  border-color: rgb(10 241 136 / 0.45);
}

.it-note {
  margin: 0 !important;
  padding: 10px 16px 12px;
  border-top: 1px dashed rgb(255 255 255 / 0.07);
  font-size: 12px;
  color: #7d8496;
}
</style>
