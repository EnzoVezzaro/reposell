# reposell — codebase filetree

Generated snapshot: 2026-09-29 (regenerate after structural changes).

Directory markers: 📄 = AGENTS.md contract · 🧠 = .acc-memory.md (functionality memory).
Excluded: node_modules, dist, build, cache, coverage, .git, .freebuff.

```
reposell/  📄🧠
├── .acc/
│   ├── config/
│   │   ├── agents/
│   │   │   ├── architect.md
│   │   │   ├── orchestrator.md
│   │   │   ├── product-reviewer.md
│   │   │   └── ui-reviewer.md
│   │   ├── mcp/
│   │   │   ├── github.yaml
│   │   │   ├── README.md
│   │   │   └── stripe.yaml
│   │   ├── multi-agent/
│   │   │   ├── config.yaml
│   │   │   └── README.md
│   │   ├── skills/
│   │   │   ├── acc-skill.md
│   │   │   ├── anti-slop.md
│   │   │   └── impeccable.md
│   │   ├── standards/
│   │   │   ├── architecture.md
│   │   │   └── testing.md
│   │   ├── templates/  📄
│   │   │   └── agents.md
│   │   ├── tools/
│   │   │   └── README.md
│   │   ├── workflows/
│   │   │   ├── feature.md
│   │   │   ├── release.md
│   │   │   ├── security.md
│   │   │   ├── testing.md
│   │   │   └── verify.md
│   │   └── config.yaml
│   └── state/
│       └── engine.json
├── .agents/
│   └── skills/
│       ├── acc/
│       │   ├── agents/
│       │   │   ├── acc-checker.md
│       │   │   ├── acc-documenter.md
│       │   │   ├── acc-explorer.md
│       │   │   ├── acc-filler.md
│       │   │   ├── acc-initializer.md
│       │   │   ├── acc-reviewer.md
│       │   │   └── acc-supervisor.md
│       │   ├── references/
│       │   │   ├── ai.md
│       │   │   ├── battle.md
│       │   │   ├── build.md
│       │   │   ├── check.md
│       │   │   ├── context.md
│       │   │   ├── discover.md
│       │   │   ├── document.md
│       │   │   ├── engine-limits.md
│       │   │   ├── engine.md
│       │   │   ├── fill.md
│       │   │   ├── graph.md
│       │   │   ├── impact.md
│       │   │   ├── init.md
│       │   │   ├── inspect.md
│       │   │   ├── install.md
│       │   │   ├── memory.md
│       │   │   ├── over-feeding.md
│       │   │   ├── relations.md
│       │   │   ├── review.md
│       │   │   ├── search.md
│       │   │   ├── slice.md
│       │   │   └── tools.md
│       │   ├── README.md
│       │   └── SKILL.md
│       ├── impeccable/
│       │   ├── agents/
│       │   │   ├── impeccable_asset_producer.toml
│       │   │   ├── impeccable_documenter.toml
│       │   │   ├── impeccable_finish_reviewer.toml
│       │   │   ├── impeccable_manual_edit_applier.toml
│       │   │   └── openai.yaml
│       │   ├── reference/
│       │   │   ├── degraded/
│       │   │   │   ├── asset-producer.md
│       │   │   │   ├── documenter.md
│       │   │   │   ├── finish-reviewer.md
│       │   │   │   └── manual-edit-applier.md
│       │   │   ├── adapt.md
│       │   │   ├── adapt.native.md
│       │   │   ├── android.md
│       │   │   ├── animate.md
│       │   │   ├── audit.md
│       │   │   ├── audit.native.md
│       │   │   ├── bolder.md
│       │   │   ├── clarify.md
│       │   │   ├── colorize.md
│       │   │   ├── craft-floor.md
│       │   │   ├── craft.md
│       │   │   ├── critique.md
│       │   │   ├── delight.md
│       │   │   ├── distill.md
│       │   │   ├── doctor.md
│       │   │   ├── document.md
│       │   │   ├── extract.md
│       │   │   ├── harden.md
│       │   │   ├── hooks.md
│       │   │   ├── init.md
│       │   │   ├── ios.md
│       │   │   ├── layout.md
│       │   │   ├── live-setup.md
│       │   │   ├── live.md
│       │   │   ├── new-work.md
│       │   │   ├── onboard.md
│       │   │   ├── operate.md
│       │   │   ├── optimize.md
│       │   │   ├── overdrive.md
│       │   │   ├── polish.md
│       │   │   ├── quieter.md
│       │   │   ├── routing.md
│       │   │   ├── shape.md
│       │   │   ├── typeset.md
│       │   │   └── visualize.md
│       │   ├── scripts/
│       │   │   ├── detector/
│       │   │   │   ├── browser/
│       │   │   │   │   └── injected/
│       │   │   │   │       └── index.mjs
│       │   │   │   ├── cli/
│       │   │   │   │   └── main.mjs
│       │   │   │   ├── engines/
│       │   │   │   │   ├── browser/
│       │   │   │   │   │   └── detect-url.mjs
│       │   │   │   │   ├── regex/
│       │   │   │   │   │   └── detect-text.mjs
│       │   │   │   │   ├── static-html/
│       │   │   │   │   │   ├── css-cascade.mjs
│       │   │   │   │   │   └── detect-html.mjs
│       │   │   │   │   └── visual/
│       │   │   │   │       └── screenshot-contrast.mjs
│       │   │   │   ├── node/
│       │   │   │   │   └── file-system.mjs
│       │   │   │   ├── profile/
│       │   │   │   │   └── profiler.mjs
│       │   │   │   ├── registry/
│       │   │   │   │   └── antipatterns.mjs
│       │   │   │   ├── rules/
│       │   │   │   │   └── checks.mjs
│       │   │   │   ├── shared/
│       │   │   │   │   ├── color.mjs
│       │   │   │   │   ├── constants.mjs
│       │   │   │   │   ├── fonts.mjs
│       │   │   │   │   ├── inline-ignores.mjs
│       │   │   │   │   └── page.mjs
│       │   │   │   ├── design-system.mjs
│       │   │   │   ├── detect-antipatterns-browser.js
│       │   │   │   ├── detect-antipatterns.mjs
│       │   │   │   └── findings.mjs
│       │   │   ├── lib/
│       │   │   │   ├── artifact-schema.mjs
│       │   │   │   ├── composition-catalog.mjs
│       │   │   │   ├── concept-catalog.mjs
│       │   │   │   ├── design-parser.mjs
│       │   │   │   ├── impeccable-config.mjs
│       │   │   │   ├── impeccable-paths.mjs
│       │   │   │   ├── is-generated.mjs
│       │   │   │   ├── open-system-browser.mjs
│       │   │   │   ├── provider.mjs
│       │   │   │   ├── roll-selection.mjs
│       │   │   │   ├── staleness-deep.mjs
│       │   │   │   ├── staleness-notice.mjs
│       │   │   │   ├── staleness.mjs
│       │   │   │   ├── surface-briefs.mjs
│       │   │   │   ├── target-args.mjs
│       │   │   │   ├── target-slug.mjs
│       │   │   │   └── template-extensions.mjs
│       │   │   ├── live/
│       │   │   │   ├── frameworks/
│       │   │   │   │   ├── astro.mjs
│       │   │   │   │   ├── detect-utils.mjs
│       │   │   │   │   ├── index.mjs
│       │   │   │   │   ├── journal.mjs
│       │   │   │   │   ├── nextjs.mjs
│       │   │   │   │   ├── nuxt.mjs
│       │   │   │   │   ├── script-src.mjs
│       │   │   │   │   ├── static-html.mjs
│       │   │   │   │   ├── sveltekit.mjs
│       │   │   │   │   ├── tag-strategy.mjs
│       │   │   │   │   ├── tanstack-start.mjs
│       │   │   │   │   └── vite-generic.mjs
│       │   │   │   ├── accept-css.mjs
│       │   │   │   ├── accept-verify.mjs
│       │   │   │   ├── browser-script-parts.mjs
│       │   │   │   ├── completion.mjs
│       │   │   │   ├── event-validation.mjs
│       │   │   │   ├── generation-preflight.mjs
│       │   │   │   ├── insert-ui.mjs
│       │   │   │   ├── instructions.mjs
│       │   │   │   ├── manual-apply.mjs
│       │   │   │   ├── manual-edit-routes.mjs
│       │   │   │   ├── manual-edits-buffer.mjs
│       │   │   │   ├── poll-lanes.mjs
│       │   │   │   ├── roots.mjs
│       │   │   │   ├── session-store.mjs
│       │   │   │   ├── source-lock.mjs
│       │   │   │   ├── source-search.mjs
│       │   │   │   ├── svelte-ast.mjs
│       │   │   │   ├── svelte-component.mjs
│       │   │   │   ├── sveltekit-adapter.mjs
│       │   │   │   ├── tanstack-adapter.mjs
│       │   │   │   ├── ui-surfaces.mjs
│       │   │   │   └── vocabulary.mjs
│       │   │   ├── command-metadata.json
│       │   │   ├── concept-seed.mjs
│       │   │   ├── context-signals.mjs
│       │   │   ├── context.mjs
│       │   │   ├── critique-storage.mjs
│       │   │   ├── detect-csp.mjs
│       │   │   ├── detect.mjs
│       │   │   ├── doctor.mjs
│       │   │   ├── embed-prompt.mjs
│       │   │   ├── generate-image.mjs
│       │   │   ├── hook-admin.mjs
│       │   │   ├── hook-before-edit.mjs
│       │   │   ├── hook-lib.mjs
│       │   │   ├── hook.mjs
│       │   │   ├── live-accept.mjs
│       │   │   ├── live-browser-dom.js
│       │   │   ├── live-browser-session.js
│       │   │   ├── live-browser.js
│       │   │   ├── live-commit-manual-edits.mjs
│       │   │   ├── live-complete.mjs
│       │   │   ├── live-copy-edit-agent.mjs
│       │   │   ├── live-discard-manual-edits.mjs
│       │   │   ├── live-inject.mjs
│       │   │   ├── live-insert.mjs
│       │   │   ├── live-manual-edit-evidence.mjs
│       │   │   ├── live-poll.mjs
│       │   │   ├── live-resume.mjs
│       │   │   ├── live-server.mjs
│       │   │   ├── live-status.mjs
│       │   │   ├── live-target.mjs
│       │   │   ├── live-wrap.mjs
│       │   │   ├── live.mjs
│       │   │   ├── modern-screenshot.umd.js
│       │   │   ├── palette.mjs
│       │   │   ├── pin.mjs
│       │   │   ├── serve-question.mjs
│       │   │   └── surface-brief.mjs
│       │   └── SKILL.md
│       └── install-anti-slop/
│           ├── assets/
│           │   └── anti-slop/
│           │       ├── effect/
│           │       │   ├── rules/
│           │       │   │   └── no-service-constructor-imports.ts
│           │       │   └── index.ts
│           │       ├── rules/
│           │       │   ├── no-chained-type-assertions.ts
│           │       │   ├── no-conditional-empty-object-spread.ts
│           │       │   ├── no-known-value-widening.ts
│           │       │   ├── no-module-mocking.ts
│           │       │   ├── no-object-parameters.ts
│           │       │   ├── no-reflect-apply.ts
│           │       │   ├── no-reflect-get.ts
│           │       │   ├── no-runtime-typeof.ts
│           │       │   ├── no-shape-in-symbol-names.ts
│           │       │   ├── no-unknown-parameters.ts
│           │       │   ├── no-unknown-returns.ts
│           │       │   ├── no-unknown-type-aliases.ts
│           │       │   ├── no-unsafe-dictionary-type.ts
│           │       │   ├── no-widen-then-assert.ts
│           │       │   └── require-safety-comment-for-type-assertion.ts
│           │       ├── shared/
│           │       │   ├── dictionary-types.ts
│           │       │   ├── lexical-type-parameters.ts
│           │       │   └── reflect-method.ts
│           │       └── index.ts
│           ├── scripts/
│           │   └── install.mjs
│           └── SKILL.md
├── .claude/
│   └── skills/
│       ├── acc
│       ├── impeccable
│       └── install-anti-slop
├── .github/  📄🧠
│   ├── workflows/  📄🧠
│   │   ├── .acc-memory.md
│   │   ├── AGENTS.md
│   │   ├── deploy.yml
│   │   └── publish.yml
│   ├── .acc-memory.md
│   ├── AGENTS.md
│   ├── FUNDING.yml
│   ├── pr_allow_providers.yml
│   └── pr.yml.example
├── .opencode/
│   ├── agents/
│   │   ├── architect.md
│   │   ├── orchestrator.md
│   │   ├── product-reviewer.md
│   │   └── ui-reviewer.md
│   ├── .gitignore
│   ├── package-lock.json
│   └── package.json
├── branding/  📄🧠
│   ├── assets/  📄🧠
│   │   ├── .acc-memory.md
│   │   ├── AGENTS.md
│   │   ├── full.png
│   │   ├── icon.png
│   │   ├── logo.png
│   │   ├── reposell-icon.svg
│   │   ├── reposell-mark-glyph.svg
│   │   └── reposell-mark.svg
│   ├── canvasui/  📄🧠
│   │   ├── .acc-memory.md
│   │   ├── AGENTS.md
│   │   ├── DecryptRevealVanilla.ts
│   │   ├── LICENSE-NOTE.md
│   │   ├── LiquidVanilla.ts
│   │   └── rect-cache.ts
│   ├── components/  📄🧠
│   │   ├── ui/  📄🧠
│   │   │   ├── .acc-memory.md
│   │   │   ├── AGENTS.md
│   │   │   ├── badge.tsx
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── index.ts
│   │   │   ├── input.tsx
│   │   │   ├── label.tsx
│   │   │   └── textarea.tsx
│   │   ├── .acc-memory.md
│   │   ├── AGENTS.md
│   │   └── index.ts
│   ├── theme/  📄🧠
│   │   ├── components/  📄🧠
│   │   │   ├── .acc-memory.md
│   │   │   ├── AGENTS.md
│   │   │   ├── CanvasDecrypt.vue
│   │   │   ├── CanvasLiquid.vue
│   │   │   ├── VPAlert.vue
│   │   │   ├── VPBadge.vue
│   │   │   ├── VPButton.vue
│   │   │   ├── VPCalculator.vue
│   │   │   ├── VPCard.vue
│   │   │   ├── VPCodeGroup.vue
│   │   │   ├── VPFeatures.vue
│   │   │   ├── VPFooter.vue
│   │   │   ├── VPHomeHero.vue
│   │   │   ├── VPNavBar.vue
│   │   │   ├── VPSidebar.vue
│   │   │   ├── VPSoundToggle.vue
│   │   │   ├── VPTabs.vue
│   │   │   ├── VPTerminal.vue
│   │   │   └── VPWaveform.vue
│   │   ├── styles/  📄🧠
│   │   │   ├── .acc-memory.md
│   │   │   ├── AGENTS.md
│   │   │   ├── custom.css
│   │   │   ├── variables-soundcn.css
│   │   │   └── variables.css
│   │   ├── .acc-memory.md
│   │   ├── AGENTS.md
│   │   └── index.ts
│   ├── tokens/  📄🧠
│   │   ├── .acc-memory.md
│   │   ├── AGENTS.md
│   │   ├── brand.json
│   │   ├── global.css
│   │   ├── index.ts
│   │   ├── soundcn.css
│   │   ├── tailwind.config.js
│   │   └── utils.ts
│   ├── .acc-memory.md
│   ├── AGENTS.md
│   ├── components.json
│   ├── DESIGN.md
│   ├── package.json
│   └── PRODUCT.md
├── docs/  📄🧠
│   ├── .vitepress/  📄🧠
│   │   ├── theme/  📄🧠
│   │   │   ├── components/  📄🧠
│   │   │   │   ├── .acc-memory.md
│   │   │   │   ├── AGENTS.md
│   │   │   │   ├── FaultyTerminal.js
│   │   │   │   ├── FaultyTerminal.vue
│   │   │   │   ├── FooterWordmark.vue
│   │   │   │   ├── HeroBackground.vue
│   │   │   │   ├── HomeAudit.vue
│   │   │   │   ├── HomeCopyChip.vue
│   │   │   │   ├── HomeInstallTabs.vue
│   │   │   │   ├── LandingHero.vue
│   │   │   │   ├── ThemeSwitcher.vue
│   │   │   │   └── VersionChip.vue
│   │   │   ├── styles/  📄🧠
│   │   │   │   ├── .acc-memory.md
│   │   │   │   ├── AGENTS.md
│   │   │   │   └── home.css
│   │   │   ├── themes/  📄🧠
│   │   │   │   ├── canvas/  📄🧠
│   │   │   │   │   ├── .acc-memory.md
│   │   │   │   │   ├── AGENTS.md
│   │   │   │   │   └── theme.css
│   │   │   │   ├── cartoon/  📄🧠
│   │   │   │   │   ├── .acc-memory.md
│   │   │   │   │   ├── AGENTS.md
│   │   │   │   │   └── theme.css
│   │   │   │   ├── security/  📄🧠
│   │   │   │   │   ├── .acc-memory.md
│   │   │   │   │   ├── AGENTS.md
│   │   │   │   │   └── theme.css
│   │   │   │   ├── shadcn/  📄🧠
│   │   │   │   │   ├── .acc-memory.md
│   │   │   │   │   ├── AGENTS.md
│   │   │   │   │   └── theme.css
│   │   │   │   ├── .acc-memory.md
│   │   │   │   ├── AGENTS.md
│   │   │   │   ├── glitch.css
│   │   │   │   └── loader.js
│   │   │   ├── .acc-memory.md
│   │   │   ├── AGENTS.md
│   │   │   ├── index.ts
│   │   │   ├── landingMotion.js
│   │   │   └── ReposellLayout.vue
│   │   ├── .acc-memory.md
│   │   ├── AGENTS.md
│   │   └── config.ts
│   ├── architecture/
│   │   └── github-app.md
│   ├── auth/
│   │   └── github/
│   │       └── callback/
│   │           └── index.md
│   ├── commands/
│   │   ├── audit.md
│   │   ├── configure.md
│   │   ├── doctor.md
│   │   ├── index.md
│   │   ├── init.md
│   │   ├── license.md
│   │   ├── listing-status.md
│   │   ├── listing.md
│   │   ├── release.md
│   │   ├── sell.md
│   │   └── verify.md
│   ├── configuration/
│   │   ├── env.md
│   │   ├── index.md
│   │   ├── schema.md
│   │   └── zero-config.md
│   ├── development/
│   │   ├── adding-commands.md
│   │   ├── adding-git-providers.md
│   │   ├── adding-payment-providers.md
│   │   ├── commands.md
│   │   ├── index.md
│   │   ├── setup.md
│   │   ├── testing-ci.md
│   │   └── testing.md
│   ├── guide/
│   │   ├── payments/
│   │   │   └── index.md
│   │   ├── architecture.md
│   │   ├── core-concepts.md
│   │   ├── crypto-identity.md
│   │   ├── git-abstraction.md
│   │   ├── index.md
│   │   ├── init.md
│   │   ├── installation.md
│   │   ├── licensing-policy.md
│   │   ├── listing-setup.md
│   │   ├── payment-abstraction.md
│   │   ├── payment-setup.md
│   │   ├── quick-start.md
│   │   ├── reciprocity.md
│   │   ├── release-config.md
│   │   └── zero-config.md
│   ├── licensing/
│   │   └── index.md
│   ├── protocol/
│   │   ├── contributions.md
│   │   ├── endpoints.md
│   │   ├── gamification.md
│   │   ├── index.md
│   │   ├── listing-endpoint.md
│   │   ├── listing-network.md
│   │   ├── listing-registry.md
│   │   ├── manifest-schema.md
│   │   ├── release-model.md
│   │   ├── sell-endpoint.md
│   │   └── signatures.md
│   ├── public/
│   │   ├── branding/
│   │   │   ├── full.png
│   │   │   ├── icon.png
│   │   │   └── logo.png
│   │   ├── licenses/
│   │   │   ├── ai-policy.example.json
│   │   │   ├── FORK-1.0.txt
│   │   │   └── RSL-1.0.txt
│   │   ├── apple-touch-icon.png
│   │   ├── CNAME
│   │   ├── favicon.ico
│   │   ├── icon.svg
│   │   └── logo.svg
│   ├── security/
│   │   ├── crypto.md
│   │   ├── dependencies.md
│   │   ├── git-provider.md
│   │   ├── incident-response.md
│   │   ├── index.md
│   │   ├── payment.md
│   │   └── secrets.md
│   ├── why/
│   │   └── index.md
│   ├── .acc-memory.md
│   ├── .env.production
│   ├── .gitignore
│   ├── AGENTS.md
│   ├── DESIGN.md
│   ├── index.md
│   ├── package-lock.json
│   ├── package.json
│   ├── payment-architecture.md
│   ├── PRODUCT.md
│   └── README.md
├── functions/  📄🧠
│   ├── github-auth/  📄🧠
│   │   ├── .acc-memory.md
│   │   ├── AGENTS.md
│   │   ├── worker.js
│   │   └── wrangler.toml
│   ├── .acc-memory.md
│   └── AGENTS.md
├── src/  📄🧠
│   ├── app/  📄🧠
│   │   ├── .acc-memory.md
│   │   ├── AGENTS.md
│   │   ├── audit-service.ts
│   │   ├── build-service.ts
│   │   ├── config-service.ts
│   │   ├── evaluate-release.ts
│   │   ├── license-compose-service.ts
│   │   ├── license-service.test.ts
│   │   ├── license-service.ts
│   │   ├── listing-announcer.ts
│   │   ├── listing-service.test.ts
│   │   ├── listing-service.ts
│   │   ├── marketplace-client.ts
│   │   ├── pages.ts
│   │   ├── sell-template.ts
│   │   ├── signing-service.ts
│   │   └── validation-service.ts
│   ├── bin/  📄🧠
│   │   ├── .acc-memory.md
│   │   ├── AGENTS.md
│   │   ├── reposell-marketplace.ts
│   │   └── reposell.ts
│   ├── cli/  📄🧠
│   │   ├── .acc-memory.md
│   │   ├── AGENTS.md
│   │   ├── banner.test.ts
│   │   ├── banner.ts
│   │   └── prompts.ts
│   ├── commands/  📄🧠
│   │   ├── .acc-memory.md
│   │   ├── AGENTS.md
│   │   ├── audit.ts
│   │   ├── balance.ts
│   │   ├── build.ts
│   │   ├── evaluation-format.ts
│   │   ├── health.ts
│   │   ├── init.ts
│   │   ├── keys.ts
│   │   ├── license-args.test.ts
│   │   ├── license-args.ts
│   │   ├── license.ts
│   │   ├── listing-publish.ts
│   │   ├── listing.ts
│   │   ├── publish.test.ts
│   │   ├── publish.ts
│   │   ├── reciprocity.ts
│   │   ├── release.test.ts
│   │   ├── release.ts
│   │   ├── sell-create-link.ts
│   │   ├── sell-sync.test.ts
│   │   ├── sell-sync.ts
│   │   ├── validate.ts
│   │   └── verify.ts
│   ├── config/  📄🧠
│   │   ├── .acc-memory.md
│   │   ├── AGENTS.md
│   │   ├── index.test.ts
│   │   └── index.ts
│   ├── domain/  📄🧠
│   │   ├── audit/  📄🧠
│   │   │   ├── .acc-memory.md
│   │   │   ├── AGENTS.md
│   │   │   ├── audit.test.ts
│   │   │   ├── checks.ts
│   │   │   ├── sbom.ts
│   │   │   └── scan.ts
│   │   ├── license/  📄🧠
│   │   │   ├── .acc-memory.md
│   │   │   ├── AGENTS.md
│   │   │   ├── detect.test.ts
│   │   │   ├── detect.ts
│   │   │   ├── spdx.ts
│   │   │   ├── templates.test.ts
│   │   │   └── templates.ts
│   │   ├── licensing/  📄🧠
│   │   │   ├── .acc-memory.md
│   │   │   ├── AGENTS.md
│   │   │   ├── compatibility.ts
│   │   │   ├── generate.ts
│   │   │   ├── licensing.test.ts
│   │   │   ├── policy.ts
│   │   │   ├── rights.ts
│   │   │   └── schemes.ts
│   │   ├── listing/  📄🧠
│   │   │   ├── .acc-memory.md
│   │   │   ├── AGENTS.md
│   │   │   ├── discovery.ts
│   │   │   ├── health.ts
│   │   │   ├── listing.test.ts
│   │   │   └── pr.ts
│   │   ├── payment/  📄🧠
│   │   │   ├── .acc-memory.md
│   │   │   ├── AGENTS.md
│   │   │   ├── link-details.test.ts
│   │   │   ├── link-details.ts
│   │   │   ├── link.ts
│   │   │   ├── stripe-links.ts
│   │   │   ├── stripe.test.ts
│   │   │   └── stripe.ts
│   │   ├── pricing/  📄🧠
│   │   │   ├── .acc-memory.md
│   │   │   ├── AGENTS.md
│   │   │   └── endpoint.ts
│   │   ├── protocol/  📄🧠
│   │   │   ├── .acc-memory.md
│   │   │   ├── AGENTS.md
│   │   │   └── documents.ts
│   │   ├── reciprocity/  📄🧠
│   │   │   ├── .acc-memory.md
│   │   │   ├── AGENTS.md
│   │   │   ├── program.ts
│   │   │   └── reciprocity.test.ts
│   │   ├── release/  📄🧠
│   │   │   ├── .acc-memory.md
│   │   │   ├── AGENTS.md
│   │   │   ├── state.ts
│   │   │   └── version.ts
│   │   ├── selling/  📄🧠
│   │   │   ├── .acc-memory.md
│   │   │   ├── AGENTS.md
│   │   │   ├── provision.ts
│   │   │   ├── selling.test.ts
│   │   │   └── sync.ts
│   │   ├── signature/  📄🧠
│   │   │   ├── .acc-memory.md
│   │   │   ├── AGENTS.md
│   │   │   └── envelope.ts
│   │   ├── .acc-memory.md
│   │   └── AGENTS.md
│   ├── utils/  📄🧠
│   │   ├── .acc-memory.md
│   │   ├── AGENTS.md
│   │   ├── crypto.ts
│   │   ├── env.test.ts
│   │   ├── env.ts
│   │   ├── git.ts
│   │   ├── project-env.test.ts
│   │   └── project-env.ts
│   ├── workflows/  📄🧠
│   │   ├── .acc-memory.md
│   │   ├── AGENTS.md
│   │   ├── ci.ts
│   │   ├── sell.test.ts
│   │   └── sell.ts
│   ├── .acc-memory.md
│   ├── AGENTS.md
│   └── index.ts
├── tools/  📄🧠
│   ├── oxlint/  📄🧠
│   │   ├── anti-slop/  📄🧠
│   │   │   ├── effect/  📄🧠
│   │   │   │   ├── rules/  📄🧠
│   │   │   │   │   ├── .acc-memory.md
│   │   │   │   │   ├── AGENTS.md
│   │   │   │   │   └── no-service-constructor-imports.ts
│   │   │   │   ├── .acc-memory.md
│   │   │   │   ├── AGENTS.md
│   │   │   │   └── index.ts
│   │   │   ├── rules/  📄🧠
│   │   │   │   ├── .acc-memory.md
│   │   │   │   ├── AGENTS.md
│   │   │   │   ├── no-chained-type-assertions.ts
│   │   │   │   ├── no-conditional-empty-object-spread.ts
│   │   │   │   ├── no-known-value-widening.ts
│   │   │   │   ├── no-module-mocking.ts
│   │   │   │   ├── no-object-parameters.ts
│   │   │   │   ├── no-reflect-apply.ts
│   │   │   │   ├── no-reflect-get.ts
│   │   │   │   ├── no-runtime-typeof.ts
│   │   │   │   ├── no-shape-in-symbol-names.ts
│   │   │   │   ├── no-unknown-parameters.ts
│   │   │   │   ├── no-unknown-returns.ts
│   │   │   │   ├── no-unknown-type-aliases.ts
│   │   │   │   ├── no-unsafe-dictionary-type.ts
│   │   │   │   ├── no-widen-then-assert.ts
│   │   │   │   └── require-safety-comment-for-type-assertion.ts
│   │   │   ├── shared/  📄🧠
│   │   │   │   ├── .acc-memory.md
│   │   │   │   ├── AGENTS.md
│   │   │   │   ├── dictionary-types.ts
│   │   │   │   ├── lexical-type-parameters.ts
│   │   │   │   └── reflect-method.ts
│   │   │   ├── .acc-memory.md
│   │   │   ├── AGENTS.md
│   │   │   └── index.ts
│   │   ├── .acc-memory.md
│   │   └── AGENTS.md
│   ├── .acc-memory.md
│   └── AGENTS.md
├── .acc-memory.md
├── .accignore
├── .DS_Store
├── .env
├── .gitattributes
├── .gitignore
├── .npmrc
├── ACC_WARN.md
├── AGENTS.md
├── CHANGELOG.md
├── CODE_OF_CONDUCT.md
├── CONTRIBUTING.md
├── DEVELOPMENT_FLOW.png
├── DEVELOPMENT.md
├── FILETREE.md
├── IMPLEMENTATION.md
├── LICENSE
├── opencode.json
├── oxlint.config.ts
├── package-lock.json
├── package.json
├── README.md
├── SECURITY.md
├── skills-lock.json
└── tsconfig.json
```
