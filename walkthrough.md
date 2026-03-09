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
7. Export via print or JSON download

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
- `src/lib/diagnostics/storage.ts`
  - browser-local draft and result persistence
- `src/components/diagnostics/*`
  - shared product UI, assessment flow, and results rendering

## Validation commands
- `pnpm test`
- `pnpm lint`
- `pnpm build`

## Deployment
- Deploy on Vercel
- Set `GROQ_API_KEY` and `GROQ_MODEL` in project environment variables
- The server route is responsible for Groq requests so the key never reaches the client
