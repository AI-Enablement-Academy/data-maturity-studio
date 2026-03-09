import { NextRequest, NextResponse } from "next/server";

import { AssessmentSession } from "@/lib/diagnostics/types";

export const runtime = "nodejs";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface GroqResponsePayload {
  output?: Array<{
    type?: string;
    content?: Array<{
      type?: string;
      text?: string;
    }>;
  }>;
  output_text?: string;
}

function getRetryAfterSeconds(response: Response) {
  const retryHeader = response.headers.get("retry-after");
  if (!retryHeader) {
    return 60;
  }

  const asNumber = Number(retryHeader);
  if (Number.isFinite(asNumber)) {
    return Math.max(10, asNumber);
  }

  const asDate = new Date(retryHeader).getTime();
  if (Number.isFinite(asDate)) {
    return Math.max(10, Math.ceil((asDate - Date.now()) / 1000));
  }

  return 60;
}

function buildContext(session: AssessmentSession) {
  return {
    productType: session.productType,
    scopeType: session.scopeType,
    useCaseKey: session.useCaseKey,
    summaryCard: session.resultModel.summaryCard,
    topBlockers: session.resultModel.topBlockers.map((item) => ({
      title: item.title,
      severity: item.severityLabel,
      explanation: item.explanation,
    })),
    drlBand: session.resultModel.drlBand,
    drlSummary: session.resultModel.drlRationale.summary,
    whyNotHigher: session.resultModel.drlRationale.whyNotHigher,
    gapToDRL7: session.resultModel.gapToDRL7,
    actionPlan: session.resultModel.actionPlan.map((item) => ({
      title: item.title,
      summary: item.summary,
      thirtyDayMove: item.thirtyDayMove,
      sixWeekPilotMove: item.sixWeekPilotMove,
    })),
    confidence: session.resultModel.confidence,
  };
}

function extractOutputText(payload: GroqResponsePayload) {
  if (payload.output_text) {
    return payload.output_text;
  }

  const parts =
    payload.output
      ?.flatMap((item) => item.content ?? [])
      .filter((item) => item.type === "output_text")
      .map((item) => item.text?.trim())
      .filter((item): item is string => Boolean(item)) ?? [];

  return parts.join("\n\n");
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.GROQ_API_KEY;
  const model = process.env.GROQ_MODEL ?? "qwen/qwen3-32b";

  if (!apiKey) {
    return NextResponse.json(
      {
        errorType: "misconfigured",
        message: "Groq is not configured on the server. Add GROQ_API_KEY and redeploy.",
      },
      { status: 500 },
    );
  }

  const body = (await request.json()) as {
    messages: ChatMessage[];
    session: AssessmentSession;
  };

  const context = buildContext(body.session);
  const conversation = body.messages
    .map((message) => ({
      role: message.role,
      content: [{ type: "input_text", text: message.content }],
    }))
    .slice(-12);

  const response = await fetch("https://api.groq.com/openai/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      max_output_tokens: 350,
      instructions: `You are the assistant inside a data maturity diagnostic product. Use only the supplied diagnostic context. Be concise, practical, and specific. Do not invent data or scores. If the user asks something outside the supplied context, say that clearly and steer them back to the report.\n\nDiagnostic context:\n${JSON.stringify(
        context,
        null,
        2,
      )}`,
      input: conversation,
    }),
    cache: "no-store",
  });

  if (response.status === 429 || response.status === 498) {
    const retryAfterSeconds = getRetryAfterSeconds(response);
    const payload = await response.json().catch(() => null);
    return NextResponse.json(
      {
        errorType: "rate_limited",
        retryAfterSeconds,
        message:
          payload?.error?.message ??
          "Groq is rate-limited right now. Try again after the countdown or use deterministic chat mode.",
      },
      { status: 429 },
    );
  }

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    return NextResponse.json(
      {
        errorType: "provider_error",
        message:
          payload?.error?.message ??
          "The Groq request failed. Use deterministic chat mode for now and try AI again later.",
      },
      { status: response.status },
    );
  }

  const payload = (await response.json()) as GroqResponsePayload;
  return NextResponse.json({
    output: extractOutputText(payload) || "No response text was returned by the provider.",
    model,
  });
}
