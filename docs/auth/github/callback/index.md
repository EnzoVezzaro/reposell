---
layout: false
---

<script setup>
import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vitepress'

const route = useRoute()
const router = useRouter()

onMounted(() => {
  const params = new URLSearchParams(window.location.search)
  const code = params.get('code')
  const state = params.get('state')
  const error = params.get('error')

  if (error) {
    // OAuth failed — redirect to home with error
    window.location.href = '/' + '?error=' + encodeURIComponent(error)
    return
  }

  if (code && state) {
    // Redirect to home with code and state for token exchange
    window.location.href = '/' + '?code=' + encodeURIComponent(code) + '&state=' + encodeURIComponent(state)
    return
  }

  // No code — redirect to home
  window.location.href = '/'
})
</script>

# Connecting GitHub…

Redirecting…
