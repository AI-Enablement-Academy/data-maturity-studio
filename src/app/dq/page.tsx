import Link from "next/link";

import { PageShell } from "@/components/diagnostics/chrome";
import { RecentReports } from "@/components/diagnostics/recent-reports";

export default function DQPage() {
  return (
    <PageShell
      activeProduct="dq"
      eyebrow="Quality diagnostic"
      title="Data Quality Diagnostic"
      summary="Find the conditions that make a workflow hard to trust, reuse, or expose to controlled AI use."
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <section className="space-y-6">
          <article className="rounded-[2rem] border border-[#1E40AF]/18 bg-[linear-gradient(145deg,rgba(255,255,255,0.98),rgba(239,246,255,0.96))] p-8 shadow-[0_24px_80px_rgba(30,64,175,0.12)]">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#1E40AF]">What DQ produces</p>
            <h2 className="mt-3 text-3xl font-semibold text-slate-950">A detailed workflow diagnosis, not a vague headline score</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {[
                "Severity across six diagnostic dimensions",
                "Three highest-pressure dimensions ranked by impact on trust and decision speed",
                "Current workflow state plus explicit capability gaps",
                "Near-term action plan and a scoped follow-on move",
              ].map((item) => (
                <div key={item} className="rounded-[1.4rem] border border-slate-200 bg-white/90 px-4 py-4 text-sm leading-7 text-slate-700">
                  {item}
                </div>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/dq/start"
                className="interactive-pill rounded-full bg-[#1E40AF] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(30,64,175,0.22)] hover:bg-[#1D4ED8]"
              >
                Start DQ assessment
              </Link>
              <Link
                href="/drl"
                className="interactive-pill rounded-full border border-[#F97316]/18 bg-[#FFF7ED] px-5 py-3 text-sm font-semibold text-[#9A3412] hover:border-[#F97316]/35 hover:bg-white"
              >
                Compare with readiness check
              </Link>
            </div>
          </article>

          <div className="grid gap-4 lg:grid-cols-2">
            <article className="rounded-[1.8rem] border border-slate-200/80 bg-white/88 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#F97316]">When to use it</p>
              <h3 className="mt-3 text-2xl font-semibold text-slate-950">Use DQ when the work is messy, political, or slow.</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Choose DQ when a team keeps losing time to metric disputes, recoding, inconsistent judgement, or weak AI readiness.
              </p>
            </article>
            <article className="rounded-[1.8rem] border border-slate-200/80 bg-white/88 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#F97316]">What changes after the report</p>
              <h3 className="mt-3 text-2xl font-semibold text-slate-950">You leave with a concrete next move.</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                The report is built to support a near-term operating decision, a stakeholder review, or a scoped follow-on effort, not just a score reveal.
              </p>
            </article>
          </div>
        </section>

        <aside className="space-y-6">
          <section className="rounded-[2rem] border border-slate-900/20 bg-[linear-gradient(180deg,#1E293B_0%,#0F172A_100%)] p-6 text-sm leading-7 text-slate-200 shadow-[0_24px_80px_rgba(15,23,42,0.18)]">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-orange-300">Sample output</p>
            <div className="mt-4 space-y-3">
              {["Top blocker cards", "Dimension profile", "Capability gaps", "PDF export"].map((item) => (
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

      <RecentReports productType="dq" />
    </PageShell>
  );
}
