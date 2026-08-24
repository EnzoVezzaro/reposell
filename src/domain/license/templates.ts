import { readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

export interface RslRenderInput {
  year: string;
  holder: string;
  repository?: string;
  jurisdiction?: string;
}

const RSL_BODY = `REPOSELL SOURCE LICENSE
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
`;

export function renderRslLicense(input: RslRenderInput): string {
  const text = RSL_BODY.replaceAll('[YEAR]', input.year)
    .replaceAll('[COPYRIGHT HOLDER]', input.holder)
    .replaceAll('[REPOSITORY]', input.repository ?? 'N/A')
    .replaceAll('[JURISDICTION]', input.jurisdiction ?? 'the State of Delaware, United States of America');
  return text.endsWith('\n') ? text : text + '\n';
}

export interface ForkLicenseInput {
  licenseId: string;
  productName: string;
  repository: string;
  owner: string;
  licensee: string;
  release: string;
  forkUrl: string;
  issued: string;
  expiration: string;
}

export function renderForkLicense(input: ForkLicenseInput): string {
  return `REPOSELL FORK LICENSE
Version 1.0

This license applies exclusively to the Licensed Fork identified by
the associated RepoSell License ID.

LICENSE ID:
${input.licenseId}

PRODUCT:
${input.productName}

ORIGINAL REPOSITORY:
${input.repository}

ORIGINAL OWNER:
${input.owner}

LICENSEE:
${input.licensee}

LICENSED RELEASE:
${input.release}

LICENSED FORK:
${input.forkUrl}

ISSUED:
${input.issued}

EXPIRATION:
${input.expiration}

The Licensee is authorized to use and modify the Licensed Fork subject
to the RepoSell Source License.

This license does not automatically extend to:

- copies;
- mirrors;
- archives;
- clones;
- redistributed repositories;
- derivative repositories;
- exported source archives;
- independently published versions; or
- subsequent forks.

Each such distribution requires an independent license from the
Original Owner unless expressly authorized.

The Licensee may retain and use the Licensed Fork for the purposes
authorized by this License.

The Licensee may not represent an unauthorized copy as an independently
licensed RepoSell Product.

The Licensee may not use the Licensed Fork for AI training, AI model
improvement, dataset creation, or non-consensual AI scraping.

The Licensee may use AI-assisted development tools only where the
Software is not retained or used for AI training or model improvement.

All intellectual-property rights remain with the Original Owner and
other applicable rights holders.

The cryptographic signature associated with this License constitutes
evidence of the identity of the issuing authority and the integrity of
the license record.

Verification does not itself grant additional rights.

Unauthorized copies are not covered by this License.
`;
}

export interface AiPolicy {
  version: '1.0';
  ai: {
    training: boolean;
    fine_tuning: boolean;
    distillation: boolean;
    dataset_creation: boolean;
    code_scraping: boolean;
    bulk_crawling: boolean;
    embedding_creation: boolean;
    model_improvement: boolean;
  };
  text_and_data_mining: { commercial: boolean; non_commercial: boolean };
  automated_agents: {
    development_use: boolean;
    model_training: boolean;
    model_improvement: boolean;
    retention_for_training: boolean;
  };
  redistribution: { automatic_license_transfer: boolean };
}

export function generateAiPolicy(): AiPolicy {
  return {
    version: '1.0',
    ai: {
      training: false,
      fine_tuning: false,
      distillation: false,
      dataset_creation: false,
      code_scraping: false,
      bulk_crawling: false,
      embedding_creation: false,
      model_improvement: false,
    },
    text_and_data_mining: { commercial: false, non_commercial: false },
    automated_agents: {
      development_use: true,
      model_training: false,
      model_improvement: false,
      retention_for_training: false,
    },
    redistribution: { automatic_license_transfer: false },
  };
}

export function renderAiPolicy(policy: AiPolicy = generateAiPolicy()): string {
  return JSON.stringify(policy, null, 2) + '\n';
}

export async function loadCanonicalTemplate(name: string): Promise<string> {
  const here = path.dirname(fileURLToPath(import.meta.url));
  return readFile(path.resolve(here, '../../../../docs/public/licenses', name), 'utf8');
}
