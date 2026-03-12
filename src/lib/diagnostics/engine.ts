import {
  diagnosticDimensions,
  interventionCatalog,
  readinessSignals,
  useCases,
} from "@/lib/diagnostics/catalog";
import { summarizeEvidence } from "@/lib/diagnostics/evidence";
import { questionBank } from "@/lib/diagnostics/questions";
import {
  ActionPlanItem,
  AnswerValue,
  AssessmentInput,
  AssessmentSession,
  ConfidenceLabel,
  DiagnosticDimensionKey,
  DiagnosticDimensionScore,
  EvidenceSummary,
  ProductType,
  ReadinessSignalKey,
  ResultModel,
} from "@/lib/diagnostics/types";

const severityLabels = [
  "No current issue",
  "Mild",
  "Significant",
  "Severe",
] as const;

function clampToAnswerValue(value: number): AnswerValue {
  return Math.max(0, Math.min(3, Math.round(value))) as AnswerValue;
}

function getApplicableQuestions(input: AssessmentInput) {
  return questionBank.filter(
    (question) =>
      question.productTypes.includes(input.productType) &&
      question.scopeTypes.includes(input.scopeType),
  );
}

function hasAnswer(value: unknown): value is AnswerValue {
  return value === 0 || value === 1 || value === 2 || value === 3;
}

function getQuestionContribution(
  answer: number,
  direction: "risk" | "maturity",
  targetDirection: "risk" | "maturity",
) {
  return direction === targetDirection ? answer : 3 - answer;
}

function emptyEvidenceInput(): AssessmentInput["evidence"] {
  return {
    csvFiles: [],
    metricDefinitionText: "",
    workflowNotesText: "",
  };
}

function normalizeEvidenceSummary(
  evidenceSummary: Partial<EvidenceSummary> | null | undefined,
): EvidenceSummary {
  const dimensionAdjustments = Object.fromEntries(
    diagnosticDimensions.map((dimension) => {
      const rawValue = evidenceSummary?.dimensionAdjustments?.[dimension.key];
      const safeValue =
        typeof rawValue === "number" && Number.isFinite(rawValue)
          ? Math.max(0, Math.min(0.8, rawValue))
          : 0;
      return [dimension.key, safeValue];
    }),
  ) as Record<DiagnosticDimensionKey, number>;

  return {
    notes: Array.isArray(evidenceSummary?.notes)
      ? evidenceSummary.notes.filter((note): note is string => typeof note === "string").slice(0, 10)
      : [],
    tags: Array.isArray(evidenceSummary?.tags)
      ? evidenceSummary.tags.filter((tag): tag is string => typeof tag === "string").slice(0, 12)
      : [],
    confidenceBoost:
      typeof evidenceSummary?.confidenceBoost === "number" && Number.isFinite(evidenceSummary.confidenceBoost)
        ? Math.max(0, Math.min(12, evidenceSummary.confidenceBoost))
        : 0,
    dimensionAdjustments,
  };
}

function getDimensionScores(
  input: AssessmentInput,
  evidenceSummary: ResultModel["evidenceSummary"],
) {
  const applicableQuestions = getApplicableQuestions(input);
  const scores = {} as Record<DiagnosticDimensionKey, DiagnosticDimensionScore>;

  for (const dimension of diagnosticDimensions) {
    const contributions = applicableQuestions
      .map((question) => {
        const weight = question.dimensionWeights[dimension.key];
        const rawAnswer = input.answers[question.id];
        if (weight === undefined || !hasAnswer(rawAnswer)) {
          return null;
        }

        return {
          questionId: question.id,
          shortLabel: question.shortLabel,
          value: getQuestionContribution(rawAnswer, question.direction, "risk") * weight,
          weight,
        };
      })
      .filter(Boolean) as Array<{
      questionId: string;
      shortLabel: string;
      value: number;
      weight: number;
    }>;

    const weightedAverage =
      contributions.reduce((sum, item) => sum + item.value, 0) /
      Math.max(
        contributions.reduce((sum, item) => sum + item.weight, 0),
        1,
      );

    const evidenceAdjustment = evidenceSummary.dimensionAdjustments[dimension.key] ?? 0;
    const score = clampToAnswerValue(weightedAverage + evidenceAdjustment);
    const contributingQuestions = contributions
      .sort((left, right) => right.value - left.value)
      .slice(0, 3)
      .map((item) => item.shortLabel);

    scores[dimension.key] = {
      key: dimension.key,
      title: dimension.title,
      score,
      severityLabel: severityLabels[score],
      contributingQuestions,
      explanation:
        score === 0
          ? `Current answers do not show a material issue in ${dimension.title.toLowerCase()}.`
          : `${dimension.summary} This diagnostic points most strongly to ${contributingQuestions.join(", ").toLowerCase() || "the supplied evidence"} as the pressure points in this workflow. ${dimension.improvementTarget}`,
    };
  }

  return scores;
}

function getReadinessSignals(input: AssessmentInput) {
  const applicableQuestions = getApplicableQuestions(input);
  const signalScores = {} as Record<ReadinessSignalKey, number>;

  for (const signal of readinessSignals) {
    const contributions = applicableQuestions
      .map((question) => {
        const weight = question.signalWeights[signal.key];
        const rawAnswer = input.answers[question.id];
        if (weight === undefined || !hasAnswer(rawAnswer)) {
          return null;
        }

        return {
          value: getQuestionContribution(rawAnswer, question.direction, signal.direction) * weight,
          weight,
        };
      })
      .filter(
        (value): value is { value: number; weight: number } => value !== null,
      );

    const weightedAverage =
      contributions.reduce((sum, item) => sum + item.value, 0) /
      Math.max(
        contributions.reduce((sum, item) => sum + item.weight, 0),
        1,
      );

    signalScores[signal.key] = Number(weightedAverage.toFixed(2));
  }

  return signalScores;
}

function getCriticalPressure(
  dimensionScores: Record<DiagnosticDimensionKey, DiagnosticDimensionScore>,
) {
  return Math.max(
    dimensionScores.record_reliability.score,
    dimensionScores.structure_interpretability.score,
    dimensionScores.quality_discipline.score,
    dimensionScores.reuse_operating_model.score,
  );
}

function getOperatingState(
  signalScores: Record<ReadinessSignalKey, number>,
  dimensionScores: Record<DiagnosticDimensionKey, DiagnosticDimensionScore>,
): ResultModel["operatingStateRationale"] {
  const severeOrSignificantCount = Object.values(dimensionScores).filter((item) => item.score >= 2).length;
  const criticalPressure = getCriticalPressure(dimensionScores);
  const thresholdNotes: string[] = [];

  if (
    signalScores.capture_foundation >= 2.3 &&
    signalScores.analytical_alignment >= 2.1 &&
    signalScores.structured_data_readiness >= 2.1 &&
    signalScores.access_reliability >= 2 &&
    signalScores.quality_loop >= 2.3 &&
    signalScores.reuse_governance >= 2.3 &&
    signalScores.ai_operational_fit >= 2 &&
    criticalPressure <= 1
  ) {
    thresholdNotes.push(
      "Capture, alignment, structure, access, quality management, and reuse governance are all strong and stable.",
    );
    return {
      state: "Ready",
      summary:
        "This workflow is deliberately structured, well-governed, and fit for dependable downstream reuse. The operating model is stable enough for controlled AI use without constant manual rescue.",
      whyNotFurther: [],
      thresholdNotes,
    };
  }

  if (
    signalScores.capture_foundation >= 1.7 &&
    signalScores.analytical_alignment >= 1.7 &&
    signalScores.structured_data_readiness >= 1.5 &&
    signalScores.access_reliability >= 1.4 &&
    signalScores.quality_loop >= 1.8 &&
    signalScores.reuse_governance >= 1.8 &&
    criticalPressure <= 2
  ) {
    thresholdNotes.push(
      "The workflow has repeatable controls and a usable operating model, but some higher-friction elements still limit broader reuse.",
    );
    return {
      state: "Managed",
      summary:
        "This workflow can support dependable analytics with repeatable controls, explicit ownership, and manageable translation cost. It is no longer purely reactive, but it is not yet ready for broad AI reuse without tighter structure and governance.",
      whyNotFurther: [
        signalScores.ai_operational_fit < 2
          ? "AI-specific reuse is still narrow and depends on extra caveat writing or cleanup."
          : "A few core controls still depend on expert intervention rather than routine operating discipline.",
      ],
      thresholdNotes,
    };
  }

  if (
    signalScores.capture_foundation < 1.2 ||
    signalScores.quality_loop < 1 ||
    (criticalPressure >= 3 && severeOrSignificantCount >= 4)
  ) {
    thresholdNotes.push(
      "The workflow still depends on unstable records, reactive fixes, or weak control loops.",
    );
    return {
      state: "Fragile",
      summary:
        "The workflow still behaves like something that has to be rescued into usefulness. Trust, structure, and reuse are too unstable for dependable downstream analysis, let alone safe AI reuse.",
      whyNotFurther: [
        "Stable capture and routine quality review are not yet strong enough to support a stronger workflow state.",
        "Too many dimensions still require repeated manual rescue.",
      ],
      thresholdNotes,
    };
  }

  thresholdNotes.push(
    "The workflow has enough structure to run, but it still depends on uneven controls, translation work, and reusable-ownership gaps.",
  );
  return {
    state: "Stabilizing",
    summary:
      "The workflow is no longer purely fragile, but it still absorbs recurring repair work. Core data exists and can support repeated use, yet the operating model, controls, and structure are not strong enough for dependable reuse at scale.",
    whyNotFurther: [
      "Quality review and reuse ownership are still inconsistent.",
      "Key dimensions still require manual cleanup before reuse.",
    ],
    thresholdNotes,
  };
}

function getAiSuitability(
  signalScores: Record<ReadinessSignalKey, number>,
  dimensionScores: Record<DiagnosticDimensionKey, DiagnosticDimensionScore>,
): ResultModel["aiSuitability"] {
  if (
    signalScores.structured_data_readiness >= 2.1 &&
    signalScores.ai_operational_fit >= 2 &&
    signalScores.quality_loop >= 2 &&
    signalScores.reuse_governance >= 2 &&
    dimensionScores.record_reliability.score <= 1 &&
    dimensionScores.structure_interpretability.score <= 1
  ) {
    return {
      label: "Ready for controlled AI use",
      summary:
        "The workflow has enough structure, quality discipline, and reuse governance for narrow but dependable AI use under explicit controls.",
    };
  }

  if (
    signalScores.structured_data_readiness >= 1.4 &&
    signalScores.ai_operational_fit >= 1.2 &&
    signalScores.quality_loop >= 1.3 &&
    dimensionScores.record_reliability.score <= 2 &&
    dimensionScores.structure_interpretability.score <= 2
  ) {
    return {
      label: "Conditionally usable for narrow AI workflows",
      summary:
        "Some AI use is possible, but only if the workflow stays narrow and the team accepts extra guardrails, translation work, and monitoring.",
    };
  }

  return {
    label: "Not ready for dependable AI reuse",
    summary:
      "The workflow still depends on too much repair work, ambiguity, or unstable structure to expose safely to dependable AI reuse.",
  };
}

function getConfidence(
  input: AssessmentInput,
  dimensionScores: Record<DiagnosticDimensionKey, DiagnosticDimensionScore>,
  evidenceSummary: ResultModel["evidenceSummary"],
) {
  const applicableQuestions = getApplicableQuestions(input);
  const answeredCount = applicableQuestions.filter((question) => hasAnswer(input.answers[question.id])).length;
  const completeness = answeredCount / Math.max(applicableQuestions.length, 1);

  const varianceSignals = [
    dimensionScores.record_reliability.score,
    dimensionScores.structure_interpretability.score,
    dimensionScores.reuse_operating_model.score,
  ];
  const consistencyPenalty = Math.max(...varianceSignals) - Math.min(...varianceSignals) > 2 ? 8 : 0;

  let score = Math.round(
    completeness * 68 +
      (input.scopeType === "use_case" ? 14 : 7) +
      Math.min(12, evidenceSummary.confidenceBoost) -
      consistencyPenalty,
  );

  score = Math.max(28, Math.min(95, score));

  let label: ConfidenceLabel = "Low";
  if (score >= 75) {
    label = "High";
  } else if (score >= 55) {
    label = "Moderate";
  }

  const notes = [
    completeness < 1
      ? "Some questions were left unanswered, which lowers confidence."
      : "The questionnaire was completed in full.",
    input.scopeType === "organization"
      ? "Organization mode is directional and naturally less precise."
      : "Use case mode improves precision by grounding the diagnosis in one workflow.",
    ...evidenceSummary.notes.slice(0, 2),
  ];

  return { label, score, notes };
}

function getCapabilityGaps(
  signalScores: Record<ReadinessSignalKey, number>,
  dimensionScores: Record<DiagnosticDimensionKey, DiagnosticDimensionScore>,
  aiSuitability: ResultModel["aiSuitability"],
) {
  const gaps: string[] = [];

  if (dimensionScores.record_reliability.score >= 2) {
    gaps.push("Core records still disagree or fail validation often enough to undermine trust.");
  }
  if (dimensionScores.decision_fit.score >= 2) {
    gaps.push("The collected data is still misaligned with the decision this workflow claims to support.");
  }
  if (dimensionScores.structure_interpretability.score >= 2) {
    gaps.push("Too much signal still needs translation before another team or model can reuse it safely.");
  }
  if (dimensionScores.access_control.score >= 2) {
    gaps.push("Access friction and control overhead still slow the workflow down materially.");
  }
  if (signalScores.quality_loop < 1.8) {
    gaps.push("Quality rules are not yet measured and reviewed consistently enough to sustain reliable reuse.");
  }
  if (signalScores.reuse_governance < 1.8) {
    gaps.push("Ownership and change control for reuse are still too weak to keep the workflow stable.");
  }
  if (aiSuitability.label === "Not ready for dependable AI reuse") {
    gaps.push("AI reuse is still blocked by unstable structure, quality control, or governance.");
  }

  return gaps.slice(0, 5);
}

function getActionPlan(
  dimensionScores: Record<DiagnosticDimensionKey, DiagnosticDimensionScore>,
): ActionPlanItem[] {
  const sortedDimensions = Object.values(dimensionScores)
    .sort((left, right) => right.score - left.score)
    .slice(0, 3)
    .map((item) => item.key);

  const selected = interventionCatalog
    .map((intervention) => ({
      intervention,
      score: intervention.targetDimensions.filter((dimension) => sortedDimensions.includes(dimension)).length,
    }))
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, 3)
    .map((item) => item.intervention);

  return selected.map((intervention) => ({
    title: intervention.title,
    summary: intervention.summary,
    targetDimensions: intervention.targetDimensions,
    thirtyDayMove: intervention.thirtyDayMove,
    sixWeekPilotMove: intervention.pilotMove,
  }));
}

export function buildResultModel(
  input: AssessmentInput,
  evidenceSummaryOverride?: Partial<EvidenceSummary> | null,
): ResultModel {
  const evidenceSummary = evidenceSummaryOverride
    ? normalizeEvidenceSummary(evidenceSummaryOverride)
    : summarizeEvidence(input);
  const dimensionScores = getDimensionScores(input, evidenceSummary);
  const readinessSignals = getReadinessSignals(input);
  const operatingStateRationale = getOperatingState(readinessSignals, dimensionScores);
  const aiSuitability = getAiSuitability(readinessSignals, dimensionScores);
  const topBlockers = Object.values(dimensionScores)
    .sort((left, right) => right.score - left.score)
    .slice(0, 3);
  const actionPlan = getActionPlan(dimensionScores);
  const confidence = getConfidence(input, dimensionScores, evidenceSummary);
  const useCaseTitle =
    useCases.find((useCase) => useCase.key === input.useCaseKey)?.title ??
    "Organization-wide diagnostics";

  return {
    topBlockers,
    dimensionScores: diagnosticDimensions.map((dimension) => dimensionScores[dimension.key]),
    operatingState: operatingStateRationale.state,
    operatingStateRationale,
    capabilityGaps: getCapabilityGaps(readinessSignals, dimensionScores, aiSuitability),
    actionPlan,
    summaryCard: `${useCaseTitle}: ${operatingStateRationale.state}. ${aiSuitability.label}. Top blockers are ${topBlockers.map((item) => item.title).join(", ")}.`,
    confidence,
    evidenceSummary,
    readinessSignals,
    aiSuitability,
  };
}

export function createAssessmentSession(input: AssessmentInput): AssessmentSession {
  const resultModel = buildResultModel(input);
  const now = new Date().toISOString();

  return {
    id: `session-${Date.now()}`,
    productType: input.productType,
    scopeType: input.scopeType,
    useCaseKey: input.useCaseKey,
    startedAt: now,
    completedAt: now,
    answers: input.answers,
    evidenceSummary: resultModel.evidenceSummary,
    scores: Object.fromEntries(
      resultModel.dimensionScores.map((score) => [score.key, score.score]),
    ) as Record<DiagnosticDimensionKey, AnswerValue>,
    operatingState: resultModel.operatingState,
    confidence: resultModel.confidence,
    resultModel,
  };
}

export function rebuildAssessmentSession(session: AssessmentSession): AssessmentSession {
  return rebuildAssessmentSessionForProduct(session, session.productType);
}

export function rebuildAssessmentSessionForProduct(
  session: AssessmentSession,
  productType: ProductType,
): AssessmentSession {
  const resultModel = buildResultModel(
    {
      productType,
      scopeType: session.scopeType,
      useCaseKey: session.useCaseKey,
      answers: session.answers,
      evidence: emptyEvidenceInput(),
    },
    session.evidenceSummary,
  );

  return {
    ...session,
    productType,
    evidenceSummary: resultModel.evidenceSummary,
    scores: Object.fromEntries(
      resultModel.dimensionScores.map((score) => [score.key, score.score]),
    ) as Record<DiagnosticDimensionKey, AnswerValue>,
    operatingState: resultModel.operatingState,
    confidence: resultModel.confidence,
    resultModel,
  };
}
