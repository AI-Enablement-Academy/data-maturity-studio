export type ProductType = "dq" | "drl";
export type ScopeType = "use_case" | "organization";
export type ScoreDirection = "risk" | "maturity";
export type ConfidenceLabel = "Low" | "Moderate" | "High";

export type DiagnosticDimensionKey =
  | "record_reliability"
  | "decision_fit"
  | "structure_interpretability"
  | "access_control"
  | "quality_discipline"
  | "reuse_operating_model";

export type ReadinessSignalKey =
  | "capture_foundation"
  | "analytical_alignment"
  | "structured_data_readiness"
  | "access_reliability"
  | "quality_loop"
  | "reuse_governance"
  | "ai_operational_fit";

export type OperatingState =
  | "Fragile"
  | "Stabilizing"
  | "Managed"
  | "Ready";

export type AiSuitabilityLabel =
  | "Not ready for dependable AI reuse"
  | "Conditionally usable for narrow AI workflows"
  | "Ready for controlled AI use";

export type UseCaseKey =
  | "operational_reporting"
  | "decision_support"
  | "compliance_reporting"
  | "process_analytics"
  | "outcome_measurement"
  | "general_workflow";

export type AnswerValue = 0 | 1 | 2 | 3;

export interface DiagnosticDimensionDefinition {
  key: DiagnosticDimensionKey;
  title: string;
  summary: string;
  improvementTarget: string;
}

export interface ReadinessSignalDefinition {
  key: ReadinessSignalKey;
  title: string;
  direction: ScoreDirection;
}

export interface UseCaseDefinition {
  key: UseCaseKey;
  title: string;
  summary: string;
}

export interface InterventionDefinition {
  id: string;
  title: string;
  summary: string;
  targetDimensions: DiagnosticDimensionKey[];
  thirtyDayMove: string;
  pilotMove: string;
}

export interface QuestionOption {
  value: AnswerValue;
  label: string;
  description: string;
}

export interface QuestionDefinition {
  id: string;
  shortLabel: string;
  prompt: string;
  helpText: string;
  direction: ScoreDirection;
  productTypes: ProductType[];
  scopeTypes: ScopeType[];
  dimensionWeights: Partial<Record<DiagnosticDimensionKey, number>>;
  signalWeights: Partial<Record<ReadinessSignalKey, number>>;
  options: QuestionOption[];
}

export interface EvidenceInput {
  csvFiles: Array<{
    fileName: string;
    content: string;
  }>;
  metricDefinitionText: string;
  workflowNotesText: string;
}

export interface EvidenceSummary {
  notes: string[];
  tags: string[];
  confidenceBoost: number;
  dimensionAdjustments: Partial<Record<DiagnosticDimensionKey, number>>;
}

export interface AssessmentAnswers {
  [questionId: string]: AnswerValue | undefined;
}

export interface AssessmentInput {
  productType: ProductType;
  scopeType: ScopeType;
  useCaseKey: UseCaseKey | null;
  answers: AssessmentAnswers;
  evidence: EvidenceInput;
}

export interface DiagnosticDimensionScore {
  key: DiagnosticDimensionKey;
  title: string;
  score: AnswerValue;
  severityLabel: "No current issue" | "Mild" | "Significant" | "Severe";
  explanation: string;
  contributingQuestions: string[];
}

export interface OperatingStateRationale {
  state: OperatingState;
  summary: string;
  whyNotFurther: string[];
  thresholdNotes: string[];
}

export interface AiSuitability {
  label: AiSuitabilityLabel;
  summary: string;
}

export interface ActionPlanItem {
  title: string;
  summary: string;
  targetDimensions: DiagnosticDimensionKey[];
  thirtyDayMove: string;
  sixWeekPilotMove: string;
}

export interface ResultModel {
  topBlockers: DiagnosticDimensionScore[];
  dimensionScores: DiagnosticDimensionScore[];
  operatingState: OperatingState;
  operatingStateRationale: OperatingStateRationale;
  capabilityGaps: string[];
  actionPlan: ActionPlanItem[];
  summaryCard: string;
  confidence: {
    label: ConfidenceLabel;
    score: number;
    notes: string[];
  };
  evidenceSummary: EvidenceSummary;
  readinessSignals: Record<ReadinessSignalKey, number>;
  aiSuitability: AiSuitability;
}

export interface AssessmentSession {
  id: string;
  productType: ProductType;
  scopeType: ScopeType;
  useCaseKey: UseCaseKey | null;
  startedAt: string;
  completedAt: string;
  answers: AssessmentAnswers;
  evidenceSummary: EvidenceSummary;
  scores: Record<DiagnosticDimensionKey, AnswerValue>;
  operatingState: OperatingState;
  confidence: ResultModel["confidence"];
  resultModel: ResultModel;
}

export interface SharedReportSnapshot {
  id: string;
  productType: ProductType;
  scopeType: ScopeType;
  useCaseKey: UseCaseKey | null;
  completedAt: string;
  operatingState: OperatingState;
  confidence: ResultModel["confidence"];
  resultModel: ResultModel;
}

export interface SavedReportSummary {
  id: string;
  productType: ProductType;
  scopeType: ScopeType;
  useCaseKey: UseCaseKey | null;
  completedAt: string;
  expiresAt: string;
  operatingState: OperatingState;
  summaryCard: string;
  topBlockerTitles: string[];
}
