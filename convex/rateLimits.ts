import { mutation } from "./_generated/server";
import { v } from "convex/values";

const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 12;

export const consume = mutation({
  args: {
    identifierHash: v.string(),
    now: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = args.now ?? Date.now();
    const bucket = Math.floor(now / RATE_LIMIT_WINDOW_MS);
    const resetAt = (bucket + 1) * RATE_LIMIT_WINDOW_MS;
    const key = `chat-rate-limit:${bucket}:${args.identifierHash}`;
    const existing = await ctx.db
      .query("rateLimits")
      .withIndex("by_key", (query) => query.eq("key", key))
      .unique();

    if (!existing) {
      await ctx.db.insert("rateLimits", {
        key,
        identifierHash: args.identifierHash,
        windowMs: RATE_LIMIT_WINDOW_MS,
        count: 1,
        resetAt,
        createdAt: now,
        updatedAt: now,
      });

      return {
        allowed: true,
        remaining: RATE_LIMIT_MAX_REQUESTS - 1,
        retryAfterSeconds: Math.max(1, Math.ceil((resetAt - now) / 1000)),
      };
    }

    const nextCount = existing.count + 1;
    await ctx.db.patch(existing._id, {
      count: nextCount,
      updatedAt: now,
      resetAt,
    });

    if (nextCount > RATE_LIMIT_MAX_REQUESTS) {
      return {
        allowed: false,
        remaining: 0,
        retryAfterSeconds: Math.max(1, Math.ceil((resetAt - now) / 1000)),
      };
    }

    return {
      allowed: true,
      remaining: Math.max(0, RATE_LIMIT_MAX_REQUESTS - nextCount),
      retryAfterSeconds: Math.max(1, Math.ceil((resetAt - now) / 1000)),
    };
  },
});
