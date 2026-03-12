import { buildResultModel, createAssessmentSession, rebuildAssessmentSessionForProduct } from "@/lib/diagnostics/engine";
import { AssessmentInput, AssessmentAnswers } from "@/lib/diagnostics/types";

function buildInput(overrides: Partial<AssessmentInput> = {}): AssessmentInput {
  return {
    productType: "dq",
    scopeType: "use_case",
    useCaseKey: "operational_reporting",
    answers: {},
    evidence: {
      csvFiles: [],
      metricDefinitionText: "",
      workflowNotesText: "",
    },
    ...overrides,
  };
}

function buildAnswers(values: Partial<AssessmentAnswers>): AssessmentAnswers {
  return values;
}

describe("buildResultModel", () => {
  it("classifies a repair-heavy workflow as Fragile", () => {
    const result = buildResultModel(
      buildInput({
        answers: buildAnswers({
          record_disagreement: 3,
          decision_misalignment: 2,
          subjective_capture: 3,
          access_delay: 2,
          input_variability: 3,
          structure_translation: 3,
          brittle_reuse: 3,
          manual_rescue: 3,
          capture_foundation: 0,
          analytical_alignment: 0,
          quality_management: 0,
          reuse_governance: 0,
          ai_usability: 0,
        }),
      }),
    );

    expect(result.operatingState).toBe("Fragile");
    expect(result.aiSuitability.label).toBe("Not ready for dependable AI reuse");
    expect(result.topBlockers).toHaveLength(3);
    expect(result.capabilityGaps.length).toBeGreaterThan(1);
  });

  it("keeps a mixed workflow in Stabilizing when structure exists but control loops stay uneven", () => {
    const result = buildResultModel(
      buildInput({
        answers: buildAnswers({
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
        }),
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
      }),
    );

    expect(result.operatingState).toBe("Stabilizing");
    expect(result.capabilityGaps.length).toBeGreaterThan(0);
    expect(result.confidence.label).toBe("High");
  });

  it("awards Ready when controls, reuse governance, and structure are all deliberate", () => {
    const result = buildResultModel(
      buildInput({
        answers: buildAnswers({
          record_disagreement: 0,
          decision_misalignment: 0,
          subjective_capture: 0,
          access_delay: 0,
          input_variability: 0,
          structure_translation: 0,
          brittle_reuse: 0,
          manual_rescue: 0,
          capture_foundation: 3,
          analytical_alignment: 3,
          quality_management: 3,
          reuse_governance: 3,
          ai_usability: 3,
        }),
      }),
    );

    expect(result.operatingState).toBe("Ready");
    expect(result.aiSuitability.label).toBe("Ready for controlled AI use");
    expect(result.operatingStateRationale.summary).toMatch(/deliberately structured/i);
  });

  it("can derive a readiness-check report from a saved DQ session without trusting old output", () => {
    const dqSession = createAssessmentSession(
      buildInput({
        answers: buildAnswers({
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
        }),
      }),
    );

    const tamperedSession = {
      ...dqSession,
      resultModel: {
        ...dqSession.resultModel,
        summaryCard: "tampered",
      },
    };

    const readinessSession = rebuildAssessmentSessionForProduct(tamperedSession, "drl");

    expect(readinessSession.productType).toBe("drl");
    expect(readinessSession.resultModel.summaryCard).not.toBe("tampered");
    expect(readinessSession.resultModel.summaryCard).toContain("Operational Reporting");
  });
});
