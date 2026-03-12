import { createAssessmentSession } from "@/lib/diagnostics/engine";
import { AssessmentSession, ProductType } from "@/lib/diagnostics/types";

export function buildFixtureSession(productType: ProductType = "dq"): AssessmentSession {
  const session = createAssessmentSession({
    productType,
    scopeType: "use_case",
    useCaseKey: "operational_reporting",
    answers: {
      record_disagreement: 2,
      decision_misalignment: 2,
      subjective_capture: 2,
      access_delay: 1,
      input_variability: 2,
      structure_translation: 2,
      brittle_reuse: 2,
      manual_rescue: 2,
      capture_foundation: 2,
      analytical_alignment: 1,
      quality_management: 1,
      reuse_governance: 1,
      ai_usability: 1,
    },
    evidence: {
      csvFiles: [
        {
          fileName: "ops.csv",
          content: "record_id,status,status\n1,open,open",
        },
      ],
      metricDefinitionText: "",
      workflowNotesText: "The team manually joins exports and repairs conflicting records before every review.",
    },
  });

  return {
    ...session,
    id: `${productType}-fixture-session`,
    startedAt: "2026-03-09T10:00:00.000Z",
    completedAt: "2026-03-09T10:10:00.000Z",
  };
}
