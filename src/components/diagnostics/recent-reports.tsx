"use client";

import Link from "next/link";
import { useMemo, useState, useSyncExternalStore } from "react";

import { clearLocalDiagnosticsData, getSavedReports, subscribeDiagnosticsStorage } from "@/lib/diagnostics/storage";
import { ProductType, SavedReportSummary } from "@/lib/diagnostics/types";

function historyKey() {
  return "diagnostics:report-history:v2";
}

function getSnapshot() {
  if (typeof window === "undefined") {
    return "";
  }

  return window.localStorage.getItem(historyKey()) ?? "";
}

function formatScope(report: SavedReportSummary) {
  return report.scopeType === "use_case" ? "Use case" : "Organization";
}

function formatProduct(report: SavedReportSummary) {
  return report.productType === "dq" ? "DQ" : "RC";
}

export function RecentReports({ productType }: { productType?: ProductType }) {
  const [isClearing, setIsClearing] = useState(false);
  const historySnapshot = useSyncExternalStore(subscribeDiagnosticsStorage, getSnapshot, () => "");
  const recentReports = useMemo(
    () => {
      if (historySnapshot === "") {
        return [];
      }

      return getSavedReports(productType).slice(0, 4);
    },
    [historySnapshot, productType],
  );

  if (recentReports.length === 0) {
    return null;
  }

  function handleClear() {
    const confirmed = window.confirm(
      "Clear local drafts and saved reports from this browser? Shared links you already copied will still work.",
    );
    if (!confirmed) {
      return;
    }

    setIsClearing(true);
    clearLocalDiagnosticsData();
    setIsClearing(false);
  }

  return (
    <section className="rounded-[2rem] border border-slate-200/80 bg-[linear-gradient(145deg,rgba(255,255,255,0.98),rgba(241,245,249,0.95))] p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)]" data-reveal="card">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#F97316]">Saved reports</p>
          <h2 className="mt-3 text-3xl font-semibold text-slate-950">Recent local history</h2>
          <p className="max-w-2xl text-sm leading-7 text-slate-500">
            Stored in this browser only for now, with automatic expiry after 30 days. Open any report again without rerunning the full assessment, or clear the local record if this device is shared.
          </p>
        </div>
        <button
          type="button"
          onClick={handleClear}
          className="interactive-pill rounded-full border border-[#F97316]/18 bg-[#FFF7ED] px-4 py-2 text-sm font-semibold text-[#9A3412] shadow-[0_10px_24px_rgba(15,23,42,0.04)] hover:border-[#F97316]/35 hover:bg-white"
        >
          {isClearing ? "Clearing..." : "Clear local data"}
        </button>
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {recentReports.map((report) => (
          <article key={report.id} className="rounded-[1.7rem] border border-slate-200/90 bg-white/88 p-5 shadow-[0_12px_30px_rgba(15,23,42,0.04)]">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[#1E293B] px-3 py-1 text-xs font-semibold text-white">
                  {formatProduct(report)}
                </span>
                <span className="rounded-full bg-[#EFF6FF] px-3 py-1 text-xs font-semibold text-[#1E40AF]">
                  {report.operatingState}
                </span>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
                {formatScope(report)}
              </span>
            </div>
            <p className="mt-4 text-base leading-8 text-slate-700">{report.summaryCard}</p>
            {report.topBlockerTitles.length > 0 ? (
              <div className="mt-4 rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Highest-pressure dimensions</p>
                <p className="mt-2 text-sm leading-7 text-slate-700">{report.topBlockerTitles.join(", ")}</p>
              </div>
            ) : null}
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
              <div className="text-xs leading-6 text-slate-500">
                <p>Saved {new Date(report.completedAt).toLocaleString()}</p>
                <p>Expires {new Date(report.expiresAt).toLocaleDateString()}</p>
              </div>
              <Link
                href={`/${report.productType}/results?reportId=${encodeURIComponent(report.id)}`}
                className={`interactive-pill rounded-full px-4 py-2 text-sm font-semibold shadow-[0_10px_24px_rgba(15,23,42,0.04)] ${
                  report.productType === "dq"
                    ? "border border-[#1E40AF]/18 bg-[#EFF6FF] text-[#1E293B] hover:border-[#1E40AF]/35 hover:bg-white"
                    : "border border-[#F97316]/18 bg-[#FFF7ED] text-[#9A3412] hover:border-[#F97316]/35 hover:bg-white"
                }`}
              >
                Open report
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
