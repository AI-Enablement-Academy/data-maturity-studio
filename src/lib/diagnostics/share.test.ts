import { describe, expect, it } from "vitest";

import { decodeSharedSession, encodeSharedSession } from "@/lib/diagnostics/share";
import { AssessmentSession } from "@/lib/diagnostics/types";

function buildSession(): AssessmentSession {
  return {
    id: "shared-session",
    productType: "dq",
    scopeType: "use_case",
    useCaseKey: "general_workflow",
    startedAt: "2026-03-09T10:00:00.000Z",
    completedAt: "2026-03-09T10:10:00.000Z",
    answers: {},
    evidenceSummary: {
      notes: ["Evidence mentions manual reconciliation."],
      tags: ["record-conflict"],
      confidenceBoost: 0.1,
      dimensionAdjustments: {
        record_reliability: 0.4,
      },
    },
    scores: {
      record_reliability: 3,
      decision_fit: 2,
      structure_interpretability: 2,
      access_control: 1,
      quality_discipline: 2,
      reuse_operating_model: 3,
    },
    operatingState: "Stabilizing",
    confidence: {
      label: "High",
      score: 0.92,
      notes: ["Use case mode improves confidence."],
    },
    resultModel: {
      topBlockers: [],
      dimensionScores: [],
      operatingState: "Stabilizing",
      operatingStateRationale: {
        state: "Stabilizing",
        summary: "This workflow still needs recurring repair work before dependable reuse.",
        whyNotFurther: ["Quality loops and reuse governance are still uneven."],
        thresholdNotes: ["Core structure exists, but control discipline is still patchy."],
      },
      capabilityGaps: ["Ownership and change control for reuse are still too weak to keep the workflow stable."],
      actionPlan: [],
      summaryCard: "This workflow is stabilizing and only conditionally usable for narrow AI workflows.",
      confidence: {
        label: "High",
        score: 0.92,
        notes: ["Use case mode improves confidence."],
      },
      evidenceSummary: {
        notes: ["Evidence mentions manual reconciliation."],
        tags: ["record-conflict"],
        confidenceBoost: 0.1,
        dimensionAdjustments: {
          record_reliability: 0.4,
        },
      },
      readinessSignals: {
        capture_foundation: 1.8,
        analytical_alignment: 1.4,
        structured_data_readiness: 1.2,
        access_reliability: 1.6,
        quality_loop: 1.4,
        reuse_governance: 1.3,
        ai_operational_fit: 1.1,
      },
      aiSuitability: {
        label: "Conditionally usable for narrow AI workflows",
        summary: "Some AI use is possible, but only with narrow scope and extra guardrails.",
      },
    },
  };
}

describe("share helpers", () => {
  it("round-trips a shareable assessment session", () => {
    const session = buildSession();

    const encoded = encodeSharedSession(session);
    const decoded = decodeSharedSession(encoded);

    expect(encoded.length).toBeGreaterThan(0);
    expect(decoded).toMatchObject({
      id: session.id,
      productType: session.productType,
      scopeType: session.scopeType,
      useCaseKey: session.useCaseKey,
      completedAt: session.completedAt,
      operatingState: session.operatingState,
    });
    expect(decoded?.resultModel.summaryCard).toBe(session.resultModel.summaryCard);
    expect(decoded).not.toHaveProperty("answers");
    expect(decoded?.resultModel.evidenceSummary.notes).toEqual([]);
  });

  it("returns null for malformed input", () => {
    expect(decodeSharedSession("not-a-valid-share-payload")).toBeNull();
  });
});
