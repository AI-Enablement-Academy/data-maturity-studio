"use client";

import { useEffect, useMemo, useState } from "react";

import { getDeterministicChatReply } from "@/lib/diagnostics/deterministic-chat";
import { AssessmentSession } from "@/lib/diagnostics/types";

type ChatMode = "ai" | "deterministic";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const starterPrompts = [
  "What is the main reason this is not at DRL 7?",
  "What should we do in the next 30 days?",
  "Explain the top blocker in plain English.",
];

export function AssistantChat({ session }: { session: AssessmentSession }) {
  const [mode, setMode] = useState<ChatMode>("ai");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Ask about the report, the likely DRL band, the gap to DRL 7, or the next actions. Deterministic mode is always available.",
    },
  ]);
  const [draft, setDraft] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [retryUntil, setRetryUntil] = useState<number | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!retryUntil) {
      return;
    }

    const timer = window.setInterval(() => {
      setNow(Date.now());
      if (Date.now() >= retryUntil) {
        setRetryUntil(null);
        setStatusMessage(null);
      }
    }, 1000);

    return () => window.clearInterval(timer);
  }, [retryUntil]);

  const countdown = useMemo(() => {
    if (!retryUntil) {
      return 0;
    }
    return Math.max(0, Math.ceil((retryUntil - now) / 1000));
  }, [retryUntil, now]);

  async function handleSubmit(promptOverride?: string) {
    const prompt = (promptOverride ?? draft).trim();
    if (!prompt || isLoading) {
      return;
    }

    const nextUserMessage: Message = { role: "user", content: prompt };
    setMessages((current) => [...current, nextUserMessage]);
    setDraft("");

    if (mode === "deterministic") {
      const reply = getDeterministicChatReply(session, prompt);
      setMessages((current) => [...current, { role: "assistant", content: reply }]);
      return;
    }

    if (retryUntil && Date.now() < retryUntil) {
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: `Groq is temporarily rate-limited. Try again in ${countdown}s, or switch to deterministic mode now.`,
        },
      ]);
      return;
    }

    setIsLoading(true);
    setStatusMessage(null);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, nextUserMessage],
          session,
        }),
      });

      const payload = (await response.json()) as {
        output?: string;
        errorType?: string;
        message?: string;
        retryAfterSeconds?: number;
      };

      if (response.status === 429 && payload.errorType === "rate_limited") {
        const retryAfterSeconds = payload.retryAfterSeconds ?? 60;
        setRetryUntil(Date.now() + retryAfterSeconds * 1000);
        setStatusMessage(payload.message ?? "Groq is rate-limited.");
        setMode("deterministic");
        setMessages((current) => [
          ...current,
          {
            role: "assistant",
            content: `${payload.message ?? "Groq is rate-limited right now."} I switched you to deterministic mode so you can keep using the app immediately.`,
          },
        ]);
        return;
      }

      if (!response.ok) {
        setStatusMessage(payload.message ?? "The AI assistant is unavailable right now.");
        setMessages((current) => [
          ...current,
          {
            role: "assistant",
            content: `${payload.message ?? "The AI assistant is unavailable right now."} Deterministic mode is still available.`,
          },
        ]);
        return;
      }

      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: payload.output ?? "No response returned.",
        },
      ]);
    } catch {
      setStatusMessage("The AI assistant is unavailable right now. Deterministic mode still works.");
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content:
            "The AI assistant is unavailable right now. Deterministic mode still works and uses the report only.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="rounded-[2rem] border border-white/50 bg-white/90 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Chat guide</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">Report assistant</h2>
        </div>
        <div className="flex gap-2 rounded-full bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setMode("ai")}
            className={`rounded-full px-4 py-2 text-sm transition ${
              mode === "ai" ? "bg-slate-950 text-white" : "text-slate-600"
            }`}
          >
            AI
          </button>
          <button
            type="button"
            onClick={() => setMode("deterministic")}
            className={`rounded-full px-4 py-2 text-sm transition ${
              mode === "deterministic" ? "bg-slate-950 text-white" : "text-slate-600"
            }`}
          >
            Deterministic
          </button>
        </div>
      </div>

      <p className="mt-4 text-sm leading-7 text-slate-600">
        AI mode uses Groq on the server with your report context only. Deterministic mode never leaves the browser.
      </p>

      {statusMessage ? (
        <div className="mt-4 rounded-[1.25rem] border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-7 text-amber-950">
          {statusMessage}
          {retryUntil ? ` Try AI again in ${countdown}s.` : null}
        </div>
      ) : null}

      <div className="mt-5 flex flex-wrap gap-2">
        {starterPrompts.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => void handleSubmit(prompt)}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-700"
          >
            {prompt}
          </button>
        ))}
      </div>

      <div className="mt-5 max-h-[420px] space-y-3 overflow-y-auto rounded-[1.5rem] bg-slate-50 p-4">
        {messages.map((message, index) => (
          <div
            key={`${message.role}-${index}`}
            className={`rounded-[1.25rem] px-4 py-3 text-sm leading-7 ${
              message.role === "assistant"
                ? "bg-white text-slate-700"
                : "ml-auto max-w-[85%] bg-slate-950 text-white"
            }`}
          >
            {message.content}
          </div>
        ))}
        {isLoading ? (
          <div className="rounded-[1.25rem] bg-white px-4 py-3 text-sm text-slate-500">
            Thinking...
          </div>
        ) : null}
      </div>

      <div className="mt-5 flex flex-col gap-3">
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          rows={4}
          placeholder="Ask about the report, the DRL band, the gap to DRL 7, or next actions."
          className="w-full rounded-[1.5rem] border border-slate-200 bg-white px-4 py-4 text-slate-900 outline-none"
        />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
            {mode === "ai" ? "Server-side Groq mode" : "Local deterministic mode"}
          </p>
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={!draft.trim() || isLoading}
            className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            Send
          </button>
        </div>
      </div>
    </section>
  );
}
