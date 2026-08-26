/**
 * Static page templates for the /reposell/* surface (spec §13, §15, §27, §40).
 * Self-contained HTML: no JS frameworks, no external assets, deterministic
 * output, JSON-LD structured metadata for agents, reduced-motion respected.
 */

import type { ReleasesIndexEntry } from '../domain/protocol/documents.js';

export function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

const PAGE_CSS = `
:root{--bg:#0b0c10;--panel:#14161d;--ink:#e8eaf0;--muted:#9aa1b2;--accent:#f5d90a;--line:#262a35;--ok:#4ade80;--bad:#f87171}
*{box-sizing:border-box;margin:0;padding:0}
body{font:16px/1.6 ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;background:var(--bg);color:var(--ink);min-height:100vh;display:flex;flex-direction:column}
main{flex:1;width:min(880px,92vw);margin:0 auto;padding:3rem 0 4rem}
.badge{display:inline-block;font-size:.75rem;letter-spacing:.14em;text-transform:uppercase;color:var(--accent);border:1px solid var(--line);border-radius:999px;padding:.25rem .8rem;background:var(--panel)}
h1{font-size:clamp(2rem,5vw,3.2rem);line-height:1.1;margin:.9rem 0 .5rem;letter-spacing:-.02em}
.desc{color:var(--muted);font-size:1.1rem;max-width:56ch}
.grid{display:grid;gap:1rem;margin-top:2.2rem}
.card{background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:1.4rem 1.5rem;display:flex;align-items:center;justify-content:space-between;gap:1rem;animation:rise .45s ease both}
.card:nth-child(2){animation-delay:.06s}.card:nth-child(3){animation-delay:.12s}.card:nth-child(4){animation-delay:.18s}
@keyframes rise{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
@media (prefers-reduced-motion: reduce){.card{animation:none}}
.ver{font-weight:600;font-size:1.05rem}
.meta{color:var(--muted);font-size:.85rem;margin-top:.15rem}
.pill{font-size:.72rem;border-radius:999px;padding:.15rem .6rem;border:1px solid var(--line)}
.pill.ok{color:var(--ok)}.pill.bad{color:var(--bad)}
.price{font-weight:700;font-size:1.25rem;white-space:nowrap}
.buy{display:inline-block;background:var(--accent);color:#111;font-weight:700;text-decoration:none;border-radius:10px;padding:.65rem 1.4rem;transition:transform .15s ease,box-shadow .15s ease}
.buy:hover{transform:translateY(-1px);box-shadow:0 6px 20px rgba(245,217,10,.25)}
@media (prefers-reduced-motion: reduce){.buy{transition:none}}
.buy.off{background:var(--line);color:var(--muted);pointer-events:none;opacity:.5}
.gh-connected .buy.off{opacity:1}
.release{flex-direction:column;align-items:stretch;gap:.8rem}
.offers{display:grid;gap:.6rem}
.offer{display:flex;align-items:center;justify-content:space-between;gap:1rem;border-top:1px solid var(--line);padding-top:.6rem}
.offer-name{font-weight:600}
footer{border-top:1px solid var(--line);padding:1.4rem 0;color:var(--muted);font-size:.85rem}
footer div{width:min(880px,92vw);margin:0 auto;display:flex;gap:1.2rem;flex-wrap:wrap}
a{color:var(--accent)}
.links{margin-top:2rem;display:flex;gap:1rem;flex-wrap:wrap;font-size:.9rem}
.empty{color:var(--muted);margin-top:2rem}
`;

export interface PageShellInput {
  title: string;
  description: string;
  body: string;
  jsonLd: Record<string, unknown>;
  embeddedJson: Record<string, unknown>;
}

/** Shared document shell; every page embeds structured data for agents (§40). */
export function renderPage(input: PageShellInput): string {
  const jsonLd = JSON.stringify(input.jsonLd);
  const data = JSON.stringify(input.embeddedJson);
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(input.title)}</title>
<meta name="description" content="${escapeHtml(input.description)}">
<script type="application/ld+json">${jsonLd}</script>
<style>${PAGE_CSS}</style>
</head>
<body>
<main>
${input.body}
<div class="links"><a href="./">index.json</a><a href="./manifest.json">manifest.json</a><a href="./health.json">health.json</a><a href="./releases/index.json">releases/index.json</a></div>
</main>
<footer><div><span>RepoSell protocol v1</span><span>payments by Stripe</span></div></footer>
<script type="application/json" id="reposell-data">${data}</script>
</body>
</html>
`;
}

export interface SellPageModel {
  productName: string;
  description: string;
  entries: ReleasesIndexEntry[];
  /** owner/name — embedded so listing CI can verify repository identity. */
  repositorySlug: string;
  /** Seller-configured discovery contribution (buyer-paid at the listing). */
  listingContribution?: { amount: number; currency: string };
}

function money(amount: number, currency: string): string {
  const formatted = amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${formatted} ${currency}`;
}

function offerLabel(entry: { offers?: ReleasesIndexEntry['offers'] }): string {
  const offers = entry.offers ?? [];
  if (offers.length === 0) return 'one-time purchase';
  const billings = new Set(offers.map((offer) => offer.billing));
  return billings.has('recurring') ? 'subscriptions available' : 'one-time purchase';
}

export function renderSellPage(model: SellPageModel): string {
  const available = model.entries.filter((entry) => entry.status === 'available');
  const blocked = model.entries.filter((entry) => entry.status !== 'available');

  const cards = available
    .map((entry) => {
      const rows = (entry.offers ?? [])
        .filter((offer) => offer.paymentLink !== undefined)
        .map((offer) => {
          // SAFETY: available offers always carry a verified payment link.
          const link = escapeHtml(offer.paymentLink ?? '#');
          const cadence =
            offer.billing === 'recurring'
              ? `per-${offer.interval ?? 'month'}`
              : 'one-time';
          const seats = offer.seats !== undefined ? ` &middot; ${offer.seats} seats` : '';
          return `<div class="offer"><div><span class="offer-name">${escapeHtml(offer.name)}</span><div class="meta">${cadence}${seats}</div></div><div style="text-align:right"><span class="price">${escapeHtml(money(offer.price, offer.currency))}</span> <a class="buy" href="${link}" rel="nofollow">Buy</a></div></div>`;
        })
        .join('\n  ');
      return `<div class="card release">
  <div class="ver">Release ${escapeHtml(entry.version)}</div>
  <div class="offers">
  ${rows.length > 0 ? rows : `<div class="meta">no verified payment links</div>`}
  </div>
  <div class="meta">${escapeHtml(offerLabel(entry))} &middot; instant fork delivery</div>
</div>`;
    })
    .join('\n');

  const blockedCards = blocked
    .map(
      (entry) => `<div class="card">
  <div><div class="ver">Release ${escapeHtml(entry.version)}</div><div class="meta">not currently purchasable</div></div>
  <span class="pill bad">blocked</span>
</div>`,
    )
    .join('\n');

  const body = `<span class="badge">Direct sale</span>
<h1>${escapeHtml(model.productName)}</h1>
<p class="desc">${escapeHtml(model.description || 'Buy directly from the source repository.')}</p>
<div class="card" id="gh-section" style="flex-direction:column;align-items:stretch;gap:.8rem;margin-bottom:1.2rem;">
  <div class="ver">GitHub</div>
  <div id="gh-content">
    <p class="meta">Connect your GitHub account to buy and fork this repository.</p>
    <button class="buy" id="gh-connect-btn" style="margin-top:.5rem">Connect GitHub</button>
  </div>
  <div id="gh-status" style="font-size:.85rem;color:var(--muted);display:none"></div>
  <div id="gh-actions" style="display:none"></div>
</div>
<div class="grid" id="sell-grid">
${cards.length > 0 ? cards : '<p class="empty">No releases are currently available for purchase.</p>'}
${blockedCards}
</div>`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: model.productName,
    description: model.description,
    offers: available.flatMap((entry) =>
      (entry.offers ?? [])
        .filter((offer) => offer.paymentLink !== undefined)
        .map((offer) => ({
          '@type': 'Offer',
          name: `${offer.name} — Release ${entry.version}`,
          price: offer.price.toFixed(2),
          priceCurrency: offer.currency,
          availability: 'https://schema.org/InStock',
          url: offer.paymentLink,
        })),
      ),
  };

  // Full flow script: GitHub login first → Buy buttons enabled → Payment → Fork
  // Same pattern as listing detail page.
  const forkScript = `
<script>
(function(){
  var GITHUB_CLIENT_ID='Iv23lidhennqrdpdFUAT';
  var CORS_PROXY='https://corsproxy.io/?url=';
  var GH_TOKEN_KEY='rs-sell-gh-token';
  var GH_USER_KEY='rs-sell-gh-user';
  var params=new URLSearchParams(location.search);
  var sid=params.get('session_id');

  var dataEl=document.getElementById('reposell-data');
  var repoSlug='';
  if(dataEl){try{var d=JSON.parse(dataEl.textContent);repoSlug=d.repository||''}catch(e){}}
  var parts=repoSlug.split('/');
  var owner=parts[0]||'';var repo=parts[1]||'';

  var ghContent=document.getElementById('gh-content');
  var ghStatus=document.getElementById('gh-status');
  var ghActions=document.getElementById('gh-actions');
  var sellGrid=document.getElementById('sell-grid');
  var token=sessionStorage.getItem(GH_TOKEN_KEY);
  var ghUser=sessionStorage.getItem(GH_USER_KEY);
  var pollTimer=null;

  function disableBuyButtons(){
    var btns=sellGrid.querySelectorAll('a.buy');
    for(var i=0;i<btns.length;i++){btns[i].classList.add('off');btns[i].setAttribute('aria-disabled','true')}
  }
  function enableBuyButtons(){
    var btns=sellGrid.querySelectorAll('a.buy');
    for(var i=0;i<btns.length;i++){btns[i].classList.remove('off');btns[i].removeAttribute('aria-disabled')}
  }
  disableBuyButtons();

  function proxyFetch(url,options){
    return fetch(CORS_PROXY+encodeURIComponent(url),options)
  }

  function showConnected(login){
    ghContent.innerHTML='';
    ghStatus.style.display='';
    ghStatus.innerHTML='\u2713 Connected as <strong>'+login+'</strong>';
    ghActions.style.display='';
    ghActions.innerHTML='<button id="gh-disconnect" style="background:none;border:1px solid var(--line);color:var(--muted);border-radius:8px;padding:.3rem .8rem;font-size:.8rem;cursor:pointer">Disconnect</button>';
    document.getElementById('gh-disconnect').onclick=function(){
      sessionStorage.removeItem(GH_TOKEN_KEY);
      sessionStorage.removeItem(GH_USER_KEY);
      token=null;ghUser=null;
      disableBuyButtons();
      resetToIdle();
    };
    enableBuyButtons();
  }

  function resetToIdle(){
    ghStatus.style.display='none';
    ghActions.style.display='none';
    ghContent.innerHTML='<p class="meta">Connect your GitHub account to buy and fork this repository.</p><button class="buy" id="gh-connect-btn" style="margin-top:.5rem">Connect GitHub</button>';
    document.getElementById('gh-connect-btn').onclick=connectGithub;
  }

  function connectGithub(){
    ghContent.innerHTML='';
    ghStatus.style.display='';
    ghStatus.innerHTML='Connecting to GitHub...';
    ghActions.style.display='';
    ghActions.innerHTML='';

    proxyFetch('https://github.com/login/device/code',{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify({client_id:GITHUB_CLIENT_ID,scope:'repo'})})
    .then(function(r){
      if(!r.ok)throw new Error('GitHub returned HTTP '+r.status);
      return r.json();
    }).then(function(data){
      if(data.error){ghStatus.innerHTML='<span style="color:var(--bad)">Error: '+(data.error_description||data.error)+'</span>';ghActions.innerHTML='<button id="gh-retry" style="background:none;border:1px solid var(--line);color:var(--muted);border-radius:8px;padding:.3rem .8rem;font-size:.8rem;cursor:pointer;margin-top:.5rem">Try again</button>';document.getElementById('gh-retry').onclick=connectGithub;return}
      window.open(data.verification_uri,'_blank','noopener');
      ghStatus.innerHTML='Enter code: <strong style="font-size:1.15rem;letter-spacing:.1em">'+data.user_code+'</strong>';
      ghActions.innerHTML='<div class="meta">at <a href="'+data.verification_uri+'" target="_blank" rel="noopener">'+data.verification_uri+'</a></div>';
      pollForToken(data.device_code,data.interval||5,data.expires_in||900);
    }).catch(function(e){ghStatus.innerHTML='<span style="color:var(--bad)">Could not reach GitHub: '+(e.message||'check your connection')+'</span>';ghActions.innerHTML='<button id="gh-retry" style="background:none;border:1px solid var(--line);color:var(--muted);border-radius:8px;padding:.3rem .8rem;font-size:.8rem;cursor:pointer;margin-top:.5rem">Try again</button>';document.getElementById('gh-retry').onclick=connectGithub});
  }

  function pollForToken(code,intervalMs,deadline){
    if(Date.now()>=deadline){ghStatus.innerHTML='Device code expired — ';resetToIdle();return}
    pollTimer=setTimeout(function(){
      proxyFetch('https://github.com/login/oauth/access_token',{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify({client_id:GITHUB_CLIENT_ID,device_code:code,grant_type:'urn:ietf:params:oauth:grant-type:device_code'})})
      .then(function(r){return r.json()}).then(function(data){
        if(data.access_token){
          token=data.access_token;
          sessionStorage.setItem(GH_TOKEN_KEY,token);
          fetch('https://api.github.com/user',{headers:{Authorization:'Bearer '+token}})
          .then(function(r){return r.json()}).then(function(u){
            ghUser=JSON.stringify({login:u.login,id:u.id});
            sessionStorage.setItem(GH_USER_KEY,ghUser);
            showConnected(u.login);
            if(sid)forkRepo();
          });
          return;
        }
        if(data.error==='authorization_pending'){pollForToken(code,intervalMs,deadline);return}
        if(data.error==='slow_down'){pollForToken(code,intervalMs+5000,deadline);return}
        ghStatus.innerHTML='Authorization failed: '+(data.error_description||data.error);
        resetToIdle();
      }).catch(function(){pollForToken(code,intervalMs,deadline)});
    },intervalMs);
  }

  function forkRepo(){
    if(!token||!owner||!repo)return;
    var forkDiv=document.createElement('div');
    forkDiv.className='card fork-section';
    forkDiv.style.cssText='flex-direction:column;align-items:stretch;gap:1rem;border:2px solid var(--ok);';
    forkDiv.innerHTML='<div class="ver" style="color:var(--ok)">&#10003; Payment confirmed</div>'+
      '<div id="fork-status" style="font-size:.85rem;color:var(--muted)">Forking <strong>'+owner+'/'+repo+'</strong> to your GitHub...</div>'+
      '<div id="fork-actions"></div>';
    sellGrid.appendChild(forkDiv);
    var forkStatus=document.getElementById('fork-status');
    var forkActions=document.getElementById('fork-actions');

    fetch('https://api.github.com/repos/'+owner+'/'+repo+'/forks',{method:'POST',headers:{Authorization:'Bearer '+token,'Accept':'application/vnd.github+json'}})
    .then(function(r){
      if(!r.ok)return r.json().then(function(b){throw new Error(b.message||'Fork failed: HTTP '+r.status)});
      return r.json();
    })
    .then(function(fork){
      forkStatus.innerHTML='<span style="color:var(--ok)">&#10003; Fork created!</span>';
      forkActions.innerHTML='<a href="'+fork.html_url+'" target="_blank" rel="noopener" class="buy">Open forked repository &#8599;</a>'+
        '<div class="meta" style="margin-top:.5rem">'+fork.full_name+'</div>';
    })
    .catch(function(e){
      forkStatus.innerHTML='<span style="color:var(--bad)">Fork failed: '+e.message+'</span>';
      forkActions.innerHTML='<button class="buy" id="retry-fork">Try again</button>';
      document.getElementById('retry-fork').onclick=forkRepo;
    });
  }

  // INIT: check stored token or show button
  if(token&&ghUser){
    try{showConnected(JSON.parse(ghUser).login);if(sid)forkRepo()}catch(e){resetToIdle()}
  }else{
    document.getElementById('gh-connect-btn').onclick=connectGithub;
    if(sid)connectGithub();
  }
})();
</script>`;

  return renderPage({
    title: `${model.productName} — Buy`,
    description: model.description,
    body: body + forkScript,
    jsonLd,
    embeddedJson: {
      schema: 'reposell/sell-page/v1',
      repository: model.repositorySlug,
      releases: model.entries,
      ...(model.listingContribution !== undefined ? { listing: { contribution: model.listingContribution } } : {}),
    },
  });
}

export interface LandingPageModel {
  productName: string;
  description: string;
  owner: string;
  repo: string;
  releaseCount: number;
  sellEnabled: boolean;
  marketplaceEnabled: boolean;
}

export function renderLandingPage(model: LandingPageModel): string {
  const rows = [
    ['Repository', `${model.owner}/${model.repo}`],
    ['Published releases', String(model.releaseCount)],
    ['Direct sale', model.sellEnabled ? 'enabled' : 'disabled'],
    ['Marketplace listing', model.marketplaceEnabled ? 'enabled' : 'disabled'],
  ]
    .map(
      ([label, value]) =>
        `<tr><td style="padding:.5rem 1rem .5rem 0;color:var(--muted)">${escapeHtml(String(label))}</td><td>${escapeHtml(String(value))}</td></tr>`,
    )
    .join('\n');

  const body = `<span class="badge">RepoSell</span>
<h1>${escapeHtml(model.productName)}</h1>
<p class="desc">${escapeHtml(model.description)}</p>
<table class="card" style="margin-top:2.2rem;display:table;width:100%">
<tbody>
${rows}
</tbody>
</table>
<div class="grid">
${model.sellEnabled ? '<div class="card"><div><div class="ver">Buy a release</div><div class="meta">verified Stripe Payment Links, per-release pricing</div></div><a class="buy" href="./sell/">Open store</a></div>' : ''}
<div class="card"><div><div class="ver">Marketplace listing</div><div class="meta">discovery metadata for marketplaces and agents</div></div><a class="buy off" href="./marketplace/">View</a></div>
</div>`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: model.productName,
    description: model.description,
    applicationCategory: 'developerApplication',
    operatingSystem: 'source distribution',
  };

  return renderPage({
    title: `${model.productName} — RepoSell`,
    description: model.description,
    body,
    jsonLd,
    embeddedJson: {
      schema: 'reposell/landing/v1',
      repository: `${model.owner}/${model.repo}`,
      sell: model.sellEnabled,
      marketplace: model.marketplaceEnabled,
    },
  });
}

export interface MarketplacePageModel {
  repositorySlug: string;
  enabled: boolean;
  listingUrl: string | null;
}

export function renderMarketplacePage(model: MarketplacePageModel): string {
  const stateLine = model.enabled
    ? 'This repository is discoverable through the RepoSell marketplace network.'
    : 'Marketplace integration is disabled for this repository.';
  const body = `<span class="badge">Listing</span>
<h1>Marketplace</h1>
<p class="desc">${escapeHtml(stateLine)} The repository remains authoritative for product, releases, pricing, licenses, integrity and health (spec §18).</p>
<div class="grid">
<div class="card"><div><div class="ver">${escapeHtml(model.repositorySlug)}</div><div class="meta">${model.enabled ? 'listed' : 'not listed'}</div></div><span class="pill ${model.enabled ? 'ok' : 'bad'}">${model.enabled ? 'listed' : 'off'}</span></div>
</div>`;

  return renderPage({
    title: `${model.repositorySlug} — Marketplace`,
    description: stateLine,
    body,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: `${model.repositorySlug} marketplace listing`,
    },
    embeddedJson: {
      schema: 'reposell/marketplace/v1',
      enabled: model.enabled,
      repository: model.repositorySlug,
      listing: model.listingUrl === null ? null : { url: model.listingUrl, provider: 'reposell' },
    },
  });
}
