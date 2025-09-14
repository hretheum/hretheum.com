// Types for Intent Detection
// Documentation: See docs/playbooks/intent_detector_dataset_and_ts_setup_UPDATED.md (sections 1, 2.2)

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
  confidence: number; // 0..1
  matches: { intent: IntentId; score: number; text: string }[]; // top-k evidence
}

export interface RoutingRules {
  hardBlock?: (q: string) => IntentId | null; // e.g., NDA overrides
  priority?: IntentId[]; // optional priority list
}
