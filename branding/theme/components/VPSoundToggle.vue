<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const soundsEnabled = ref(false)
const audioContext = ref<AudioContext | null>(null)

const soundEffects = {
  verifySuccess: { freq: [880, 1320], type: 'sine', duration: 0.35, gain: 0.15 },
  verifyFail: { freq: [220, 165], type: 'sine', duration: 0.28, gain: 0.12 },
  deploy: { freq: [660, 880], type: 'sine', duration: 0.2, gain: 0.1 },
  copy: { freq: [1200], type: 'square', duration: 0.04, gain: 0.08 },
  toggle: { freq: [440], type: 'sine', duration: 0.06, gain: 0.06 },
  navigate: { freq: [1600], type: 'sine', duration: 0.02, gain: 0.04 },
}

const playSound = (type: keyof typeof soundEffects) => {
  if (!soundsEnabled.value || !audioContext.value) return
  
  const ctx = audioContext.value
  const config = soundEffects[type]
  const now = ctx.currentTime
  
  config.freq.forEach((f, i) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    
    osc.type = config.type
    osc.frequency.setValueAtTime(f, now)
    
    if (config.freq.length > 1 && i > 0) {
      osc.frequency.exponentialRampToValueAtTime(f, now + config.duration * 0.5)
    }
    
    gain.gain.setValueAtTime(config.gain, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + config.duration)
    
    osc.connect(gain).connect(ctx.destination)
    osc.start(now)
    osc.stop(now + config.duration)
  })
}

const toggleSounds = () => {
  soundsEnabled.value = !soundsEnabled.value
  localStorage.setItem('reposell-sounds', String(soundsEnabled.value))
  
  if (soundsEnabled.value && !audioContext.value) {
    // SAFETY: Safari exposes AudioContext only as a webkit-prefixed property; both branches construct an AudioContext.
    const Ctor = window.AudioContext ?? (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (Ctor) audioContext.value = new Ctor()
  }
  
  if (soundsEnabled.value) {
    playSound('toggle')
  }
}

onMounted(() => {
  const stored = localStorage.getItem('reposell-sounds')
  if (stored === 'true') {
    soundsEnabled.value = true
    // SAFETY: Safari exposes AudioContext only as a webkit-prefixed property; both branches construct an AudioContext.
    const Ctor = window.AudioContext ?? (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (Ctor) audioContext.value = new Ctor()
  }
  
  if (soundsEnabled.value) {
    document.addEventListener('click', handleClick, true)
    document.addEventListener('mouseover', handleHover, true)
  }
})

onUnmounted(() => {
  document.removeEventListener('click', handleClick, true)
  document.removeEventListener('mouseover', handleHover, true)
  if (audioContext.value) {
    audioContext.value.close()
  }
})

const handleClick = (e: MouseEvent) => {
  // SAFETY: event targets in a mounted DOM tree are Elements; matches() guards usage below.
  const target = e.target as HTMLElement
  if (target.matches('button, a, [role="button"], .VPButton, input[type="submit"], input[type="button"]')) {
    if (target.classList.contains('VPButton')) {
      playSound('verifySuccess')
    } else {
      playSound('toggle')
    }
  }
}

const handleHover = (e: MouseEvent) => {
  // SAFETY: event targets in a mounted DOM tree are Elements; matches() guards usage below.
  const target = e.target as HTMLElement
  if (target.matches('button, a, [role="button"], .VPButton, .VPSidebarItem, .VPNavBarTitle')) {
    // Subtle - only play on specific elements
  }
}
</script>

<template>
  <div class="VPSoundToggle">
    <button
      @click="toggleSounds"
      :class="{ active: soundsEnabled }"
      :aria-label="soundsEnabled ? 'Disable sound effects' : 'Enable sound effects'"
      :aria-pressed="soundsEnabled"
    >
      <svg v-if="!soundsEnabled" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
        <line x1="15" y1="9" x2="9" y2="15" stroke-linecap="round" />
        <line x1="9" y1="9" x2="15" y2="15" stroke-linecap="round" />
      </svg>
      <svg v-else class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
      </svg>
    </button>
  </div>
</template>