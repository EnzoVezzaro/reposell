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
 * The Stripe Payment Link captured during the wizard is wired into every
 * buy CTA. Without a link the CTAs render disabled with guidance instead.
 */

import { promises as fs } from 'fs';
import path from 'path';

export interface SellSiteOptions {
  productName: string;
  /** Stripe Payment Link URL (https://buy.stripe.com/…), when known. */
  paymentLink?: string;
  /** Repository URL used by the secondary CTA. */
  repositoryUrl?: string;
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
      description: 'Buy directly from the source repository.',
    },
    theme: {
      colors: {
        background: '#0b0c10',
        surface: '#14161d',
        ink: '#e8eaf0',
        muted: '#9aa1b2',
        accent: '#f5d90a',
        accentInk: '#111111',
        line: '#262a35',
      },
      fonts: {
        heading: 'Syne, sans-serif',
        body: 'Outfit, sans-serif',
        mono: '"Geist Mono", monospace',
      },
      radiusCard: '14px',
      radiusButton: '10px',
      maxWidth: '920px',
    },
    sections: [
      {
        id: 'hero',
        type: 'hero',
        eyebrow: 'Direct sale',
        title: options.productName,
        subtitle: 'One-time purchase · instant fork delivery · your repo, your keys.',
        ctas: [
          { label: 'Buy latest release', action: { kind: 'purchase' }, variant: 'primary' },
          ...(options.repositoryUrl !== undefined
            ? [{ label: 'View repository', action: { kind: 'link', url: options.repositoryUrl }, variant: 'ghost' }]
            : []),
        ],
      },
      { id: 'features', type: 'features', title: 'What you get', items: [] },
      { id: 'releases', type: 'releases', title: 'Releases' },
      { id: 'faq', type: 'faq', items: [] },
      { id: 'footer', type: 'footer', text: 'Powered by reposell — sell software from your own repository.', links: [] },
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

const STYLES_CSS = `:root{
  --rs-bg:#0b0c10;
  --rs-surface:#14161d;
  --rs-ink:#e8eaf0;
  --rs-muted:#9aa1b2;
  --rs-accent:#f5d90a;
  --rs-accent-ink:#111111;
  --rs-line:#262a35;
  --rs-font-heading:Syne,sans-serif;
  --rs-font-body:Outfit,sans-serif;
  --rs-font-mono:"Geist Mono",monospace;
  --rs-radius-card:14px;
  --rs-radius-button:10px;
  --rs-max-width:920px;
}
*{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth}
body{font-family:var(--rs-font-body);background:var(--rs-bg);color:var(--rs-ink);line-height:1.6;-webkit-font-smoothing:antialiased}
.rs-shell{width:min(var(--rs-max-width),92vw);margin:0 auto;padding:3rem 0 4rem}
.rs-section{padding:2rem 0}
.rs-eyebrow{display:inline-block;font-size:.75rem;letter-spacing:.14em;text-transform:uppercase;color:var(--rs-accent);border:1px solid var(--rs-line);border-radius:999px;padding:.25rem .8rem;background:var(--rs-surface)}
.rs-title{font-family:var(--rs-font-heading);font-size:clamp(2rem,5vw,3.2rem);line-height:1.1;margin:.9rem 0 .5rem;letter-spacing:-.02em}
.rs-subtitle{color:var(--rs-muted);font-size:1.05rem;max-width:56ch}
.rs-ctas{display:flex;gap:.8rem;flex-wrap:wrap;margin-top:1.4rem}
.rs-btn{display:inline-block;background:var(--rs-accent);color:var(--rs-accent-ink);font-weight:700;text-decoration:none;border-radius:var(--rs-radius-button);padding:.65rem 1.4rem;transition:transform .15s ease,box-shadow .15s ease}
.rs-btn:hover{transform:translateY(-1px);box-shadow:0 6px 20px color-mix(in srgb,var(--rs-accent) 30%,transparent)}
.rs-btn--ghost{background:transparent;color:var(--rs-ink);border:1px solid var(--rs-line)}
.rs-btn--disabled{background:var(--rs-line);color:var(--rs-muted);pointer-events:none}
.rs-h2{font-family:var(--rs-font-heading);font-size:clamp(1.4rem,3vw,2rem);margin-bottom:1.2rem;letter-spacing:-.01em}
.rs-grid{display:grid;gap:1rem}
.rs-grid--features{grid-template-columns:repeat(auto-fit,minmax(220px,1fr))}
.rs-card{background:var(--rs-surface);border:1px solid var(--rs-line);border-radius:var(--rs-radius-card);padding:1.3rem 1.4rem}
.rs-feature-icon{color:var(--rs-accent);margin-bottom:.5rem}
.rs-feature-title{font-size:1.02rem;font-weight:600;margin-bottom:.35rem}
.rs-feature-body{color:var(--rs-muted);font-size:.92rem}
.rs-empty{color:var(--rs-muted)}
.rs-note{color:var(--rs-muted);font-size:.88rem;margin-top:.8rem}
.rs-note code{font-family:var(--rs-font-mono);color:var(--rs-accent)}
.rs-faq{display:grid;gap:.7rem}
.rs-faq-item summary{cursor:pointer;font-weight:600;list-style:none}
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
 * Renders the standalone sell/index.html template. Buy CTAs point at the
 * wizard's Stripe Payment Link; without one they stay disabled and the page
 * explains how to wire them.
 */
export function renderSellTemplate(options: SellSiteOptions): SellTemplateFiles {
  const name = escapeHtml(options.productName);
  const linked = options.paymentLink !== undefined && options.paymentLink.length > 0;
  const buyHref = escapeHtml(linked ? (options.paymentLink ?? '#') : '#');
  const buy =
    linked === true
      ? `<a class="rs-btn" href="${buyHref}" rel="nofollow">Buy latest release</a>`
      : `<span class="rs-btn rs-btn--disabled">Buy latest release</span>`;
  const repoCta =
    options.repositoryUrl !== undefined
      ? `\n    <a class="rs-btn rs-btn--ghost" href="${escapeHtml(options.repositoryUrl)}">View repository</a>`
      : '';
  const linkNote =
    linked === true
      ? ''
      : `\n  <p class="rs-note">Wire your checkout: create a Stripe Payment Link and set it on the buy CTA below, or run <code>reposell sell init --link https://buy.stripe.com/…</code>.</p>`;

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${name} — Buy</title>
<meta name="description" content="Buy ${name} directly from the source repository.">
<link rel="stylesheet" href="./styles.css">
</head>
<body>
<main class="rs-shell">

  <section class="rs-section" data-rs-section-id="hero">
    <div class="rs-hero">
      <span class="rs-eyebrow">Direct sale</span>
      <h1 class="rs-title">${name}</h1>
      <p class="rs-subtitle">One-time purchase · instant fork delivery · your repo, your keys.</p>
      <div class="rs-ctas">
        ${buy}${repoCta}
      </div>${linkNote}
    </div>
  </section>

  <section class="rs-section" data-rs-section-id="features">
    <h2 class="rs-h2">What you get</h2>
    <!-- Add feature cards: <article class="rs-card rs-feature"><h3>…</h3><p>…</p></article> -->
    <div class="rs-grid rs-grid--features"></div>
  </section>

  <section class="rs-section" data-rs-section-id="releases">
    <h2 class="rs-h2">Releases</h2>
    <p class="rs-empty">No releases are currently available for purchase.</p>
    <p class="rs-note">Declare one with <code>reposell release v0.1.0 --price 10 --link &lt;your-stripe-link&gt;</code>, then run <code>reposell build</code>.</p>
  </section>

  <section class="rs-section" data-rs-section-id="faq">
    <details class="rs-card rs-faq-item">
      <summary>How is it delivered?</summary>
      <p>Instantly — you fork the signed release from the source repository.</p>
    </details>
  </section>

</main>

<footer class="rs-footer">
  <p>Powered by reposell — sell software from your own repository.</p>
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
