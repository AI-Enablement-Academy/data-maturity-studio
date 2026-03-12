const promptInjectionPatterns = [
  /ignore (all|any|the|previous|prior) (instructions|rules|messages)/i,
  /forget (all|any|the|previous|prior) (instructions|rules|messages)/i,
  /reveal (the )?(system|developer|hidden) prompt/i,
  /show (me )?(the )?(system|developer|hidden) prompt/i,
  /what (is|are) your (system|developer) instructions/i,
  /override (your|the) instructions/i,
  /bypass (your|the) (guardrails|rules|filters|restrictions)/i,
  /act as (if you are )?/i,
  /roleplay as/i,
  /jailbreak/i,
];

const relevantKeywords = [
  "report",
  "workflow",
  "state",
  "blocker",
  "dimension",
  "pattern",
  "quality",
  "trust",
  "reuse",
  "readiness",
  "confidence",
  "questionnaire",
  "question",
  "score",
  "scoring",
  "evidence",
  "action",
  "next step",
  "ai suitability",
  "capture",
  "record",
  "records",
  "access",
  "structure",
  "governance",
  "ownership",
  "decision",
  "method",
  "source",
  "citation",
  "reference",
  "references",
  "paper",
  "wang",
  "strong",
  "pipino",
  "lawrence",
  "fix",
  "improve",
  "cleanup",
  "manual",
  "evidence",
  "share",
  "export",
  "privacy",
];

const offTopicKeywords = [
  "weather",
  "sports",
  "movie",
  "recipe",
  "crypto",
  "bitcoin",
  "stock",
  "politics",
  "election",
  "celebrity",
  "travel",
  "vacation",
  "horoscope",
  "joke",
  "poem",
  "song",
  "translate",
  "summarize this article",
];

const genericFollowUps = [
  "why is this bad",
  "why does this matter",
  "what does that mean",
  "what should we do",
  "what next",
  "which one",
  "why this one",
  "explain this",
  "explain that",
  "what changed",
  "is this safe",
];

export interface ChatScopeDecision {
  allowed: boolean;
  reason?: "prompt_injection" | "off_topic";
  message?: string;
}

function containsAny(text: string, values: string[]) {
  return values.some((value) => text.includes(value));
}

export function assessChatScope(prompt: string): ChatScopeDecision {
  const normalized = prompt.trim().toLowerCase();
  if (!normalized) {
    return {
      allowed: false,
      reason: "off_topic",
      message: "Ask about the report, the workflow state, the action plan, or the cited method.",
    };
  }

  if (promptInjectionPatterns.some((pattern) => pattern.test(prompt))) {
    return {
      allowed: false,
      reason: "prompt_injection",
      message:
        "I cannot follow instructions that try to override the report boundaries or reveal hidden prompts. Ask about the report, the method, or the academic references instead.",
    };
  }

  if (containsAny(normalized, relevantKeywords) || containsAny(normalized, genericFollowUps)) {
    return { allowed: true };
  }

  if (containsAny(normalized, offTopicKeywords)) {
    return {
      allowed: false,
      reason: "off_topic",
      message:
        "This assistant only answers questions about the current report, the workflow it describes, the scoring method, or the academic references behind the tool.",
    };
  }

  return {
    allowed: false,
    reason: "off_topic",
    message:
      "I can help with the report, the workflow it describes, the scoring method, or the cited academic sources. Ask about blockers, dimensions, AI suitability, actions, evidence, privacy, or exports.",
  };
}
