# LLM Prompt (Generate Project Markdown per this Playbook)

Use the following prompt to generate a single Markdown file that strictly follows this playbook. Replace variables in ALL_CAPS. Keep all documentation and comments in English; content text may be bilingual (PL/EN) as needed.

```text
You are generating a project Markdown file for a personal portfolio. Follow these hard rules:

1) Output a single Markdown document with YAML frontmatter and the sections listed below. Do NOT include any extra commentary outside the document.
2) Frontmatter MUST include:
   - source_type: one of [case_study, experience, leadership, bio, faq]
   - source_name: canonical project name (e.g., "ORG PRODUCT XYZ")
   - role: ROLE
   - tech: [TECH_1, TECH_2, ...]
   - org: ORG
   - product: PRODUCT
   - domain: DOMAIN
   - kpis: [KPI_1, KPI_2, ...]
   - aliases: [ALIASES...] (short nicknames users may type)
   - link: STABLE_LINK_TO_MAIN_SECTION (e.g., "/portfolio/slug#summary")
   - intent_tags: [OPTIONAL_INTENT_HINTS]
   - date: YYYY-MM-DD (optional)
3) Repeat the project name in H2/H3 section headings (e.g., "## Summary — ORG PRODUCT").
4) Keep sections short, factual, and quotable; include concrete metrics where possible. Redact sensitive data.

Required Sections for source_type=case_study:
## Summary — ORG PRODUCT
## Problem — ORG PRODUCT
## Approach — ORG PRODUCT
## Stakeholder Management — ORG PRODUCT (conflicts, escalation, C‑suite alignment, decision log)
## Metrics & Experiments — ORG PRODUCT (hypotheses, design, power, bias handling, KPIs, results, ROI)
## Results & Impact — ORG PRODUCT (numbers, outcomes)
## Learnings — ORG PRODUCT (top 3)
## Links — ORG PRODUCT (deep links)

Required Sections for source_type=experience:
## Role & Scope — ORG
## Responsibilities — ORG
## KPIs Influenced — ORG
## Collaborations — ORG

Frontmatter Example:
---
source_type: case_study
source_name: "ORG PRODUCT"
role: "ROLE"
tech: ["TECH_1", "TECH_2"]
org: "ORG"
product: "PRODUCT"
domain: "DOMAIN"
kpis: ["KPI_1", "KPI_2"]
aliases: ["ALIAS_1", "ALIAS_2"]
link: "/portfolio/slug#summary"
intent_tags: ["metrics_experiments", "stakeholder_mgmt"]
date: 2024-01-01
---

Now produce the Markdown file (frontmatter + sections) for:
- source_type: SOURCE_TYPE
- source_name: SOURCE_NAME
- role: ROLE
- org: ORG
- product: PRODUCT
- domain: DOMAIN
- tech: [TECH_1, TECH_2, ...]
- kpis: [KPI_1, KPI_2, ...]
- aliases: [ALIASES...]
- link: STABLE_LINK
```

# Project Content Templates & Metadata Playbook

This document defines how to structure Markdown content for projects (case studies, experience) so the chat can reliably bind detected intents to the correct projects. It includes frontmatter schemas, section templates, and ingestion guidelines.

## 1. Goals
- Ensure strong intent → project linking via consistent metadata and section structure.
- Improve retrieval quality (top-K) and citations with precise `source_name` and deep links.
- Enable entity-based boosts (project/organization names) and intent-based boosts in the RAG pipeline.

## 2. Frontmatter Schema (per file)
Use YAML frontmatter at the top of each Markdown file:

```yaml
---
source_type: case_study # one of [case_study, experience, leadership, bio, faq]
source_name: "ING Onboarding DS" # canonical project name
role: "Head of Design" # or relevant role
tech: ["Figma", "Storybook", "React"] # technologies/tools
org: "ING" # organization or client
product: "Onboarding" # product/area
domain: "banking" # domain/industry
kpis: ["activation", "retention_d30"] # key metrics touched
aliases: ["ING OB", "Onboarding @ ING", "ING Onboarding"] # search aliases
link: "/portfolio/ing-onboarding#summary" # deep link to main section
intent_tags: ["metrics_experiments", "stakeholder_mgmt"] # optional hints
date: 2023-10-01 # optional
---
```

Notes:
- Always provide `source_type` and `source_name`.
- Prefer short `aliases` users may type (company, product, acronyms).
- Provide stable `link` anchors (H2/H3 slugs) for citations.

## 3. Case Study Template
Recommended section order and headings. Repeat the project name in H2/H3 titles to keep entity tokens in each chunk.

```markdown
---
source_type: case_study
source_name: "ING Onboarding DS"
role: "Head of Design"
tech: ["Figma", "React", "GA4"]
org: "ING"
product: "Onboarding"
domain: "banking"
kpis: ["activation", "dropoff_kys"]
aliases: ["ING OB", "Onboarding @ ING", "ING Onboarding"]
link: "/portfolio/ing-onboarding#summary"
intent_tags: ["metrics_experiments", "product_sense", "stakeholder_mgmt"]
---

## Summary — ING Onboarding
Short 2–3 paragraph executive summary with scope, constraints, and impact. Include concrete numbers when possible.

## Problem — ING Onboarding
Business and user problem, constraints, audience, regulatory context.

## Approach — ING Onboarding
Design approach, discovery, research plan, architecture of solution.

## Stakeholder Management — ING Onboarding
Conflict handling, C-level alignment, decision log, escalation path, risk communication.

## Metrics & Experiments — ING Onboarding
Hypotheses, experiment design (A/B, power, bias handling), KPIs, results and ROI.

## Results & Impact — ING Onboarding
Outcomes with numbers and quotes, what changed in KPIs.

## Learnings — ING Onboarding
Top 3 learnings, what you’d do differently.

## Links — ING Onboarding
- Case URL: /portfolio/ing-onboarding#summary
- Supplementary: dashboards, repos, internal docs (if public/sanitized)
```

Guidance:
- Keep each section self-contained so chunking preserves enough context.
- Include the project name in headings to strengthen entity-boost.

## 4. Experience Template
Use separate files for experience overviews to reduce overlap with case studies.

```markdown
---
source_type: experience
source_name: "Eryk – Experience Overview (ING)"
role: "Head of Design"
org: "ING"
product: "Onboarding"
tech: ["Figma", "Storybook"]
domain: "banking"
link: "/portfolio/experience#ing"
---

## Role & Scope — ING
Team size, responsibilities, reporting line, geographic scope.

## Responsibilities — ING
Key activities, ownership areas, cross-functional collaboration.

## KPIs Influenced — ING
List KPIs impacted (e.g., activation, retention, NPS) with short notes.

## Collaborations — ING
Stakeholders (PM, Eng, Compliance), rituals, tools.
```

## 5. Leadership Template (Optional)
```markdown
---
source_type: leadership
source_name: "Leadership Philosophy"
link: "/portfolio/leadership#philosophy"
---

## Principles
…

## Coaching & Mentorship
…
```

## 6. Bio/FAQ Template (Optional)
```markdown
---
source_type: bio
source_name: "About Eryk"
link: "/portfolio/bio#about"
---

## About
Short bio in 1–2 paragraphs.

## Highlights
Bulleted notable strengths and achievements.
```

## 7. Chunking & Ingestion Guidelines
- Chunk size: 500–800 tokens; overlap: 100–150.
- Ensure each section heading contains the project name so entity tokens repeat across chunks.
- Propagate frontmatter to chunk metadata: `source_type`, `source_name`, `role`, `tech[]`, `org`, `product`, `domain`, `kpis`, `aliases[]`, `link`.
- Generate stable anchor links for each section and store as `link` in metadata.

## 8. Retrieval Integration (What the system uses)
- Intent-based boosts bias retrieval toward matching `source_type` for `case_study`, `experience`, `leadership`, `competencies` (bio/leadership).
- Entity-boost increases scores when user query tokens overlap with `source_name` (and can be extended to `org`/`product`).
- Query Expansion generates 2–3 paraphrases per intent to improve recall.
- MMR reduces redundancy so diverse sections of the correct project are selected.

## 9. Optional: Organization & Product Boosts
To further increase binding strength, include:
- `org`: organization/client names (e.g., "ING", "Allegro").
- `product`: product/area (e.g., "Onboarding").
- `aliases[]`: common nicknames/acronyms users may type.

The pipeline can add small boosts when the user message mentions any of these values.

## 10. Quality Checklist (Per File)
- [ ] Frontmatter includes: `source_type`, `source_name`, `role`, `tech[]`, `link`.
- [ ] Added `org`, `product`, `domain`, `kpis`, `aliases[]` where applicable.
- [ ] Headings repeat the project name in each section.
- [ ] Sections include: Summary, Problem, Approach, Stakeholder Management, Metrics & Experiments, Results & Impact, Learnings, Links (for case studies).
- [ ] Experience files have Role & Scope, Responsibilities, KPIs Influenced, Collaborations.
- [ ] Anchor links are stable and mapped in `link` metadata.
- [ ] Sensitive data is redacted/sanitized.

## 11. Example: Minimal Case Study
```markdown
---
source_type: case_study
source_name: "Allegro Design System Refresh"
role: "Senior Product Designer"
tech: ["Figma", "Storybook"]
org: "Allegro"
product: "Design System"
domain: "e-commerce"
link: "/portfolio/allegro-ds#summary"
aliases: ["Allegro DS", "Design System @ Allegro"]
intent_tags: ["design_systems", "tools_automation", "stakeholder_mgmt"]
---

## Summary — Allegro DS
…

## Problem — Allegro DS
…

## Approach — Allegro DS
…

## Stakeholder Management — Allegro DS
…

## Metrics & Experiments — Allegro DS
…

## Results & Impact — Allegro DS
…

## Learnings — Allegro DS
…
```

## 12. Maintenance
- When adding new projects, follow the templates and checklist.
- Keep aliases and links up-to-date.
- After content updates, re-run ingestion and restart the server to refresh in-memory stores.
