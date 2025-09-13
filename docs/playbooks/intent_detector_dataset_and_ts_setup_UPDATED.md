
# Intent Detector for Interview — Dataset + TypeScript Setup (LangChain)

This file contains:
1) **Intent schema with `example_utterances`** (PL/EN mix) aligned to your 200 interview questions.  
2) **TypeScript guide** to build an intent detector in LangChain using embeddings (and an optional hybrid LLM pass).

---

## 1) Intent Schema (with `example_utterances`)

> Use these as a mini‑dataset to seed embeddings. They’re *not* regex keywords — they’re semantically rich examples per intent.

### Top-Level Groups
- `retrieval_core`
- `role_fit`
- `logistics`
- `process`
- `assets`
- `compliance`
- `conversational`

Each intent: `id`, `description`, `example_utterances`.

---

### retrieval_core

#### competencies
- **description:** Verification of design craft & process (UX, UI, research, prototyping, usability, accessibility).
- **example_utterances:**
  - "Jak definiujesz problem projektowy?"
  - "Jakie metody użyteczności stosujesz najczęściej i kiedy?"
  - "How do you structure a rapid usability test under time pressure?"
  - "Opisz, jak tworzysz i weryfikujesz hipotezy badawcze."
  - "How do you translate JTBD into testable prototypes?"
  - "Jak zapewniasz dostępność (WCAG) w codziennej pracy?"

#### leadership
- **description:** Team leadership, mentoring, feedback culture, conflict resolution, scaling.
- **example_utterances:**
  - "Jak budujesz zaufanie i odpowiedzialność w zespole?"
  - "Opisz sytuację konfliktu i jak ją rozwiązałeś."
  - "How do you grow juniors vs. seniors?"
  - "Jak wprowadzasz kulturę feedbacku w praktyce?"
  - "Tell me about a tough call you made as a design lead."
  - "Jak sygnalizujesz ryzyko na poziomie leadershipu?"

#### experience
- **description:** Past roles/scope, PM/Eng collaboration, scale, KPIs/OKRs.
- **example_utterances:**
  - "Jak wyglądał Twój ostatni zespół i Twój zakres?"
  - "Współpraca z product managerami — co działało, co nie?"
  - "Which KPIs did you directly influence?"
  - "Opowiedz o pracy w rozproszonym środowisku i strefach czasowych."
  - "How did you document design decisions?"
  - "Jak skalowałeś procesy wraz ze wzrostem organizacji?"

#### case_study
- **description:** Deep dive into portfolio projects: trade‑offs, metrics, outcomes.
- **example_utterances:**
  - "Który projekt w portfolio najlepiej pokazuje Twoje umiejętności i dlaczego?"
  - "Jak mierzyłeś sukces projektu i jakie były wyniki?"
  - "Describe the hardest trade‑off you made in this case."
  - "Co byś dziś zmienił w tym case study?"
  - "How did stakeholder feedback change your solution?"
  - "Jak poradziłeś sobie z niedostępnością danych?"

#### product_sense
- **description:** MVP, value proposition, north star metric, growth/retention thinking.
- **example_utterances:**
  - "Jak definiujesz MVP w warunkach niepewności?"
  - "What would you change in our product and why?"
  - "Jak rozumiesz north star metric dla tego produktu?"
  - "Opisz kompromis między retencją a akwizycją."
  - "How would you validate value prop in a week?"
  - "Jak priorytetyzujesz impact vs. koszt wdrożenia?"

#### research_process
- **description:** Research methods, planning, documentation of insights.
- **example_utterances:**
  - "Jak planujesz sprint badawczy i dobierasz metody?"
  - "How do you structure interviews to avoid bias?"
  - "W jaki sposób dokumentujesz i udostępniasz insighty?"
  - "Opisz, jak przetwarzasz hipotezy w testy."
  - "How do you make research actionable for engineers?"
  - "Jak działasz, gdy klient nie ma danych?"

#### design_systems
- **description:** Tokens, libraries, Storybook, Figma variables, governance.
- **example_utterances:**
  - "Jak utrzymujesz spójność designu w wielu produktach?"
  - "Opisz wasz system design tokens i governance."
  - "How did you integrate Storybook with the DS?"
  - "Jak synchronizowałeś tokeny z repo/frontendem?"
  - "What’s your approach to semantic tokens?"
  - "Jak rozwiązywałeś konflikty wersji bibliotek Figmy?"

#### metrics_experiments
- **description:** Experiments, A/B testing, success metrics, ROI of design.
- **example_utterances:**
  - "Jak weryfikujesz, czy design przynosi ROI?"
  - "Describe your last A/B test and learnings."
  - "Jakie metryki były kluczowe dla decyzji produktowych?"
  - "How do you prevent metric gaming?"
  - "Opisz projekt, w którym metryki was zaskoczyły."
  - "Jak łączysz dane ilościowe z jakościowymi?"

#### stakeholder_mgmt
- **description:** Stakeholder alignment, exec communication, decisions/escalation.
- **example_utterances:**
  - "Jak przekonywałeś interesariuszy do inwestycji w UX?"
  - "Tell me about a time you aligned conflicting stakeholders."
  - "Jak rozmawiasz z zarządem o designie i ROI?"
  - "What do you do when recommendations are ignored?"
  - "Jak radzisz sobie z design by committee?"
  - "Jak dokumentujesz decyzje i rationale?"

#### tools_automation
- **description:** Practical use of Figma, Jira/ClickUp, Notion, Make/n8n, AI in workflow.
- **example_utterances:**
  - "Jak korzystasz z Figmy w zespole na co dzień?"
  - "How do you automate routine design ops?"
  - "Jak dokumentujesz proces w Notion/Confluence?"
  - "What AI tools have actually saved you time?"
  - "Jak budujesz przepływ Figmy z repo/CI?"
  - "Które automatyzacje utrzymujesz, a które porzucasz?"

---

### role_fit

#### skill_verification
- **description:** Hard skills vs. role needs.
- **example_utterances:**
  - "W jakim obszarze jesteś najsilniejszy?"
  - "How do you handle high‑fidelity prototyping?"
  - "Jak radzisz sobie z analityką danych?"
  - "Opisz swoje kompetencje w accessibility."
  - "How comfortable are you with metrics‑driven design?"
  - "Jakie narzędzia masz w małym palcu?"

#### domain_expertise
- **description:** Industry/domain experience (e.g., sports, betting/trading, B2B).
- **example_utterances:**
  - "Jak oceniasz konkurencję w naszej domenie?"
  - "Doświadczenie w betting/trading — kluczowe wyzwania?"
  - "How would you adapt to strictly regulated markets?"
  - "Jakie są różnice B2B vs B2C w Twoim podejściu?"
  - "What domain assumptions would you validate first?"
  - "Jak nawigujesz ograniczeniami prawnymi branży?"

#### fit_assessment
- **description:** Culture, values, work style, motivation.
- **example_utterances:**
  - "Co Cię napędza do pracy?"
  - "Jak opisałbyś swój styl pracy w zespole?"
  - "What kind of team culture helps you thrive?"
  - "Jak łączysz strategię i egzekucję?"
  - "Where do you draw the line on quality vs. speed?"
  - "Jak podchodzisz do feedbacku 360°?"

#### behavioral
- **description:** STAR, failures, ethics, lessons learned.
- **example_utterances:**
  - "Opowiedz o porażce i czego Cię nauczyła."
  - "Tell me about an unpopular decision you stood by."
  - "Jak wyciągasz lekcje z błędów?"
  - "Describe a time you had to escalate."
  - "Jak radzisz sobie z presją czasu?"
  - "Opisz sytuację, gdy projekt utknął."

---

### logistics

#### availability
- **description:** Start date, notice period, availability.
- **example_utterances:**
  - "Od kiedy możesz zacząć?"
  - "Jaki masz okres wypowiedzenia?"
  - "When are you available for next steps?"
  - "Czy możesz zacząć w przyszłym miesiącu?"
  - "Masz ograniczenia czasowe w tygodniu?"
  - "What’s the earliest possible start?"

#### location_remote
- **description:** Remote/hybrid/on‑site, time zones.
- **example_utterances:**
  - "Preferujesz pracę zdalną czy hybrydową?"
  - "Are time zone overlaps a problem for you?"
  - "Jak często bywasz w biurze?"
  - "Czy praca w różnych strefach czasowych Ci odpowiada?"
  - "Do you need equipment on‑site?"
  - "Jakie masz wymagania dot. home office?"

#### compensation
- **description:** Salary/band, contract type, equity/bonus.
- **example_utterances:**
  - "Jakie masz oczekiwania finansowe?"
  - "B2B czy UoP — co preferujesz i dlaczego?"
  - "What range are you targeting?"
  - "Czy equity ma dla Ciebie znaczenie?"
  - "Bonus vs. base — jak ważne?"
  - "Jak podchodzisz do widełek i transparentności?"

#### scheduling
- **description:** Meeting slots, next stages planning.
- **example_utterances:**
  - "Kiedy pasują Ci kolejne etapy?"
  - "Proszę o 3 propozycje terminów."
  - "Can we schedule a 45‑min portfolio deep‑dive?"
  - "Czy pasuje Ci przyszły wtorek rano?"
  - "Masz preferencje co do długości rozmów?"
  - "Poproszę o sloty w tym i przyszłym tygodniu."

#### visa_relocation_travel
- **description:** Visa/relocation constraints, business travel.
- **example_utterances:**
  - "Czy rozważasz relokację?"
  - "Do you require visa sponsorship?"
  - "Jak podchodzisz do podróży służbowych?"
  - "Czy masz ograniczenia relokacyjne/rodzinne?"
  - "What’s your relocation timeline?"
  - "Czy hybryda jest dla Ciebie realna?"

---

### process

#### hiring_process
- **description:** Stages, decision timelines, feedback, references.
- **example_utterances:**
  - "Jak wygląda proces rekrutacji?"
  - "Kiedy mogę spodziewać się decyzji i feedbacku?"
  - "Will there be a live exercise?"
  - "Czy przewidujecie rozmowę z zarządem?"
  - "Jak długo trwają poszczególne etapy?"
  - "Czy wymagacie referencji?"

#### assignment_brief
- **description:** Take‑home/live task details, scope, evaluation criteria.
- **example_utterances:**
  - "Czy będzie zadanie domowe?"
  - "What are the evaluation criteria?"
  - "Jaki jest zakres i deadline zadania?"
  - "Czy mogę użyć istniejących komponentów?"
  - "Jakie są oczekiwania co do prezentacji rozwiązania?"
  - "Czy mogę zadać pytania do briefu?"

---

### assets

#### assets_request
- **description:** Requests for portfolio, case deck, references.
- **example_utterances:**
  - "Proszę o portfolio lub deck case studies."
  - "Can you share a condensed case deck?"
  - "Masz referencje od poprzednich pracodawców?"
  - "Link do portfolio online?"
  - "Czy możesz dodać kontekst do tego case?"
  - "Poproszę 2–3 przykłady projektów."

#### code_or_design_files
- **description:** Sharing source files, prototypes, Storybook.
- **example_utterances:**
  - "Czy możesz udostępnić prototyp Figmy?"
  - "Link do Storybooka albo repo?"
  - "Masz wersję high‑fidelity do pokazania?"
  - "Can we see redlines/specs?"
  - "Czy możesz dodać komentarze do prototypu?"
  - "Poproszę o read‑only dostęp."

---

### compliance

#### nda_privacy
- **description:** Confidentiality, NDA, sensitive data in cases.
- **example_utterances:**
  - "Czy podpiszemy NDA przed zagłębieniem w case?"
  - "Does your case reveal any confidential data?"
  - "Jak anonimizujesz materiały w portfolio?"
  - "Czy możesz redagować nazwy klientów?"
  - "What’s your stance on privacy compliance?"
  - "Czy mamy ograniczenia w prezentacji?"

#### data_processing_ip
- **description:** Data processing, IP ownership, GDPR.
- **example_utterances:**
  - "Kto jest właścicielem IP w projektach?"
  - "How do you ensure GDPR compliance in research?"
  - "Czy masz wzorce zgód/klauzul?"
  - "Jak przechowujesz dane badawcze?"
  - "Do you separate PII in your repositories?"
  - "Jak rozwiązujesz kwestie IP przy B2B?"

#### accessibility_compliance
- **description:** WCAG standards, audits, compliance workflows.
- **example_utterances:**
  - "Jak zapewniasz zgodność z WCAG?"
  - "Do you run accessibility audits?"
  - "Jakie narzędzia używasz do audytu?"
  - "Czy macie checklisty/wymogi dostępności?"
  - "How do you train the team on accessibility?"
  - "Czy accessibility jest w Definition of Done?"

---

### conversational

#### clarification
- **description:** Asking to clarify scope/meaning/context.
- **example_utterances:**
  - "Możesz doprecyzować pytanie?"
  - "What do you mean by 'impact'?"
  - "Czy chodzi o projekt X czy Y?"
  - "Wyjaśnij proszę zakres pytania."
  - "Could you give an example?"
  - "Czy mówimy o obecnej roli?"

#### smalltalk
- **description:** Ice‑breakers and rapport building.
- **example_utterances:**
  - "Jak minął dzień?"
  - "Great to finally meet you."
  - "Zanim zaczniemy, kawa czy herbata?"
  - "How’s your week going?"
  - "Miło Cię poznać!"
  - "Dzięki za czas."

#### rapport_meta
- **description:** Meta about the interview flow/preferences.
- **example_utterances:**
  - "Wolisz krótkie odpowiedzi czy dłuższe przykłady?"
  - "Can I sketch a quick diagram?"
  - "Czy mogę wrócić do tego wątku później?"
  - "Would you like a summary first?"
  - "Mogę udzielić odpowiedzi po polsku?"
  - "Czy nagrywamy spotkanie?"

#### curveballs_creative
- **description:** Creative/oddball questions.
- **example_utterances:**
  - "Opisz kolor żółty osobie niewidomej."
  - "Gdybyś miał 1 mld $, co byś zmienił?"
  - "Jak zaprojektujesz budzik dla niesłyszących?"
  - "Which three apps would you kill and why?"
  - "Jak zaprojektujesz onboarding astronauty?"
  - "What emoji best describe you?"

---

## 2) TypeScript Setup with LangChain

Below is a pragmatic, **embedding‑first** intent detector with an **optional hybrid LLM reranker**.

### 2.1. Install
```bash
npm i langchain @langchain/openai @langchain/community
# or choose embeddings provider you prefer, e.g. OpenAI
```

> Set `OPENAI_API_KEY` in env if you use OpenAI embeddings.

### 2.2. Types & Dataset Loader
```ts
// intents.ts
export type IntentId =
  | "retrieval_core.competencies"
  | "retrieval_core.leadership"
  | "retrieval_core.experience"
  | "retrieval_core.case_study"
  | "retrieval_core.product_sense"
  | "retrieval_core.research_process"
  | "retrieval_core.design_systems"
  | "retrieval_core.metrics_experiments"
  | "retrieval_core.stakeholder_mgmt"
  | "retrieval_core.tools_automation"
  | "role_fit.skill_verification"
  | "role_fit.domain_expertise"
  | "role_fit.fit_assessment"
  | "role_fit.behavioral"
  | "logistics.availability"
  | "logistics.location_remote"
  | "logistics.compensation"
  | "logistics.scheduling"
  | "logistics.visa_relocation_travel"
  | "process.hiring_process"
  | "process.assignment_brief"
  | "assets.assets_request"
  | "assets.code_or_design_files"
  | "compliance.nda_privacy"
  | "compliance.data_processing_ip"
  | "compliance.accessibility_compliance"
  | "conversational.clarification"
  | "conversational.smalltalk"
  | "conversational.rapport_meta"
  | "conversational.curveballs_creative";

export interface IntentExample {
  intent: IntentId;
  text: string;
}

export interface IntentResult {
  topIntent: IntentId;
  confidence: number;       // 0..1
  matches: { intent: IntentId; score: number; text: string }[]; // top-k evidence
}

export interface RoutingRules {
  hardBlock?: (q: string) => IntentId | null; // e.g., NDA overrides
  priority?: IntentId[]; // optional priority list
}
```

Populate an array of examples by copying the utterances above into a JSON/TS file (one item per line), e.g.:
```ts
// dataset.ts
import { IntentExample } from "./intents";

export const DATASET: IntentExample[] = [
  { intent: "retrieval_core.competencies", text: "Jak definiujesz problem projektowy?" },
  { intent: "retrieval_core.competencies", text: "How do you structure a rapid usability test under time pressure?" },
  // ... add all utterances from the schema section
];
```

### 2.3. Build Vector Store
```ts
// vectorStore.ts
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { OpenAIEmbeddings } from "@langchain/openai";
import { Document } from "@langchain/core/documents";
import { DATASET } from "./dataset";
import { IntentExample } from "./intents";

export async function buildStore() {
  const embeddings = new OpenAIEmbeddings({ model: "text-embedding-3-large" });
  const docs: Document[] = DATASET.map((ex: IntentExample) => ({
    pageContent: ex.text,
    metadata: { intent: ex.intent }
  }));
  const store = await MemoryVectorStore.fromDocuments(docs, embeddings);
  return store;
}
```

### 2.4. Classifier (Embedding‑first)
```ts
// classify.ts
import { buildStore } from "./vectorStore";
import { IntentResult, IntentId, RoutingRules } from "./intents";

const DEFAULT_PRIORITY: IntentId[] = [
  "compliance.nda_privacy",
  "process.assignment_brief",
  "assets.assets_request",
  "logistics.compensation",
];

function hardBlockRule(q: string): IntentId | null {
  const s = q.toLowerCase();
  if (s.includes("nda") || s.includes("pouf") || s.includes("confidential")) {
    return "compliance.nda_privacy";
  }
  return null;
}

export async function classifyIntent(
  query: string,
  opts?: { k?: number; threshold?: number; routing?: RoutingRules }
): Promise<IntentResult> {
  const store = await buildStore();
  const k = opts?.k ?? 6;
  const threshold = opts?.threshold ?? 0.45;
  const routing = opts?.routing ?? { hardBlock: hardBlockRule, priority: DEFAULT_PRIORITY };

  // 1) hard routing
  const hard = routing.hardBlock?.(query);
  if (hard) {
    return { topIntent: hard, confidence: 1.0, matches: [{ intent: hard, score: 1, text: query }] };
  }

  // 2) vector similarity
  const results = await store.similaritySearchWithScore(query, k);
  const byIntent = new Map<IntentId, number>();
  const evidence: { intent: IntentId; score: number; text: string }[] = [];

  for (const [doc, score] of results) {
    // LangChain returns lower score = closer for some stores; normalize:
    const sim = 1 / (1 + score); // simple monotonic transform
    const intent = doc.metadata.intent as IntentId;
    byIntent.set(intent, (byIntent.get(intent) ?? 0) + sim);
    evidence.push({ intent, score: sim, text: doc.pageContent });
  }

  // pick best with priority tie‑break
  const ranked = Array.from(byIntent.entries()).sort((a, b) => b[1] - a[1]);
  let [topIntent, topScore] = ranked[0] ?? [("conversational.clarification" as IntentId), 0];

  if (routing.priority && ranked.length > 1) {
    const order = new Map(routing.priority.map((id, i) => [id, i]));
    ranked.sort((a, b) => {
      if (Math.abs(a[1] - b[1]) > 1e-6) return b[1] - a[1];
      return (order.get(a[0]) ?? 999) - (order.get(b[0]) ?? 999);
    });
    [topIntent, topScore] = ranked[0];
  }

  // threshold / fallback
  if (topScore < threshold) {
    topIntent = "conversational.clarification";
  }

  return { topIntent, confidence: Math.min(1, topScore), matches: evidence.slice(0, k) };
}
```

### 2.5. Optional: Hybrid LLM Reranker
Use an LLM to validate or flip between close intents (e.g., `case_study` vs `assets_request`):
```ts
// rerank.ts
import { ChatOpenAI } from "@langchain/openai";
import { z } from "zod";
import { StructuredOutputParser } from "langchain/output_parsers";
import { IntentId } from "./intents";

const schema = z.object({
  final_intent: z.string(),
  reason: z.string()
});

const parser = StructuredOutputParser.fromZodSchema(schema);

const sys = `You are an intent adjudicator for interview conversations.
Given the candidate's message and two candidate intents, decide which is correct.
Prefer compliance > process.assignment_brief > assets.assets_request > logistics.compensation > retrieval_core.case_study in ties.
Respond in JSON.`;

export async function rerankWithLLM(
  userText: string,
  intents: { id: IntentId; score: number }[]
) {
  const llm = new ChatOpenAI({ model: "gpt-4o-mini", temperature: 0 });
  const top2 = intents.slice(0, 2).map(i => i.id).join(" vs ");
  const prompt = [
    { role: "system", content: sys },
    { role: "user", content: `Text: ${userText}\nCandidates: ${top2}\n${parser.getFormatInstructions()}` }
  ] as any;

  const res = await llm.invoke(prompt);
  const out = await parser.parse(res.content as string);
  return out; // { final_intent, reason }
}
```

### 2.6. Usage
```ts
import { classifyIntent } from "./classify";

async function run() {
  const q = "Czy podpiszemy NDA przed omówieniem case?";
  const result = await classifyIntent(q);
  console.log(result);
}

run();
```

### 2.7. Tips
- Keep `example_utterances` **short and specific**. Add **10–20 per intent** as you observe real traffic.
- Periodically **re‑embed** after dataset updates.
- Log borderline cases and expand dataset accordingly.
- Consider **language detection** and normalize (PL/EN mixture works fine if examples cover both).
- For speed/scale, switch `MemoryVectorStore` to FAISS/Chroma.

---

## 3) Minimal Evaluation Loop
1. Create a CSV of test prompts with expected intents.  
2. Run `classifyIntent` and compute accuracy/F1.  
3. Add utterances for misclassified samples, re‑embed, repeat.

---

## 4) License/Notes
- Examples are yours to use in production.  
- Swap OpenAI embeddings with any provider compatible with LangChain.


---

## 5) Structured Prompt (Hybrid Classification)

Besides embeddings, you can enforce deterministic outputs with a **structured prompt**.

### Prompt Template
```text
You are an intent detector for interview conversations (recruiter ↔ candidate).
Decide which intent best matches the user's message.

## Intents (id → description + 2–4 example utterances)
{INTENT_CATALOG}

## Hard rules (priority, tie-break):
1) compliance.nda_privacy overrides everything when NDA/confidentiality/privacy is clearly requested.
2) Then process.assignment_brief > assets.assets_request > logistics.compensation > retrieval_core.case_study.
3) Prefer single top_intent; if uncertain, include up to 2 alt_intents with lower confidence.
4) Do NOT output chain-of-thought. Provide only a brief rationale and short evidence spans (quotes from the message).
5) If confidence < 0.45, classify as conversational.clarification.

## Context
<chat_history>
{CHAT_HISTORY}
</chat_history>

## Message
<message>
{USER_MESSAGE}
</message>

## Output JSON schema
Return ONLY a JSON object:
{
  "top_intent": "string",
  "confidence": 0.0-1.0,
  "alt_intents": [
    {"id": "string", "confidence": 0.0-1.0}
  ],
  "evidence": ["short quote"],
  "rationale_brief": "≤200 chars, high-level reason"
}
```

### TypeScript Example
See `structured.ts`:

```ts
import { z } from "zod";
import { StructuredOutputParser } from "langchain/output_parsers";
import { ChatOpenAI } from "@langchain/openai";

// schema
const schema = z.object({
  top_intent: z.string(),
  confidence: z.number().min(0).max(1),
  alt_intents: z.array(z.object({ id: z.string(), confidence: z.number() })).optional(),
  evidence: z.array(z.string()).max(3).optional(),
  rationale_brief: z.string().max(200)
});

const parser = StructuredOutputParser.fromZodSchema(schema);

export async function classifyWithPrompt(userMessage: string, catalog: string, history: string) {
  const model = new ChatOpenAI({ model: "gpt-4o-mini", temperature: 0 });
  const sys = `You are an intent detector. ${parser.getFormatInstructions()}`;
  const prompt = [
    { role: "system", content: sys },
    { role: "user", content: `
${catalog}

<chat_history>
${history}
</chat_history>

<message>
${userMessage}
</message>
`}];
  const res = await model.invoke(prompt);
  return parser.parse(res.content as string);
}
```

---

## 6) Intent Catalog (TS export)

You can auto-generate a `catalog.ts` from this dataset:

```ts
// catalog.ts
import { IntentId } from "./intents";

export interface IntentCatalogEntry {
  id: IntentId;
  description: string;
  example_utterances: string[];
}

export const INTENT_CATALOG: IntentCatalogEntry[] = [
  {
    id: "retrieval_core.competencies",
    description: "Verification of design craft & process (UX, UI, research, prototyping, accessibility)",
    example_utterances: [
      "Jak definiujesz problem projektowy?",
      "How do you structure a rapid usability test under time pressure?",
      "Jak zapewniasz dostępność (WCAG) w codziennej pracy?"
    ]
  },
  {
    id: "retrieval_core.case_study",
    description: "Deep dive into portfolio projects: trade-offs, metrics, outcomes.",
    example_utterances: [
      "Który projekt w portfolio najlepiej pokazuje Twoje umiejętności i dlaczego?",
      "Jak mierzyłeś sukces projektu i jakie były wyniki?",
      "Describe the hardest trade-off you made in this case."
    ]
  },
  // ... continue for all intents from the schema above
];

## 7) Integration Notes (Chat Pipeline)

- Wire 'classifyIntent()' at the start of every chat turn. If 'confidence < 0.45', return 'conversational.clarification' with a short clarifying question.
- For 'retrieval_core.*' intents, route to the RAG pipeline and apply intent-based boosts from 'docs/playbooks/RETRIEVAL_PLAYBOOK.md'.
- For 'logistics', 'process', 'assets', 'compliance', and 'conversational' intents, follow the response policies outlined in 'docs/CONVERSATIONAL_RAG.md' (Non-retrieval Flows).
- Use 'rerankWithLLM' only when top-2 intents are close. Respect hard rules: 'compliance.nda_privacy' overrides ties.
- Keep the 'INTENT_CATALOG' as the source of truth for the structured prompt fallback.

### Minimal Server Integration
- 'app/api/intent/route.ts' (debug endpoint): POST '{ query }' → 'classifyIntent'.
- 'app/api/chat/route.ts': detect intent → route → RAG or non-retrieval → generate answer → log '(query, intent, confidence, evidence)'.

### Maintenance
- Re-embed vectors after adding new 'example_utterances' to the dataset.
- Log borderline samples (0.40–0.55) and expand the dataset iteratively.
- Consider moving from 'MemoryVectorStore' to FAISS/Chroma for persistence.

<!-- CASCADE_APPEND_TARGET -->
