# Walkthrough

## Run locally
1. `cd data-maturity-studio`
2. `pnpm install`
3. `pnpm dev`
4. Open `http://127.0.0.1:3000` or the port shown by Next.js

## Main routes
- `/`
- `/dmm`
- `/dmm/start`
- `/dmm/results`
- `/drl`
- `/drl/start`
- `/drl/results`

## Product flow
1. Choose DMM or DRL
2. Start an assessment
3. Set scope:
   - use case
   - organization
4. Answer deterministic questions
5. Optionally upload CSV evidence and paste notes
6. Generate a report
7. Ask follow-up questions in AI mode or deterministic mode
8. Export via print or JSON download

## Architecture
- `src/lib/diagnostics/types.ts`
  - shared domain types
- `src/lib/diagnostics/catalog.ts`
  - root conditions, signals, use cases, interventions
- `src/lib/diagnostics/questions.ts`
  - typed question bank
- `src/lib/diagnostics/evidence.ts`
  - deterministic evidence summarization
- `src/lib/diagnostics/engine.ts`
  - root scoring, confidence, DRL banding, action plan composition
- `src/lib/diagnostics/deterministic-chat.ts`
  - browser-only report assistant fallback
- `src/lib/diagnostics/storage.ts`
  - browser-local draft and result persistence
- `src/app/api/chat/route.ts`
  - server-side Groq proxy using env-backed secrets only
- `src/components/diagnostics/*`
  - shared product UI, assessment flow, and results rendering

## Current test coverage
- domain tests for scoring, evidence parsing, and deterministic chat
- live Playwright validation on the Vercel deployment for DMM and DRL public flows
- source-alignment pass against the October 2025 white paper for Ten Root Conditions, DRL 1-7 language, and DPM / TDQM framing

## Validation commands
- `pnpm test`
- `pnpm lint`
- `pnpm build`
- manual Playwright CLI pass against `https://data-maturity-studio.vercel.app`

## Deployment
- Deploy on Vercel
- Set `GROQ_API_KEY` and `GROQ_MODEL` in project environment variables
- The server route is responsible for Groq requests so the key never reaches the client
- If Groq rate-limits, the UI shows a countdown and keeps deterministic chat available
- Production URL: `https://data-maturity-studio.vercel.app`
