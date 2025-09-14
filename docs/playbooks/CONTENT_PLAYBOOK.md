# Content Playbook (data/rag/)

Guidelines to author high-signal, citation-friendly source content for RAG.

## Canonical Documents
- Core Competencies: concise pillars + short, quote-ready lines.
- Leadership Playbook: org model (tribe/chapter), coaching, governance, stakeholder alignment.
- Case Studies: one file per case (Context → Approach → Outcome metrics) + 2–3 short quotes.
- Bio/Experience: role timeline and scope.
- FAQ: recruiter-style Q&A for common topics.

## Frontmatter Metadata (YAML)
```yaml
---
source_type: competencies   # competencies | leadership | case_study | bio | faq
source_name: Core Competencies
link: /#competencies
role: Product Design Leader
tech: [Figma, Design System, AI, RAG]
date: 2024-01-01
---
```

## Structure & Language
- Clear H2/H3 with domain keywords and synonyms used in queries.
- Short paragraphs (3–6 lines), explicit sentences (120–160 chars) for quotability.
- Light redundancy of critical terms across canonical and case docs.

## Chunking Hygiene
- Break on headings/paragraphs; avoid very long blocks.
- Slight overlaps ok; keep each chunk focused on one idea.

## Linkability
- Provide `link` anchors for each canonical section to enable deep-links in chat "Sources".
