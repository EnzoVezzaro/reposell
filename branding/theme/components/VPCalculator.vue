<script setup lang="ts">
import { ref, computed } from 'vue'

const price = ref(50)

const MIN = 10
const MAX = 500
const STEP = 5

const FEE_MIN = 5
const FEE_RATE = 0.1

const fee = computed(() => Math.max(FEE_MIN, price.value * FEE_RATE))
const youKeepReposell = computed(() => Math.max(price.value - fee.value, 0))
const reposellPct = computed(() => Math.round((youKeepReposell.value / price.value) * 100))
const typicalCut = 30
const youKeepTypical = computed(() => price.value * (1 - typicalCut / 100))
</script>

<template>
  <div class="rs-calc">
    <div class="rs-calc-head">
      <label class="rs-calc-label" for="rs-price">Your product price</label>
      <output class="rs-calc-amount">${{ price }}<span class="usd">USD</span></output>
    </div>
    <input
      id="rs-price"
      v-model.number="price"
      type="range"
      :min="MIN"
      :max="MAX"
      :step="STEP"
      class="rs-calc-slider"
    />
    <div class="rs-calc-scale" aria-hidden="true"><span>$10</span><span>$250</span><span>$500</span></div>

    <div class="rs-calc-rows">
      <div class="rs-row rs-row--reposell">
        <div class="rs-row-head">
          <span>With reposell you keep <em>(fee: ${{ fee.toFixed(2) }} — min $5, then 10%)</em></span>
          <strong>${{ youKeepReposell.toFixed(2) }}</strong>
        </div>
        <div class="rs-bar">
          <div class="rs-bar-fill" :style="{ width: reposellPct + '%' }"></div>
        </div>
        <small>You keep {{ reposellPct }}% · the ${{ fee.toFixed(2) }} fee is fixed inside a signed policy</small>
      </div>

      <div class="rs-row rs-row--typical">
        <div class="rs-row-head">
          <span>Typical listing <em>(30% cut)</em></span>
          <strong>${{ youKeepTypical.toFixed(2) }}</strong>
        </div>
        <div class="rs-bar">
          <div class="rs-bar-fill rs-bar-fill--dim" :style="{ width: (100 - typicalCut) + '%' }"></div>
        </div>
        <small>You keep {{ 100 - typicalCut }}% — and hope the % never changes</small>
      </div>
    </div>

    <p class="rs-calc-note">
      The fee <strong>starts at $5 and grows with you</strong> (10% after that) — always locked inside a
      <strong>signed pricing policy</strong> nobody can quietly edit. Every fee keeps the protocol independent:
      built by one developer today, ready for a team tomorrow.
    </p>
  </div>
</template>

<style scoped>
.rs-calc {
  background: var(--rs-card);
  border: 1px solid var(--rs-line);
  border-radius: calc(var(--rs-radius) + 6px);
  padding: 28px;
  margin: 24px 0;
}

.rs-calc-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16px;
}

.rs-calc-label {
  font-weight: 600;
  color: var(--vp-c-text-1);
}

.rs-calc-amount {
  font-family: var(--font-display);
  font-size: 34px;
  font-weight: 800;
  color: var(--vp-c-text-1);
  font-variant-numeric: tabular-nums;
}

.rs-calc-amount .usd {
  font-size: 12px;
  font-weight: 600;
  margin-left: 6px;
  color: var(--vp-c-text-3);
  letter-spacing: 0.08em;
}

.rs-calc-slider {
  width: 100%;
  margin: 18px 0 6px;
  accent-color: #0af188;
  height: 22px;
  cursor: grab;
}
.rs-calc-slider:active { cursor: grabbing; }

.rs-calc-scale {
  display: flex;
  justify-content: space-between;
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--vp-c-text-3);
}

.rs-calc-rows {
  display: grid;
  gap: 20px;
  margin-top: 26px;
}

.rs-row-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 12px;
  font-size: 14px;
  color: var(--vp-c-text-1);
  margin-bottom: 8px;
}

.rs-row-head em {
  font-style: normal;
  color: var(--vp-c-text-3);
  font-size: 12px;
}

.rs-row-head strong {
  font-family: var(--font-display);
  font-size: 18px;
  font-variant-numeric: tabular-nums;
}

.rs-bar {
  height: 14px;
  background: rgb(25 27 22 / 0.08);
  border-radius: 999px;
  overflow: hidden;
}
.dark .rs-bar {
  background: rgb(244 243 235 / 0.09);
}

.rs-bar-fill {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, #08d878, #0af188);
  box-shadow: 0 0 14px rgb(10 241 136 / 0.45);
  transition: width 300ms cubic-bezier(0.16, 1, 0.3, 1);
}

.rs-bar-fill--dim {
  background: rgb(25 27 22 / 0.28);
  box-shadow: none;
}
.dark .rs-bar-fill--dim {
  background: rgb(244 243 235 / 0.22);
}

.rs-row small {
  display: block;
  margin-top: 6px;
  font-size: 12px;
  color: var(--vp-c-text-3);
}

.rs-calc-note {
  margin: 24px 0 0 !important;
  padding-top: 18px;
  border-top: 1px dashed var(--rs-line);
  font-size: 13px;
  color: var(--vp-c-text-2);
}
</style>
