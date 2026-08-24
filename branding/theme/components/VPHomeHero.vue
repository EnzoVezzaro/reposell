<script setup lang="ts">
import { useData } from 'vitepress'
import VPButton from './VPButton.vue'

const { frontmatter } = useData()
</script>

<template>
  <section class="VPHomeHero relative overflow-hidden">
    <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--vp-c-signal-muted)_0%,_transparent_70%)] pointer-events-none" />
    
    <div class="container mx-auto px-4 relative z-10">
      <h1 class="name">
        <slot name="title">
          {{ frontmatter.title }}
        </slot>
      </h1>
      
      <p class="tagline">
        <slot name="tagline">
          {{ frontmatter.tagline }}
        </slot>
      </p>

      <div class="actions">
        <slot name="actions">
          <VPButton
            v-for="action in frontmatter.actions || []"
            :key="action.text"
            :href="action.link"
            variant="signal"
            size="lg"
            class="action-button primary"
            :target="action.target"
            :rel="action.rel"
          >
            {{ action.text }}
          </VPButton>
          
          <VPButton
            v-for="action in frontmatter.actionsSecondary || []"
            :key="action.text"
            :href="action.link"
            variant="secondary"
            size="lg"
            class="action-button secondary"
            :target="action.target"
            :rel="action.rel"
          >
            {{ action.text }}
          </VPButton>
        </slot>
      </div>

      <div class="features-preview" v-if="frontmatter.features">
        <slot name="features" />
      </div>
    </div>
  </section>
</template>