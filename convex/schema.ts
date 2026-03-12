import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  rateLimits: defineTable({
    key: v.string(),
    identifierHash: v.string(),
    windowMs: v.number(),
    count: v.number(),
    resetAt: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_key", ["key"]),
});
