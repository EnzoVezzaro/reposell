<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'

type LineType = 'cmd' | 'ok' | 'info' | 'note'
interface TermLine { t: LineType; text: string }

const props = defineProps<{
  scenario?: 'install' | 'enable' | 'deploy'
}>()

const SCENARIOS = {
  install: {
    title: 'your-terminal',
    lines: [
      { t: 'cmd', text: 'npm install -g @reposell/cli' },
      { t: 'cmd', text: 'cd your-repo && reposell init' },
      { t: 'ok', text: '✓ Detected GitHub remote · origin/you/your-repo' },
      { t: 'ok', text: '✓ Generated /.well-known/sell-endpoint.json' },
      { t: 'ok', text: '✓ Generated /listing/manifest.json (Ed25519-signed)' },
      { t: 'ok', text: '✓ Wrote .github/workflows/reposell.yml' },
      { t: 'note', text: 'That is it. Your repo is now sellable.' },
    ],
  },
  enable: {
    title: 'your-repo',
    lines: [
      { t: 'cmd', text: 'reposell init --provider github' },
      { t: 'cmd', text: 'reposell listing enable --public' },
      { t: 'ok', text: '✓ Pricing policy fetched · signature verified' },
      { t: 'ok', text: '✓ Manifest signed with local Ed25519 key' },
      { t: 'ok', text: '✓ /listing endpoint is live' },
      { t: 'note', text: 'Listings can now discover and verify you.' },
    ],
  },
  deploy: {
    title: 'ops-box',
    lines: [
      { t: 'cmd', text: 'git clone https://github.com/EnzoVezzaro/reposell-listing-public' },
      { t: 'cmd', text: 'cp .env.example .env && docker compose up -d' },
      { t: 'ok', text: '✓ API healthy · Frontend healthy' },
      { t: 'ok', text: '✓ Official pricing policy verified on startup' },
      { t: 'ok', text: '✓ Scheduler syncing discovery queue' },
      { t: 'note', text: 'Your instance is live — fails safe, settles honestly.' },
    ],
  },
} as const satisfies Record<string, { title: string; lines: { t: string; text: string }[] }>

const scenario = computed(() => SCENARIOS[props.scenario || 'install'])

const revealed = ref<TermLine[]>([])
const typing = ref('')
const activeLine = ref<TermLine | null>(null)
const done = ref(false)

let runId = 0
let observer: IntersectionObserver | null = null
const root = ref<HTMLElement | null>(null)

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function play(id: number) {
  const lines = scenario.value.lines
  revealed.value = []
  typing.value = ''
  done.value = false

  await wait(400)
  for (const line of lines) {
    if (id !== runId) return
    if (line.t === 'cmd') {
      activeLine.value = line
      for (let i = 1; i <= line.text.length; i++) {
        if (id !== runId) return
        typing.value = line.text.slice(0, i)
        await wait(26 + Math.random() * 34)
      }
      await wait(260)
    } else {
      activeLine.value = null
      typing.value = ''
      revealed.value.push(line)
      await wait(line.t === 'note' ? 350 : 240)
    }
    if (id !== runId) return
  }
  activeLine.value = null
  typing.value = ''
  done.value = true
}

function replay() {
  runId++
  void play(runId)
}

async function copyAll() {
  const text = scenario.value.lines
    .map((l) => (l.t === 'cmd' ? `$ ${l.text}` : l.text))
    .join('\n')
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    /* clipboard unavailable */
  }
}

onMounted(() => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reduced || !('IntersectionObserver' in window)) {
    revealed.value = [...scenario.value.lines]
    done.value = true
    return
  }
  observer = new IntersectionObserver(
    (entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        observer?.disconnect()
        void play(runId)
      }
    },
    { threshold: 0.35 },
  )
  if (root.value) observer.observe(root.value)
})

onBeforeUnmount(() => {
  runId++
  observer?.disconnect()
})
</script>

<template>
  <div ref="root" class="rs-term">
    <div class="rs-term-bar">
      <span class="rs-term-dot"></span><span class="rs-term-dot"></span><span class="rs-term-dot"></span>
      <span class="rs-term-title">{{ scenario.title }}</span>
      <span class="rs-term-tools">
        <button type="button" class="rs-term-tool" aria-label="Copy transcript" @click="copyAll">⧉</button>
        <button type="button" class="rs-term-tool" aria-label="Replay" @click="replay">↻</button>
      </span>
    </div>
    <div class="rs-term-body">
      <div v-for="(line, i) in revealed" :key="i" :class="`rs-line rs-line--${line.t}`">
        <span v-if="line.t === 'cmd'" class="t-prompt">$ </span>{{ line.text }}
      </div>
      <div v-if="activeLine" class="rs-line rs-line--cmd">
        <span class="t-prompt">$ </span>{{ typing }}<span class="rs-cursor" />
      </div>
      <div v-if="done" class="rs-line rs-line--idle"><span class="t-prompt">$ </span><span class="rs-cursor" /></div>
    </div>
  </div>
</template>

<style scoped>
.rs-term-body {
  padding: 16px;
  min-height: 220px;
}

.rs-line {
  font-family: var(--font-mono);
  font-size: 13.5px;
  line-height: 1.75;
  white-space: pre-wrap;
  word-break: break-word;
  animation: rs-line-in 240ms ease-out both;
}

.rs-line--cmd { color: #ffffff; }
.rs-line--ok { color: #34d399; }
.rs-line--info { color: #93c5fd; }
.rs-line--note { color: #0af188; margin-top: 6px; }
.rs-line--idle { opacity: 0.55; }

.rs-cursor {
  display: inline-block;
  width: 8px;
  height: 1.05em;
  margin-left: 2px;
  vertical-align: text-bottom;
  background: #0af188;
  animation: rs-blink 900ms steps(1) infinite;
}

@keyframes rs-line-in {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes rs-blink {
  50% { opacity: 0; }
}

.rs-term-tools {
  margin-left: auto;
  display: flex;
  gap: 4px;
}

.rs-term-tool {
  background: transparent;
  border: none;
  color: #a8a89a;
  font-size: 14px;
  line-height: 1;
  padding: 4px 6px;
  border-radius: 6px;
  cursor: pointer;
  transition: color 140ms ease, background-color 140ms ease;
}

.rs-term-tool:hover {
  color: #0af188;
  background: rgb(10 241 136 / 0.12);
}
</style>
