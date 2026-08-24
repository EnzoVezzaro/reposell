<script setup>
/**
 * FooterWordmark — official reposell wordmark (branding/assets/full.png).
 * Content is identical across themes; each theme may restyle it via
 * .lx-wordmark-img under its own data-theme scope.
 */
import { withBase } from 'vitepress'
</script>

<template>
  <img
    class="lx-wordmark-img"
    :src="withBase('/branding/full.png')"
    alt="reposell"
    loading="lazy"
  />
</template>
