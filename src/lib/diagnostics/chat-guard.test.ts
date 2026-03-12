import { afterEach, describe, expect, it } from "vitest";

import {
  consumeChatRateLimit,
  getClientIdentifier,
  resetChatRateLimitStore,
  setChatRateLimitAdapterForTests,
  validateAssessmentSession,
  validateChatBody,
  validateRequestSize,
  validateTrustedOrigin,
} from "@/lib/diagnostics/chat-guard";
import { buildFixtureSession } from "@/lib/diagnostics/test-fixtures";

afterEach(() => {
  resetChatRateLimitStore();
});

describe("validateChatBody", () => {
  it("accepts a safe request shape", () => {
    const result = validateChatBody({
      messages: [{ role: "user", content: "What blocks the Governed band?" }],
      session: buildFixtureSession("dq"),
    });

    expect(result.ok).toBe(true);
  });

  it("rejects oversized or invalid message payloads", () => {
    const result = validateChatBody({
      messages: [{ role: "user", content: "x".repeat(1601) }],
      session: buildFixtureSession("dq"),
    });

    expect(result.ok).toBe(false);
  });
});

describe("validateAssessmentSession", () => {
  it("accepts a fixture assessment session", () => {
    const result = validateAssessmentSession(buildFixtureSession("dq"));

    expect(result.ok).toBe(true);
  });
});

describe("consumeChatRateLimit", () => {
  it("blocks once the in-memory window is exhausted", async () => {
    let finalResult = await consumeChatRateLimit("client-a", 0);

    for (let index = 0; index < 11; index += 1) {
      finalResult = await consumeChatRateLimit("client-a", 0);
    }

    expect(finalResult.allowed).toBe(true);

    const blocked = await consumeChatRateLimit("client-a", 0);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("uses an injected durable adapter when available", async () => {
    setChatRateLimitAdapterForTests({
      consume: async () => ({
        allowed: false,
        remaining: 0,
        retryAfterSeconds: 42,
      }),
    });

    const blocked = await consumeChatRateLimit("client-a", 0);

    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBe(42);
  });
});

describe("getClientIdentifier", () => {
  it("prefers x-forwarded-for", () => {
    const headers = new Headers({
      "x-forwarded-for": "203.0.113.8, 10.0.0.1",
      "x-real-ip": "198.51.100.4",
      "user-agent": "vitest-agent",
    });

    expect(getClientIdentifier(headers)).toContain("203.0.113.8");
  });
});

describe("request validation helpers", () => {
  it("accepts same-origin requests", () => {
    const headers = new Headers({
      origin: "https://data-maturity.example",
      host: "data-maturity.example",
    });

    expect(validateTrustedOrigin("https://data-maturity.example/api/chat", headers)).toBe(true);
  });

  it("accepts loopback requests when host and origin use different loopback aliases", () => {
    const headers = new Headers({
      origin: "http://127.0.0.1:3000",
      host: "127.0.0.1:3000",
    });

    expect(validateTrustedOrigin("http://localhost:3000/api/chat", headers)).toBe(true);
  });

  it("rejects oversized request bodies", () => {
    const headers = new Headers({
      "content-length": "100001",
    });

    expect(validateRequestSize(headers)).toBe(false);
  });
});
