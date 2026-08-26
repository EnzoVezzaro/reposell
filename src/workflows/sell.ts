/**
 * /sell builder: scaffolds the seller's standalone storefront so the
 * repository can start selling right after init.
 *
 * Outputs (never overwrites existing files):
 *   .reposell/storefront.json   storefront document (Studio/builder source)
 *   sell/index.html             editable HTML template
 *   sell/styles.css             theme stylesheet
 *   sell/scripts.js             reveal-on-scroll runtime
 *
 * The template uses the reposell landing identity (signal green on ink,
 * Syne/Oxanium/Outfit/Geist Mono, chamfered edges) and is fork-centric:
 * buyers purchase a fork of the signed release — the page never links to,
 * names or exposes the source repository. The buy CTA starts disabled and
 * activates on the deployed /reposell/* surface once a release publishes;
 * the Stripe Payment Link captured during the wizard is kept on record
 * (comment + storefront document) for that hand-off.
 */

import { promises as fs } from 'fs';
import path from 'path';

export interface SellSiteOptions {
  productName: string;
  /** Stripe Payment Link URL (https://buy.stripe.com/…), when known. */
  paymentLink?: string;
}

export interface SellSiteResult {
  written: string[];
  paymentLinkWired: boolean;
}

const STOREFRONT_VERSION = 1;

function storefrontDocument(options: SellSiteOptions) {
  return {
    schema: 'reposell-storefront',
    version: STOREFRONT_VERSION,
    product: {
      name: options.productName,
      description: 'Buy a licensed fork of the signed release — delivered instantly.',
    },
    theme: {
      colors: {
        background: '#0a0a0a',
        surface: '#161616',
        ink: '#f0f0f0',
        muted: '#7a7a7a',
        accent: '#0af188',
        accentInk: '#0a0a0a',
        line: 'rgba(240,240,240,0.08)',
      },
      fonts: {
        heading: 'Syne, sans-serif',
        body: 'Outfit, sans-serif',
        mono: '"Geist Mono", monospace',
      },
      radiusCard: '2px',
      radiusButton: '2px',
      maxWidth: '920px',
    },
    sections: [
      {
        id: 'hero',
        type: 'hero',
        eyebrow: 'Official /sell',
        title: options.productName,
        subtitle: 'Buy a licensed fork of the signed release — delivered instantly, license included.',
        ctas: [{ label: 'Buy latest release', action: { kind: 'purchase' }, variant: 'primary' }],
      },
      {
        id: 'features',
        type: 'features',
        title: 'What you get',
        items: [
          { title: 'Signed release fork', body: 'You fork the exact tagged release you purchased — cryptographically signed.', icon: '◆' },
          { title: 'License terms included', body: 'Your purchase ships with the project license and AI policy.', icon: '◇' },
          { title: 'Verified payment', body: 'The payment link is checked against the manifest before it ever reaches you.', icon: '◈' },
        ],
      },
      { id: 'releases', type: 'releases', title: 'Releases' },
      {
        id: 'faq',
        type: 'faq',
        items: [
          { question: 'How is it delivered?', answer: 'Instantly — you receive a fork of the signed release, with your license terms attached.' },
          { question: 'What about updates?', answer: 'Each release is a separate purchase; new releases appear here as they publish.' },
        ],
      },
      { id: 'footer', type: 'footer', text: 'Powered by reposell — sell software straight from your project.', links: [] },
    ],
  };
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

const STYLES_CSS = `@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300..800&family=Oxanium:wght@400..800&family=Syne:wght@400..800&family=Geist+Mono:wght@300..700&display=swap');
:root{
  --rs-bg:#0a0a0a;
  --rs-surface:#161616;
  --rs-surface-soft:#111111;
  --rs-ink:#f0f0f0;
  --rs-muted:#7a7a7a;
  --rs-accent:#0af188;
  --rs-accent-hover:#3df5a0;
  --rs-accent-dim:rgba(10,241,136,0.12);
  --rs-accent-ink:#0a0a0a;
  --rs-line:rgba(240,240,240,0.08);
  --rs-font-hero:Syne,sans-serif;
  --rs-font-heading:Oxanium,sans-serif;
  --rs-font-body:Outfit,sans-serif;
  --rs-font-mono:"Geist Mono",monospace;
  --rs-radius:2px;
  --rs-max-width:920px;
}
*{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth}
body{font-family:var(--rs-font-body);background:var(--rs-bg);color:var(--rs-ink);line-height:1.6;-webkit-font-smoothing:antialiased}
.rs-shell{width:min(var(--rs-max-width),92vw);margin:0 auto;padding:3rem 0 4rem}
.rs-section{padding:2rem 0}
.rs-section+.rs-section{border-top:1px solid var(--rs-line)}
.rs-eyebrow{display:inline-block;font-family:var(--rs-font-mono);font-size:.72rem;letter-spacing:.18em;text-transform:uppercase;color:var(--rs-accent);background:var(--rs-accent-dim);border:1px solid transparent;border-radius:var(--rs-radius);padding:.3rem .8rem}
.rs-title{font-family:var(--rs-font-hero);font-weight:700;font-size:clamp(2.2rem,6vw,3.6rem);line-height:1.05;letter-spacing:-.02em;margin:.9rem 0 .5rem}
.rs-subtitle{color:var(--rs-muted);font-size:1.08rem;max-width:56ch}
.rs-ctas{display:flex;gap:.8rem;flex-wrap:wrap;margin-top:1.5rem}
.rs-btn{display:inline-block;font-family:var(--rs-font-heading);font-weight:600;background:var(--rs-accent);color:var(--rs-accent-ink);text-decoration:none;border-radius:var(--rs-radius);padding:.7rem 1.6rem;transition:transform .15s ease,background .15s ease}
.rs-btn:hover{background:var(--rs-accent-hover);transform:translateY(-1px)}
.rs-btn--disabled{background:transparent;border:1px solid var(--rs-line);color:var(--rs-muted);pointer-events:none}
.rs-h2{font-family:var(--rs-font-heading);font-size:clamp(1.4rem,3vw,2rem);margin-bottom:1.2rem;letter-spacing:-.01em}
.rs-kicker{font-family:var(--rs-font-mono);font-size:.72rem;letter-spacing:.18em;text-transform:uppercase;color:var(--rs-accent);display:block;margin-bottom:.4rem}
.rs-grid{display:grid;gap:1rem}
.rs-grid--features{grid-template-columns:repeat(auto-fit,minmax(220px,1fr))}
.rs-card{position:relative;background:var(--rs-surface);border:1px solid var(--rs-line);border-radius:var(--rs-radius);padding:1.3rem 1.4rem}
.rs-card::before{content:'+';position:absolute;top:.45rem;right:.7rem;font-family:var(--rs-font-mono);font-size:.8rem;color:var(--rs-accent)}
.rs-feature-icon{color:var(--rs-accent);margin-bottom:.55rem}
.rs-feature-title{font-family:var(--rs-font-heading);font-size:1rem;font-weight:600;margin-bottom:.35rem}
.rs-feature-body{color:var(--rs-muted);font-size:.92rem}
.rs-empty{color:var(--rs-muted)}
.rs-note{color:var(--rs-muted);font-size:.88rem;margin-top:.8rem}
.rs-note code{font-family:var(--rs-font-mono);color:var(--rs-accent)}
.rs-faq{display:grid;gap:.7rem}
.rs-faq-item summary{cursor:pointer;font-family:var(--rs-font-heading);font-weight:600;list-style:none}
.rs-faq-item summary::-webkit-details-marker{display:none}
.rs-faq-item[open] summary{margin-bottom:.5rem;color:var(--rs-accent)}
.rs-faq-item p{color:var(--rs-muted);font-size:.95rem}
.rs-reveal{opacity:0;transform:translateY(10px);transition:opacity .45s ease,transform .45s ease}
.rs-reveal--in{opacity:1;transform:none}
footer.rs-footer{border-top:1px solid var(--rs-line);padding:1.6rem 0;color:var(--rs-muted);font-size:.88rem;display:flex;justify-content:space-between;gap:1rem;flex-wrap:wrap}
.rs-footer-links{display:flex;gap:1rem;flex-wrap:wrap}
.rs-footer-links a,.rs-footer a{color:var(--rs-accent)}
@media (prefers-reduced-motion: reduce){
  html{scroll-behavior:auto}
  .rs-reveal{opacity:1;transform:none;transition:none}
  .rs-btn{transition:none}
}`;

const SCRIPTS_JS = `(() => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const targets = document.querySelectorAll('.rs-card, .rs-hero');
  if (!('IntersectionObserver' in window)) {
    targets.forEach((el) => el.classList.add('rs-reveal--in'));
    return;
  }
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add('rs-reveal--in');
      observer.unobserve(entry.target);
    }
  }, { threshold: 0.12 });
  targets.forEach((el) => { el.classList.add('rs-reveal'); observer.observe(el); });
})();`;

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

  const documentPath = path.join(cwd, '.reposell', 'storefront.json');
  await fs.mkdir(path.dirname(documentPath), { recursive: true });
  if ((await writeFresh(documentPath, `${JSON.stringify(storefrontDocument(options), null, 2)}\n`)) !== undefined) {
    written.push(path.relative(cwd, documentPath));
  }

  const sellDir = path.join(cwd, 'sell');
  await fs.mkdir(sellDir, { recursive: true });
  const template = renderSellTemplate(options);
  for (const [fileName, content] of [
    ['index.html', template.html],
    ['styles.css', template.css],
    ['scripts.js', template.js],
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
