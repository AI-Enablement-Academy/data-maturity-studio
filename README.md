# Data Maturity Studio

Deterministic diagnostics for people analytics maturity, root-cause analysis, and the path to DRL 7, with an optional Groq-backed report assistant.

This project ships two public tools from one shared Next.js codebase:

- `DMM Diagnostic`
  - The primary product
  - Diagnoses the Ten Root Conditions from the handbook
  - Produces the main operational value

- `DRL Diagnostic`
  - A lighter secondary surface
  - Uses the same scoring engine
  - Outputs a likely DRL band and the gap to DRL 7

## Product principles

- No LLM dependency for core diagnostics
- Deterministic scoring and explainable output
- Root-cause diagnosis before maturity labeling
- Use-case mode as the default, organization mode as directional
- Exportable artifacts instead of generic dashboard filler
- Optional AI assist must never override deterministic scores

## Routes

- `/`
- `/dmm`
- `/dmm/start`
- `/dmm/results`
- `/drl`
- `/drl/start`
- `/drl/results`

## Local development

```bash
pnpm install
pnpm dev
```

Then open [http://127.0.0.1:3000](http://127.0.0.1:3000).

## Validation

```bash
pnpm test
pnpm lint
pnpm build
```

## Hosting

This project is intended for Vercel deployment.

Why:
- the app now includes a server-side Groq chat route
- the Groq API key must stay server-side
- Vercel handles Next.js route handlers cleanly
- this keeps the path open for later auth, persistence, and richer AI assist features

### Required environment variables

```bash
GROQ_API_KEY=your_server_side_key
GROQ_MODEL=qwen/qwen3-32b
```

For local development, put them in `.env.local`.
For production, set them in the Vercel project environment settings.
Do not commit `.env.local` or any real provider key.

### Groq integration

- Provider docs: [Groq Docs](https://console.groq.com/docs/overview)
- API base URL: `https://api.groq.com/openai/v1`
- Model: `qwen/qwen3-32b`
- The app handles `429 Too Many Requests` responses by surfacing a retry countdown and switching the user to deterministic mode so the workflow can continue.

## Architecture

- `src/lib/diagnostics/types.ts`
  - shared domain types
- `src/lib/diagnostics/catalog.ts`
  - root conditions, DRL signals, use cases, interventions
- `src/lib/diagnostics/questions.ts`
  - typed question bank
- `src/lib/diagnostics/evidence.ts`
  - deterministic evidence parsing and confidence modifiers
- `src/lib/diagnostics/engine.ts`
  - severity scoring, confidence, DRL banding, action plan composition
- `src/lib/diagnostics/deterministic-chat.ts`
  - browser-only fallback assistant based on the report model
- `src/app/api/chat/route.ts`
  - server-side Groq integration for optional AI assist
- `src/components/diagnostics/*`
  - shared product UI, wizard flow, and results rendering

## Open source

This repository is intended to be public and openly inspectable. The scoring model is deterministic by design, so users can challenge, inspect, and improve the logic without depending on a black-box AI layer. The optional assistant runs through server-side env configuration only, so no provider secrets are exposed in the client bundle.
