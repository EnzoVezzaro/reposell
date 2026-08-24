import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'reposell CLI',
  description: 'Don\'t let AI consume your repo for free. Earn for the tools you build for the Opensource',
  lang: 'en-US',
  base: '/docs/',
  head: [
    
    ['link', { rel: 'icon', type: 'image/png', href: '/branding/icon.png' }],
    ['link', { rel: 'apple-touch-icon', href: '/branding/icon.png' }],
    ['meta', { name: 'theme-color', content: '#0af188' }],
    ['meta', { property: 'og:image', content: '/branding/logo.png' }],
    ['link', { rel: 'preload', as: 'style', href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600&family=Space+Grotesk:wght@400;500;600;700&family=Fira+Code:wght@400;500&family=Baloo+2:wght@500;600;700;800&family=Space+Mono:wght@400;700&display=swap' }],
    ['link', { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600&family=Space+Grotesk:wght@400;500;600;700&family=Fira+Code:wght@400;500&family=Baloo+2:wght@500;600;700;800&family=Space+Mono:wght@400;700&display=swap' }],
    ['meta', { name: 'description', content: 'Don\'t let AI consume your repo for free. Earn for the tools you build for the Opensource' }],
    // pre-paint: pin home to dark + arm anime.js boot-hide before first frame
    ['script', {}, `(function(){try{var p=location.pathname,b='/docs/',h=p===b||p===b+'index.html'||p==='/'||p==='/index.html';if(!h)return;var d=document.documentElement;d.classList.add('rs-home','dark');if(!(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches))d.classList.add('lx-boot')}catch(e){}})()`],
  ],
  themeConfig: {
    siteTitle: false,
    description: 'Don\'t let AI consume your repo for free. Earn for the tools you build for the Opensource',
    nav: [
      {
        text: 'Guide',
        items: [
          { text: 'What is reposell?', link: '/guide/' },
          { text: 'Quick Start', link: '/guide/quick-start' },
          { text: 'Core Concepts', link: '/guide/core-concepts' },
          { text: 'Installation', link: '/guide/installation' },
          { text: 'Init a Repository', link: '/guide/init' },
          { text: 'Payment Setup', link: '/guide/payment-setup' },
          { text: 'Listing Setup', link: '/guide/listing-setup' },
          { text: 'Licensing Policy & Audit', link: '/guide/licensing-policy' },
          { text: 'Reciprocity Program', link: '/guide/reciprocity' },
        ],
      },
      {
        text: 'Docs',
        items: [
          { text: 'Overview', link: '/commands/' },
          { text: 'Configuration', link: '/configuration/' },
          { text: 'Schema Reference', link: '/configuration/schema' },
          { text: 'Environment Variables', link: '/configuration/env' },
          { text: 'Zero-Config', link: '/guide/zero-config' },
        ],
      },
      {
        text: 'Protocol',
        items: [
          { text: 'Overview', link: '/protocol/' },
          { text: 'Endpoint Architecture', link: '/protocol/endpoints' },
          { text: 'Manifest Schema', link: '/protocol/manifest-schema' },
          { text: 'Sell Endpoint', link: '/protocol/sell-endpoint' },
          { text: 'Listing Endpoint', link: '/protocol/listing-endpoint' },
          { text: 'Release Model', link: '/protocol/release-model' },
          { text: 'Signatures', link: '/protocol/signatures' },
          { text: 'The Listing Network', link: '/protocol/listing-network' },
        ],
      },
      {
        text: 'Resources',
        items: [
          { text: 'Security Model', link: '/security/' },
          { text: 'Cryptographic Security', link: '/security/crypto' },
          { text: 'Payment Security', link: '/security/payment' },
          { text: 'Licensing', link: '/licensing/' },
          { text: 'Development Setup', link: '/development/setup' },
          { text: 'Adding Commands', link: '/development/adding-commands' },
          { text: 'Testing', link: '/development/testing' },
        ],
      },
      { text: 'Why', link: '/why/' },
    ],
    sidebar: {
      '/guide/': [
        {
          text: 'Introduction',
          items: [
            { text: 'What is reposell?', link: '/guide/' },
            { text: 'Quick Start', link: '/guide/quick-start' },
            { text: 'Core Concepts', link: '/guide/core-concepts' },
            { text: 'Zero-Config Principle', link: '/guide/zero-config' },
          ],
        },
        {
          text: 'Getting Started',
          items: [
            { text: 'Installation', link: '/guide/installation' },
            { text: 'Initialize Repository', link: '/guide/init' },
            { text: 'Payment Setup', link: '/guide/payment-setup' },
            { text: 'Payments & Keys', link: '/guide/payments/' },
            { text: 'Listing Setup', link: '/guide/listing-setup' },
            { text: 'Licensing Policy & Audit', link: '/guide/licensing-policy' },
            { text: 'Reciprocity Program', link: '/guide/reciprocity' },
          ],
        },
        {
          text: 'Architecture',
          items: [
            { text: 'Clean Architecture', link: '/guide/architecture' },
            { text: 'Payment Abstraction', link: '/guide/payment-abstraction' },
            { text: 'Git Abstraction', link: '/guide/git-abstraction' },
            { text: 'Cryptographic Identity', link: '/guide/crypto-identity' },
          ],
        },
      ],
      '/commands/': [
        {
          text: 'Command Reference',
          items: [
            { text: 'Overview', link: '/commands/' },
            { text: 'reposell init', link: '/commands/init' },
            { text: 'reposell configure', link: '/commands/configure' },
            { text: 'reposell sell', link: '/commands/sell' },
            { text: 'reposell listing', link: '/commands/listing' },
            { text: 'reposell listing status', link: '/commands/listing-status' },
            { text: 'reposell license', link: '/commands/license' },
            { text: 'reposell release', link: '/commands/release' },
            { text: 'reposell verify', link: '/commands/verify' },
            { text: 'reposell doctor', link: '/commands/doctor' },
          ],
        },
      ],
      '/configuration/': [
        {
          text: 'Configuration',
          items: [
            { text: 'reposell.yml', link: '/configuration/' },
            { text: 'Schema Reference', link: '/configuration/schema' },
            { text: 'Environment Variables', link: '/configuration/env' },
            { text: 'Zero-Config Derivation', link: '/configuration/zero-config' },
          ],
        },
      ],
      '/protocol/': [
        {
          text: 'Protocol Specification',
          items: [
            { text: 'Overview', link: '/protocol/' },
            { text: 'Endpoint Architecture', link: '/protocol/endpoints' },
            { text: 'Manifest Schema', link: '/protocol/manifest-schema' },
            { text: '/sell Endpoint', link: '/protocol/sell-endpoint' },
            { text: 'Listing & Marketplace Endpoints', link: '/protocol/listing-endpoint' },
            { text: 'Release Model', link: '/protocol/release-model' },
            { text: 'Signatures', link: '/protocol/signatures' },
            { text: 'The Listing Network', link: '/protocol/listing-network' },
            { text: 'Listing Registry (PR flow)', link: '/protocol/listing-registry' },
            { text: 'Gamification', link: '/protocol/gamification' },
            { text: 'Contributions & Payment Links', link: '/protocol/contributions' },
          ],
        },
      ],
      '/licensing/': [
        {
          text: 'Licensing',
          items: [
            { text: 'License Checks & Templates', link: '/licensing/' },
          ],
        },
      ],
      '/development/': [
        {
          text: 'Development',
          items: [
            { text: 'Setup', link: '/development/setup' },
            { text: 'Commands', link: '/development/commands' },
            { text: 'Testing', link: '/development/testing' },
            { text: 'Testing the CI Flow', link: '/development/testing-ci' },
            { text: 'Adding Commands', link: '/development/adding-commands' },
            { text: 'Adding Payment Providers', link: '/development/adding-payment-providers' },
            { text: 'Adding Git Providers', link: '/development/adding-git-providers' },
          ],
        },
      ],
      '/security/': [
        {
          text: 'Security',
          items: [
            { text: 'Overview', link: '/security/' },
            { text: 'Cryptographic Security', link: '/security/crypto' },
            { text: 'Payment Security', link: '/security/payment' },
            { text: 'Git Provider Security', link: '/security/git-provider' },
            { text: 'Secret Management', link: '/security/secrets' },
            { text: 'Dependency Security', link: '/security/dependencies' },
            { text: 'Incident Response', link: '/security/incident-response' },
          ],
        },
      ],
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/EnzoVezzaro/reposell' },
    ],
    footer: {
      message: 'Made with ☕ and 🎧 by a solo developer from the Dominican Republic.',
      copyright: '© 2026 Enzo Vezzaro · MIT License',
    },
    search: {
      provider: 'local',
    },
    editLink: {
      pattern: 'https://github.com/EnzoVezzaro/reposell/edit/main/docs/docs/:path',
      text: 'Edit this page on GitHub',
    },
  },
  markdown: {
    theme: 'github-dark',
    lineNumbers: true,
  },
  vite: {
    resolve: {
      alias: {
        '@reposell/design-system': '../../../../branding',
      },
    },
  },
})