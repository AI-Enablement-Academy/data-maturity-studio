import Link from "next/link";

import { PageShell } from "@/components/diagnostics/chrome";

const sections = [
  {
    title: "Method",
    points: [
      "The Data Quality Diagnostic is the primary product. It scores six diagnostic dimensions deterministically from the questionnaire and optional evidence inputs.",
      "The Readiness Check compresses the same evidence into a shorter workflow snapshot with explicit capability gaps.",
      "The report assistant can help interpret a finished report, but it does not change scores, top blockers, workflow state, or AI suitability.",
    ],
  },
  {
    title: "Privacy",
    points: [
      "Assessment answers, saved reports, and report history are stored in this browser for alpha convenience only.",
      "Raw CSV evidence and pasted free-text notes are processed in the active tab and are not retained in draft autosave.",
      "Do not upload PII, confidential employee records, or anything you are not authorized to use in this tool.",
      "Share links are portable report snapshots. They carry the report output in the URL fragment, so only share them deliberately.",
    ],
  },
  {
    title: "External enrichment",
    points: [
      "This alpha does not run automatic company-search or web-enrichment behind the scenes.",
      "Recommendations come from the questionnaire, deterministic scoring model, optional user-provided evidence, and optional report chat context.",
      "Any future external enrichment should be opt-in, tied to named sources, and kept separate from the core quality and readiness scoring logic.",
    ],
  },
  {
    title: "Alpha limitations",
    points: [
      "This public alpha is improving accessibility and security, but it is not claiming formal WCAG 2.2 AA, OWASP, or regulatory certification yet.",
      "AI chat availability can be limited because provider usage is budget-capped and rate-limited.",
      "Browser-local storage is a temporary alpha design, not the final persistence architecture.",
      "AI assistant responses can be wrong or incomplete and should not be treated as legal, compliance, or employment advice.",
    ],
  },
];

export default function MethodPage() {
  return (
    <PageShell
      eyebrow="Method"
      title="How the diagnostic works, what it stores, and what it does not claim"
      summary="This alpha is built for transparency. The scoring engine is deterministic, the report assistant is optional, and the source basis is stated clearly."
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="space-y-6 rounded-[2rem] border border-white/50 bg-white/90 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
          {sections.map((section) => (
            <article key={section.title} className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-6">
              <h2 className="text-2xl font-semibold text-slate-950">{section.title}</h2>
              <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-700">
                {section.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </article>
          ))}
        </section>

        <aside className="space-y-6">
          <section className="rounded-[2rem] border border-white/50 bg-[#1E293B] p-6 text-sm leading-7 text-slate-200 shadow-[0_24px_80px_rgba(15,23,42,0.14)]">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-orange-300">Public codebase</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Built in the open</h2>
            <p className="mt-3">
              The diagnostic logic is inspectable and challengeable. That is deliberate. Trust improves when the scoring model can be read, debated, and improved.
            </p>
          </section>

          <section className="rounded-[2rem] border border-white/50 bg-white/90 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#1E40AF]">Next step</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">Run a diagnostic</h2>
            <div className="mt-5 flex flex-col gap-3">
              <Link
                href="/dq/start"
                className="rounded-full bg-slate-950 px-5 py-3 text-center text-sm font-semibold text-white"
              >
                Start DQ
              </Link>
              <Link
                href="/drl/start"
                className="rounded-full border border-slate-200 px-5 py-3 text-center text-sm font-semibold text-slate-700"
              >
                Start readiness check
              </Link>
            </div>
          </section>

          <section className="rounded-[2rem] border border-slate-200/80 bg-white/88 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#1E40AF]">Academic foundations</p>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              This tool draws on Wang &amp; Strong (1996), Pipino, Lee &amp; Wang (2002), Wang (1998), and Lawrence (2017). The six diagnostic dimensions, workflow-state model, AI suitability gate, question bank, and scoring logic are original to this implementation. The references below provide conceptual background, not a copied product scaffold.
            </p>
            <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-700">
              <li>
                Wang, Richard Y. (1998).{" "}
                <a className="underline decoration-slate-300 underline-offset-4" href="https://web.mit.edu/tdqm/www/tdqmpub/WangCACMFeb98.pdf" target="_blank" rel="noreferrer">
                  A Product Perspective on Total Data Quality Management
                </a>
                . Communications of the ACM, 41(2), 58-65.
              </li>
              <li>
                Wang, Richard Y., and Diane M. Strong (1996).{" "}
                <a className="underline decoration-slate-300 underline-offset-4" href="https://www.tandfonline.com/doi/abs/10.1080/07421222.1996.11518099" target="_blank" rel="noreferrer">
                  Beyond Accuracy: What Data Quality Means to Data Consumers
                </a>
                . Journal of Management Information Systems, 12(4).
              </li>
              <li>
                Pipino, Leo L., Yang W. Lee, and Richard Y. Wang (2002). Data Quality Assessment. Communications of the ACM, 45(4), 211-218.
              </li>
              <li>
                Lawrence, Neil D. (2017).{" "}
                <a className="underline decoration-slate-300 underline-offset-4" href="https://arxiv.org/abs/1705.02245" target="_blank" rel="noreferrer">
                  Data Readiness Levels
                </a>
                . arXiv:1705.02245.
              </li>
            </ul>
          </section>
        </aside>
      </div>
    </PageShell>
  );
}
