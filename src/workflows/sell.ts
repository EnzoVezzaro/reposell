/**
 * /sell builder: scaffolds the seller's standalone storefront so the
 * repository can start selling right after init.
 *
 * Outputs (never overwrites existing files):
 *   .reposell/storefront.json   storefront document
 *   sell/index.html             rendered page
 *   sell/styles.css             theme stylesheet (from @reposell/sell)
 *   sell/scripts.js             reveal-on-scroll runtime (from @reposell/sell)
 *
 * Fork-centric: buyers purchase a fork of the signed release; at init time
 * no release exists, so the buy CTA renders disabled and no payment link is
 * exposed. The Stripe Payment Link captured during the wizard is kept on
 * record in reposell.yml for the CI hand-off.
 */

import { promises as fs } from 'fs';
import path from 'path';
import {
  STYLES_CSS,
  SCRIPTS_JS,
  buildStorefrontDocument,
  STOREFRONT_VERSION,
} from '@reposell/sell';

export interface SellSiteOptions {
  productName: string;
  /** Stripe Payment Link URL (https://buy.stripe.com/…), when known. */
  paymentLink?: string;
}

export interface SellSiteResult {
  written: string[];
  paymentLinkWired: boolean;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export interface SellTemplateFiles {
  html: string;
  css: string;
  js: string;
}

/**
 * Renders the standalone sell/index.html template. Fork-centric: buyers get
 * a fork of the signed release and never see the source repository. The buy
 * CTA starts disabled — it activates on the deployed page once a release is
 * available; the wizard's Payment Link stays on record for that hand-off.
 */
export function renderSellTemplate(options: SellSiteOptions): SellTemplateFiles {
  const name = escapeHtml(options.productName);
  const linked = options.paymentLink !== undefined && options.paymentLink.length > 0;
  // The starter page has no published release yet, so checkout stays
  // disabled — the deployed /reposell/* page resolves live verified offers
  // after `reposell publish` + CI build.
  const buy = `<span class="rs-btn rs-btn--disabled" data-rs-available="false">Buy latest release</span>`;
  const linkComment =
    linked === true
      ? `\n<!-- Payment Link on record: ${escapeHtml(options.paymentLink ?? '')} — wired automatically once a release publishes. -->`
      : '';
  const linkNote =
    `\n      <p class="rs-note">Checkout activates when your first release is available — run <code>reposell publish v0.1.0</code> and push; CI rebuilds this page with live offers.</p>`;

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${name} — Buy</title>
<meta name="description" content="Buy a licensed fork of ${name} — signed release, delivered instantly.">
<link rel="stylesheet" href="./styles.css">
</head>
<body>
<main class="rs-shell">
${linkComment}
  <section class="rs-section" data-rs-section-id="hero">
    <div class="rs-hero">
      <span class="rs-eyebrow">Official /sell</span>
      <h1 class="rs-title">${name}</h1>
      <p class="rs-subtitle">Buy a licensed fork of the signed release — delivered instantly, license included.</p>
      <div class="rs-ctas">
        ${buy}
      </div>${linkNote}
    </div>
  </section>

  <section class="rs-section" data-rs-section-id="features">
    <span class="rs-kicker">/ what you get</span>
    <h2 class="rs-h2">Details from the manifest.</h2>
    <div class="rs-grid rs-grid--features">
      <article class="rs-card rs-feature">
        <div class="rs-feature-icon">◆</div>
        <h3 class="rs-feature-title">Signed release fork</h3>
        <p class="rs-feature-body">You fork the exact tagged release you purchased — cryptographically signed.</p>
      </article>
      <article class="rs-card rs-feature">
        <div class="rs-feature-icon">◇</div>
        <h3 class="rs-feature-title">License terms included</h3>
        <p class="rs-feature-body">Your purchase ships with the project license and AI policy attached.</p>
      </article>
      <article class="rs-card rs-feature">
        <div class="rs-feature-icon">◈</div>
        <h3 class="rs-feature-title">Verified payment</h3>
        <p class="rs-feature-body">The payment link is checked against the manifest before it ever reaches you.</p>
      </article>
    </div>
  </section>

  <section class="rs-section" data-rs-section-id="releases">
    <span class="rs-kicker">/ releases</span>
    <h2 class="rs-h2">Available now.</h2>
    <p class="rs-empty">No releases are currently available for purchase.</p>
    <p class="rs-note">Declare one with <code>reposell release v0.1.0 --price 10 --link &lt;your-stripe-link&gt;</code>, then run <code>reposell build</code>.</p>
  </section>

  <section class="rs-section" data-rs-section-id="faq">
    <span class="rs-kicker">/ questions</span>
    <h2 class="rs-h2">Good to know.</h2>
    <div class="rs-faq">
      <details class="rs-card rs-faq-item">
        <summary>How is it delivered?</summary>
        <p>Instantly — after checkout you receive a fork of the signed release, with your license terms attached.</p>
      </details>
      <details class="rs-card rs-faq-item">
        <summary>What about updates?</summary>
        <p>Each release is a separate purchase; new releases appear here as they publish.</p>
      </details>
    </div>
  </section>

</main>

<footer class="rs-footer">
  <p>Powered by reposell — verified forks of signed releases.</p>
</footer>

<script src="./scripts.js" defer></script>
</body>
</html>
`;

  return { html, css: STYLES_CSS, js: SCRIPTS_JS };
}

/** Writes-or-skips helper: existing files are never clobbered. */
async function writeFresh(fullPath: string, content: string): Promise<string | undefined> {
  try {
    await fs.writeFile(fullPath, content, { flag: 'wx' });
    return fullPath;
  } catch {
    return undefined;
  }
}

export async function generateSellSite(cwd: string, options: SellSiteOptions): Promise<SellSiteResult> {
  const written: string[] = [];

  const document = buildStorefrontDocument(
    options.productName,
    'Buy a licensed fork of the signed release — delivered instantly.',
  );
  const documentPath = path.join(cwd, '.reposell', 'storefront.json');
  await fs.mkdir(path.dirname(documentPath), { recursive: true });
  if ((await writeFresh(documentPath, `${JSON.stringify(document, null, 2)}\n`)) !== undefined) {
    written.push(path.relative(cwd, documentPath));
  }

  const files = renderSellTemplate(options);

  const sellDir = path.join(cwd, 'sell');
  await fs.mkdir(sellDir, { recursive: true });
  for (const [fileName, content] of [
    ['index.html', files.html],
    ['styles.css', files.css],
    ['scripts.js', files.js],
  ] as const) {
    const fullPath = path.join(sellDir, fileName);
    if ((await writeFresh(fullPath, content)) !== undefined) {
      written.push(path.join('sell', fileName));
    }
  }

  return {
    written,
    paymentLinkWired: options.paymentLink !== undefined && options.paymentLink.length > 0,
  };
}
