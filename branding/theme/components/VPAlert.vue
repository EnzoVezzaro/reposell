<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  type?: 'info' | 'success' | 'warning' | 'danger' | 'tip' | 'note' | 'caution'
  title?: string
  icon?: boolean
  class?: string
}>()

const icons = {
  info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>',
  success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
  warning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
  danger: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
  tip: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="M12 6v6l4 2"/></svg>',
  note: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>',
  caution: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
}

const classes = computed(() => {
  const base = 'flex gap-4 p-4 rounded-lg border'
  const types = {
    info: 'bg-signal-muted border-signal text-signal',
    success: 'bg-verified-muted border-verified text-verified',
    warning: 'bg-pending-muted border-pending text-pending-fg',
    danger: 'bg-invalid-muted border-invalid text-invalid',
    tip: 'bg-signal-muted border-signal text-signal',
    note: 'bg-bg-alt border-border text-fg-muted',
    caution: 'bg-pending-muted border-pending text-pending-fg',
  }
  return `${base} ${types[props.type || 'info']} ${props.class || ''}`
})
</script>

<template>
  <div :class="classes" role="alert">
    <div v-if="props.icon !== false" class="flex-shrink-0 w-5 h-5" v-html="icons[props.type || 'info']" />
    <div class="flex-1 min-w-0">
      <p v-if="props.title" class="font-semibold">{{ props.title }}</p>
      <div class="prose prose-sm mt-1">
        <slot />
      </div>
    </div>
  </div>
</template>