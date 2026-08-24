---
title: Licensing
description: How reposell checks your repository license, and the RepoSell Source License family — source-available, fork-specific, with machine-readable AI reservations.
---

# Licensing

Your repository's license is a legal statement, and reposell treats it like one: it **reads what you have, explains what it means for selling, offers better-fitting options — and never overwrites anything without you choosing**.

::: warning What these licenses are not
The RepoSell Source License family is **source-available, not open source**. The [Open Source Definition](https://opensource.org/osd) requires free redistribution and rights that aren't tied to a particular product or distribution — our fork-specific terms intentionally conflict with that. That's a feature here, not a bug. Don't label an RSL project "open source."
:::

## The check

`reposell init` and `reposell doctor` both run the licensing check:

```bash
$ reposell license check
```

Detection reads, in order of trust:

1. `LICENSE`, `LICENSE.md`, `LICENSE.txt`, `COPYING` at the repo root
2. The `license` field in `package.json`, `Cargo.toml`, `pyproject.toml`, `composer.json`
3. GitHub's license API (via your GitProvider) as a cross-check

A known SPDX entry (`MIT`, `Apache-2.0`, `GPL-3.0-only`, …) gets you a plain-language read on how it interacts with selling:

```bash
✓ License detected: MIT (SPDX: MIT)
  Selling via reposell: allowed. Keep full ownership of your code.
```

## When nothing recognizable is found

Selling unlicensed code means buyers legally receive nothing — so reposell stops and asks:

```bash
⚠ No recognizable license found.
? What would you like to do? …
❯ Generate RSL-1.0 (RepoSell Source License) with my details
  Preview the per-purchase Fork License
  Keep my own license (I know what I'm doing)
  Skip for now
```

Pick RSL-1.0 and reposell generates a complete `LICENSE` **filled with your information** — name from your Git config, repository URL, copyright year — shows a diff, and writes `.reposell/ai-policy.json` alongside it. Nothing is committed; you review and commit yourself.

Non-interactive equivalent:

```bash
reposell license use rsl --holder "Enzo Vezzaro" --repo-url auto
```

## RSL-1.0 — RepoSell Source License

The primary template: source-available software where **rights attach to the specific purchase**, not to the fact that code is readable.

**The core principle, stated precisely:** *the license is granted to the identified Licensed Fork and Licensee — not to arbitrary copies.* A copy isn't unlicensable; the person making the copy simply holds no license until the Owner grants one.

Key sections at a glance:

| Section | What it does |
| --- | --- |
| §2 Grant | Use / modify / execute / build on / deploy **the Licensed Fork** only |
| §3 Fork-specific | Copies, clones, mirrors and subsequent forks need their own license |
| §4–5 Redistribution & resale | None, unless you authorize it via your reposell config |
| §7–8 AI training & scraping | Prohibited without written permission — public ≠ permission |
| §9 AI coding assistants | Allowed transiently for authorized dev work; no retention, no training |
| §10 Machine-readable reservation | Rights reserved via license, metadata, headers, robots.txt, manifests, signatures |

<details>
<summary><strong>Full RSL-1.0 text</strong></summary>

```txt
REPOSELL SOURCE LICENSE
Version 1.0

Copyright (c) [YEAR] [COPYRIGHT HOLDER]

This software is made available through RepoSell subject to the terms
of this RepoSell Source License ("License").

IMPORTANT NOTICE

This License grants rights only to the specific Product, Release, Fork,
or other software instance identified by the applicable RepoSell
transaction, license record, or LICENSE file.

Access to the source code does not, by itself, grant unrestricted rights
to copy, redistribute, sublicense, resell, commercially exploit, train
artificial intelligence systems on, or create independent distributions
of the Software.

1. DEFINITIONS

"Software" means the source code, binaries, documentation, configuration,
assets, and other materials identified by the applicable Product
manifest.

"Original Repository" means the repository from which the Software
originated.

"Owner" means the copyright owner or authorized licensor of the
Original Repository.

"Licensed Fork" means the specific fork, repository, release, or
software instance obtained by a Licensee pursuant to this License.

"Licensee" means the person or organization to whom this License was
granted.

"AI System" means any artificial intelligence, machine-learning,
generative AI, foundation model, large language model, coding agent,
embedding system, retrieval system, dataset-generation system, or
similar computational system.

"AI Training" includes training, pre-training, fine-tuning, distillation,
reinforcement learning from code, parameter optimization, dataset
generation, evaluation dataset generation, benchmark generation, or
other processes intended to improve an AI System using the Software.

"AI Scraping" means automated collection, crawling, indexing,
extraction, parsing, harvesting, downloading, or ingestion of the
Software or substantial portions thereof for use by an AI System.

2. LICENSE GRANT

Subject to the terms of this License and any applicable RepoSell
transaction record, the Owner grants the Licensee a limited,
non-exclusive, non-transferable license to:

(a) access the Licensed Fork;

(b) use the Licensed Fork;

(c) modify the Licensed Fork;

(d) execute the Licensed Fork;

(e) develop software using the Licensed Fork;

(f) deploy the Licensed Fork for permitted purposes; and

(g) create derivative works from the Licensed Fork.

The license is limited to the Licensed Fork and the applicable
transaction.

3. FORK-SPECIFIC LICENSE

The license granted under this Agreement is tied to the specific
Licensed Fork obtained by the Licensee.

A copy, clone, mirror, export, archive, duplicate, reproduction, or
subsequent fork of the Licensed Fork is NOT automatically licensed
under this Agreement.

Any person who obtains such a copy must obtain an independent license
from the Owner unless another written license expressly authorizes such
use.

This restriction applies regardless of whether the copy was obtained
through Git, GitHub, GitLab, Bitbucket, HTTP, a package registry,
backup system, mirror, archive, or another mechanism.

4. NO AUTOMATIC REDISTRIBUTION RIGHTS

The Licensee may not redistribute the Licensed Fork or any substantial
portion of it to another person or organization unless expressly
authorized by the Owner.

A redistribution does not transfer the Licensee's rights to the
recipient.

The recipient must obtain an independent license from the Owner.

5. NO RESALE

The Licensee may not sell, sublicense, rent, lease, distribute,
white-label, or otherwise commercially transfer the Licensed Fork
without written authorization from the Owner.

RepoSell listing transactions constitute authorized distribution
only when expressly identified as such by the Owner's RepoSell
configuration.

6. INTELLECTUAL PROPERTY

All copyrights, trademarks, patents, trade secrets, database rights,
design rights, and other intellectual-property rights in the Software
remain with their respective owners.

This License does not transfer ownership of any intellectual-property
rights.

7. AI TRAINING PROHIBITION

Unless the Owner has expressly granted written permission, the
Licensee and all third parties are prohibited from using the Software
or any substantial portion of the Software for:

(a) training an AI System;

(b) pre-training an AI System;

(c) fine-tuning an AI System;

(d) distilling an AI System;

(e) reinforcement learning;

(f) generating training datasets;

(g) generating synthetic datasets derived from the Software;

(h) improving code-generation or code-completion models;

(i) improving embeddings or vector representations intended for
    machine-learning systems; or

(j) any substantially equivalent AI-development activity.

8. NON-CONSENSUAL AI SCRAPING

The Software may not be:

(a) crawled for AI training;

(b) scraped for AI training;

(c) bulk-downloaded for AI training;

(d) indexed for AI training;

(e) mirrored for AI training;

(f) ingested into an AI dataset; or

(g) otherwise collected for the development or improvement of an
    AI System,

without the prior written authorization of the Owner.

Public accessibility of the repository, website, documentation,
Git server, package registry, or other endpoint does not constitute
permission for AI training or AI dataset creation.

9. AI AGENTS AND AUTOMATED CODE ASSISTANTS

Access to the Software by an AI coding assistant, autonomous agent,
coding agent, software-development agent, or similar system is
permitted only when such access is necessary to perform an authorized
development task for the Licensee and does not result in:

(a) retention of the Software for model training;

(b) use of the Software for model improvement;

(c) incorporation of the Software into a training dataset;

(d) redistribution of the Software to unauthorized parties; or

(e) creation of an unauthorized derivative AI dataset.

This provision does not prohibit ordinary use of an AI coding assistant
solely as a development tool where the Software is processed transiently
and is not used for model training or improvement.

10. MACHINE-READABLE AI RIGHTS RESERVATION

The Owner expressly reserves all rights concerning AI training,
AI scraping, text and data mining, dataset creation, model training,
and related computational uses.

The Owner may communicate this reservation through:

(a) this License;

(b) repository metadata;

(c) LICENSE files;

(d) robots.txt;

(e) HTTP headers;

(f) machine-readable manifests;

(g) RepoSell manifests;

(h) cryptographic signatures;

(i) API responses; and

(j) other machine-readable mechanisms.

AI systems and automated crawlers are expected to respect these
reservations.

11. NO IMPLIED AI LICENSE

No permission to use the Software for AI training, AI scraping,
dataset creation, model development, or model improvement shall be
inferred from:

(a) publication of the Software;

(b) public repository access;

(c) GitHub visibility;

(d) source-code availability;

(e) documentation availability;

(f) search-engine indexing;

(g) package-registry publication; or

(h) the absence of a technical access restriction.

12. THIRD-PARTY COMPONENTS

This License does not override licenses applicable to third-party
components contained in or distributed with the Software.

Third-party components remain subject to their respective licenses.

13. TRADEMARKS

This License does not grant permission to use the Owner's trademarks,
logos, names, service marks, or branding except as expressly permitted
by the Owner.

14. SECURITY RESEARCH

Nothing in this License is intended to prohibit good-faith security
research, vulnerability disclosure, interoperability research, or
activities protected by applicable law.

15. LEGAL COMPLIANCE

Nothing in this License shall be interpreted to restrict rights that
cannot legally be restricted under applicable law.

16. TERMINATION

This License terminates automatically upon material breach.

Upon termination, the Licensee must cease all use, distribution,
commercial exploitation, and other activities not otherwise authorized
by the Owner.

17. SURVIVAL

Sections concerning intellectual property, confidentiality, AI use,
AI training, redistribution, limitations of liability, and enforcement
survive termination to the extent permitted by law.

18. DISCLAIMER

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, TO THE MAXIMUM EXTENT PERMITTED BY LAW.

19. LIMITATION OF LIABILITY

TO THE MAXIMUM EXTENT PERMITTED BY LAW, THE OWNER SHALL NOT BE LIABLE
FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, EXEMPLARY,
OR PUNITIVE DAMAGES ARISING FROM THE SOFTWARE OR THIS LICENSE.

20. GOVERNING LAW

This License shall be governed by the laws specified by the Owner in
the applicable Product manifest or license record.

If no governing law is specified, the laws of [JURISDICTION] shall
apply.

21. ENTIRE AGREEMENT

This License, together with the applicable RepoSell Product manifest,
transaction record, and any expressly incorporated terms, constitutes
the complete agreement concerning the Licensed Fork.

22. SEVERABILITY

If any provision of this License is found unenforceable, the remaining
provisions shall remain in effect to the maximum extent permitted by
law.
```

</details>

📄 Canonical copies live at [`/licenses/RSL-1.0.txt`](/licenses/RSL-1.0.txt), [`/licenses/FORK-1.0.txt`](/licenses/FORK-1.0.txt) and [`/licenses/ai-policy.example.json`](/licenses/ai-policy.example.json).

## The Fork License — issued per purchase

RSL-1.0 is the standing terms. The **RepoSell Fork License** is the per-purchase instrument that fills in who, what, and which exact release:

```txt
LICENSE ID:        [REPOSELL-LICENSE-ID]
PRODUCT:           [PRODUCT-NAME]
ORIGINAL REPO:     [REPOSITORY]
ORIGINAL OWNER:    [OWNER]
LICENSEE:          [LICENSEE]
LICENSED RELEASE:  [VERSION / COMMIT SHA]
LICENSED FORK:     [FORK URL]
ISSUED / EXPIRES:  [DATE] · [DATE OR PERPETUAL]
```

It restates the boundaries that matter most — no automatic extension to copies/mirrors/subsequent forks, no representing an unauthorized copy as licensed, no AI training — and notes that its cryptographic signature evidences issuer identity and record integrity. **Verification proves authenticity; it doesn't itself grant rights.**

## The machine-readable layer

Prose licenses don't reach crawlers. Reservations are also published as signals machines can read:

**`.reposell/ai-policy.json`** (generated with your license):

```json
{
  "version": "1.0",
  "ai": {
    "training": false,
    "fine_tuning": false,
    "distillation": false,
    "dataset_creation": false,
    "code_scraping": false,
    "bulk_crawling": false,
    "embedding_creation": false,
    "model_improvement": false
  },
  "text_and_data_mining": { "commercial": false, "non_commercial": false },
  "automated_agents": {
    "development_use": true,
    "model_training": false,
    "model_improvement": false,
    "retention_for_training": false
  },
  "redistribution": { "automatic_license_transfer": false }
}
```

Note the asymmetry: `automated_agents.development_use: true` — using an AI coding assistant while developing against your purchase is fine. Retaining that code for model training is not.

**Listing endpoints** additionally serve:

```txt
REPOSELL-AI-POLICY: DENY
X-RepoSell-AI-Training: deny
X-RepoSell-AI-Scraping: deny
X-RepoSell-Text-Data-Mining: deny
X-RepoSell-License: RSL-1.0
```

plus AI-specific declarations in `/robots.txt`. This direction matters: the EU framework explicitly recognizes machine-readable rights reservations against text and data mining ([EUIPO](https://www.euipo.europa.eu/en/copyright-knowledge-centre/copyright-and-genai)), and GPAI providers must respect copyright reservations ([AI Act, Art. 53](https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-53)). These signals are **not a replacement for the license** — they're how the license speaks to machines.

## Cryptographic binding

Your existing signature system binds the whole story together:

```txt
License ── Owner · Repository · Product · Release · Commit SHA
        ── License ID · License type · AI policy · Redistribution policy
        ── Listing authorization · Timestamp
              │
              ▼
       SIGNED MANIFEST  ── verified against ──▶ owner's public key (lives in CI)
```

Result: *"this exact repository + release + fork + license policy was authorized by this owner, and nothing has been modified"* — verifiable by anyone, including the public listing, without ever holding a private key. One honest caveat: **signatures prove integrity, not legal enforceability** — the license text and applicable law do that part.

## Keeping your own license

Choosing **Keep my own license** is a first-class option:

```bash
$ reposell license keep
✓ Keeping existing license (detected: GPL-3.0-only)
✓ Recorded in reposell.yml → license: keep-existing
```

reposell stores the choice in `reposell.yml`, stops suggesting, and publishes the detected SPDX identifier in your manifest so buyers see exactly what they're buying under. `doctor` still flags genuine contradictions (say, copyleft code bundled into a proprietary sale) — once, politely, with a link here.

::: tip Not legal advice
Templates and tooling, not counsel. For high-stakes products, have a lawyer review your chosen terms — especially governing law (§20).
:::
