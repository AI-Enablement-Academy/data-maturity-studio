import { createAssessmentSession } from "@/lib/diagnostics/engine";
import { getDeterministicChatReply } from "@/lib/diagnostics/deterministic-chat";

const session = createAssessmentSession({
  productType: "dq",
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
    csvFiles: [],
    metricDefinitionText: "",
    workflowNotesText: "",
  },
});

describe("getDeterministicChatReply", () => {
  it("explains the workflow state deterministically", () => {
    const reply = getDeterministicChatReply(session, "What workflow state is this and why?");
    expect(reply).toMatch(/workflow state/i);
    expect(reply).toMatch(/stabilizing|managed|fragile|ready/i);
  });

  it("returns action guidance for next-step questions", () => {
    const reply = getDeterministicChatReply(session, "What should we do next?");
    expect(reply).toMatch(/next moves/i);
    expect(reply).toMatch(/immediate actions/i);
  });
});
