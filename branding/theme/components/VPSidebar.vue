<script setup lang="ts">
import { useData, useRoute } from 'vitepress'
import { computed } from 'vue'

const { theme, frontmatter } = useData()
const route = useRoute()

const sidebar = computed(() => theme.value.sidebar || {})
const currentPath = computed(() => route.path)

const isActive = (link: string) => {
  return currentPath.value === link || currentPath.value.startsWith(link + '/')
}

const getSidebarItems = () => {
  const sidebarConfig = sidebar.value
  if (Array.isArray(sidebarConfig)) {
    return sidebarConfig
  }
  return sidebarConfig[currentPath.value] || sidebarConfig['/'] || []
}
</script>

<template>
  <aside class="VPSidebar" aria-label="Sidebar">
    <nav class="p-4 space-y-1" aria-label="Documentation navigation">
      <template v-for="group in getSidebarItems()" :key="group.text || group">
        <div v-if="group.items" class="space-y-1">
          <p v-if="group.text" class="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-fg-subtle">
            {{ group.text }}
          </p>
          <template v-for="item in group.items" :key="item.text || item.link">
            <a
              v-if="item.link"
              :href="item.link"
              :class="[
                'VPSidebarItem block px-3 py-2 text-sm font-medium rounded-md transition-all',
                isActive(item.link) ? 'bg-signal-muted text-signal' : 'text-fg-muted hover:bg-bg-alt hover:text-fg'
              ]"
            >
              {{ item.text }}
            </a>
            <span v-else class="VPSidebarGroup px-3 py-2 text-xs font-semibold uppercase tracking-wider text-fg-subtle block">
              {{ item.text }}
            </span>
          </template>
        </div>
        <a
          v-else-if="group.link"
          :href="group.link"
          :class="[
            'VPSidebarItem block px-3 py-2 text-sm font-medium rounded-md transition-all',
            isActive(group.link) ? 'bg-signal-muted text-signal' : 'text-fg-muted hover:bg-bg-alt hover:text-fg'
          ]"
        >
          {{ group.text }}
        </a>
      </template>
    </nav>
  </aside>
</template>