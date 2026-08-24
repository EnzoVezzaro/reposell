<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  variant?: 'default' | 'secondary' | 'success' | 'warning' | 'danger' | 'outline'
  size?: 'sm' | 'md'
  dot?: boolean
  class?: string
}>()

const classes = computed(() => {
  const base = 'inline-flex items-center gap-1.5 font-semibold rounded-full whitespace-nowrap'
  const variants = {
    default: 'bg-signal-muted text-signal',
    secondary: 'bg-bg-alt text-fg-muted border border-border',
    success: 'bg-verified-muted text-verified',
    warning: 'bg-pending-muted text-pending-fg',
    danger: 'bg-invalid-muted text-invalid',
    outline: 'bg-transparent border border-border text-fg-muted',
  }
  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
  }
  return `${base} ${variants[props.variant || 'default']} ${sizes[props.size || 'md']} ${props.class || ''}`
})
</script>

<template>
  <span :class="classes">
    <span v-if="props.dot" class="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
    <slot />
  </span>
</template>