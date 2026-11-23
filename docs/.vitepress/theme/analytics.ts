// PostHog product analytics for reposell.dev (project 762673).
// Browser-only; manual page views on route change; no autocapture, no replay.
// Event properties never carry PII (no repo names, tokens, or user input).
import posthog from 'posthog-js'

const POSTHOG_KEY = 'phc_oA9YRYsvPM4TWSAfaGwHzKeXJPsEEQKGunhTkzqALPyt'
const POSTHOG_HOST = 'https://us.i.posthog.com'

let ready = false

export function initAnalytics(): void {
  if (ready || typeof window === 'undefined') return
  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    capture_pageview: false,
    capture_pageleave: true,
    autocapture: false,
    disable_session_recording: true,
    persistence: 'localStorage+cookie',
  })
  ready = true
}

export function track(event: string, properties: Record<string, string | number | boolean> = {}): void {
  if (!ready) return
  posthog.capture(event, properties)
}

export function trackPageview(): void {
  track('$pageview', { $current_url: window.location.href })
}
