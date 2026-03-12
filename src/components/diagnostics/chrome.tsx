import Link from "next/link";

import { AnimatedShell } from "@/components/diagnostics/animated-shell";
import { productConfigs } from "@/lib/diagnostics/product-config";
import { ProductType } from "@/lib/diagnostics/types";

function FooterLink({
  label,
  href,
  children,
}: {
  label: string;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a
      aria-label={label}
      className="interactive-pill inline-flex items-center gap-2 rounded-full border border-[#1E40AF]/14 bg-white px-3 py-2 text-slate-700 hover:border-[#1E40AF]/30 hover:text-slate-950"
      href={href}
      rel="noreferrer"
      target="_blank"
      title={label}
    >
      {children}
      <span className="text-xs font-semibold text-slate-700">{label}</span>
    </a>
  );
}

function FooterIconLinkedIn() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M6.94 8.5H3.56V20h3.38V8.5Zm.22-3.56a1.98 1.98 0 1 0-3.96 0 1.98 1.98 0 0 0 3.96 0ZM20.44 13.08c0-3.46-1.84-5.08-4.3-5.08-1.98 0-2.86 1.09-3.36 1.86V8.5H9.4c.04.9 0 11.5 0 11.5h3.38v-6.42c0-.34.03-.68.13-.92.27-.68.88-1.38 1.9-1.38 1.34 0 1.88 1.03 1.88 2.53V20h3.38v-6.92Z" />
    </svg>
  );
}

function FooterIconGithub() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 .5a12 12 0 0 0-3.8 23.39c.6.12.82-.26.82-.58v-2.02c-3.34.72-4.05-1.42-4.05-1.42-.55-1.38-1.33-1.75-1.33-1.75-1.09-.74.08-.73.08-.73 1.2.09 1.83 1.22 1.83 1.22 1.07 1.8 2.8 1.28 3.48.98.11-.76.42-1.28.76-1.58-2.67-.3-5.47-1.31-5.47-5.86 0-1.3.47-2.36 1.23-3.2-.12-.3-.53-1.5.12-3.12 0 0 1.01-.32 3.3 1.22a11.66 11.66 0 0 1 6 0c2.28-1.54 3.29-1.22 3.29-1.22.66 1.62.25 2.82.12 3.12.77.84 1.23 1.9 1.23 3.2 0 4.56-2.8 5.55-5.48 5.84.43.37.82 1.1.82 2.23v3.3c0 .32.22.7.83.58A12 12 0 0 0 12 .5Z" />
    </svg>
  );
}

function FooterIconRepo() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="M8 6.75A2.75 2.75 0 0 1 10.75 4h6.5A2.75 2.75 0 0 1 20 6.75v10.5A2.75 2.75 0 0 1 17.25 20h-6.5A2.75 2.75 0 0 1 8 17.25V6.75Z" />
      <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H8v14H6.5A2.5 2.5 0 0 1 4 16.5v-9Z" />
    </svg>
  );
}

function FooterIconGlobe() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17" />
      <path d="M12 3.5c2.6 2.24 4.25 5.26 4.25 8.5S14.6 18.26 12 20.5c-2.6-2.24-4.25-5.26-4.25-8.5S9.4 5.74 12 3.5Z" />
    </svg>
  );
}

export function DiagnosticsNav({ activeProduct }: { activeProduct?: ProductType }) {
  return (
    <nav
      aria-label="Primary"
      className="flex flex-wrap items-center justify-between gap-4 rounded-full border border-slate-200/80 bg-white/82 px-4 py-3 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur"
      data-reveal="nav"
    >
      <Link href="/" className="font-semibold tracking-[0.22em] text-[#1E293B] uppercase">
        Data Quality Studio
      </Link>
      <div className="flex gap-2 text-sm">
        {Object.values(productConfigs).map((config) => {
          const isActive = activeProduct === config.productType;
          return (
            <Link
              key={config.productType}
              href={config.routeBase}
              aria-label={config.title}
              className={`interactive-pill rounded-full px-4 py-2 ${
                isActive
                  ? "bg-[#1E40AF] text-white shadow-[0_12px_30px_rgba(30,64,175,0.25)]"
                  : "border border-[#1E40AF]/10 bg-[#EFF6FF] text-[#1E293B] hover:border-[#1E40AF]/25 hover:bg-white"
              }`}
            >
              <span className="sm:hidden">{config.shortTitle}</span>
              <span className="hidden sm:inline">{config.title}</span>
            </Link>
          );
        })}
        <Link
          href="/method"
          className="interactive-pill rounded-full border border-[#F97316]/18 bg-[#FFF7ED] px-4 py-2 text-[#9A3412] hover:border-[#F97316]/35 hover:bg-white"
        >
          Method
        </Link>
      </div>
    </nav>
  );
}

function ProductAreaStrip({ activeProduct, compact = false }: { activeProduct?: ProductType; compact?: boolean }) {
  return (
    <section
      className={`grid gap-4 rounded-[2rem] border border-white/50 bg-white/72 shadow-[0_18px_50px_rgba(15,23,42,0.06)] backdrop-blur ${
        compact
          ? "p-3 lg:grid-cols-[190px_minmax(0,1fr)_minmax(0,1fr)]"
          : "p-4 lg:grid-cols-[220px_minmax(0,1fr)_minmax(0,1fr)]"
      }`}
      data-reveal="card"
    >
      <div className={`rounded-[1.4rem] border border-slate-200 bg-slate-50/90 ${compact ? "px-4 py-3" : "px-4 py-4"}`}>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#F97316]">Two areas</p>
        <p className={`mt-3 text-slate-600 ${compact ? "text-xs leading-6" : "text-sm leading-7"}`}>
          DQ is the fuller six-dimension diagnostic. Readiness Check is the shorter workflow snapshot.
        </p>
      </div>
      {Object.values(productConfigs).map((config) => {
        const isActive = activeProduct === config.productType;
        return (
          <Link
            key={config.productType}
            href={config.routeBase}
            className={`interactive-card rounded-[1.55rem] border ${
              isActive
                ? "border-[#1E40AF]/20 bg-[linear-gradient(145deg,rgba(30,64,175,0.16),rgba(255,255,255,0.98))] shadow-[0_20px_52px_rgba(30,64,175,0.14)]"
                : "border-slate-200 bg-white"
            } ${compact ? "px-4 py-4" : "px-5 py-5"}`}
            data-tone={config.productType === "drl" ? "orange" : "blue"}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${config.productType === "drl" ? "text-[#C2410C]" : "text-[#1E40AF]"}`}>
                  {config.shortTitle}
                </p>
                <h2 className={`${compact ? "mt-1 text-xl" : "mt-2 text-2xl"} font-semibold text-slate-950`}>
                  {config.title}
                </h2>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${
                  isActive
                    ? config.productType === "drl"
                      ? "bg-[#F97316] text-white"
                      : "bg-[#1E40AF] text-white"
                    : config.productType === "drl"
                      ? "bg-[#FFF7ED] text-[#9A3412]"
                      : "bg-[#EFF6FF] text-[#1E40AF]"
                }`}
              >
                {isActive ? "Active area" : "Open area"}
              </span>
            </div>
            <p className={`mt-3 text-slate-600 ${compact ? "text-sm leading-6" : "text-sm leading-7"}`}>{config.summary}</p>
            {!compact ? <p className="mt-3 text-sm leading-7 text-slate-500">{config.positioning}</p> : null}
            <div className="mt-4 flex items-center justify-between border-t border-slate-200/80 pt-4">
              <span className={`cta-cue ${config.productType === "drl" ? "text-[#C2410C]" : "text-[#1E40AF]"}`}>
                {isActive ? "View current area" : `Open ${config.title}`}
              </span>
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                {config.productType === "dq" ? "Full diagnostic" : "Quick view"}
              </span>
            </div>
          </Link>
        );
      })}
    </section>
  );
}

export function PageShell({
  activeProduct,
  eyebrow,
  title,
  summary,
  variant = "default",
  children,
}: {
  activeProduct?: ProductType;
  eyebrow: string;
  title: string;
  summary: string;
  variant?: "default" | "task";
  children: React.ReactNode;
}) {
  const isTaskVariant = variant === "task";

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(30,64,175,0.14),_transparent_32%),radial-gradient(circle_at_90%_10%,_rgba(249,115,22,0.12),_transparent_22%),linear-gradient(180deg,#f8fafc_0%,#eef2f7_100%)]">
      <AnimatedShell>
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <div className={`mx-auto flex min-h-screen max-w-7xl flex-col px-5 py-6 sm:px-8 lg:px-10 ${isTaskVariant ? "gap-5" : "gap-8"}`}>
          <DiagnosticsNav activeProduct={activeProduct} />
          {isTaskVariant ? (
            <header className="rounded-[1.9rem] border border-white/50 bg-[linear-gradient(135deg,rgba(255,255,255,0.95),rgba(241,245,249,0.94))] px-6 py-5 shadow-[0_18px_44px_rgba(15,23,42,0.08)]">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div className="space-y-3" data-reveal="hero">
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#1E40AF]">{eyebrow}</p>
                  <h1 className="max-w-4xl text-3xl leading-tight font-semibold text-slate-950 sm:text-4xl">
                    {title}
                  </h1>
                  <p className="max-w-3xl text-base leading-7 text-slate-600">{summary}</p>
                </div>
                <div className="grid gap-2 sm:grid-cols-3">
                  {["Deterministic core", "Public alpha", "PDF export"].map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-slate-200 bg-white/85 px-4 py-2 text-center text-xs font-semibold tracking-[0.16em] text-slate-600 uppercase"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </header>
          ) : (
            <header className="relative overflow-hidden rounded-[2.4rem] border border-white/50 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(241,245,249,0.94))] p-8 shadow-[0_24px_80px_rgba(15,23,42,0.10)] lg:grid lg:grid-cols-[minmax(0,1.25fr)_320px] lg:gap-6">
              <div className="pointer-events-none absolute inset-y-0 right-[18%] hidden w-px bg-[linear-gradient(180deg,rgba(30,64,175,0),rgba(30,64,175,0.18),rgba(30,64,175,0))] lg:block" />
              <div className="pointer-events-none absolute -right-14 top-6 h-40 w-40 rounded-full bg-[radial-gradient(circle,_rgba(249,115,22,0.18),_transparent_70%)]" />
              <div className="pointer-events-none absolute -left-10 bottom-4 h-32 w-32 rounded-full bg-[radial-gradient(circle,_rgba(30,64,175,0.14),_transparent_70%)]" />
              <div className="space-y-4" data-reveal="hero">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#1E40AF]">
                  {eyebrow}
                </p>
                <h1 className="max-w-4xl text-4xl leading-[1.06] font-semibold text-slate-950 sm:text-5xl lg:text-[3.9rem]">
                  {title}
                </h1>
                <p className="max-w-3xl text-lg leading-8 text-slate-600">{summary}</p>
                <div className="flex flex-wrap gap-3 pt-3">
                  {["Deterministic core", "Public alpha", "PDF export"].map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-slate-200 bg-white/85 px-4 py-2 text-xs font-semibold tracking-[0.16em] text-slate-600 uppercase"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
              <div
                className="mt-6 rounded-[2rem] bg-[linear-gradient(180deg,#1E293B_0%,#0F172A_100%)] p-6 text-sm leading-7 text-slate-200 shadow-[0_20px_50px_rgba(15,23,42,0.22)] lg:mt-0"
                data-reveal="hero"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-orange-300">Design stance</p>
                <p className="mt-3 text-2xl font-semibold leading-tight text-white">Deterministic scoring, readable outputs, and explicit limits.</p>
                <div className="mt-5 space-y-4">
                  <div className="rounded-[1.25rem] border border-white/10 bg-white/6 px-4 py-3 transition duration-200 hover:bg-white/8">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Logic</p>
                    <p className="mt-2 text-sm text-slate-100">Primary-literature-grounded, deterministic scoring with explicit blockers and rationale.</p>
                  </div>
                  <div className="rounded-[1.25rem] border border-white/10 bg-white/6 px-4 py-3 transition duration-200 hover:bg-white/8">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Output</p>
                    <p className="mt-2 text-sm text-slate-100">Readable reports, stronger charts, and artifacts that hold up in planning and review.</p>
                  </div>
                </div>
              </div>
            </header>
          )}
          <ProductAreaStrip activeProduct={activeProduct} compact={isTaskVariant} />
          <main id="main-content" className="flex-1" tabIndex={-1}>
            {children}
          </main>
          <footer
            className={`rounded-[1.75rem] border border-white/50 bg-white/78 text-sm leading-7 text-slate-600 shadow-[0_18px_50px_rgba(15,23,42,0.06)] backdrop-blur ${
              isTaskVariant ? "px-5 py-4" : "px-5 py-5"
            }`}
            data-reveal="card"
          >
            <div className={`mb-4 grid gap-3 ${isTaskVariant ? "xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]" : "xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.15fr)_minmax(0,0.9fr)]"}`}>
              <div className="rounded-[1.35rem] border border-[#1E40AF]/12 bg-[linear-gradient(145deg,rgba(239,246,255,0.9),rgba(255,255,255,0.92))] px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#1E40AF]">Data Quality Studio created by</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <FooterLink label="Adam LinkedIn" href="https://www.linkedin.com/in/adambkovacs/">
                    <FooterIconLinkedIn />
                  </FooterLink>
                  <FooterLink label="Adam GitHub" href="https://github.com/adambkovacs">
                    <FooterIconGithub />
                  </FooterLink>
                </div>
              </div>
              <div className="rounded-[1.35rem] border border-[#F97316]/14 bg-[linear-gradient(145deg,rgba(255,247,237,0.92),rgba(255,255,255,0.94))] px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#C2410C]">Academy and project</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <FooterLink label="Academy GitHub" href="https://github.com/AI-Enablement-Academy">
                    <FooterIconGithub />
                  </FooterLink>
                  <FooterLink label="Project repo" href="https://github.com/AI-Enablement-Academy/data-quality-studio">
                    <FooterIconRepo />
                  </FooterLink>
                  <FooterLink label="Academy website" href="https://aienablement.academy">
                    <FooterIconGlobe />
                  </FooterLink>
                </div>
              </div>
              <div className="rounded-[1.35rem] border border-slate-200 bg-slate-50/85 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Method and safety</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link
                    href="/method"
                    className="interactive-pill inline-flex items-center gap-2 rounded-full border border-[#F97316]/18 bg-white px-3 py-2 text-xs font-semibold text-[#9A3412] hover:border-[#F97316]/35 hover:text-[#7C2D12]"
                  >
                    Method and alpha limits
                  </Link>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-500">
                  Private by default in this browser. Reports become public only if someone deliberately copies and shares a snapshot link.
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-2 border-t border-slate-200 pt-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-2">
                <p>
                  Data Quality Studio created by{" "}
                  <a
                    className="font-semibold text-[#1E293B] underline decoration-[#1E40AF]/35 underline-offset-4"
                    href="https://www.linkedin.com/in/adambkovacs/"
                    rel="noreferrer"
                    target="_blank"
                  >
                    Adam Kovacs
                  </a>{" "}
                  x{" "}
                  <a
                    className="font-semibold text-[#1E293B] underline decoration-[#1E40AF]/35 underline-offset-4"
                    href="https://aienablement.academy"
                    rel="noreferrer"
                    target="_blank"
                  >
                    AI Enablement Academy
                  </a>
                  . Public MIT codebase, free to inspect, and still a limited alpha prototype.
                </p>
                <p className="mt-2 text-xs leading-5 text-slate-500">
                  The current six diagnostic dimensions, workflow-state model, scoring engine, question bank, and action logic are original to this implementation. The method draws on Wang &amp; Strong (1996), Pipino, Lee &amp; Wang (2002), Wang (1998), and Lawrence (2017).
                </p>
                <p className="mt-2 text-xs leading-5 text-slate-500">
                  This site does not use cookies, tracking pixels, or analytics. No personal data is collected, stored, or shared. All assessment data stays in your browser unless you explicitly choose to share a report link.
                </p>
                <p className="text-slate-500">
                  Some features rely on tightly budgeted third-party APIs, so availability may be capped or temporarily downgraded.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                <span>Deterministic scoring first.</span>
                <span>AI assist is optional.</span>
                <span>Browser-local by default.</span>
                <span>No tracking. No cookies.</span>
              </div>
            </div>
          </footer>
        </div>
      </AnimatedShell>
    </div>
  );
}
