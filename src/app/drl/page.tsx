import Link from "next/link";

import { PageShell } from "@/components/diagnostics/chrome";
import { RecentReports } from "@/components/diagnostics/recent-reports";

export default function DRLPage() {
  return (
    <PageShell
      activeProduct="drl"
      eyebrow="Readiness check"
      title="Readiness Check"
      summary="Get a shorter workflow snapshot and see what still blocks dependable reuse."
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <section className="space-y-6">
          <article className="rounded-[2rem] border border-[#F97316]/18 bg-[linear-gradient(145deg,rgba(255,255,255,0.98),rgba(255,247,237,0.96))] p-8 shadow-[0_24px_80px_rgba(249,115,22,0.1)]">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#1E40AF]">What the readiness check emphasizes</p>
            <h2 className="mt-3 text-3xl font-semibold text-slate-950">A shorter workflow snapshot for quick decisions</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {[
                "A current workflow state grounded in deterministic logic",
                "What still blocks stronger reuse and control",
                "Explicit capability gaps with a clean first-pass summary",
                "A lighter assessment surface that still stays specific",
              ].map((item) => (
                <div key={item} className="rounded-[1.4rem] border border-slate-200 bg-white/90 px-4 py-4 text-sm leading-7 text-slate-700">
                  {item}
                </div>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/drl/start"
                className="interactive-pill rounded-full bg-[#F97316] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(249,115,22,0.2)] hover:bg-[#EA580C]"
              >
                Start readiness check
              </Link>
              <Link
                href="/dq"
                className="interactive-pill rounded-full border border-[#1E40AF]/18 bg-[#EFF6FF] px-5 py-3 text-sm font-semibold text-[#1E293B] hover:border-[#1E40AF]/35 hover:bg-white"
              >
                Open full DQ assessment
              </Link>
            </div>
          </article>

          <div className="grid gap-4 lg:grid-cols-2">
            <article className="rounded-[1.8rem] border border-slate-200/80 bg-white/88 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#F97316]">When to use it</p>
              <h3 className="mt-3 text-2xl font-semibold text-slate-950">Use the readiness check when the room needs a fast workflow snapshot.</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Choose the readiness check for first-pass qualification and quick workflow snapshots where speed matters.
              </p>
            </article>
            <article className="rounded-[1.8rem] border border-slate-200/80 bg-white/88 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#F97316]">What changes after the report</p>
              <h3 className="mt-3 text-2xl font-semibold text-slate-950">You can escalate to the full DQ assessment without losing the logic.</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                The readiness check is the lighter wrapper. The full DQ view stays available when you need the blocker-level diagnosis behind the snapshot.
              </p>
            </article>
          </div>
        </section>

        <aside className="space-y-6">
          <section className="rounded-[2rem] border border-slate-900/20 bg-[linear-gradient(180deg,#1E293B_0%,#0F172A_100%)] p-6 text-sm leading-7 text-slate-200 shadow-[0_24px_80px_rgba(15,23,42,0.18)]">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-orange-300">Sample output</p>
            <div className="mt-4 space-y-3">
              {["Current workflow state", "Why pressure remains", "Capability gaps", "Action-focused summary"].map((item) => (
                <div key={item} className="rounded-[1.25rem] border border-white/10 bg-white/8 px-4 py-3 text-sm text-slate-100">
                  {item}
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[2rem] border border-slate-200/80 bg-white/88 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#1E40AF]">Report stance</p>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Private by default in this browser. Public only if someone deliberately creates and shares a report snapshot link.
            </p>
          </section>
        </aside>
      </div>

      <RecentReports productType="drl" />
    </PageShell>
  );
}
