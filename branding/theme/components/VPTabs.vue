<script setup lang="ts">
import { ref, computed } from 'vue'

const props = defineProps<{
  tabs: Array<{ label: string; content: string | any }>
  defaultIndex?: number
}>()

const activeIndex = ref(props.defaultIndex || 0)

const getAriaControls = (index: number) => `tabpanel-${index}`
const getTabId = (index: number) => `tab-${index}`
const getTabPanelId = (index: number) => `tabpanel-${index}`
const getAriaLabelledby = (index: number) => `tab-${index}`
</script>

<template>
  <div class="VPTabs">
    <div class="tabs" role="tablist">
      <button
        v-for="(tab, index) in props.tabs"
        :key="index"
        :class="['tab', { active: activeIndex === index }]"
        @click="activeIndex = index"
        role="tab"
        :aria-selected="activeIndex === index"
        :aria-controls="getAriaControls(index)"
        :id="getTabId(index)"
      >
        {{ tab.label }}
      </button>
    </div>
    <div class="tab-panels">
      <div
        v-for="(tab, index) in props.tabs"
        :key="index"
        :class="['tab-panel', { active: activeIndex === index }]"
        role="tabpanel"
        :aria-labelledby="getAriaLabelledby(index)"
        :id="getTabPanelId(index)"
        v-show="activeIndex === index"
      >
        <component v-if="typeof tab.content === 'object'" :is="tab.content" />
        <div v-else v-html="tab.content" />
      </div>
    </div>
  </div>
</template>