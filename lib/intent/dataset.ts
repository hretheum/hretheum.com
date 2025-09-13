// Intent examples dataset (seed). Extend with the full set from the playbook.
// Documentation: See docs/playbooks/intent_detector_dataset_and_ts_setup_UPDATED.md (section 1)

import type { IntentExample } from "./intents";

export const DATASET: IntentExample[] = [
  // retrieval_core.competencies
  { intent: "retrieval_core.competencies", text: "Jak definiujesz problem projektowy?" },
  {
    intent: "retrieval_core.competencies",
    text: "How do you structure a rapid usability test under time pressure?",
  },
  { intent: "retrieval_core.competencies", text: "Jak zapewniasz dostępność (WCAG) w codziennej pracy?" },

  // retrieval_core.case_study
  {
    intent: "retrieval_core.case_study",
    text: "Który projekt w portfolio najlepiej pokazuje Twoje umiejętności i dlaczego?",
  },
  { intent: "retrieval_core.case_study", text: "Jak mierzyłeś sukces projektu i jakie były wyniki?" },
  { intent: "retrieval_core.case_study", text: "Describe the hardest trade-off you made in this case." },

  // logistics.compensation
  { intent: "logistics.compensation", text: "Jakie masz oczekiwania finansowe?" },
  { intent: "logistics.compensation", text: "What range are you targeting?" },
  { intent: "logistics.compensation", text: "B2B czy UoP — co preferujesz i dlaczego?" },

  // compliance.nda_privacy
  { intent: "compliance.nda_privacy", text: "Czy podpiszemy NDA przed zagłębieniem w case?" },
  { intent: "compliance.nda_privacy", text: "Does your case reveal any confidential data?" },
  { intent: "compliance.nda_privacy", text: "Jak anonimizujesz materiały w portfolio?" },

  // conversational.clarification
  { intent: "conversational.clarification", text: "Możesz doprecyzować pytanie?" },
  { intent: "conversational.clarification", text: "What do you mean by 'impact'?" },
  { intent: "conversational.clarification", text: "Czy chodzi o projekt X czy Y?" },
];
