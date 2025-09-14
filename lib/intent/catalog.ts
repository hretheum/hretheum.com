// Intent Catalog (short descriptions + example utterances)
// Documentation: See docs/playbooks/intent_detector_dataset_and_ts_setup_UPDATED.md (section 6)

import type { IntentId } from "./intents";

export interface IntentCatalogEntry {
  id: IntentId;
  description: string;
  example_utterances: string[];
}

// NOTE: This is a compact seed catalog. Extend with the full set from the playbook as needed.
export const INTENT_CATALOG: IntentCatalogEntry[] = [
  {
    id: "retrieval_core.competencies",
    description:
      "Verification of design craft & process (UX, UI, research, prototyping, accessibility).",
    example_utterances: [
      "Jak definiujesz problem projektowy?",
      "How do you structure a rapid usability test under time pressure?",
      "Jak zapewniasz dostępność (WCAG) w codziennej pracy?"
    ]
  },
  {
    id: "retrieval_core.case_study",
    description:
      "Deep dive into portfolio projects: trade-offs, metrics, outcomes.",
    example_utterances: [
      "Który projekt w portfolio najlepiej pokazuje Twoje umiejętności i dlaczego?",
      "Jak mierzyłeś sukces projektu i jakie były wyniki?",
      "Describe the hardest trade-off you made in this case."
    ]
  },
  {
    id: "logistics.compensation",
    description: "Salary/band, contract type, equity/bonus.",
    example_utterances: [
      "Jakie masz oczekiwania finansowe?",
      "What range are you targeting?",
      "B2B czy UoP — co preferujesz i dlaczego?"
    ]
  },
  {
    id: "compliance.nda_privacy",
    description: "Confidentiality, NDA, sensitive data in cases.",
    example_utterances: [
      "Czy podpiszemy NDA przed zagłębieniem w case?",
      "Does your case reveal any confidential data?",
      "Jak anonimizujesz materiały w portfolio?"
    ]
  },
  {
    id: "conversational.clarification",
    description: "Asking to clarify scope/meaning/context.",
    example_utterances: [
      "Możesz doprecyzować pytanie?",
      "What do you mean by 'impact'?",
      "Czy chodzi o projekt X czy Y?"
    ]
  }
];
