<script setup lang="ts">
import { useData } from 'vitepress'

const { theme } = useData()
</script>

<template>
  <footer class="VPFooter">
    <div class="container">
      <div class="VPFooterLinks">
        <div class="VPFooterColumn" v-if="theme.value.logo || theme.value.title">
          <a :href="theme.value.logoLink || '/'" class="flex items-center gap-2 mb-4">
            <img
              v-if="theme.value.logo"
              :src="theme.value.logo"
              alt=""
              class="h-8 w-auto"
            />
            <span v-if="theme.value.title" class="font-logo text-xl font-bold tracking-tighter text-fg">
              {{ theme.value.title }}
            </span>
          </a>
          <p class="text-fg-muted max-w-xs">{{ theme.value.description }}</p>
        </div>

        <div class="VPFooterColumn" v-for="(group, key) in theme.value.footer || {}" :key="key">
          <h4>{{ group.title }}</h4>
          <nav class="space-y-2">
            <a
              v-for="item in group.items"
              :key="item.text"
              :href="item.link"
              class="text-sm text-fg-muted hover:text-signal transition-colors block"
            >
              {{ item.text }}
            </a>
          </nav>
        </div>
      </div>

      <div class="VPFooterBottom">
        <p class="text-sm text-fg-subtle">
          Copyright &copy; {{ new Date().getFullYear() }} {{ theme.value.footer?.copyright || theme.value.title }}
        </p>

        <div class="VPFooterSocial flex gap-4">
          <a
            v-for="link in theme.value.socialLinks || []"
            :key="link.link"
            :href="link.link"
            target="_blank"
            rel="noopener noreferrer"
            class="text-fg-muted hover:text-signal transition-colors"
            :aria-label="link.icon"
          >
            <component :is="link.icon" class="w-5 h-5" />
          </a>
        </div>
      </div>
    </div>
  </footer>
</template>