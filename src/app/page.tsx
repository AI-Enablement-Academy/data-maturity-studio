import Link from "next/link";

import { PageShell } from "@/components/diagnostics/chrome";
import { RecentReports } from "@/components/diagnostics/recent-reports";

export default function HomePage() {
  return (
    <PageShell
      eyebrow="Diagnostic Suite"
      title="Deterministic diagnostics for workflow quality, reuse, and controlled AI suitability."
      summary="This studio has two areas from one codebase: DQ for the full six-dimension diagnostic, and Readiness Check for a shorter workflow snapshot."
    >
      <div className="flex flex-col gap-8 lg:gap-10">
        <div className="grid items-stretch gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
          <article
            className="relative flex h-full flex-col overflow-hidden rounded-[2.2rem] border border-[#1E40AF]/18 bg-[linear-gradient(145deg,rgba(255,255,255,0.98),rgba(239,246,255,0.96))] p-8 shadow-[0_24px_80px_rgba(30,64,175,0.12)]"
            data-reveal="card"
          >
            <div className="pointer-events-none absolute right-0 top-0 h-44 w-44 bg-[radial-gradient(circle,_rgba(30,64,175,0.2),_transparent_70%)]" />
            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#1E40AF]">DQ</p>
              <h2 className="max-w-xl text-4xl leading-tight font-semibold text-slate-950">
                Diagnose what is actually breaking trust before you choose the next fix.
              </h2>
              <p className="max-w-2xl text-base leading-8 text-slate-600">
                The DQ surface is the fuller workflow tool: six diagnostic dimensions, the three highest-pressure dimensions, a workflow-state snapshot, and an action plan built for real operating friction.
              </p>
            </div>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {[
                ["6", "diagnostic dimensions"],
                ["3", "pressure points"],
                ["1", "next-step plan"],
              ].map(([value, label]) => (
                <div key={label} className="flex h-full flex-col justify-between rounded-[1.5rem] border border-slate-200 bg-white/90 px-4 py-5">
                  <p className="text-3xl font-semibold text-slate-950">{value}</p>
                  <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</p>
                </div>
              ))}
            </div>
            <div className="mt-auto flex flex-wrap gap-3 pt-8">
                <Link
                  href="/dq/start"
                  className="interactive-pill rounded-full bg-[#1E40AF] px-6 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(30,64,175,0.22)] hover:bg-[#1D4ED8]"
                >
                  Start DQ assessment
                </Link>
                <Link
                  href="/dq"
                  className="interactive-pill rounded-full border border-[#1E40AF]/18 bg-white px-6 py-3 text-sm font-semibold text-[#1E293B] hover:border-[#1E40AF]/35"
                >
                  Open DQ overview
                </Link>
            </div>
          </article>

          <article
            className="relative flex h-full flex-col overflow-hidden rounded-[2.2rem] border border-[#F97316]/28 bg-[linear-gradient(180deg,#1E293B_0%,#0F172A_100%)] p-8 text-white shadow-[0_24px_80px_rgba(15,23,42,0.22)]"
            data-reveal="card"
          >
            <div className="pointer-events-none absolute -right-10 top-8 h-36 w-36 rounded-full bg-[radial-gradient(circle,_rgba(249,115,22,0.48),_transparent_68%)]" />
            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-orange-300">Readiness</p>
              <h2 className="text-3xl leading-tight font-semibold">Get the shorter workflow snapshot with the logic still visible.</h2>
              <p className="text-base leading-8 text-slate-300">
                The Readiness Check is the lighter wrapper for fast first-pass conversations. It stays grounded in deterministic scoring, explicit capability gaps, and an AI suitability gate.
              </p>
            </div>
            <div className="mt-8 space-y-3">
              {[
                "Current workflow state",
                "What still blocks dependable reuse",
                "AI suitability gate",
              ].map((item) => (
                <div key={item} className="rounded-[1.3rem] border border-white/10 bg-white/8 px-4 py-3 text-sm text-slate-100">
                  {item}
                </div>
              ))}
            </div>
            <div className="mt-auto flex flex-wrap gap-3 pt-8">
                <Link
                  href="/drl/start"
                  className="interactive-pill rounded-full bg-[#F97316] px-6 py-3 text-sm font-semibold text-white hover:bg-[#EA580C]"
                >
                  Start readiness check
                </Link>
                <Link
                  href="/drl"
                  className="interactive-pill rounded-full border border-white/18 bg-white/6 px-6 py-3 text-sm font-semibold text-white hover:border-[#FDBA74] hover:bg-white/10"
                >
                  Open readiness overview
                </Link>
            </div>
          </article>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              title: "Explainable scoring",
              summary: "The six-dimension profile, workflow state, and action plan come from deterministic logic you can inspect and challenge.",
            },
            {
              title: "Private by default",
              summary: "Reports stay in this browser until someone deliberately copies a portable share link or downloads an export.",
            },
            {
              title: "AI is optional",
              summary: "The assistant can interpret a finished report, but deterministic mode is always available and never leaves the browser.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-[1.6rem] border border-slate-200/80 bg-white/84 px-5 py-5 shadow-[0_18px_50px_rgba(15,23,42,0.05)]"
              data-reveal="card"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#1E40AF]">{item.title}</p>
              <p className="mt-3 text-sm leading-7 text-slate-700">{item.summary}</p>
            </div>
          ))}
        </div>

        <RecentReports />
      </div>
    </PageShell>
  );
}
