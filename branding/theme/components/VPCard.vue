<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  title?: string
  description?: string
  header?: boolean
  footer?: boolean
  hoverable?: boolean
  class?: string
}>()

const classes = computed(() => {
  const base = 'bg-surface border border-border rounded-xl overflow-hidden transition-all duration-180 ease-out'
  const hover = props.hoverable ? 'hover:border-signal hover:shadow-signal hover:-translate-y-1' : ''
  return `${base} ${hover} ${props.class || ''}`
})
</script>

<template>
  <div :class="classes">
    <div v-if="props.header || $slots.header" class="px-6 py-4 border-b border-border bg-bg-soft">
      <slot name="header">
        <div v-if="props.title || props.description">
          <h3 v-if="props.title" class="text-lg font-semibold leading-snug tracking-tighter text-fg">{{ props.title }}</h3>
          <p v-if="props.description" class="mt-1 text-sm text-fg-muted">{{ props.description }}</p>
        </div>
      </slot>
    </div>

    <div class="p-6 pt-0">
      <slot />
    </div>

    <div v-if="props.footer || $slots.footer" class="px-4 py-3 border-t border-border bg-bg-soft flex items-center justify-end gap-3">
      <slot name="footer" />
    </div>
  </div>
</template>