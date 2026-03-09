# Task

## Objective
Implement a Vercel-ready diagnostic suite with two public entry points:
- `DMM Diagnostic`
- `DRL Diagnostic`

The suite must use one shared codebase, deterministic scoring, and no LLM dependency in v1.

## Current status
- Standalone Next.js app scaffolded in `data-maturity-studio/`
- Shared question bank, content model, evidence mapper, and scoring engine implemented
- DMM and DRL public routes implemented
- Local draft storage and local report storage implemented
- Printable report and JSON export implemented
- Vercel-oriented server-side Groq chat integration in progress
- Domain tests passing
- Production build passing

## Remaining follow-up opportunities
- Add richer component-level acceptance tests
- Add analytics sink instead of local `dataLayer` pushes only
- Add real PDF generation instead of print-to-PDF flow
- Add more nuanced evidence parsing and unsupported-file UX
- Add optional AI assist only after deterministic usage is validated
- Add persistent saved assessments only if a real backend is warranted
