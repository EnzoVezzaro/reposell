<script setup>
import { computed, onBeforeMount, onBeforeUnmount, ref } from 'vue'

const GITHUB_CLIENT_ID = 'Iv23lidhennqrdpdFUAT';
const TOKEN_EXCHANGE_URL = 'https://github-auth.reposell.dev/exchange';

const url = ref('')
const token = ref('')
const connectState = ref('idle') // idle | connecting | connected | error
const connectError = ref('')
const state = ref('idle') // idle | running | done | error | blocked
const errorNote = ref('')
const visibleChecks = ref(0)
const score = ref(0)
const grade = ref('')
const repoUrl = ref('')
const timers = []

const GRADES = ['S', 'A', 'B', 'C', 'F']
const TOKEN_KEY = 'rs-audit-pat'

const connected = computed(() => connectState.value === 'connected')

// ---- repository picker (connected mode) -------------------------------
const repos = ref([])
const reposState = ref('idle') // idle | loading | ready | error
const ddOpen = ref(false)
const ddActive = ref(-1)

const filteredRepos = computed(() => {
  const q = url.value.trim().toLowerCase()
  const list = repos.value
  if (!q) return list.slice(0, 8)
  return list
    .filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        (r.desc && r.desc.toLowerCase().includes(q)),
    )
    .slice(0, 8)
})

async function loadRepos() {
  reposState.value = 'loading'
  const collected = []
  try {
    for (let page = 1; page <= 3; page++) {
      const res = await ghFetch(
        `/user/repos?per_page=100&page=${page}&sort=pushed&affiliation=owner,collaborator,organization_member`,
      )
      if (!res.ok) {
        reposState.value = 'error'
        return
      }
      const batch = await res.json()
      // SAFETY: /user/repos answers with an array of repo objects.
      if (!Array.isArray(batch)) break
      for (const r of batch) {
        if (r?.full_name) {
          collected.push({ name: r.full_name, desc: String(r.description ?? ''), priv: r.private === true })
        }
      }
      if (batch.length < 100) break
    }
    repos.value = collected
    reposState.value = 'ready'
  } catch {
    reposState.value = 'error'
  }
}

function pickRepo(repo) {
  url.value = repo.name
  ddOpen.value = false
  ddActive.value = -1
  void run()
}

function onInputFocus() {
  if (connected.value && reposState.value === 'ready') {
    ddOpen.value = true
    ddActive.value = -1
  }
}

function onInputBlur() {
  setTimeout(() => {
    ddOpen.value = false
    ddActive.value = -1
  }, 150)
}

function onInputKeydown(e) {
  if (!ddOpen.value || filteredRepos.value.length === 0) return
  const key = e.key
  if (key === 'ArrowDown' || key === 'ArrowUp') {
    e.preventDefault()
    const max = filteredRepos.value.length - 1
    ddActive.value =
      key === 'ArrowDown'
        ? ddActive.value >= max
          ? 0
          : ddActive.value + 1
        : ddActive.value <= 0
          ? max
          : ddActive.value - 1
  } else if (key === 'Enter') {
    if (ddActive.value >= 0) {
      e.preventDefault()
      pickRepo(filteredRepos.value[ddActive.value])
    }
  } else if (key === 'Escape') {
    ddOpen.value = false
    ddActive.value = -1
  }
}
const runLabel = computed(() =>
  state.value === 'running' ? 'Auditing…' : state.value === 'done' || state.value === 'error' ? 'Run again' : 'Audit my repo',
)

const verdictLine = computed(() => {
  if (!checks.value.length) return ''
  const failed = checks.value.filter((c) => c.status !== 'pass')
  if (failed.length === 0) return 'Sell-ready across the board. Ship it — and keep every sale.'
  const names = failed.map((c) => c.label.toLowerCase()).join(', ')
  return `Not there yet: ${names}. Fix ${failed.length === 1 ? 'it' : 'those'} and this repo earns its grade.`
})

const checks = ref([])

function baseChecks() {
  return [
    { key: 'meta', label: 'Repository reachable', weight: 5, status: 'pending', detail: '', href: '' },
    { key: 'license', label: 'LICENSE detected', weight: 15, status: 'pending', detail: '', href: '' },
    { key: 'config', label: 'reposell.yml config', weight: 20, status: 'pending', detail: '', href: '' },
    { key: 'manifest', label: 'Listing manifest signed', weight: 30, status: 'pending', detail: '', href: '' },
    { key: 'workflow', label: 'Release workflow wired', weight: 20, status: 'pending', detail: '', href: '' },
    { key: 'release', label: 'Release published', weight: 10, status: 'pending', detail: '', href: '' },
  ]
}

const FIX_FOR = {
  license: '/licensing/',
  config: '/guide/init',
  manifest: '/protocol/listing-endpoint/',
  workflow: '/commands/release',
  release: '/commands/release',
}

function parseRepo(raw) {
  const path = raw
    .trim()
    .replace(/\/+$/, '')
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/^github\.com\//i, '')
    .split(/[/?#]/)
    .filter(Boolean)
  if (path.length < 2) return null
  if (!/^[\w.-]+$/.test(path[0]) || !/^[\w.-]+$/.test(path[1])) return null
  return { owner: path[0], repo: path[1] }
}

function authHeaders() {
  const headers = { Accept: 'application/vnd.github+json' }
  if (token.value) headers.Authorization = `Bearer ${token.value}`
  return headers
}

async function ghFetch(path, attempt = 0) {
  const controller = new AbortController()
  const abort = setTimeout(() => controller.abort(), 12000)
  try {
    return await fetch(`https://api.github.com${path}`, {
      headers: authHeaders(),
      signal: controller.signal,
    })
  } catch (err) {
    // SAFETY: fetch failures surface as TypeError; aborts surface as AbortError — both mean "no path to GitHub".
    const name = err?.name === 'AbortError' ? 'timeout' : 'network'
    // Transient failures (VPN handshake, DNS hiccup, sleeping tab) get exactly one silent retry.
    if (attempt < 1 && name !== 'offline') {
      await new Promise((r) => setTimeout(r, 900))
      return ghFetch(path, attempt + 1)
    }
    err.rsReason = name
    throw err
  } finally {
    clearTimeout(abort)
  }
}

function networkMessage() {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return 'You appear to be offline. Reconnect and run again.'
  }
  return 'Could not reach api.github.com — your network, VPN, firewall or ad-blocker is likely blocking it. Disable blocking for api.github.com (or switch networks) and run again.'
}

async function ghJson(path) {
  const res = await ghFetch(path)
  let body = null
  try {
    body = await res.json()
  } catch {
    body = null
  }
  const rateLimited =
    res.status === 403 && res.headers.get('x-ratelimit-remaining') === '0'
  return { ok: res.ok, status: res.status, rateLimited, body }
}

function connect() {
  connectState.value = 'connecting'
  connectError.value = ''
  const redirectUri = window.location.origin + '/auth/github/callback';
  const state = Math.random().toString(36).slice(2);
  sessionStorage.setItem('rs-gh-oauth-state', state);
  const params = new URLSearchParams({
    client_id: GITHUB_CLIENT_ID,
    scope: 'repo',
    redirect_uri: redirectUri,
    state,
  });
  window.location.href = `https://github.com/login/oauth/authorize?${params}`;
}

async function exchangeCode(code) {
  connectState.value = 'connecting'
  connectError.value = ''
  try {
    const res = await fetch(TOKEN_EXCHANGE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });
    const data = await res.json();
    if (!res.ok || data.error) {
      connectState.value = 'error'
      connectError.value = data.error || 'GitHub rejected the authorization — try again.'
      return;
    }
    token.value = data.access_token;
    connectState.value = 'connected'
    sessionStorage.setItem(TOKEN_KEY, token.value);
    sessionStorage.removeItem('rs-gh-oauth-state');
    // Clean the URL
    const clean = window.location.pathname;
    window.history.replaceState({}, '', clean);
    void loadRepos();
  } catch {
    connectState.value = 'error'
    connectError.value = 'Could not reach the token exchange service — try again.'
  }
}

function disconnect() {
  token.value = ''
  sessionStorage.removeItem(TOKEN_KEY)
  connectState.value = 'idle'
  repos.value = []
  reposState.value = 'idle'
  ddOpen.value = false
}

function mark(key, status, detail, href = '') {
  const row = checks.value.find((c) => c.key === key)
  if (!row) return
  row.status = status
  row.detail = detail
  row.href = href
}

function gradeFrom(total) {
  if (total >= 90) return 'S'
  if (total >= 75) return 'A'
  if (total >= 60) return 'B'
  if (total >= 40) return 'C'
  return 'F'
}

function clearTimers() {
  while (timers.length) clearTimeout(timers.pop())
}

const reducedMotion = () =>
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true

function revealUpTo(count, finish) {
  visibleChecks.value = count
  if (count >= checks.value.length && finish) {
    timers.push(setTimeout(finish, reducedMotion() ? 0 : 420))
  }
}

async function run() {
  if (state.value === 'running') return
  const target = parseRepo(url.value)
  if (!target) {
    state.value = 'error'
    errorNote.value = 'Enter a repository as owner/name or a full github.com URL.'
    return
  }
  clearTimers()
  errorNote.value = ''
  grade.value = ''
  score.value = 0
  checks.value = baseChecks()
  visibleChecks.value = 0
  state.value = 'running'
  repoUrl.value = `https://github.com/${target.owner}/${target.repo}`

  const head = `repos/${target.owner}/${target.repo}`
  const raw = `${head}/contents`

  try {
    const meta = await ghJson(head)
    if (meta.status === 404) {
      state.value = 'blocked'
      errorNote.value = token.value
        ? 'Not found with this token. Check spelling, or that the token can open this repo.'
        : 'Not found. Private repo? Connect GitHub above, then run again.'
      revealUpTo(1)
      return
    }
    if (meta.rateLimited) {
      state.value = 'blocked'
      errorNote.value = 'GitHub API rate limit hit. Try again in an hour — or connect a token for 5,000 requests/hour.'
      return
    }
    if (!meta.ok) throw new Error('network')

    const info = meta.body ?? {}
    const topics = Array.isArray(info.topics) ? info.topics : []
    const described = Boolean(String(info.description ?? '').trim()) && topics.length > 0
    mark(
      'meta',
      described ? 'pass' : 'fail',
      described ? `${info.private === true ? 'private' : 'public'} · ${topics.length} topics` : 'add a description and topics on GitHub',
      repoUrl.value,
    )
    revealUpTo(1)

    const spdx = info.license?.spdx_id
    const licensed = Boolean(spdx) && spdx !== 'NOASSERTION'
    const custom = spdx === 'NOASSERTION'
    mark(
      'license',
      licensed || custom ? 'pass' : 'fail',
      licensed ? `SPDX ${spdx}` : custom ? 'custom license detected' : 'none found — pick RSL-1.0 or keep your own',
      licensed || custom ? `${repoUrl.value}/blob/HEAD/LICENSE` : '',
    )

    const yml = await ghJson(`${raw}/reposell.yml`)
    mark(
      'config',
      yml.ok ? 'pass' : 'fail',
      yml.ok ? 'present at repo root' : 'missing — reposell init writes it',
      yml.ok ? `${repoUrl.value}/blob/HEAD/reposell.yml` : '',
    )
    revealUpTo(2)

    const man = await ghJson(`${raw}/listing/manifest.json`)
    if (man.ok) {
      let parsed = null
      try {
        if (man.body?.content && man.body?.encoding === 'base64') {
          const text = atob(String(man.body.content).replace(/\n/g, ''))
          parsed = JSON.parse(text)
        }
      } catch {
        parsed = null
      }
      const signed = Boolean(parsed?.product && parsed?.version && parsed?.signature)
      mark(
        'manifest',
        signed ? 'pass' : 'fail',
        signed
          ? `v${parsed.version} · Ed25519 signature present`
          : parsed
            ? 'malformed — product, version and signature are required'
            : 'unparsable JSON',
        `${repoUrl.value}/blob/HEAD/listing/manifest.json`,
      )
    } else {
      mark('manifest', 'fail', 'no listing/manifest.json — reposell init generates it')
    }
    revealUpTo(3)

    const wf = await ghJson(`${raw}/.github/workflows/reposell.yml`)
    mark(
      'workflow',
      wf.ok ? 'pass' : 'fail',
      wf.ok ? '.github/workflows/reposell.yml live' : 'not wired yet',
      wf.ok ? `${repoUrl.value}/blob/HEAD/.github/workflows/reposell.yml` : '',
    )

    const rel = await ghJson(`${head}/releases?per_page=1`)
    const latest = Array.isArray(rel.body) ? rel.body[0] : null
    const when = latest?.published_at ? String(latest.published_at).slice(0, 10) : ''
    mark(
      'release',
      latest ? 'pass' : 'fail',
      latest ? `${latest.tag_name ?? 'untagged'}${when ? ` · ${when}` : ''}` : 'no releases yet',
      latest ? `${repoUrl.value}/releases` : '',
    )
    revealUpTo(checks.value.length, () => {
      const total = checks.value.reduce((sum, c) => sum + (c.status === 'pass' ? c.weight : 0), 0)
      score.value = total
      grade.value = gradeFrom(total)
      state.value = 'done'
    })
  } catch (err) {
    state.value = 'error'
    errorNote.value =
      err?.rsReason === 'timeout'
        ? 'api.github.com did not respond within 12s — check your connection, VPN or ad-blocker, then run again.'
        : networkMessage()
  }
}

onBeforeUnmount(clearTimers)

// Handle OAuth callback on mount
onBeforeMount(() => {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  const state = params.get('state');
  const error = params.get('error');

  if (error) {
    connectState.value = 'error'
    connectError.value = error === 'access_denied'
      ? 'GitHub authorization was denied — try again.'
      : 'GitHub authorization failed: ' + error;
    // Clean the URL
    window.history.replaceState({}, '', window.location.pathname);
    return;
  }

  if (code) {
    const savedState = sessionStorage.getItem('rs-gh-oauth-state');
    if (!state || state !== savedState) {
      connectState.value = 'error'
      connectError.value = 'OAuth state mismatch — try again.'
      window.history.replaceState({}, '', window.location.pathname);
      return;
    }
    void exchangeCode(code);
    return;
  }

  // Restore saved token
  try {
    const saved = sessionStorage.getItem(TOKEN_KEY)
    if (saved) {
      token.value = saved
      connectState.value = 'connected'
      void loadRepos()
    }
  } catch {
    // storage unavailable — stay unauthenticated
  }
});
</script>

<template>
  <div class="audit">
    <div class="audit-head">
      <div class="audit-grades" aria-hidden="true">
        <span v-for="g in GRADES" :key="g" class="audit-grade" :class="{ 'is-hit': grade === g }">{{ g }}</span>
      </div>
      <p class="audit-meta">Grades S–F · live against GitHub's API</p>
    </div>

    <div class="audit-connect">
      <template v-if="connected">
        <span class="audit-dot" aria-hidden="true"></span>
        <span class="audit-connect-label">GitHub connected · private repos enabled · token lives in this tab only</span>
        <button type="button" class="audit-unlink" @click="disconnect">Disconnect</button>
      </template>
      <template v-else>
        <button type="button" class="audit-link-btn" :disabled="connectState === 'connecting'" @click="connect">
          {{ connectState === 'connecting' ? 'Connecting…' : 'Connect GitHub' }}
        </button>
        <span class="audit-connect-hint">sign in with your GitHub account to audit private repos</span>
      </template>
    </div>

    <p v-if="connectError" class="audit-connecterr" role="alert">{{ connectError }}</p>

    <form class="audit-form" @submit.prevent="run">
      <label class="visually-hidden" for="audit-url">Repository URL</label>
      <div class="audit-pickerwrap">
        <span class="audit-inputwrap">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
          <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z"/>
        </svg>
        <input
          id="audit-url"
          v-model="url"
          type="text"
          inputmode="url"
          autocomplete="off"
          spellcheck="false"
          :placeholder="connected && reposState === 'ready' ? 'search your repositories… or paste any github.com URL' : 'github.com/you/your-repo — public or private'"
          role="combobox"
          :aria-expanded="ddOpen ? 'true' : 'false'"
          aria-controls="audit-repo-list"
          aria-autocomplete="list"
          @focus="onInputFocus"
          @blur="onInputBlur"
          @keydown="onInputKeydown"
        />
        <span v-if="connected && reposState === 'loading'" class="audit-dd-spin" aria-hidden="true">···</span>
      </span>
      <ul
        v-if="ddOpen && filteredRepos.length > 0"
        id="audit-repo-list"
        class="audit-dd"
        role="listbox"
      >
        <li
          v-for="(repo, i) in filteredRepos"
          :key="repo.name"
          class="audit-dd-item"
          :class="{ 'is-active': i === ddActive }"
          role="option"
          :aria-selected="i === ddActive ? 'true' : 'false'"
          @mousedown.prevent="pickRepo(repo)"
        >
          <span class="audit-dd-name">{{ repo.name }}</span>
          <span v-if="repo.priv" class="audit-dd-priv">private</span>
          <span v-if="repo.desc" class="audit-dd-desc">{{ repo.desc }}</span>
        </li>
      </ul>
      <p v-else-if="ddOpen && connected && reposState === 'error'" class="audit-dd-err">
        couldn't load your repository list — type a URL instead
      </p>
      </div>
      <button type="submit" class="audit-run" :disabled="state === 'running'">{{ runLabel }}</button>
    </form>

    <div v-if="state !== 'idle'" class="audit-body" role="status" aria-live="polite">
      <ul class="audit-checks">
        <li
          v-for="(check, i) in checks.slice(0, visibleChecks)"
          :key="check.key"
          class="audit-check"
          :class="[`is-${check.status}`, i === visibleChecks - 1 && state === 'running' ? 'is-in' : 'is-settled']"
        >
          <span class="audit-tick" aria-hidden="true">
            <template v-if="check.status === 'checking'">·</template>
            <template v-else-if="check.status === 'pass'">✓</template>
            <template v-else>✗</template>
          </span>
          <span class="audit-label">{{ check.label }}</span>
          <a v-if="check.href" class="audit-detail audit-detail--link" :href="check.href" target="_blank" rel="noopener">{{ check.detail }} ↗</a>
          <span v-else class="audit-detail">{{ check.detail }}</span>
          <a v-if="check.status === 'fail' && FIX_FOR[check.key]" class="audit-fix" :href="FIX_FOR[check.key]">fix →</a>
        </li>
      </ul>

      <p v-if="errorNote" class="audit-errornote" role="alert">{{ errorNote }}</p>

      <div v-if="state === 'done'" class="audit-result" :class="{ 'is-mid': score < 90 }">
        <span class="audit-score">{{ grade }}<small>{{ score }}/100</small></span>
        <p class="audit-verdict">
          {{ verdictLine }}
        </p>
        <a class="audit-doc" href="/commands/doctor">Deep local audit: reposell doctor →</a>
      </div>
    </div>

    <p class="audit-note">
      Read-only checks straight from GitHub's API. Connect GitHub to securely inspect
      repositories you can access — nothing leaves your browser except api.github.com calls.
    </p>
  </div>
</template>

<style scoped>
.audit {
  border: 1px solid rgb(255 255 255 / 0.08);
  background:
    radial-gradient(120% 140% at 85% -10%, rgb(167 139 250 / 0.09), transparent 55%),
    #101218;
  border-radius: 16px;
  padding: 22px;
  overflow: hidden;
}

.audit-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 14px;
}

.audit-grades {
  display: inline-flex;
  gap: 4px;
}

.audit-grade {
  font-family: var(--font-mono);
  font-size: 11px;
  line-height: 1;
  color: #5d6472;
  border: 1px solid rgb(255 255 255 / 0.08);
  border-radius: 6px;
  padding: 4px 7px;
  transition: color 200ms ease, border-color 200ms ease, background-color 200ms ease,
    box-shadow 200ms ease;
}

.audit-grade.is-hit {
  color: #13151a;
  background: #0af188;
  border-color: #0af188;
  font-weight: 700;
  box-shadow: 0 0 18px -2px rgb(10 241 136 / 0.5);
}

.audit-meta {
  margin: 0 !important;
  font-family: var(--font-mono);
  font-size: 11.5px;
  color: #7d8496;
}

/* connect row */
.audit-connect {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  padding-bottom: 14px;
}

.audit-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #0af188;
  box-shadow: 0 0 10px rgb(10 241 136 / 0.7);
  flex-shrink: 0;
}

.audit-connect-label {
  font-family: var(--font-mono);
  font-size: 12px;
  color: #34d399;
}

.audit-link-btn {
  appearance: none;
  border: 1px solid rgb(10 241 136 / 0.45);
  background: rgb(10 241 136 / 0.08);
  color: #0af188;
  border-radius: 8px;
  font-size: 12.5px;
  font-weight: 600;
  padding: 6px 12px;
  cursor: pointer;
  transition: background-color 160ms ease, border-color 160ms ease;
}

.audit-link-btn:hover:not(:disabled) {
  background: rgb(10 241 136 / 0.16);
  border-color: rgb(10 241 136 / 0.75);
}

.audit-link-btn:disabled {
  opacity: 0.6;
  cursor: wait;
}

.audit-unlink {
  appearance: none;
  border: none;
  background: transparent;
  color: #7d8496;
  font-size: 12px;
  text-decoration: underline;
  text-underline-offset: 3px;
  cursor: pointer;
  margin-left: auto;
}

.audit-unlink:hover {
  color: #c9cdd6;
}

.audit-connect-hint {
  font-size: 11.5px;
  color: #7d8496;
}

.audit-connecterr {
  margin: 0 0 12px !important;
  font-size: 12.5px;
  color: #f87171;
}

/* form */
.audit-form {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.audit-pickerwrap {
  flex: 1;
  min-width: 220px;
  position: relative;
}

/* repository dropdown */
.audit-dd {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  right: 0;
  z-index: 40;
  list-style: none !important;
  margin: 0 !important;
  padding: 6px !important;
  background: #0b0d12;
  border: 1px solid rgb(255 255 255 / 0.14);
  border-radius: 12px;
  box-shadow: 0 18px 44px -18px rgb(0 0 0 / 0.85);
  max-height: 268px;
  overflow-y: auto;
}

.audit-dd-item {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 2px 10px;
  padding: 8px 10px;
  border-radius: 8px;
  cursor: pointer;
}

.audit-dd-item:hover,
.audit-dd-item.is-active {
  background: rgb(10 241 136 / 0.09);
}

.audit-dd-name {
  font-family: var(--font-mono);
  font-size: 12.5px;
  color: #f2f4f8;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.audit-dd-priv {
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.08em;
  color: #a78bfa;
  border: 1px solid rgb(167 139 250 / 0.4);
  border-radius: 5px;
  padding: 1px 6px;
  height: fit-content;
}

.audit-dd-desc {
  grid-column: 1 / -1;
  font-size: 11px;
  color: #7d8496;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.audit-dd-spin {
  font-family: var(--font-mono);
  color: #0af188;
  animation: audit-pulse 1s ease-in-out infinite alternate;
}

@keyframes audit-pulse {
  to { opacity: 0.35; }
}

@media (prefers-reduced-motion: reduce) {
  .audit-dd-spin { animation: none; }
}

.audit-dd-err {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  right: 0;
  z-index: 40;
  margin: 0 !important;
  padding: 9px 12px;
  font-size: 11.5px;
  color: #7d8496;
  background: #0b0d12;
  border: 1px solid rgb(255 255 255 / 0.1);
  border-radius: 10px;
}

.audit-inputwrap {
  flex: 1;
  min-width: 220px;
  display: flex;
  align-items: center;
  gap: 9px;
  background: #0b0d12;
  border: 1px solid rgb(255 255 255 / 0.12);
  border-radius: 10px;
  padding: 0 12px;
  transition: border-color 160ms ease, box-shadow 160ms ease;
}

.audit-inputwrap:focus-within {
  border-color: rgb(10 241 136 / 0.55);
  box-shadow: 0 0 0 3px rgb(10 241 136 / 0.12);
}

.audit-inputwrap svg {
  color: #5d6472;
  flex-shrink: 0;
}

.audit-inputwrap input {
  width: 100%;
  background: transparent;
  border: none;
  outline: none;
  color: #f2f4f8;
  font-family: var(--font-mono);
  font-size: 13px;
  padding: 11px 0;
}

.audit-inputwrap input::placeholder {
  color: #6b7280;
}

.audit-run {
  appearance: none;
  border: none;
  border-radius: 10px;
  background: #0af188;
  color: #13151a;
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  padding: 11px 16px;
  cursor: pointer;
  white-space: nowrap;
  box-shadow: 0 4px 18px -6px rgb(10 241 136 / 0.5);
  transition: transform 160ms cubic-bezier(0.34, 1.56, 0.64, 1), background-color 160ms ease,
    opacity 160ms ease;
}

.audit-run:hover:not(:disabled) {
  background: #5cf2a8;
  transform: translateY(-1px);
}

.audit-run:focus-visible {
  outline: 2px solid #5cf2a8;
  outline-offset: 2px;
}

.audit-run:disabled {
  opacity: 0.65;
  cursor: wait;
}

.audit-run--ghost {
  background: transparent;
  color: #0af188;
  border: 1px solid rgb(10 241 136 / 0.45);
  box-shadow: none;
}

.audit-body {
  margin-top: 18px;
  border-top: 1px solid rgb(255 255 255 / 0.07);
  padding-top: 14px;
}

.audit-checks {
  list-style: none !important;
  margin: 0;
  padding: 0;
}

.audit-check {
  display: flex;
  align-items: baseline;
  gap: 10px;
  padding: 5px 0;
  font-size: 13px;
}

.audit-check.is-in {
  animation: audit-in 260ms cubic-bezier(0.16, 1, 0.3, 1) both;
}

@keyframes audit-in {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .audit-check.is-in {
    animation: none;
  }
}

.audit-tick {
  width: 14px;
  text-align: center;
  color: #34d399;
  font-size: 12px;
  user-select: none;
  flex-shrink: 0;
}

.audit-check.is-fail .audit-tick,
.audit-check.is-error .audit-tick {
  color: #f87171;
}

.audit-label {
  color: #eef0f4;
  white-space: nowrap;
}

.audit-detail {
  margin-left: auto;
  font-family: var(--font-mono);
  font-size: 11.5px;
  color: #7d8496;
  text-align: right;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.audit-detail--link {
  color: #9ba3b4;
  text-decoration: none;
}

.audit-detail--link:hover {
  color: #0af188;
}

.audit-fix {
  font-size: 12px;
  color: #0af188;
  text-decoration: none;
  white-space: nowrap;
  flex-shrink: 0;
}

.audit-fix:hover {
  text-decoration: underline;
  text-underline-offset: 4px;
}

.audit-errornote {
  margin: 12px 0 0 !important;
  font-size: 13px;
  line-height: 1.6;
  color: #f87171;
}

.audit-result {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 16px;
  padding: 14px;
  border: 1px solid rgb(10 241 136 / 0.35);
  background: rgb(10 241 136 / 0.06);
  border-radius: 12px;
  flex-wrap: wrap;
}

.audit-result.is-mid {
  border-color: rgb(251 191 36 / 0.4);
  background: rgb(251 191 36 / 0.05);
}

.audit-score {
  font-family: var(--font-mono);
  font-weight: 700;
  font-size: 30px;
  line-height: 1;
  color: #0af188;
  text-shadow: 0 0 24px rgb(10 241 136 / 0.45);
  display: inline-flex;
  flex-direction: column;
  gap: 2px;
}

.audit-result.is-mid .audit-score {
  color: #fbbf24;
  text-shadow: 0 0 24px rgb(251 191 36 / 0.35);
}

.audit-score small {
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.06em;
  color: #7d8496;
  text-shadow: none;
}

.audit-verdict {
  margin: 0 !important;
  font-size: 13px;
  line-height: 1.6;
  color: #c9cdd6;
  flex: 1;
  min-width: 240px;
  text-wrap: pretty;
}

.audit-doc {
  font-size: 13px;
  font-weight: 500;
  color: #0af188;
  text-decoration: none;
  white-space: nowrap;
}

.audit-doc:hover {
  text-decoration: underline;
  text-underline-offset: 4px;
}

.audit-note {
  margin: 14px 0 0 !important;
  font-size: 11.5px;
  line-height: 1.6;
  color: #7d8496;
}

.audit-note code {
  font-family: var(--font-mono);
  font-size: 11px;
  color: #a8aebb;
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}
</style>
