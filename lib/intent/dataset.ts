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
  { intent: "retrieval_core.competencies", text: "Jakie znasz metody ewaluacji użyteczności?" },
  { intent: "retrieval_core.competencies", text: "How do you handle accessibility in day-to-day work?" },

  // retrieval_core.case_study
  {
    intent: "retrieval_core.case_study",
    text: "Który projekt w portfolio najlepiej pokazuje Twoje umiejętności i dlaczego?",
  },
  { intent: "retrieval_core.case_study", text: "Jak mierzyłeś sukces projektu i jakie były wyniki?" },
  { intent: "retrieval_core.case_study", text: "Describe the hardest trade-off you made in this case." },
  { intent: "retrieval_core.case_study", text: "Co byś dziś zmienił w tym case study?" },
  { intent: "retrieval_core.case_study", text: "How did stakeholder feedback change your solution?" },

  // retrieval_core.leadership
  { intent: "retrieval_core.leadership", text: "Jak budujesz zaufanie w zespole?" },
  { intent: "retrieval_core.leadership", text: "Opisz sytuację konfliktu i jak ją rozwiązałeś" },
  { intent: "retrieval_core.leadership", text: "How do you grow juniors vs seniors?" },
  { intent: "retrieval_core.leadership", text: "Jak wprowadzasz kulturę feedbacku?" },

  // logistics.compensation
  { intent: "logistics.compensation", text: "Jakie masz oczekiwania finansowe?" },
  { intent: "logistics.compensation", text: "What range are you targeting?" },
  { intent: "logistics.compensation", text: "B2B czy UoP — co preferujesz i dlaczego?" },

  // retrieval_core.experience
  { intent: "retrieval_core.experience", text: "Jak wyglądał Twój ostatni zespół i Twój zakres?" },
  { intent: "retrieval_core.experience", text: "Współpraca z product managerami — co działało, co nie?" },
  { intent: "retrieval_core.experience", text: "Which KPIs did you directly influence?" },

  // retrieval_core.product_sense
  { intent: "retrieval_core.product_sense", text: "Jak definiujesz MVP w warunkach niepewności?" },
  { intent: "retrieval_core.product_sense", text: "What would you change in our product and why?" },
  { intent: "retrieval_core.product_sense", text: "Jak rozumiesz north star metric dla tego produktu?" },

  // retrieval_core.research_process
  { intent: "retrieval_core.research_process", text: "Jak planujesz sprint badawczy i dobierasz metody?" },
  { intent: "retrieval_core.research_process", text: "How do you structure interviews to avoid bias?" },
  { intent: "retrieval_core.research_process", text: "W jaki sposób dokumentujesz i udostępniasz insighty?" },

  // retrieval_core.design_systems
  { intent: "retrieval_core.design_systems", text: "Jak utrzymujesz spójność designu w wielu produktach?" },
  { intent: "retrieval_core.design_systems", text: "Opisz wasz system design tokens i governance" },
  { intent: "retrieval_core.design_systems", text: "How did you integrate Storybook with the DS?" },

  // retrieval_core.metrics_experiments
  { intent: "retrieval_core.metrics_experiments", text: "Jak weryfikujesz czy design przynosi ROI?" },
  { intent: "retrieval_core.metrics_experiments", text: "Describe your last A/B test and learnings" },
  { intent: "retrieval_core.metrics_experiments", text: "Jakie metryki były kluczowe dla decyzji produktowych?" },

  // retrieval_core.stakeholder_mgmt
  { intent: "retrieval_core.stakeholder_mgmt", text: "Jak przekonywałeś interesariuszy do inwestycji w UX?" },
  { intent: "retrieval_core.stakeholder_mgmt", text: "Tell me about a time you aligned conflicting stakeholders" },
  { intent: "retrieval_core.stakeholder_mgmt", text: "Jak dokumentujesz decyzje i rationale?" },

  // retrieval_core.tools_automation
  { intent: "retrieval_core.tools_automation", text: "Jak korzystasz z Figmy w zespole na co dzień?" },
  { intent: "retrieval_core.tools_automation", text: "How do you automate routine design ops?" },
  { intent: "retrieval_core.tools_automation", text: "Jak dokumentujesz proces w Notion lub Confluence?" },

  // compliance.nda_privacy
  { intent: "compliance.nda_privacy", text: "Czy podpiszemy NDA przed zagłębieniem w case?" },
  { intent: "compliance.nda_privacy", text: "Does your case reveal any confidential data?" },
  { intent: "compliance.nda_privacy", text: "Jak anonimizujesz materiały w portfolio?" },

  // compliance.data_processing_ip
  { intent: "compliance.data_processing_ip", text: "Kto jest właścicielem IP w projektach?" },
  { intent: "compliance.data_processing_ip", text: "How do you ensure GDPR compliance in research?" },
  { intent: "compliance.data_processing_ip", text: "Do you separate PII in your repositories?" },

  // compliance.accessibility_compliance
  { intent: "compliance.accessibility_compliance", text: "Jak zapewniasz zgodność z WCAG?" },
  { intent: "compliance.accessibility_compliance", text: "Do you run accessibility audits?" },
  { intent: "compliance.accessibility_compliance", text: "Jakie narzędzia używasz do audytu?" },

  // conversational.clarification
  { intent: "conversational.clarification", text: "Możesz doprecyzować pytanie?" },
  { intent: "conversational.clarification", text: "What do you mean by 'impact'?" },
  { intent: "conversational.clarification", text: "Czy chodzi o projekt X czy Y?" },

  // conversational.smalltalk
  { intent: "conversational.smalltalk", text: "Jak minął dzień?" },
  { intent: "conversational.smalltalk", text: "Great to finally meet you" },
  { intent: "conversational.smalltalk", text: "Zanim zaczniemy, kawa czy herbata?" },

  // conversational.rapport_meta
  { intent: "conversational.rapport_meta", text: "Wolisz krótkie odpowiedzi czy dłuższe przykłady?" },
  { intent: "conversational.rapport_meta", text: "Can I sketch a quick diagram?" },
  { intent: "conversational.rapport_meta", text: "Czy mogę wrócić do tego wątku później?" },

  // conversational.curveballs_creative
  { intent: "conversational.curveballs_creative", text: "Opisz kolor żółty osobie niewidomej" },
  { intent: "conversational.curveballs_creative", text: "Jak zaprojektujesz budzik dla niesłyszących?" },
  { intent: "conversational.curveballs_creative", text: "Which three apps would you kill and why?" },

  // role_fit.skill_verification
  { intent: "role_fit.skill_verification", text: "W jakim obszarze jesteś najsilniejszy?" },
  { intent: "role_fit.skill_verification", text: "How do you handle high-fidelity prototyping?" },
  { intent: "role_fit.skill_verification", text: "Jak radzisz sobie z analityką danych?" },

  // role_fit.domain_expertise
  { intent: "role_fit.domain_expertise", text: "Jak oceniasz konkurencję w naszej domenie?" },
  { intent: "role_fit.domain_expertise", text: "Doświadczenie w betting/trading — kluczowe wyzwania?" },
  { intent: "role_fit.domain_expertise", text: "How would you adapt to strictly regulated markets?" },

  // role_fit.fit_assessment
  { intent: "role_fit.fit_assessment", text: "Co Cię napędza do pracy?" },
  { intent: "role_fit.fit_assessment", text: "Jak opisałbyś swój styl pracy w zespole?" },
  { intent: "role_fit.fit_assessment", text: "What kind of team culture helps you thrive?" },

  // role_fit.behavioral
  { intent: "role_fit.behavioral", text: "Opowiedz o porażce i czego Cię nauczyła" },
  { intent: "role_fit.behavioral", text: "Tell me about an unpopular decision you stood by" },
  { intent: "role_fit.behavioral", text: "Jak wyciągasz lekcje z błędów?" },

  // logistics.availability
  { intent: "logistics.availability", text: "Od kiedy możesz zacząć?" },
  { intent: "logistics.availability", text: "Jaki masz okres wypowiedzenia?" },
  { intent: "logistics.availability", text: "When are you available for next steps?" },

  // logistics.location_remote
  { intent: "logistics.location_remote", text: "Preferujesz pracę zdalną czy hybrydową?" },
  { intent: "logistics.location_remote", text: "Are time zone overlaps a problem for you?" },
  { intent: "logistics.location_remote", text: "Jak często bywasz w biurze?" },

  // logistics.scheduling
  { intent: "logistics.scheduling", text: "Kiedy pasują Ci kolejne etapy?" },
  { intent: "logistics.scheduling", text: "Proszę o 3 propozycje terminów" },
  { intent: "logistics.scheduling", text: "Can we schedule a 45-min portfolio deep-dive?" },

  // logistics.visa_relocation_travel
  { intent: "logistics.visa_relocation_travel", text: "Czy rozważasz relokację?" },
  { intent: "logistics.visa_relocation_travel", text: "Do you require visa sponsorship?" },
  { intent: "logistics.visa_relocation_travel", text: "Jak podchodzisz do podróży służbowych?" },

  // process.hiring_process
  { intent: "process.hiring_process", text: "Jak wygląda proces rekrutacji?" },
  { intent: "process.hiring_process", text: "Kiedy mogę spodziewać się decyzji i feedbacku?" },
  { intent: "process.hiring_process", text: "Will there be a live exercise?" },

  // process.assignment_brief
  { intent: "process.assignment_brief", text: "Czy będzie zadanie domowe?" },
  { intent: "process.assignment_brief", text: "What are the evaluation criteria?" },
  { intent: "process.assignment_brief", text: "Jaki jest zakres i deadline zadania?" },

  // assets.assets_request
  { intent: "assets.assets_request", text: "Proszę o portfolio lub deck case studies" },
  { intent: "assets.assets_request", text: "Can you share a condensed case deck?" },
  { intent: "assets.assets_request", text: "Masz referencje od poprzednich pracodawców?" },

  // assets.code_or_design_files
  { intent: "assets.code_or_design_files", text: "Czy możesz udostępnić prototyp Figmy?" },
  { intent: "assets.code_or_design_files", text: "Link do Storybooka albo repo?" },
  { intent: "assets.code_or_design_files", text: "Masz wersję high-fidelity do pokazania?" },
];
