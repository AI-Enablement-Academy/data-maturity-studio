# Task

## Objective
Ship a Vercel-ready diagnostic suite with two public entry points:

- `Data Quality Diagnostic`
- `Readiness Check`

The suite must use one shared codebase, deterministic scoring, and optional server-side AI assist that never affects the diagnostic result.

## Current status

- Standalone Next.js app scaffolded in `data-quality-studio/`
- Shared question bank, content model, evidence mapper, and scoring engine implemented
- DQ and readiness public routes implemented
- Local draft storage and local report storage implemented
- PDF export, printable report fallback, and JSON export implemented
- Vercel-oriented server-side Groq chat integration implemented
- Deterministic browser-only chat fallback implemented
- Convex-backed shared-rate-limit path implemented for chat and PDF routes, with safe in-memory fallback for local or unprovisioned environments
- Convex backend deployed to `fabulous-buzzard-827` and generated bindings committed
- Vercel project envs added for `CONVEX_URL`, `CONVEX_HTTP_URL`, and `CONVEX_DEPLOY_KEY`
- Production Vercel project domain wiring verified
- Academy-branded shell, charts, motion, and export UX in place
- Local saved-report history and portable share-link snapshots implemented
- Method and alpha-limitations page added
- Public repo presentation upgraded with committed screenshots, badges, and richer setup docs
- GitHub repo renamed to `AI-Enablement-Academy/data-quality-studio`
- Vercel project renamed to `data-quality-explorer-studio`
- Public GitHub-facing URL:
  - `https://data-quality-explorer-studio.vercel.app`
- Readiness flow is shorter than DQ and uses the same deterministic engine
- Assessment flow now allows users to review without optional evidence, blocks final report generation until required answers are complete, supports CSV removal and same-file re-upload, and guards against stale async upload overwrites
- Question bank copy was rewritten question by question to move away from source-adjacent phrasing
- Readiness-signal labels and report charts were renamed into plainer product language
- Shared links now carry report output snapshots without the original answer sheet
- Chat now rejects off-topic and prompt-injection requests on both the client and the server
- Method page and README now include fuller academic references

## Current model reset

The source-clean model reset is implemented:

- replaced the old derivative ten-driver model with six original diagnostic dimensions
- replaced the old readiness-band framing with operating states
- replaced readiness gaps with capability gaps
- replaced the old sponsor-facing readiness surface with a shorter `Readiness Check`
- rewrote the core types, catalog, question bank, engine, evidence mapper, chat context, charts, and PDF output to the new model

## Reset validation status

- `pnpm test` passes
- `pnpm lint` passes
- `pnpm build` passes
- browser audit completed on a fresh `next start` server for:
  - `/`
  - `/dq/start`
  - `/dq/results`
  - `/drl/start`
  - `/drl/results`
  - `/method`
- browser audit covered:
  - optional evidence skip path
  - upload, remove, and same-file re-upload
  - DQ report generation
  - readiness report generation
  - JSON export
  - PDF export
  - share snapshot links
  - client-side chat refusal
  - server-side off-topic and prompt-injection refusal

## Follow-up opportunities after the reset

- richer component-level acceptance tests and a scripted browser regression suite
- analytics sink instead of local `dataLayer` pushes only
- more nuanced evidence parsing and unsupported-file UX
- server-side persistence and signed share links in a future V2
- richer company-context enrichment only behind explicit user consent
- deeper manual assistive-technology audit if needed later
