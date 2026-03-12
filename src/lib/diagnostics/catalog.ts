import {
  DiagnosticDimensionDefinition,
  InterventionDefinition,
  ReadinessSignalDefinition,
  UseCaseDefinition,
} from "@/lib/diagnostics/types";

export const diagnosticDimensions: DiagnosticDimensionDefinition[] = [
  {
    key: "record_reliability",
    title: "Record Reliability",
    summary:
      "Records and metrics cannot be trusted consistently because values conflict, drift, or arrive with weak validation.",
    improvementTarget:
      "Tighten validation, reconciliation, and record stewardship so core values stay dependable across the workflow.",
  },
  {
    key: "decision_fit",
    title: "Decision Fit",
    summary:
      "The available data is not complete, timely, or relevant enough for the decision the workflow now needs to support.",
    improvementTarget:
      "Refocus collection on the decision in front of the team, not on legacy fields or convenient exports.",
  },
  {
    key: "structure_interpretability",
    title: "Structure and Interpretability",
    summary:
      "Important signal is buried in narrative notes, inconsistent formats, or opaque structures that are difficult to compare or reuse.",
    improvementTarget:
      "Move high-value signals into clearer, more structured, and more machine-readable forms.",
  },
  {
    key: "access_control",
    title: "Access and Control",
    summary:
      "People who need the data cannot reach it reliably or safely enough, creating approval delays, shadow copies, and workaround behavior.",
    improvementTarget:
      "Design access paths that are faster, safer, and less dependent on one-off approvals or manual extraction.",
  },
  {
    key: "quality_discipline",
    title: "Quality Management Discipline",
    summary:
      "Quality checks happen late and reactively instead of being defined, measured, reviewed, and improved as part of routine operations.",
    improvementTarget:
      "Introduce explicit quality rules, monitoring, and remediation loops that teams can sustain over time.",
  },
  {
    key: "reuse_operating_model",
    title: "Reuse Operating Model",
    summary:
      "The workflow lacks a stable operating model for downstream reuse, with unclear ownership, weak change control, or brittle handoffs between producers and consumers.",
    improvementTarget:
      "Define who produces, maintains, and consumes the data, then formalize reuse expectations and escalation paths.",
  },
];

export const readinessSignals: ReadinessSignalDefinition[] = [
  { key: "capture_foundation", title: "Stable capture path", direction: "maturity" },
  { key: "analytical_alignment", title: "Fit to the current decision", direction: "maturity" },
  { key: "structured_data_readiness", title: "Structured for reuse", direction: "maturity" },
  { key: "access_reliability", title: "Reachable in time", direction: "maturity" },
  { key: "quality_loop", title: "Quality review routine", direction: "maturity" },
  { key: "reuse_governance", title: "Clear reuse ownership", direction: "maturity" },
  { key: "ai_operational_fit", title: "AI-ready handling", direction: "maturity" },
];

export const useCases: UseCaseDefinition[] = [
  {
    key: "operational_reporting",
    title: "Operational Reporting",
    summary: "Diagnose the data quality behind regular operational reports and dashboards.",
  },
  {
    key: "decision_support",
    title: "Decision Support Analytics",
    summary: "Diagnose whether data supports strategic or tactical decisions reliably.",
  },
  {
    key: "compliance_reporting",
    title: "Compliance and Regulatory Reporting",
    summary: "Diagnose data quality for regulatory, audit, or compliance workflows.",
  },
  {
    key: "process_analytics",
    title: "Process and Performance Analytics",
    summary: "Diagnose data behind process measurement, improvement, and benchmarking.",
  },
  {
    key: "outcome_measurement",
    title: "Outcome Measurement",
    summary: "Diagnose whether outcome and performance signals are trustworthy enough for analysis.",
  },
  {
    key: "general_workflow",
    title: "General Workflow Analytics",
    summary: "Use a broader diagnostic when the workflow is not limited to a single domain-specific use case.",
  },
];

export const interventionCatalog: InterventionDefinition[] = [
  {
    id: "record-control",
    title: "Record Control Reset",
    summary:
      "Stabilize the core records and definitions before the workflow absorbs more manual reconciliation or caveat writing.",
    targetDimensions: ["record_reliability", "quality_discipline", "reuse_operating_model"],
    thirtyDayMove:
      "Choose one critical metric or record family, define validation rules, and assign a named steward for exceptions.",
    pilotMove:
      "Run a six-week reconciliation cycle on the highest-value records and measure drop in disputes or rework.",
  },
  {
    id: "decision-fit-refresh",
    title: "Decision-Fit Refresh",
    summary:
      "Rework the captured fields and review cadence so the workflow serves the decision it claims to support now.",
    targetDimensions: ["decision_fit", "quality_discipline"],
    thirtyDayMove:
      "Identify the decision that matters most, then remove one stale field and add one field that directly improves that decision.",
    pilotMove:
      "Pilot a slimmed-down capture and review design for one recurring decision process and compare cycle quality.",
  },
  {
    id: "structure-normalization",
    title: "Structure Normalization",
    summary:
      "Reduce narrative sprawl and inconsistent formats by converting the highest-value signals into structured, comparable records.",
    targetDimensions: ["structure_interpretability", "record_reliability"],
    thirtyDayMove:
      "Take one free-text or exported input and replace it with a guided structured template plus clear labels.",
    pilotMove:
      "Run a six-week structured capture pilot on one messy input source and measure comparability improvement.",
  },
  {
    id: "access-redesign",
    title: "Access Path Redesign",
    summary:
      "Remove the operational drag created by slow approvals, brittle extracts, and shadow copies.",
    targetDimensions: ["access_control", "reuse_operating_model"],
    thirtyDayMove:
      "Document the current approval path, then remove one avoidable handoff or manual retrieval step.",
    pilotMove:
      "Pilot a governed self-service or pre-approved access path for one repeat workflow and track cycle-time reduction.",
  },
  {
    id: "quality-loop",
    title: "Measured Quality Loop",
    summary:
      "Move from cleanup after the fact to routine measurement, review, and remediation of the most expensive quality failures.",
    targetDimensions: ["quality_discipline", "record_reliability", "decision_fit"],
    thirtyDayMove:
      "Set three quality rules, one owner, and one review rhythm for the assessed workflow.",
    pilotMove:
      "Run a six-week define-measure-analyze-improve loop with visible metrics and remediation checkpoints.",
  },
  {
    id: "reuse-contract",
    title: "Reuse Contract",
    summary:
      "Clarify who produces, maintains, consumes, and approves change in the data that multiple teams depend on.",
    targetDimensions: ["reuse_operating_model", "access_control", "decision_fit"],
    thirtyDayMove:
      "Name the producer, maintainer, and consumer roles for one dataset and write the minimum rules for changes and escalation.",
    pilotMove:
      "Pilot a reusable workflow contract for one cross-functional data flow and measure how often ad hoc workarounds drop.",
  },
];
