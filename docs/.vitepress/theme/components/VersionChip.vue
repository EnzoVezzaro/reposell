<script setup>
import pkg from '../../../../package.json'

const version = `v${pkg.version}`
</script>

<template>
  <span class="mono">built in the open · <a class="lx-ver" :href="'https://github.com/EnzoVezzaro/reposell/releases'" target="_blank" rel="noopener">{{ version }}</a></span>
</template>
