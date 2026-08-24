<script setup lang="ts">
import { useData } from 'vitepress'
import VPCard from './VPCard.vue'

const { frontmatter } = useData()
</script>

<template>
  <section class="VPFeatures" v-if="frontmatter.features">
    <div class="container">
      <h2 v-if="frontmatter.featuresTitle" class="mb-12">{{ frontmatter.featuresTitle }}</h2>
      
      <div class="grid">
        <VPCard
          v-for="(feature, index) in frontmatter.features"
          :key="index"
          :title="feature.title"
          :description="feature.description"
          hoverable
          class="group"
        >
          <template #header>
            <div class="flex items-center gap-3">
              <div class="icon group-hover:scale-110 transition-transform duration-300">
                <component :is="feature.icon" class="w-6 h-6" v-if="feature.icon" />
                <div v-else class="w-12 h-12 rounded-xl bg-signal-muted flex items-center justify-center">
                  <span class="text-2xl">{{ feature.emoji || '✨' }}</span>
                </div>
              </div>
              <div>
                <h3 class="text-lg font-semibold text-fg">{{ feature.title }}</h3>
                <p v-if="feature.description" class="text-sm text-fg-muted">{{ feature.description }}</p>
              </div>
            </div>
          </template>

          <div class="mt-4">
            <slot :feature="feature" :index="index" />
            <p v-if="!feature.details && !feature.link" class="text-fg-muted text-sm">
              {{ feature.description }}
            </p>
            <a v-if="feature.link" :href="feature.link" class="text-sm font-medium text-signal hover:text-signal-hover inline-flex items-center gap-1">
              {{ feature.linkText || 'Learn more' }}
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </a>
          </div>
        </VPCard>
      </div>
    </div>
  </section>
</template>