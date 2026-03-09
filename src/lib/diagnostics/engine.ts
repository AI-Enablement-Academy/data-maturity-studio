import {
  drlSignals,
  interventionCatalog,
  rootConditions,
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
  DRLSignalKey,
  ResultModel,
  RootConditionKey,
  RootConditionScore,
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

function getQuestionContribution(answer: number, direction: "risk" | "maturity", targetDirection: "risk" | "maturity") {
  return direction === targetDirection ? answer : 3 - answer;
}

function getRootConditionScores(input: AssessmentInput, evidenceSummary: ResultModel["evidenceSummary"]) {
  const applicableQuestions = getApplicableQuestions(input);
  const scores = {} as Record<RootConditionKey, RootConditionScore>;

  for (const condition of rootConditions) {
    const contributions = applicableQuestions
      .map((question) => {
        const weight = question.rootWeights[condition.key];
        const rawAnswer = input.answers[question.id];
        if (weight === undefined || rawAnswer === undefined) {
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

    const evidenceAdjustment = evidenceSummary.rootConditionAdjustments[condition.key] ?? 0;
    const score = clampToAnswerValue(weightedAverage + evidenceAdjustment);
    const contributingQuestions = contributions
      .sort((left, right) => right.value - left.value)
      .slice(0, 3)
      .map((item) => item.shortLabel);

    scores[condition.key] = {
      key: condition.key,
      title: condition.title,
      score,
      severityLabel: severityLabels[score],
      contributingQuestions,
      explanation:
        score === 0
          ? `Current answers do not show a material issue in ${condition.title.toLowerCase()}.`
          : `${condition.summary} This diagnostic points most strongly to ${contributingQuestions.join(", ").toLowerCase() || "the supplied evidence"} as the pressure points in this workflow. ${condition.drl7Expectation}`,
    };
  }

  return scores;
}

function getSignalScores(input: AssessmentInput) {
  const applicableQuestions = getApplicableQuestions(input);
  const signalScores = {} as Record<DRLSignalKey, number>;

  for (const signal of drlSignals) {
    const contributions = applicableQuestions
      .map((question) => {
        const weight = question.signalWeights[signal.key];
        const rawAnswer = input.answers[question.id];
        if (weight === undefined || rawAnswer === undefined) {
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

function getCriticalBlockers(rootScores: Record<RootConditionKey, RootConditionScore>) {
  return [
    rootScores.multiple_data_sources.score,
    rootScores.subjective_judgement.score,
    rootScores.diverse_coding_systems.score,
    rootScores.input_standards.score,
    rootScores.system_integration.score,
  ];
}

function getDRLBand(
  signalScores: Record<DRLSignalKey, number>,
  rootScores: Record<RootConditionKey, RootConditionScore>,
): ResultModel["drlRationale"] {
  const criticalBlockers = getCriticalBlockers(rootScores);
  const maxCriticalBlocker = Math.max(...criticalBlockers);
  const thresholdNotes: string[] = [];
  const whyNotHigher: string[] = [];

  if (
    signalScores.advanced_ai_integration >= 2.5 &&
    signalScores.structured_ai_readiness >= 2.5 &&
    signalScores.data_product_discipline >= 2.5 &&
    signalScores.dpm_ownership >= 2.5 &&
    signalScores.tdqm_discipline >= 2.5 &&
    maxCriticalBlocker <= 1
  ) {
    thresholdNotes.push(
      "Advanced AI integration, structured data readiness, and DRL 7 discipline are all materially present.",
    );
    return {
      band: "Emerging DRL 8-9",
      summary:
        "These levels represent emerging capabilities where automated structured collection integrates directly with AI systems to enable prescriptive and cognitive analytics.",
      whyNotHigher,
      thresholdNotes,
    };
  }

  if (
    signalScores.data_product_discipline >= 2.2 &&
    signalScores.dpm_ownership >= 2 &&
    signalScores.tdqm_discipline >= 2 &&
    signalScores.structured_ai_readiness >= 2.2 &&
    maxCriticalBlocker <= 1
  ) {
    thresholdNotes.push(
      "Information Product principles, DPM coordination, TDQM discipline, and structured AI readiness are all materially present.",
    );
    return {
      band: "DRL 7",
      summary:
        "DRL 7 is the strategic product breakthrough where data collection is intentionally designed to support AI consumption rather than hoping AI can overcome collection deficiencies.",
      whyNotHigher: signalScores.advanced_ai_integration < 2
        ? ["Advanced AI integration remains limited, which keeps the workflow below emerging DRL 8-9."]
        : [],
      thresholdNotes,
    };
  }

  if (maxCriticalBlocker > 1) {
    whyNotHigher.push(
      "At least one critical blocker remains significant or severe across source conflict, subjective judgement, coding systems, input standards, or integration.",
    );
  }

  if (signalScores.manual_collection_risk >= 2.1 && signalScores.digital_foundation < 1.3) {
    thresholdNotes.push(
      "Manual collection still dominates and the digital collection foundation is weak.",
    );
    return {
      band: "DRL 1-2",
      summary:
        "Organisations at DRL 1-2 rely on manual data gathering through spreadsheets, emails, and basic forms. Quality management is reactive and the data lacks the reliability and structure AI requires.",
      whyNotHigher: [
        "Digital collection and storage are not yet stable enough for DRL 3-4.",
        ...whyNotHigher,
      ],
      thresholdNotes,
    };
  }

  if (
    signalScores.digital_foundation >= 1.2 &&
    signalScores.digital_foundation < 1.7 &&
    signalScores.data_product_discipline < 1.6 &&
    signalScores.byproduct_dependence < 1.8
  ) {
    thresholdNotes.push(
      "Basic digital systems exist, but the workflow still behaves as an operational by-product rather than an intentional information product.",
    );
    return {
      band: "DRL 3-4",
      summary:
        "These levels represent basic digital collection and storage with some quality controls, but data is still collected as a by-product of business processes rather than designed for analytical consumption.",
      whyNotHigher: [
        "The workflow lacks enough integration strength and product discipline for DRL 5-6 or above.",
        ...whyNotHigher,
      ],
      thresholdNotes,
    };
  }

  thresholdNotes.push(
    "The workflow shows digital infrastructure and some integration, but data still behaves mostly as a by-product and not a designed product.",
  );
  return {
    band: "DRL 5-6",
    summary:
      "Most organisations operate in the DRL 5-6 plateau: high-volume data collection and some machine learning support descriptive and diagnostic analytics, but the underlying data still behaves as a by-product rather than something designed for AI consumption.",
    whyNotHigher: [
      "Information Product discipline, DPM coordination, TDQM discipline, or structured AI readiness are not yet strong enough for DRL 7.",
      ...whyNotHigher,
    ],
    thresholdNotes,
  };
}

function getConfidence(
  input: AssessmentInput,
  rootScores: Record<RootConditionKey, RootConditionScore>,
  evidenceSummary: ResultModel["evidenceSummary"],
) {
  const applicableQuestions = getApplicableQuestions(input);
  const answeredCount = applicableQuestions.filter((question) => input.answers[question.id] !== undefined).length;
  const completeness = answeredCount / Math.max(applicableQuestions.length, 1);

  const varianceSignals = [
    rootScores.multiple_data_sources.score,
    rootScores.diverse_coding_systems.score,
    rootScores.system_integration.score,
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

function getGapToDRL7(
  signalScores: Record<DRLSignalKey, number>,
  rootScores: Record<RootConditionKey, RootConditionScore>,
) {
  const gaps: string[] = [];
  if (signalScores.data_product_discipline < 2.2) {
    gaps.push("The workflow is not yet designed and governed as an Information Product or Data-as-a-Product asset.");
  }
  if (signalScores.dpm_ownership < 2) {
    gaps.push("Data-as-a-Product Manager (DPM) coordination is not yet strong enough for DRL 7.");
  }
  if (signalScores.tdqm_discipline < 2) {
    gaps.push("TDQM-style quality measurement and remediation are not yet systematic enough for DRL 7.");
  }
  if (signalScores.structured_ai_readiness < 2.2) {
    gaps.push("The current data structure still requires too much recoding, caveat writing, or translation for AI use.");
  }

  for (const key of [
    "multiple_data_sources",
    "subjective_judgement",
    "diverse_coding_systems",
    "input_standards",
    "system_integration",
  ] as RootConditionKey[]) {
    if (rootScores[key].score >= 2) {
      gaps.push(`${rootScores[key].title} remains ${rootScores[key].severityLabel.toLowerCase()}.`);
    }
  }

  return gaps.slice(0, 5);
}

function getActionPlan(rootScores: Record<RootConditionKey, RootConditionScore>): ActionPlanItem[] {
  const sortedConditions = Object.values(rootScores)
    .sort((left, right) => right.score - left.score)
    .slice(0, 3)
    .map((item) => item.key);

  const selected = interventionCatalog
    .map((intervention) => ({
      intervention,
      score: intervention.targetConditions.filter((condition) => sortedConditions.includes(condition)).length,
    }))
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, 3)
    .map((item) => item.intervention);

  return selected.map((intervention) => ({
    title: intervention.title,
    summary: intervention.summary,
    targetConditions: intervention.targetConditions,
    thirtyDayMove: intervention.thirtyDayMove,
    sixWeekPilotMove: intervention.pilotMove,
  }));
}

export function buildResultModel(input: AssessmentInput): ResultModel {
  const evidenceSummary = summarizeEvidence(input);
  const rootScores = getRootConditionScores(input, evidenceSummary);
  const signalScores = getSignalScores(input);
  const drlRationale = getDRLBand(signalScores, rootScores);
  const topBlockers = Object.values(rootScores)
    .sort((left, right) => right.score - left.score)
    .slice(0, 3);
  const actionPlan = getActionPlan(rootScores);
  const confidence = getConfidence(input, rootScores, evidenceSummary);
  const useCaseTitle =
    useCases.find((useCase) => useCase.key === input.useCaseKey)?.title ??
    "Organization-wide diagnostics";

  return {
    topBlockers,
    rootConditionScores: rootConditions.map((condition) => rootScores[condition.key]),
    drlBand: drlRationale.band,
    drlRationale,
    gapToDRL7: getGapToDRL7(signalScores, rootScores),
    actionPlan,
    summaryCard: `${useCaseTitle}: ${drlRationale.band} with ${confidence.label.toLowerCase()} confidence. Top blockers are ${topBlockers.map((item) => item.title).join(", ")}.`,
    confidence,
    evidenceSummary,
    signalScores,
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
      resultModel.rootConditionScores.map((score) => [score.key, score.score]),
    ) as Record<RootConditionKey, AnswerValue>,
    drlBand: resultModel.drlBand,
    confidence: resultModel.confidence,
    resultModel,
  };
}
