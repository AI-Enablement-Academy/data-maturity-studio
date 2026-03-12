# Walkthrough

## Run locally

1. `cd data-quality-studio`
2. `pnpm install`
3. `pnpm dev`
4. Open `http://127.0.0.1:3000` or the port shown by Next.js

## Main routes

- `/`
- `/dq`
- `/dq/start`
- `/dq/results`
- `/drl`
- `/drl/start`
- `/drl/results`
- `/method`
- `/dmm` redirects to `/dq`

## Product flow

1. Choose DQ or Readiness Check
2. Start an assessment
3. Set scope:
   - use case
   - organization
4. Answer deterministic questions
5. For DQ only, optionally upload CSV evidence and paste notes
6. Generate a report
7. Ask follow-up questions in AI mode or deterministic mode
8. Export via PDF report, print fallback, JSON download, or portable share link

## Architecture

- `src/lib/diagnostics/types.ts`
  - shared domain types
- `src/lib/diagnostics/catalog.ts`
  - six diagnostic dimensions, readiness signals, use cases, interventions
- `src/lib/diagnostics/questions.ts`
  - typed question bank with question-by-question rewritten copy
- `src/lib/diagnostics/evidence.ts`
  - deterministic evidence summarization
- `src/lib/diagnostics/engine.ts`
  - dimension scoring, operating-state assignment, AI suitability, action plan composition
- `src/lib/diagnostics/deterministic-chat.ts`
  - browser-only report assistant fallback
- `src/lib/diagnostics/chat-scope.ts`
  - off-topic and prompt-injection refusal rules shared by client and server
- `src/lib/diagnostics/storage.ts`
  - browser-local draft and result persistence with evidence stripping, expiry, and delete/clear controls
- `src/lib/diagnostics/chat-guard.ts`
  - request validation, trusted-origin checks, JSON-size guards, and Convex-backed chat throttling with local fallback
- `convex/schema.ts`
  - durable server-side rate-limit schema
- `convex/rateLimits.ts`
  - shared throttle mutation for Next.js routes
- `src/app/api/chat/route.ts`
  - server-side Groq proxy using env-backed secrets only
- `src/app/api/report-pdf/route.ts`
  - server-side PDF download route with the same request-validation and abuse-throttle boundary as chat
- `src/app/method/page.tsx`
  - public method, privacy, alpha-limitations, and source page
- `src/components/diagnostics/*`
  - shared product UI, site-wide DQ/readiness switcher, assessment flow, motion shell, charts, PDF document, and results rendering

## Source stance

This alpha now treats source clarity as a hard constraint.

- The method draws on Wang & Strong (1996), Pipino, Lee & Wang (2002), Wang (1998), and Lawrence (2017).
- The current six diagnostic dimensions are original to this implementation.
- The operating-state model is original to this implementation.
- The AI suitability gate is original to this implementation.
- The question bank, chart labels, and workflow-facing copy were rewritten to stand on the primary literature and the product's own framing.

## Current test coverage

- domain tests for scoring, evidence parsing, share helpers, and deterministic chat
- component tests for assessment flow and report rendering
- local browser validation for charts, focus handling, semantic state, optional-evidence skip, upload removal and re-upload, PDF download, share behavior, chat refusal behavior, and console cleanliness
- route coverage across `/`, `/dq`, `/dq/start`, `/dq/results`, `/drl`, `/drl/start`, `/drl/results`, and `/method`

## Validation commands

- `pnpm test`
- `pnpm lint`
- `pnpm build`

## Deployment

- Deploy on Vercel
- Set `GROQ_API_KEY`, `GROQ_MODEL`, `CONVEX_URL`, `CONVEX_HTTP_URL`, and `CONVEX_DEPLOY_KEY` in project environment variables
- The server route is responsible for Groq requests so the key never reaches the client
- Convex owns the durable shared throttle path for chat and PDF export
- If Groq rate-limits, the UI shows a countdown and keeps deterministic chat available
- PDF export is generated server-side through `/api/report-pdf`
- Share links are URL-fragment snapshots and browser-local reports expire after 30 days

Production URL:

- `https://data-quality-explorer-studio.vercel.app`

## Remaining realities

- Share links are still portable client-side snapshots, not signed server-issued links
- Browser-local report history is still an alpha convenience layer, not multi-device persistence
- The report assistant is intentionally narrow and will refuse unrelated questions instead of acting like a general chatbot
