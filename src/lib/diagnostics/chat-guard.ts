import { createHash } from "node:crypto";

import { ConvexHttpClient } from "convex/browser";

import { api } from "../../../convex/_generated/api";
import { AssessmentSession } from "@/lib/diagnostics/types";

const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 12;
const MAX_REQUEST_BYTES = 100_000;
const MAX_MESSAGES = 20;
const MAX_MESSAGE_LENGTH = 1500;

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

export interface ChatRateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

interface RateLimitStoreAdapter {
  consume(identifier: string, now: number): Promise<ChatRateLimitResult>;
}

const rateLimitStore = new Map<string, RateLimitEntry>();
let configuredAdapter: RateLimitStoreAdapter | null | undefined;
let overrideAdapter: RateLimitStoreAdapter | null = null;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isChatRole(value: unknown): value is ChatMessage["role"] {
  return value === "user" || value === "assistant";
}

function isValidMessage(value: unknown): value is ChatMessage {
  return (
    isRecord(value) &&
    isChatRole(value.role) &&
    typeof value.content === "string" &&
    value.content.trim().length > 0 &&
    value.content.length <= MAX_MESSAGE_LENGTH
  );
}

function isAssessmentSessionLike(value: unknown): value is AssessmentSession {
  if (!isRecord(value) || !isRecord(value.answers) || !isRecord(value.evidenceSummary)) {
    return false;
  }

  return (
    (value.productType === "dq" || value.productType === "drl") &&
    typeof value.scopeType === "string" &&
    (value.useCaseKey === null || typeof value.useCaseKey === "string") &&
    typeof value.startedAt === "string" &&
    typeof value.completedAt === "string"
  );
}

class ConvexRateLimitAdapter implements RateLimitStoreAdapter {
  private readonly client: ConvexHttpClient;

  constructor(url: string) {
    this.client = new ConvexHttpClient(url);
  }

  async consume(identifier: string, now: number): Promise<ChatRateLimitResult> {
    return this.client.mutation(api.rateLimits.consume, {
      identifierHash: createStableIdentifierHash(identifier),
      now,
    });
  }
}

function buildAllowedOrigins(requestUrl: string, headers: Headers) {
  const request = new URL(requestUrl);
  const allowedOrigins = new Set<string>([request.origin]);
  const forwardedProto = headers.get("x-forwarded-proto");
  const forwardedHost = headers.get("x-forwarded-host");
  const host = headers.get("host");

  if (forwardedProto && forwardedHost) {
    allowedOrigins.add(`${forwardedProto}://${forwardedHost}`);
  }

  if (host) {
    const protocol = forwardedProto ?? request.protocol.replace(":", "");
    allowedOrigins.add(`${protocol}://${host}`);
  }

  return allowedOrigins;
}

function getConfiguredAdapter() {
  if (overrideAdapter) {
    return overrideAdapter;
  }

  if (configuredAdapter !== undefined) {
    return configuredAdapter;
  }

  const url = process.env.CONVEX_URL;
  configuredAdapter = url ? new ConvexRateLimitAdapter(url) : null;
  return configuredAdapter;
}

function createStableIdentifierHash(identifier: string) {
  return createHash("sha256").update(identifier).digest("hex");
}

function consumeInMemoryRateLimit(identifier: string, now = Date.now()): ChatRateLimitResult {
  const current = rateLimitStore.get(identifier);

  if (!current || current.resetAt <= now) {
    rateLimitStore.set(identifier, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    });

    return {
      allowed: true,
      remaining: RATE_LIMIT_MAX_REQUESTS - 1,
      retryAfterSeconds: Math.ceil(RATE_LIMIT_WINDOW_MS / 1000),
    };
  }

  if (current.count >= RATE_LIMIT_MAX_REQUESTS) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
    };
  }

  current.count += 1;
  rateLimitStore.set(identifier, current);

  return {
    allowed: true,
    remaining: RATE_LIMIT_MAX_REQUESTS - current.count,
    retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
  };
}

export function validateAssessmentSession(body: unknown):
  | { ok: true; value: AssessmentSession }
  | { ok: false; message: string } {
  if (!isAssessmentSessionLike(body)) {
    return { ok: false, message: "The diagnostic report context is incomplete or invalid." };
  }

  return { ok: true, value: body };
}

export function validateChatBody(body: unknown):
  | { ok: true; value: { messages: ChatMessage[]; session: AssessmentSession } }
  | { ok: false; message: string } {
  if (!isRecord(body)) {
    return { ok: false, message: "Invalid request body." };
  }

  if (!Array.isArray(body.messages) || body.messages.length === 0 || body.messages.length > MAX_MESSAGES) {
    return { ok: false, message: "Messages must be a non-empty array with a safe upper bound." };
  }

  if (!body.messages.every(isValidMessage)) {
    return {
      ok: false,
      message: "Each message must include a valid role and a non-empty prompt under the length limit.",
    };
  }

  const session = validateAssessmentSession(body.session);
  if (!session.ok) {
    return { ok: false, message: session.message };
  }

  return {
    ok: true,
    value: {
      messages: body.messages,
      session: session.value,
    },
  };
}

export function getClientIdentifier(headers: Headers) {
  const forwardedFor = headers.get("x-forwarded-for");
  const agent = headers.get("user-agent")?.slice(0, 80) ?? "unknown-agent";

  if (forwardedFor) {
    const firstIp = forwardedFor.split(",")[0]?.trim() || "anonymous";
    return `${firstIp}:${agent}`;
  }

  const ip = headers.get("x-real-ip") ?? "anonymous";
  return `${ip}:${agent}`;
}

export function validateTrustedOrigin(requestUrl: string, headers: Headers) {
  const origin = headers.get("origin");
  const referer = headers.get("referer");
  const allowedOrigins = buildAllowedOrigins(requestUrl, headers);

  if (origin) {
    return allowedOrigins.has(origin);
  }

  if (referer) {
    try {
      return allowedOrigins.has(new URL(referer).origin);
    } catch {
      return false;
    }
  }

  return true;
}

export function validateRequestSize(headers: Headers, maxBytes = MAX_REQUEST_BYTES) {
  const contentLength = headers.get("content-length");
  if (!contentLength) {
    return true;
  }

  const bytes = Number(contentLength);
  return Number.isFinite(bytes) && bytes > 0 && bytes <= maxBytes;
}

export async function parseJsonBodyWithLimit(
  request: Request,
  maxBytes = MAX_REQUEST_BYTES,
): Promise<
  | { ok: true; value: unknown }
  | { ok: false; status: 400 | 413; message: string }
> {
  if (!validateRequestSize(request.headers, maxBytes)) {
    return {
      ok: false,
      status: 413,
      message: "The request payload is too large.",
    };
  }

  const raw = await request.text().catch(() => null);
  if (typeof raw !== "string") {
    return {
      ok: false,
      status: 400,
      message: "The request body could not be read.",
    };
  }

  if (Buffer.byteLength(raw, "utf8") > maxBytes) {
    return {
      ok: false,
      status: 413,
      message: "The request payload is too large.",
    };
  }

  try {
    return {
      ok: true,
      value: JSON.parse(raw),
    };
  } catch {
    return {
      ok: false,
      status: 400,
      message: "The request body is not valid JSON.",
    };
  }
}

export async function consumeChatRateLimit(identifier: string, now = Date.now()) {
  const adapter = getConfiguredAdapter();
  if (!adapter) {
    return consumeInMemoryRateLimit(identifier, now);
  }

  try {
    return await adapter.consume(identifier, now);
  } catch {
    return consumeInMemoryRateLimit(identifier, now);
  }
}

export function setChatRateLimitAdapterForTests(adapter: RateLimitStoreAdapter | null) {
  overrideAdapter = adapter;
}

export function resetChatRateLimitStore() {
  rateLimitStore.clear();
  overrideAdapter = null;
  configuredAdapter = undefined;
}
