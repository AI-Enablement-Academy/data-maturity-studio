import Link from "next/link";

import { PageShell } from "@/components/diagnostics/chrome";
import { productConfigs } from "@/lib/diagnostics/product-config";

export default function HomePage() {
  return (
    <PageShell
      eyebrow="Diagnostic Suite"
      title="Deterministic diagnostics for data maturity, root causes, and the path to DRL 7."
      summary="This studio ships two public entry points from one codebase: a fuller DMM diagnostic for root-cause analysis and a lighter DRL diagnostic for maturity banding and sponsor conversations."
    >
      <div className="grid gap-6 lg:grid-cols-2">
        {Object.values(productConfigs).map((config) => (
          <article
            key={config.productType}
            className="rounded-[2rem] border border-white/50 bg-white/90 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)]"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-700">
              {config.shortTitle}
            </p>
            <h2 className="mt-4 text-3xl font-semibold text-slate-950">{config.title}</h2>
            <p className="mt-4 text-base leading-8 text-slate-600">{config.summary}</p>
            <p className="mt-5 text-sm leading-7 text-slate-500">{config.positioning}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={config.routeBase}
                className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
              >
                Open {config.shortTitle}
              </Link>
              <Link
                href={`${config.routeBase}/start`}
                className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700"
              >
                Start assessment
              </Link>
            </div>
          </article>
        ))}
      </div>
    </PageShell>
  );
}
