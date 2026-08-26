<script setup>
const version = `v${globalThis.__APP_VERSION__}`
</script>

<template>
  <span class="mono">built in the open · <a class="lx-ver" :href="'https://github.com/EnzoVezzaro/reposell/releases'" target="_blank" rel="noopener">{{ version }}</a></span>
</template>
