"use client";

import { useEffect, useMemo, useState } from "react";

import { assessChatScope } from "@/lib/diagnostics/chat-scope";
import { getDeterministicChatReply } from "@/lib/diagnostics/deterministic-chat";
import { AssessmentSession } from "@/lib/diagnostics/types";

type ChatMode = "ai" | "deterministic";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const starterPrompts = [
  "What is the main reason this workflow is not stronger yet?",
  "What should we do in the next 30 days?",
  "Explain the top blocker in plain English.",
];

export function AssistantChat({ session }: { session: AssessmentSession }) {
  const [mode, setMode] = useState<ChatMode>("ai");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Ask about the report, the current workflow state, capability gaps, AI suitability, or the next actions. Deterministic mode is always available.",
    },
  ]);
  const [draft, setDraft] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [retryUntil, setRetryUntil] = useState<number | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());
  const [liveMessage, setLiveMessage] = useState("");

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

    const scopeDecision = assessChatScope(prompt);
    if (!scopeDecision.allowed) {
      setMessages((current) => [
        ...current,
        { role: "user", content: prompt },
        {
          role: "assistant",
          content:
            scopeDecision.message ??
            "I can only help with this report, the workflow it describes, the scoring method, or the cited academic sources.",
        },
      ]);
      setDraft("");
      setLiveMessage("Out-of-scope question refused.");
      return;
    }

    const nextUserMessage: Message = { role: "user", content: prompt };
    setMessages((current) => [...current, nextUserMessage]);
    setDraft("");
    setLiveMessage("Question sent.");

    if (mode === "deterministic") {
      const reply = getDeterministicChatReply(session, prompt);
      setMessages((current) => [...current, { role: "assistant", content: reply }]);
      setLiveMessage("Deterministic reply ready.");
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
      setLiveMessage(`Groq is rate-limited. Try again in ${countdown} seconds, or use deterministic mode.`);
      return;
    }

    setIsLoading(true);
    setStatusMessage(null);
    setLiveMessage("AI response in progress.");

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
        setLiveMessage(`Groq is rate-limited. Switched to deterministic mode for ${retryAfterSeconds} seconds.`);
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
        setLiveMessage(payload.message ?? "AI assistant unavailable. Deterministic mode is still available.");
        return;
      }

      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: payload.output ?? "No response returned.",
        },
      ]);
      setLiveMessage("AI reply ready.");
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
      setLiveMessage("AI assistant unavailable. Deterministic mode still works.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="rounded-[2rem] border border-white/50 bg-white/90 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
      <div aria-live="polite" className="sr-only">
        {liveMessage}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Chat guide</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">Report assistant</h2>
        </div>
        <fieldset className="min-w-[220px]">
          <legend className="sr-only">Chat mode</legend>
          <div className="flex gap-2 rounded-full bg-slate-100 p-1">
            {[
              { value: "ai" as const, label: "AI" },
              { value: "deterministic" as const, label: "Deterministic" },
            ].map((option) => {
              const isChecked = mode === option.value;
              return (
                <label
                  key={option.value}
                  className={`flex-1 cursor-pointer rounded-full px-4 py-2 text-center text-sm transition has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-amber-500 ${
                    isChecked ? "bg-slate-950 text-white" : "text-slate-600"
                  }`}
                >
                  <input
                    type="radio"
                    name="chat-mode"
                    className="sr-only"
                    checked={isChecked}
                    onChange={() => setMode(option.value)}
                  />
                  {option.label}
                </label>
              );
            })}
          </div>
        </fieldset>
      </div>

      <p className="mt-4 text-sm leading-7 text-slate-600">
        AI mode uses Groq on the server with your report context only. Deterministic mode never leaves the browser.
      </p>
      <div className="mt-4 rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-7 text-slate-700">
        Do not paste PII, confidential employee data, or privileged material into the chat. AI replies can be wrong or incomplete, and they are not legal, compliance, or employment advice.
      </div>

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

      <div
        aria-atomic="false"
        aria-busy={isLoading}
        aria-live="polite"
        aria-relevant="additions text"
        className="mt-5 max-h-[420px] space-y-3 overflow-y-auto rounded-[1.5rem] bg-slate-50 p-4"
        role="log"
      >
        {messages.map((message, index) => (
          <div
            key={`${message.role}-${index}`}
            className={`rounded-[1.25rem] px-4 py-3 text-sm leading-7 ${
              message.role === "assistant"
                ? "bg-white text-slate-700"
                : "ml-auto max-w-[85%] bg-slate-950 text-white"
            }`}
          >
            <p className="sr-only">{message.role === "assistant" ? "Assistant message" : "Your message"}</p>
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
        <label className="sr-only" htmlFor="report-assistant-input">
          Ask the report assistant a question
        </label>
        <textarea
          id="report-assistant-input"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          rows={4}
          placeholder="Ask about the report, the workflow state, capability gaps, AI suitability, or next actions."
          className="w-full rounded-[1.5rem] border border-slate-200 bg-white px-4 py-4 text-slate-900"
        />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
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
