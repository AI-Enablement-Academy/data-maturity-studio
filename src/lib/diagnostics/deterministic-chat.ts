import { AssessmentSession, RootConditionScore } from "@/lib/diagnostics/types";

function findCondition(session: AssessmentSession, question: string): RootConditionScore | null {
  const normalized = question.toLowerCase();
  return (
    session.resultModel.rootConditionScores.find((item) => {
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
  const normalized = question.toLowerCase();
  const matchedCondition = findCondition(session, normalized);

  if (matchedCondition) {
    return `${matchedCondition.title} is currently rated ${matchedCondition.severityLabel.toLowerCase()}. ${matchedCondition.explanation}`;
  }

  if (
    normalized.includes("top blocker") ||
    normalized.includes("root cause") ||
    normalized.includes("biggest problem")
  ) {
    return `The top blockers are ${listTopBlockers(session)}. These are the conditions creating the most drag on trust, comparability, and AI readiness in this assessment.`;
  }

  if (
    normalized.includes("drl") ||
    normalized.includes("level") ||
    normalized.includes("maturity")
  ) {
    return `The likely maturity band is ${session.resultModel.drlBand}. ${session.resultModel.drlRationale.summary} The strongest reasons it is not higher are: ${session.resultModel.drlRationale.whyNotHigher.join(" ") || "advanced AI integration is still limited."}`;
  }

  if (
    normalized.includes("gap") ||
    normalized.includes("missing") ||
    normalized.includes("what would it take") ||
    normalized.includes("drl 7")
  ) {
    return `To move toward DRL 7, the report highlights these gaps: ${session.resultModel.gapToDRL7.join(" ")}`;
  }

  if (
    normalized.includes("next") ||
    normalized.includes("action") ||
    normalized.includes("plan") ||
    normalized.includes("what should we do")
  ) {
    return `The strongest next moves are these 30-day actions: ${session.resultModel.actionPlan
      .map((item) => `${item.title}: ${item.thirtyDayMove}`)
      .join(" ")}`;
  }

  if (normalized.includes("confidence") || normalized.includes("trust")) {
    return `Confidence is ${session.resultModel.confidence.label.toLowerCase()} (${session.resultModel.confidence.score}/100). ${session.resultModel.confidence.notes.join(" ")}`;
  }

  return `In deterministic mode I can answer from the report only. Ask about top blockers, DRL level, the gap to DRL 7, confidence, or next actions. Right now the assessment summary is: ${session.resultModel.summaryCard}`;
}
