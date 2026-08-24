<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' | 'signal' | 'verified'
  size?: 'default' | 'sm' | 'lg' | 'xl' | 'icon'
  disabled?: boolean
  href?: string
  target?: string
  rel?: string
  loading?: boolean
}>()

const isLink = computed(() => !!props.href)

const classes = computed(() => [
  'rs-btn',
  `rs-btn--${props.variant || 'default'}`,
  `rs-btn--${props.size || 'default'}`,
])
</script>

<template>
  <a
    v-if="isLink"
    :href="props.href"
    :target="props.target"
    :rel="props.rel"
    :class="classes"
    :aria-busy="props.loading || undefined"
    :aria-disabled="props.disabled || undefined"
  >
    <slot />
    <span v-if="props.loading" class="rs-btn__spin" aria-hidden="true" />
  </a>

  <button
    v-else
    :class="classes"
    :disabled="props.disabled || props.loading"
    :aria-busy="props.loading || undefined"
    type="button"
  >
    <slot />
    <span v-if="props.loading" class="rs-btn__spin" aria-hidden="true" />
  </button>
</template>

<style scoped>
.rs-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-family: var(--font-sans);
  font-weight: 600;
  border-radius: var(--rs-radius);
  border: 1px solid transparent;
  cursor: pointer;
  text-decoration: none;
  white-space: nowrap;
  transition:
    background-color 160ms ease,
    color 160ms ease,
    border-color 160ms ease,
    box-shadow 160ms ease,
    transform 160ms ease;
}

.rs-btn:focus-visible {
  outline: 2px solid var(--vp-c-brand-1);
  outline-offset: 2px;
}

.rs-btn:disabled {
  opacity: 0.45;
  pointer-events: none;
}

/* sizes */
.rs-btn--sm { padding: 0.375rem 0.75rem; font-size: 12px; height: 2rem; }
.rs-btn--default { padding: 0.5rem 1rem; font-size: 14px; height: 2.5rem; }
.rs-btn--lg { padding: 0.75rem 1.5rem; font-size: 16px; height: 3rem; }
.rs-btn--xl { padding: 1rem 2rem; font-size: 18px; height: 3.5rem; }
.rs-btn--icon { width: 2.5rem; height: 2.5rem; padding: 0; }

/* variants */
.rs-btn--default,
.rs-btn--signal {
  background: var(--color-signal);
  color: var(--color-signal-fg);
}
.rs-btn--default:hover,
.rs-btn--signal:hover {
  background: var(--color-signal-hover);
  transform: translateY(-1px);
  box-shadow: 0 8px 24px -8px rgb(197 60 0 / 0.55);
}
.rs-btn--default:active,
.rs-btn--signal:active {
  background: var(--color-signal-active);
  transform: translateY(0);
}

.rs-btn--verified {
  background: var(--vp-c-verified);
  color: #f0fdf4;
}
.dark .rs-btn--verified {
  color: #052e16;
}

.rs-btn--destructive {
  background: #dc2626;
  color: #fef2f2;
}
.rs-btn--destructive:hover {
  background: #b91c1c;
}

.rs-btn--outline {
  background: transparent;
  color: var(--vp-c-text-1);
  border-color: var(--rs-border);
}
.rs-btn--outline:hover {
  background: var(--rs-muted);
  border-color: var(--vp-c-text-3);
}

.rs-btn--secondary {
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
  border-color: var(--rs-border);
}
.rs-btn--secondary:hover {
  background: var(--vp-c-bg-alt);
}

.rs-btn--ghost {
  background: transparent;
  color: var(--vp-c-text-2);
}
.rs-btn--ghost:hover {
  background: var(--rs-muted);
  color: var(--vp-c-text-1);
}

.rs-btn--link {
  background: transparent;
  color: var(--vp-c-brand-1);
  text-underline-offset: 4px;
  height: auto;
  padding: 0;
}
.rs-btn--link:hover {
  text-decoration: underline;
}

/* loading spinner */
.rs-btn__spin {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 9999px;
  animation: rs-spin 600ms linear infinite;
}

@keyframes rs-spin {
  to { transform: rotate(360deg); }
}
</style>
