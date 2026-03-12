"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";

import { AssistantChat } from "@/components/diagnostics/assistant-chat";
import { ReportCharts } from "@/components/diagnostics/report-charts";
import { rebuildAssessmentSessionForProduct } from "@/lib/diagnostics/engine";
import { productConfigs } from "@/lib/diagnostics/product-config";
import { decodeSharedSession, encodeSharedSession } from "@/lib/diagnostics/share";
import {
  deleteSavedReport,
  loadReportById,
  loadResultSnapshot,
  parseResultSnapshot,
  subscribeDiagnosticsStorage,
} from "@/lib/diagnostics/storage";
import { trackEvent } from "@/lib/diagnostics/tracking";
import { AssessmentSession, DiagnosticDimensionScore, ProductType, SharedReportSnapshot } from "@/lib/diagnostics/types";

type ReportSession = AssessmentSession | SharedReportSnapshot;

function readShareTokenFromHash() {
  if (typeof window === "undefined") {
    return null;
  }

  return new URLSearchParams(window.location.hash.replace(/^#/, "")).get("share");
}

function readStoredSessionSnapshot(productType: ProductType, source: string | null, reportId: string | null) {
  if (reportId) {
    const savedReport = loadReportById(reportId);
    if (savedReport) {
      return JSON.stringify(savedReport);
    }
  }

  const nextSnapshot = loadResultSnapshot(productType);
  if (!nextSnapshot && productType === "drl" && source === "dq") {
    return loadResultSnapshot("dq");
  }
  return nextSnapshot;
}

function severityTone(score: number) {
  if (score >= 3) {
    return "bg-rose-100 text-rose-900 border-rose-200";
  }
  if (score >= 2) {
    return "bg-amber-100 text-amber-950 border-amber-200";
  }
  if (score >= 1) {
    return "bg-sky-100 text-sky-900 border-sky-200";
  }
  return "bg-emerald-100 text-emerald-900 border-emerald-200";
}

function hasAssessmentInputs(session: ReportSession): session is AssessmentSession {
  return "answers" in session;
}

function downloadJson(session: ReportSession, productType: ProductType) {
  const blob = new Blob([JSON.stringify(session, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${productType}-diagnostic-report.json`;
  link.click();
  URL.revokeObjectURL(url);
}

function buildCopySummary(session: ReportSession) {
  return [
    session.resultModel.summaryCard,
    `Top blockers: ${session.resultModel.topBlockers.map((item) => item.title).join(", ")}`,
    `Capability gaps: ${session.resultModel.capabilityGaps.join(" ")}`,
    `AI suitability: ${session.resultModel.aiSuitability.label}`,
  ].join("\n");
}

function BlockerCard({ blocker }: { blocker: DiagnosticDimensionScore }) {
  return (
    <article className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5" data-reveal="card">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Top blocker</p>
      <h3 className="mt-3 text-lg font-semibold text-slate-950">{blocker.title}</h3>
      <div className={`mt-3 inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${severityTone(blocker.score)}`}>
        {blocker.severityLabel}
      </div>
      <p className="mt-4 text-sm leading-7 text-slate-600">{blocker.explanation}</p>
    </article>
  );
}

export function ResultsClient({ productType }: { productType: ProductType }) {
  const searchParams = useSearchParams();
  const [copied, setCopied] = useState(false);
  const [liveMessage, setLiveMessage] = useState("");
  const [shareTokenFromHash, setShareTokenFromHash] = useState<string | null>(readShareTokenFromHash);
  const [shareSourceResolved, setShareSourceResolved] = useState(typeof window !== "undefined");
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const config = productConfigs[productType];
  const source = searchParams.get("source");
  const reportId = searchParams.get("reportId");
  const shareToken = searchParams.get("share") ?? shareTokenFromHash;

  useEffect(() => {
    function readShareToken() {
      setShareTokenFromHash(readShareTokenFromHash());
      setShareSourceResolved(true);
    }

    readShareToken();
    window.addEventListener("hashchange", readShareToken);
    return () => window.removeEventListener("hashchange", readShareToken);
  }, []);

  const sessionSnapshot = useSyncExternalStore(
    subscribeDiagnosticsStorage,
    () => readStoredSessionSnapshot(productType, source, reportId),
    () => null,
  );
  const rawSession = useMemo<ReportSession | null>(() => {
    if (shareToken) {
      return decodeSharedSession(shareToken);
    }

    if (!sessionSnapshot) {
      return null;
    }

    return parseResultSnapshot(sessionSnapshot);
  }, [sessionSnapshot, shareToken]);

  const isDerivedReadinessView =
    !shareToken &&
    productType === "drl" &&
    source === "dq" &&
    rawSession?.productType === "dq";

  const session = useMemo<ReportSession | null>(() => {
    if (!rawSession) {
      return null;
    }

    if (isDerivedReadinessView && hasAssessmentInputs(rawSession)) {
      return rebuildAssessmentSessionForProduct(rawSession, "drl");
    }

    return rawSession;
  }, [isDerivedReadinessView, rawSession]);

  if (!session && !shareSourceResolved) {
    return (
      <div className="rounded-[2rem] border border-white/50 bg-white/90 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
        <h2 className="text-2xl font-semibold text-slate-950">Loading report...</h2>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600">
          Resolving the saved or shared report snapshot.
        </p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="rounded-[2rem] border border-white/50 bg-white/90 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
        <h2 className="text-2xl font-semibold text-slate-950">No report available yet</h2>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600">
          Start a {config.title} assessment first. Results are stored locally in this browser for v1.
        </p>
        <Link
          href={`${config.routeBase}/start`}
          className="mt-6 inline-flex rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
        >
          Start {config.title} assessment
        </Link>
      </div>
    );
  }

  const activeSession = session;
  const exportProductType = activeSession.productType;
  const allowsServerActions = hasAssessmentInputs(activeSession) && !shareToken;

  async function handleCopySummary() {
    await navigator.clipboard.writeText(buildCopySummary(activeSession));
    setCopied(true);
    setLiveMessage("Summary copied to clipboard.");
    trackEvent("report_copied", { productType: exportProductType, operatingState: activeSession.operatingState });
    window.setTimeout(() => {
      setCopied(false);
      setLiveMessage("");
    }, 1800);
  }

  function handleExportJson() {
    downloadJson(activeSession, exportProductType);
    setLiveMessage("JSON report downloaded.");
    trackEvent("report_exported", {
      productType: exportProductType,
      format: "json",
      operatingState: activeSession.operatingState,
    });
  }

  function handlePrint() {
    window.print();
    setLiveMessage("Print dialog opened.");
    trackEvent("report_exported", {
      productType: exportProductType,
      format: "print",
      operatingState: activeSession.operatingState,
    });
  }

  async function handleDownloadPdf() {
    setIsGeneratingPdf(true);
    try {
      const response = await fetch("/api/report-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ session: activeSession }),
      });

      if (!response.ok) {
        throw new Error("PDF generation failed.");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${exportProductType}-diagnostic-report.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      setLiveMessage("PDF report downloaded.");
      trackEvent("report_exported", {
        productType: exportProductType,
        format: "pdf",
        operatingState: activeSession.operatingState,
      });
    } catch {
      setLiveMessage("PDF export failed. Try again or use print for now.");
    } finally {
      setIsGeneratingPdf(false);
    }
  }

  async function handleCopyShareLink() {
    const confirmed = window.confirm(
      "This creates a portable share link with the report snapshot embedded in the URL fragment. Continue?",
    );
    if (!confirmed) {
      return;
    }

    const url = new URL(window.location.href);
    url.searchParams.delete("reportId");
    url.searchParams.delete("source");
    url.searchParams.delete("share");
    url.hash = `share=${encodeSharedSession(activeSession)}`;
    await navigator.clipboard.writeText(url.toString());
    setCopied(false);
    setLiveMessage("Share link copied to clipboard.");
    trackEvent("report_exported", {
      productType: exportProductType,
      format: "share-link",
      operatingState: activeSession.operatingState,
    });
  }

  function handleDeleteReport() {
    if (shareToken) {
      return;
    }

    const confirmed = window.confirm("Delete this saved report from this browser?");
    if (!confirmed) {
      return;
    }

    deleteSavedReport(activeSession.id, activeSession.productType);
    setLiveMessage("Saved report deleted from this browser.");
    window.location.assign(config.routeBase);
  }

  return (
    <div className="space-y-6" id="diagnostic-report">
      <div aria-live="polite" className="sr-only">
        {liveMessage}
      </div>
      <section className="rounded-[1.5rem] border border-slate-200 bg-white/88 px-5 py-4 text-sm leading-7 text-slate-700 shadow-[0_14px_36px_rgba(15,23,42,0.05)]">
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full bg-[#1E293B] px-3 py-1 text-[11px] font-semibold tracking-[0.16em] text-white uppercase">
            {shareToken ? "Shared snapshot" : "Private in this browser"}
          </span>
          <span className="rounded-full bg-amber-100 px-3 py-1 text-[11px] font-semibold tracking-[0.16em] text-amber-950 uppercase">
            Decision support only
          </span>
        </div>
        <p className="mt-3">
          {shareToken
            ? "You are viewing a portable shared report snapshot. It includes the report output, but not private drafts, raw evidence files, or the original answer sheet."
            : "This report stays private in this browser unless someone deliberately creates and shares a portable snapshot link."}{" "}
          Treat diagnostics as decision support, not legal or compliance advice, and avoid putting PII or sensitive data into uploads or chat prompts.
        </p>
      </section>
      <section className="rounded-[1.75rem] border border-slate-200 bg-[linear-gradient(145deg,rgba(255,255,255,0.96),rgba(241,245,249,0.92))] px-6 py-5 shadow-[0_18px_44px_rgba(15,23,42,0.06)]">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Summary card</p>
        <p className="mt-3 max-w-4xl text-lg leading-8 text-slate-800">{activeSession.resultModel.summaryCard}</p>
      </section>
      <section className="grid gap-4 lg:grid-cols-3">
        {activeSession.resultModel.topBlockers.map((blocker) => (
          <BlockerCard key={blocker.key} blocker={blocker} />
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_360px]">
        <div
          className="rounded-[2rem] border border-white/50 bg-white/90 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)]"
          data-reveal="card"
        >
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Diagnostic profile</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">Diagnostic dimensions</h2>
            </div>
            <p className="max-w-sm text-right text-sm leading-7 text-slate-500">
              Severity runs from no current issue to severe. This heatmap is the primary diagnosis, not a decorative scorecard.
            </p>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3 print:grid-cols-2">
            {activeSession.resultModel.dimensionScores.map((item) => (
              <div key={item.key} className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                <div className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${severityTone(item.score)}`}>
                  {item.severityLabel}
                </div>
                <h3 className="mt-3 text-base font-semibold text-slate-950">{item.title}</h3>
                <p className="mt-2 text-sm leading-7 text-slate-600">{item.explanation}</p>
                {item.contributingQuestions.length > 0 ? (
                  <p className="mt-3 text-xs uppercase tracking-[0.16em] text-slate-500">
                    Driven by {item.contributingQuestions.join(", ")}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </div>

        <aside className="space-y-6">
          <div
            className="rounded-[2rem] border border-white/50 bg-slate-950 p-6 text-white shadow-[0_24px_80px_rgba(15,23,42,0.14)]"
            data-reveal="card"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-300">Operating state</p>
            <h2 className="mt-3 text-4xl font-semibold">{activeSession.resultModel.operatingState}</h2>
            <p className="mt-4 text-sm leading-7 text-slate-200">{activeSession.resultModel.operatingStateRationale.summary}</p>
            <div className="mt-5 rounded-[1.5rem] bg-white/8 p-4 text-sm leading-7 text-slate-200">
              <p className="font-semibold text-white">Confidence: {activeSession.resultModel.confidence.label}</p>
              <p className="mt-2">{activeSession.resultModel.confidence.notes.join(" ")}</p>
            </div>
            <div className="mt-4 rounded-[1.5rem] border border-white/10 bg-white/6 p-4 text-sm leading-7 text-slate-200">
              <p className="font-semibold text-white">AI suitability</p>
              <p className="mt-2">{activeSession.resultModel.aiSuitability.label}</p>
              <p className="mt-2 text-slate-300">{activeSession.resultModel.aiSuitability.summary}</p>
            </div>
          </div>

          <div
            className="rounded-[2rem] border border-white/50 bg-white/90 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)]"
            data-reveal="card"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Capability gaps</p>
            <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-700">
              {activeSession.resultModel.capabilityGaps.map((item) => (
                <li key={item} className="rounded-[1.25rem] bg-slate-50 px-4 py-3">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div
          className="rounded-[2rem] border border-white/50 bg-white/90 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)]"
          data-reveal="card"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Action plan</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">What to do next</h2>
          <div className="mt-6 space-y-4">
            {activeSession.resultModel.actionPlan.map((item) => (
              <article key={item.title} className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                <h3 className="text-lg font-semibold text-slate-950">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{item.summary}</p>
                <div className="mt-4 grid gap-3 lg:grid-cols-2">
                  <div className="rounded-[1.25rem] bg-white px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Immediate move</p>
                    <p className="mt-2 text-sm leading-7 text-slate-700">{item.thirtyDayMove}</p>
                  </div>
                  <div className="rounded-[1.25rem] bg-white px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Follow-on move</p>
                    <p className="mt-2 text-sm leading-7 text-slate-700">{item.sixWeekPilotMove}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        <aside className="space-y-6">
          <div
            className="rounded-[2rem] border border-white/50 bg-white/90 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)]"
            data-reveal="card"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Export / share</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-950">Take the report with you</h2>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-2 text-[11px] font-semibold tracking-[0.16em] text-slate-500 uppercase">
                {shareToken ? "Shared view" : "Private by default"}
              </span>
            </div>
            <div className="mt-4 rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-7 text-slate-700">
              Public sharing is opt-in only. Copy a share link only when you are authorized to make this report portable.
            </div>
            <div className="mt-5 flex flex-col gap-3">
              {allowsServerActions ? (
                <button
                  type="button"
                  onClick={() => void handleDownloadPdf()}
                  aria-busy={isGeneratingPdf}
                  disabled={isGeneratingPdf}
                  className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(15,23,42,0.16)] disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                  {isGeneratingPdf ? "Generating PDF..." : "Download PDF report"}
                </button>
              ) : null}
              <button
                type="button"
                onClick={handlePrint}
                className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700"
              >
                Print fallback
              </button>
              <button
                type="button"
                onClick={handleExportJson}
                className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700"
              >
                Download JSON
              </button>
              <button
                type="button"
                onClick={() => void handleCopySummary()}
                className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700"
              >
                {copied ? "Summary copied" : "Copy summary"}
              </button>
              <button
                type="button"
                onClick={() => void handleCopyShareLink()}
                className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700"
              >
                Copy share link
              </button>
              {!shareToken && !isDerivedReadinessView ? (
                <button
                  type="button"
                  onClick={handleDeleteReport}
                  className="rounded-full border border-rose-200 bg-white px-5 py-3 text-sm font-semibold text-rose-700"
                >
                  Delete from this browser
                </button>
              ) : null}
            </div>
            <div className="mt-5 rounded-[1.5rem] bg-slate-950 p-5 text-sm leading-7 text-slate-200">
              <p className="font-semibold text-white">Pilot hook</p>
              <p className="mt-3">
              This result is designed to support the next internal decision, not just label the workflow.
              </p>
              <div className="mt-5 flex flex-col gap-3">
                {productType === "dq" ? (
                  <Link
                    href="/drl/results?source=dq"
                    className="rounded-full bg-white px-5 py-3 text-center text-sm font-semibold text-slate-950"
                  >
                    Open readiness view
                  </Link>
                ) : (
                  <Link
                    href="/dq/start"
                    className="rounded-full bg-white px-5 py-3 text-center text-sm font-semibold text-slate-950"
                  >
                    Run full DQ assessment
                  </Link>
                )}
                <Link
                  href={`${config.routeBase}/start`}
                  className="rounded-full border border-white/20 px-5 py-3 text-center text-sm font-semibold text-white"
                >
                  Run another assessment
                </Link>
              </div>
            </div>
          </div>
        </aside>
      </section>

      <ReportCharts session={activeSession} />

      <section
        className="rounded-[2rem] border border-white/50 bg-white/90 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)]"
        data-reveal="card"
      >
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Rationale</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">Why this workflow state was assigned</h2>
          </div>
          <p className="max-w-xl text-sm leading-7 text-slate-500">
            Threshold notes describe what the engine saw. The amber notes explain what still blocks a stronger workflow state.
          </p>
        </div>
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <div className="space-y-3">
            {activeSession.resultModel.operatingStateRationale.thresholdNotes.map((item) => (
              <div key={item} className="rounded-[1.25rem] bg-slate-50 px-4 py-3 text-sm leading-7 text-slate-700">
                {item}
              </div>
            ))}
          </div>
          <div className="space-y-3">
            {activeSession.resultModel.operatingStateRationale.whyNotFurther.map((item) => (
              <div key={item} className="rounded-[1.25rem] bg-amber-50 px-4 py-3 text-sm leading-7 text-amber-950">
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      {allowsServerActions ? <AssistantChat session={activeSession} /> : null}
    </div>
  );
}
