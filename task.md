# Task

## Objective
Implement a Vercel-ready diagnostic suite with two public entry points:
- `DMM Diagnostic`
- `DRL Diagnostic`

The suite must use one shared codebase, deterministic scoring, and optional server-side AI assist that never affects scoring.

## Current status
- Standalone Next.js app scaffolded in `data-maturity-studio/`
- Shared question bank, content model, evidence mapper, and scoring engine implemented
- DMM and DRL public routes implemented
- Local draft storage and local report storage implemented
- Printable report and JSON export implemented
- Vercel-oriented server-side Groq chat integration implemented
- Deterministic browser-only chat fallback implemented
- Rate-limit countdown and auto-fallback to deterministic mode implemented
- Results-page local-storage hydration bug fixed
- Live Playwright validation completed for DMM flow, DRL flow, exports, print trigger, deterministic chat, AI chat, and rate-limit fallback behavior
- Root-condition wording and DRL threshold language aligned against the October 2025 white paper source text
- Domain tests passing
- Production build passing

## Remaining follow-up opportunities
- Add richer component-level acceptance tests
- Add analytics sink instead of local `dataLayer` pushes only
- Add real PDF generation instead of print-to-PDF flow
- Add more nuanced evidence parsing and unsupported-file UX
- Expand optional AI assist only after deterministic usage is validated
- Add persistent saved assessments only if a real backend is warranted
