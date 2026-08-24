---
layout: home
footer: false

title: reposell
description: Your repo, your keys, your revenue. Turn any Git repository into something people can buy.
---

<LandingHero>
  <template #title>
    <h1 class="lx-title">Your repo.<br />Your keys.<br /><em>Your revenue.</em></h1>
  </template>
  <template #subtitle>
    <p class="lx-sub">
      reposell turns any Git repository into something people can buy — checkout,
      licensing and signed releases wired by a single command. No platform lock-in.
      You keep every sale.
    </p>
  </template>
  <template #actions>
    <a class="lx-btn lx-btn--solid" href="/guide/quick-start">Start selling free</a>
    <a class="lx-btn lx-btn--ghost" href="/protocol/">Read the protocol</a>
  </template>
  <template #chip>
    <HomeCopyChip cmd="npx @reposell/cli init" />
  </template>
  <template #trust>
    <ul class="lx-trust" aria-label="Works with">
      <li>npm</li>
      <li>GitHub Actions</li>
      <li>Stripe Links</li>
      <li>Ed25519</li>
      <li>SPDX</li>
    </ul>
  </template>
</LandingHero>

<div class="lx-shell">
  <div class="lx-vprops">
    <div class="lx-vprop"><strong>Free &amp; open protocol</strong><span>The spec is public. No platform lock.</span></div>
    <div class="lx-vprop"><strong>Keys never leave your machine</strong><span>Ed25519 signing is local-only.</span></div>
    <div class="lx-vprop"><strong>CI-native releases</strong><span>Everything runs in CI. GitHub Actions today — more coming soon.</span></div>
    <div class="lx-vprop"><strong>Zero daemons</strong><span>One CLI binary. Nothing in the background.</span></div>
  </div>

  <section id="features" class="lx-section lx-reveal">
    <div class="lx-h2row">
      <span class="lx-num" aria-hidden="true">01</span>
      <div class="lx-h2block">
        <p class="kick">/ features</p>
        <h2>Tools that sell.</h2>
        <p class="lede">Every piece of selling infrastructure — checkout, keys, licensing, releases — reduced to commands you already know how to run.</p>
      </div>
    </div>
    <div class="lx-bento">
      <div class="lx-cell lx-wide lx-glow">
        <p class="lx-cell-title">Zero-config init</p>
        <p class="lx-cell-desc">Reads your repo and wires checkout, licensing and release automation. One command, no dashboards.</p>
        <code class="lx-code"><span class="c">$</span> reposell <span class="k">init</span> <span class="m"># that's the whole setup</span></code>
      </div>
      <div class="lx-cell">
        <p class="lx-cell-title">Keys that stay yours</p>
        <p class="lx-cell-desc">Ed25519 signing happens locally. Rotate through signed trust docs.</p>
        <code class="lx-code">ed25519 <span class="k">sign</span> manifest.json</code>
      </div>
      <div class="lx-cell">
        <p class="lx-cell-title">Doctor on call</p>
        <p class="lx-cell-desc">Finds broken config, stale keys and license gaps — then fixes them.</p>
        <code class="lx-code"><span class="c">$</span> reposell <span class="k">doctor</span></code>
      </div>
      <div class="lx-cell">
        <p class="lx-cell-title">Fair splits</p>
        <p class="lx-cell-desc">Fees live inside signed policy documents nobody can quietly edit.</p>
        <code class="lx-code">fee = <span class="s">max($5, 10%)</span></code>
      </div>
      <div class="lx-cell">
        <p class="lx-cell-title">CI-native releases</p>
        <p class="lx-cell-desc">Tag a version; CI signs and publishes it for you — GitHub Actions first, more coming.</p>
        <code class="lx-code"><span class="m">.github/workflows/reposell.yml</span></code>
      </div>
      <div class="lx-cell lx-wide lx-glow">
        <p class="lx-cell-title">License engine built in</p>
        <p class="lx-cell-desc">init detects your license. Unknown text? Pick standards-compliant templates filled with your info — or keep yours untouched.</p>
        <code class="lx-code">license check → <span class="k">RSL-1.0?</span> → <span class="s">your name on it</span></code>
      </div>
      <div class="lx-cell">
        <p class="lx-cell-title">Signed manifests</p>
        <p class="lx-cell-desc">Every listing speaks the same verifiable wire format.</p>
        <code class="lx-code">/<span class="k">listing</span>/manifest.json</code>
      </div>
      <div class="lx-cell">
        <p class="lx-cell-title">Verify anywhere</p>
        <p class="lx-cell-desc">Buyers check signatures against your public key in one command.</p>
        <code class="lx-code"><span class="c">$</span> reposell <span class="k">verify</span></code>
      </div>
    </div>
  </section>
</div>

<section class="lx-ticker" aria-hidden="true">
  <div class="lx-ticker-track">
    <span>Ed25519 signed</span><i>✦</i>
    <span>Stripe links</span><i>✦</i>
    <span>Zero-config</span><i>✦</i>
    <span>CI-native · multi-provider soon</span><i>✦</i>
    <span>Your keys</span><i>✦</i>
    <span>Your revenue</span><i>✦</i>
    <span>Ed25519 signed</span><i>✦</i>
    <span>Stripe links</span><i>✦</i>
    <span>Zero-config</span><i>✦</i>
    <span>CI-native · multi-provider soon</span><i>✦</i>
    <span>Your keys</span><i>✦</i>
    <span>Your revenue</span><i>✦</i>
  </div>
</section>

<div class="lx-shell">
  <section id="how" class="lx-section">
    <div class="lx-h2row">
      <span class="lx-num" aria-hidden="true">02</span>
      <div class="lx-h2block">
        <p class="kick">/ workflow</p>
        <h2>One command. One Stripe link.</h2>
        <p class="lede">No migration, no new storefront. /sell mints your Stripe payment link — listings mint theirs with the cut attached, then grant buyers access to your real repo. Or sell direct.</p>
      </div>
    </div>
    <div class="lx-pipeline">
      <div class="lx-step"><strong>/sell → your link</strong><span>One command creates a hosted Stripe payment link for your repository. That's the whole checkout.</span></div>
      <div class="lx-step"><strong>/listing → its link</strong><span>Listings create their own Stripe link with their cut at checkout — charged from the signed manifest repo.</span></div>
      <div class="lx-step"><strong>access granted</strong><span>The buyer gets access to the real repository, license bound to their GitHub identity.</span></div>
      <div class="lx-step"><strong>or go direct</strong><span>Your link is yours — buyers can always buy straight from the seller. No middleman required.</span></div>
    </div>
    <VPTerminal scenario="install" />
  </section>

  <section id="install" class="lx-section">
    <div class="lx-h2row">
      <span class="lx-num" aria-hidden="true">03</span>
      <div class="lx-h2block">
        <p class="kick">/ docs</p>
        <h2>Install anywhere Node runs.</h2>
        <p class="lede">macOS, Linux, Windows, CI. The CLI talks straight to Git and Stripe — no accounts, no background services.</p>
      </div>
    </div>
    <HomeInstallTabs />
    <div class="lx-links lx-links-after">
      <a class="lx-link" href="/guide/installation"><strong>Installation guide</strong><span>Every platform, every package manager.</span></a>
      <a class="lx-link" href="/configuration/"><strong>Configuration</strong><span>reposell.yml, schema and env vars.</span></a>
      <a class="lx-link" href="/commands/"><strong>Command reference</strong><span>All eight verbs, flags included.</span></a>
    </div>
  </section>

  <section id="math" class="lx-section">
    <div class="lx-h2row">
      <span class="lx-num" aria-hidden="true">04</span>
      <div class="lx-h2block">
        <p class="kick">/ pricing</p>
        <h2>Do the math.</h2>
        <p class="lede">You keep every cent of every sale. Checkout runs on your own Stripe Payment Link — reposell takes no cut. Not a percentage. Not a minimum. Nothing.</p>
      </div>
    </div>
    <div class="lx-mathgrid lx-reveal">
      <div class="lx-mathcard">
        <p class="kick">direct sale</p>
        <table class="lx-math">
          <tr><td>Buyer pays</td><td>$50.00</td></tr>
          <tr><td>reposell cut</td><td class="ok">$0.00</td></tr>
          <tr><td>You receive*</td><td class="ok"><b>$50.00</b></td></tr>
        </table>
        <p class="lx-math-note">* minus Stripe's own processing fee, which is between you and Stripe.</p>
      </div>
      <div class="lx-mathcard">
        <p class="kick">optional: listing contribution</p>
        <table class="lx-math">
          <tr><td>Your price</td><td>$50.00</td></tr>
          <tr><td>Your contribution</td><td>you choose — $0 / $5 / $10…</td></tr>
          <tr><td>Sale revenue</td><td class="ok"><b>still 100% yours</b></td></tr>
        </table>
        <p class="lx-math-note">Listing discovery runs on a separate voluntary contribution link — flat amount, per release, immutable forever. Skip it and nothing changes.</p>
      </div>
    </div>
    <ul class="lx-chips" aria-label="Pricing facts">
      <li><b>100%</b> of every sale</li>
      <li><b>$0</b> platform fee</li>
      <li>contribution is <b>flat &amp; optional</b></li>
      <li>economics <b>immutable per release</b></li>
    </ul>
  </section>

  <section id="audit" class="lx-section">
    <div class="lx-h2row">
      <span class="lx-num" aria-hidden="true">05</span>
      <div class="lx-h2block">
        <p class="kick">/ audit</p>
        <h2>How sell-ready is your repo?</h2>
        <p class="lede">A real audit against GitHub's API — license, manifest, workflow, releases. Private repos: connect GitHub first.</p>
      </div>
    </div>
    <div class="audit-host lx-reveal">
      <HomeAudit />
    </div>
  </section>

  <div class="lx-trustcard">
    <span class="lx-trustcard-icon" aria-hidden="true">⛨</span>
    <div>
      <h3>Security is the product, not a feature</h3>
      <p>Private keys never touch Git, npm, CI logs or our servers. Every manifest, pricing policy and license carries an Ed25519 signature you can verify yourself — and key rotation happens through signed trust documents, so history stays intact.</p>
      <a href="/security/">Read the security model →</a>
    </div>
  </div>

  <section id="jump" class="lx-section">
    <div class="lx-links">
      <a class="lx-link" href="/guide/quick-start"><strong>Quick start</strong><span>From git clone to first sale in about five minutes.</span></a>
      <a class="lx-link" href="/guide/core-concepts"><strong>Core concepts</strong><span>Manifests, pricing policies and trust chains, explained plainly.</span></a>
      <a class="lx-link" href="/licensing/"><strong>Licensing</strong><span>Check, choose or keep. Templates with real AI clauses.</span></a>
      <a class="lx-link" href="/security/"><strong>Security</strong><span>Threat model, key management and what we never touch.</span></a>
      <a class="lx-link" href="/protocol/"><strong>Protocol spec</strong><span>The wire format every listing speaks.</span></a>
    </div>
  </section>
</div>

<footer class="lx-footer">
  <FooterWordmark />
  <div class="lx-shell">
    <div class="lx-footer-grid">
      <div class="lx-fcol lx-fbrand">
        <h4>reposell</h4>
        <p class="lx-fblurb">Your repo, your keys, your revenue. Turn any Git repository into something people can buy.</p>
        <p>Made with ☕ and 🎧 by Enzo Vezzaro — a solo developer from the Dominican Republic, building for a team tomorrow.</p>
      </div>
      <nav class="lx-fcol" aria-label="Product">
        <h4>Product</h4>
        <ul>
          <li><a href="/guide/quick-start">Quick start</a></li>
          <li><a href="/guide/installation">Installation</a></li>
          <li><a href="/commands/">Commands</a></li>
          <li><a href="/configuration/">Configuration</a></li>
        </ul>
      </nav>
      <nav class="lx-fcol" aria-label="Protocol">
        <h4>Protocol</h4>
        <ul>
          <li><a href="/protocol/">Specification</a></li>
          <li><a href="/protocol/manifest-schema">Manifest schema</a></li>
          <li><a href="/protocol/signatures">Signatures</a></li>
          <li><a href="/protocol/release-model">Release model</a></li>
        </ul>
      </nav>
      <nav class="lx-fcol" aria-label="Trust">
        <h4>Trust</h4>
        <ul>
          <li><a href="/security/">Security model</a></li>
          <li><a href="/licensing/">Licensing guide</a></li>
          <li><a href="/commands/doctor">reposell doctor</a></li>
          <li><a href="/commands/verify">reposell verify</a></li>
        </ul>
      </nav>
    </div>
    <div class="lx-bottombar">
      <span>© 2026 Enzo Vezzaro · MIT License</span>
      <span class="lx-socials">
        <a href="https://github.com/EnzoVezzaro/reposell" target="_blank" rel="noopener">GitHub</a>
        <a href="https://github.com/EnzoVezzaro/reposell/issues" target="_blank" rel="noopener">Issues</a>
        <a href="https://github.com/EnzoVezzaro/reposell/blob/main/CONTRIBUTING.md" target="_blank" rel="noopener">Contributing</a>
      </span>
      <VersionChip />
    </div>
  </div>
</footer>
