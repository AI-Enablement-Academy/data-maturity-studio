import { ProductType } from "@/lib/diagnostics/types";

export interface ProductConfig {
  productType: ProductType;
  title: string;
  shortTitle: string;
  summary: string;
  positioning: string;
  routeBase: `/${ProductType}`;
  questionIds: string[];
}

export const productConfigs: Record<ProductType, ProductConfig> = {
  dq: {
    productType: "dq",
    title: "Data Quality Diagnostic",
    shortTitle: "DQ",
    summary:
      "Diagnose the operating dimensions that determine whether a workflow can be trusted, reused, and prepared for controlled AI use.",
    positioning:
      "Use the Data Quality Diagnostic when you need the fuller diagnosis first: where trust breaks, where structure collapses, and what to fix next.",
    routeBase: "/dq",
    questionIds: [
      "record_disagreement",
      "decision_misalignment",
      "subjective_capture",
      "access_delay",
      "input_variability",
      "structure_translation",
      "brittle_reuse",
      "manual_rescue",
      "capture_foundation",
      "analytical_alignment",
      "quality_management",
      "reuse_governance",
      "ai_usability",
    ],
  },
  drl: {
    productType: "drl",
    title: "Readiness Check",
    shortTitle: "RC",
    summary:
      "Estimate the current workflow condition and show what still blocks dependable reuse.",
    positioning:
      "Use the Readiness Check when you need a shorter first-pass snapshot with explicit capability gaps.",
    routeBase: "/drl",
    questionIds: [
      "record_disagreement",
      "decision_misalignment",
      "subjective_capture",
      "access_delay",
      "brittle_reuse",
      "manual_rescue",
      "capture_foundation",
      "analytical_alignment",
      "quality_management",
      "reuse_governance",
      "ai_usability",
    ],
  },
};
