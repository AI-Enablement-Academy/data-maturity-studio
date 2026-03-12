import { AssessmentSession, DiagnosticDimensionScore } from "@/lib/diagnostics/types";
import { assessChatScope } from "@/lib/diagnostics/chat-scope";

function findDimension(session: AssessmentSession, question: string): DiagnosticDimensionScore | null {
  const normalized = question.toLowerCase();
  return (
    session.resultModel.dimensionScores.find((item) => {
      const title = item.title.toLowerCase();
      const key = item.key.replaceAll("_", " ");
      return normalized.includes(title) || normalized.includes(key);
    }) ?? null
  );
}

function listTopBlockers(session: AssessmentSession) {
  return session.resultModel.topBlockers
    .map((item) => `${item.title} (${item.severityLabel.toLowerCase()})`)
    .join(", ");
}

export function getDeterministicChatReply(session: AssessmentSession, question: string) {
  const scopeDecision = assessChatScope(question);
  if (!scopeDecision.allowed) {
    return scopeDecision.message ?? "Ask about the report, the workflow state, or the method behind this tool.";
  }

  const normalized = question.toLowerCase();
  const matchedDimension = findDimension(session, normalized);

  if (matchedDimension) {
    return `${matchedDimension.title} is currently rated ${matchedDimension.severityLabel.toLowerCase()}. ${matchedDimension.explanation}`;
  }

  if (
    normalized.includes("top blocker") ||
    normalized.includes("root cause") ||
    normalized.includes("biggest problem")
  ) {
    return `The top blockers are ${listTopBlockers(session)}. These are the dimensions creating the most drag on trust, reuse, and controlled AI use in this assessment.`;
  }

  if (
    normalized.includes("readiness") ||
    normalized.includes("state") ||
    normalized.includes("level") ||
    normalized.includes("maturity")
  ) {
    return `The current workflow state is ${session.resultModel.operatingState}. ${session.resultModel.operatingStateRationale.summary} The strongest reasons it is not further along are: ${session.resultModel.operatingStateRationale.whyNotFurther.join(" ") || "the workflow still needs stronger operating discipline."}`;
  }

  if (
    normalized.includes("gap") ||
    normalized.includes("missing") ||
    normalized.includes("what would it take") ||
    normalized.includes("ai")
  ) {
    return `The report highlights these capability gaps: ${session.resultModel.capabilityGaps.join(" ")} AI suitability is currently ${session.resultModel.aiSuitability.label.toLowerCase()}. ${session.resultModel.aiSuitability.summary}`;
  }

  if (
    normalized.includes("next") ||
    normalized.includes("action") ||
    normalized.includes("plan") ||
    normalized.includes("what should we do")
  ) {
    return `The strongest next moves are these immediate actions: ${session.resultModel.actionPlan
      .map((item) => `${item.title}: ${item.thirtyDayMove}`)
      .join(" ")}`;
  }

  if (normalized.includes("confidence") || normalized.includes("trust")) {
    return `Confidence is ${session.resultModel.confidence.label.toLowerCase()} (${session.resultModel.confidence.score}/100). ${session.resultModel.confidence.notes.join(" ")}`;
  }

  return `In deterministic mode I can answer from the report only. Ask about top blockers, workflow state, capability gaps, AI suitability, confidence, or next actions. Right now the assessment summary is: ${session.resultModel.summaryCard}`;
}
