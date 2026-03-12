"use client";

import { useEffect, useState } from "react";

import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  RadialLinearScale,
  Tooltip,
} from "chart.js";
import { Bar, Doughnut, Radar } from "react-chartjs-2";

import { readinessSignals as readinessSignalDefinitions } from "@/lib/diagnostics/catalog";
import { AssessmentSession, SharedReportSnapshot } from "@/lib/diagnostics/types";

ChartJS.register(
  ArcElement,
  BarElement,
  CategoryScale,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  RadialLinearScale,
  Tooltip,
);

const surfaceBorder = "rgba(148, 163, 184, 0.22)";
const slate = "#0f172a";
const orange = "#f97316";
const blue = "#60a5fa";
const rose = "#f43f5e";
const emerald = "#10b981";

function shortDimensionLabel(label: string) {
  return label
    .replace(" and Interpretability", "")
    .replace(" Management Discipline", " discipline")
    .replace(" Operating Model", " model");
}

function normalizeSignalPercent(value: number) {
  return Math.round((value / 3) * 100);
}

const readinessSignalOrder = readinessSignalDefinitions.map((signal) => signal.key);

export function ReportCharts({ session }: { session: AssessmentSession | SharedReportSnapshot }) {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setPrefersReducedMotion(mediaQuery.matches);

    updatePreference();
    mediaQuery.addEventListener("change", updatePreference);
    return () => mediaQuery.removeEventListener("change", updatePreference);
  }, []);

  const dimensionScores = session.resultModel.dimensionScores;
  const readinessSignals = session.resultModel.readinessSignals ?? {
    capture_foundation: 0,
    analytical_alignment: 0,
    structured_data_readiness: 0,
    access_reliability: 0,
    quality_loop: 0,
    reuse_governance: 0,
    ai_operational_fit: 0,
  };
  const readinessSignalRows = readinessSignalDefinitions.map((signal) => ({
    key: signal.key,
    title: signal.title,
    value: normalizeSignalPercent(readinessSignals[signal.key]),
  }));
  const severityBuckets = dimensionScores.reduce(
    (accumulator, score) => {
      accumulator[score.severityLabel] += 1;
      return accumulator;
    },
    {
      "No current issue": 0,
      Mild: 0,
      Significant: 0,
      Severe: 0,
    } as Record<string, number>,
  );

  const horizontalBarData = {
    labels: dimensionScores.map((item) => shortDimensionLabel(item.title)),
    datasets: [
      {
        label: "Severity",
        data: dimensionScores.map((item) => item.score),
        borderRadius: 999,
        borderSkipped: false,
        backgroundColor: dimensionScores.map((item) => {
          if (item.score >= 3) return "rgba(244, 63, 94, 0.82)";
          if (item.score >= 2) return "rgba(249, 115, 22, 0.78)";
          if (item.score >= 1) return "rgba(30, 64, 175, 0.72)";
          return "rgba(16, 185, 129, 0.7)";
        }),
      },
    ],
  };

  const radarData = {
    labels: readinessSignalRows.map((item) => item.title),
    datasets: [
      {
        label: "Current state",
        data: readinessSignalOrder
          .map((key) => readinessSignals[key])
          .map((value) => Number((value * 33.33).toFixed(1))),
        borderColor: "rgba(15, 23, 42, 0.88)",
        backgroundColor: "rgba(30, 64, 175, 0.18)",
        pointBackgroundColor: orange,
        pointBorderColor: "#fffaf0",
        pointHoverBackgroundColor: "#ffffff",
        pointHoverBorderColor: slate,
        pointRadius: 3.5,
        borderWidth: 2.5,
      },
    ],
  };

  const doughnutData = {
    labels: Object.keys(severityBuckets),
    datasets: [
      {
        label: "Diagnostic dimensions",
        data: Object.values(severityBuckets),
        backgroundColor: [
          "rgba(16, 185, 129, 0.82)",
          "rgba(30, 64, 175, 0.72)",
          "rgba(249, 115, 22, 0.78)",
          "rgba(244, 63, 94, 0.78)",
        ],
        borderColor: ["#d1fae5", "#e0f2fe", "#fef3c7", "#ffe4e6"],
        borderWidth: 2,
        hoverOffset: 12,
      },
    ],
  };

  const commonTooltip = {
    backgroundColor: "rgba(15, 23, 42, 0.94)",
    titleColor: "#f8fafc",
    bodyColor: "#e2e8f0",
    borderColor: "rgba(249, 115, 22, 0.35)",
    borderWidth: 1,
    padding: 12,
    displayColors: true,
    cornerRadius: 14,
  };

  const chartAnimation = prefersReducedMotion
    ? false
    : {
        duration: 1100,
        easing: "easeOutQuart" as const,
      };

  return (
    <section
      className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(300px,0.9fr)]"
      data-reveal="chart"
    >
      <article className="rounded-[2rem] border border-white/50 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,0.94))] p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#1E40AF]">
              Dimension severity
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">
              Which dimensions create the most drag
            </h2>
          </div>
          <p className="max-w-md text-sm leading-7 text-slate-500">
            Higher bars mean more drag on dependable reuse, operating stability, and controlled AI use.
          </p>
        </div>
        <div className="sr-only">
          Diagnostic dimension severity summary: {dimensionScores.map((item) => `${item.title}, ${item.severityLabel}.`).join(" ")}
        </div>
        <div className="mt-6 h-[360px]">
          <Bar
            aria-label="Horizontal bar chart showing severity across the diagnostic dimensions."
            data={horizontalBarData}
            options={{
              animation: chartAnimation,
              maintainAspectRatio: false,
              responsive: true,
              indexAxis: "y",
              layout: {
                padding: {
                  left: 8,
                  right: 10,
                  top: 4,
                  bottom: 4,
                },
              },
              scales: {
                x: {
                  beginAtZero: true,
                  max: 3,
                  grid: {
                    color: "rgba(148,163,184,0.16)",
                  },
                  border: { display: false },
                  ticks: {
                    stepSize: 1,
                    color: "#64748b",
                    font: { size: 11 },
                    callback(value) {
                      return ["None", "Mild", "Significant", "Severe"][Number(value)] ?? value;
                    },
                  },
                },
                y: {
                  grid: { display: false },
                  border: { display: false },
                  ticks: {
                    color: slate,
                    font: { size: 11, weight: 600 },
                  },
                },
              },
              plugins: {
                legend: { display: false },
                tooltip: commonTooltip,
              },
            }}
          />
        </div>
        <div className="mt-6 overflow-x-auto rounded-[1.25rem] border border-slate-200 bg-slate-50">
          <table className="min-w-full text-left text-sm text-slate-700">
            <caption className="sr-only">Tabular fallback for diagnostic dimension severity.</caption>
            <thead className="border-b border-slate-200 bg-white">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold">Dimension</th>
                <th scope="col" className="px-4 py-3 font-semibold">Severity</th>
              </tr>
            </thead>
            <tbody>
              {dimensionScores.map((item) => (
                <tr key={item.key} className="border-b border-slate-200 last:border-b-0">
                  <th scope="row" className="px-4 py-3 font-medium">{item.title}</th>
                  <td className="px-4 py-3">{item.severityLabel}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>

      <div className="grid gap-6">
        <article className="rounded-[2rem] border border-white/50 bg-[linear-gradient(145deg,rgba(15,23,42,0.98),rgba(15,23,42,0.9))] p-6 text-white shadow-[0_24px_80px_rgba(15,23,42,0.16)]">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-orange-300">
            Workflow pattern
          </p>
          <h2 className="mt-2 text-2xl font-semibold">What the workflow already does well enough to reuse</h2>
          <p className="mt-3 text-sm leading-7 text-slate-300">
            This radar shows the operating patterns that most affect dependable reuse and controlled AI use.
          </p>
          <div className="sr-only">
            Workflow pattern summary: {readinessSignalRows
              .map((item) => `${item.title} ${item.value} percent`)
              .join(", ")}
            .
          </div>
          <div className="mt-4 h-[320px]">
            <Radar
              aria-label="Radar chart showing the workflow pattern profile."
              data={radarData}
              options={{
                animation: prefersReducedMotion
                  ? false
                  : {
                      duration: 1200,
                      easing: "easeOutQuart",
                    },
                maintainAspectRatio: false,
                responsive: true,
                scales: {
                  r: {
                    min: 0,
                    max: 100,
                    angleLines: {
                      color: "rgba(255,255,255,0.09)",
                    },
                    grid: {
                      color: "rgba(255,255,255,0.09)",
                    },
                    pointLabels: {
                      color: "#e2e8f0",
                      font: { size: 11, weight: 600 },
                    },
                    ticks: {
                      display: false,
                      backdropColor: "transparent",
                    },
                  },
                },
                plugins: {
                  legend: { display: false },
                  tooltip: commonTooltip,
                },
              }}
            />
          </div>
          <div className="mt-4 overflow-x-auto rounded-[1.25rem] border border-white/10 bg-white/5">
            <table className="min-w-full text-left text-sm text-slate-200">
              <caption className="sr-only">Tabular fallback for workflow pattern signals.</caption>
              <thead className="border-b border-white/10 text-slate-300">
                <tr>
                  <th scope="col" className="px-4 py-3 font-semibold">Pattern</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Current state</th>
                </tr>
              </thead>
              <tbody>
                {readinessSignalRows.map((item) => (
                  <tr key={item.key} className="border-b border-white/10 last:border-b-0">
                    <th scope="row" className="px-4 py-3 font-medium">{item.title}</th>
                    <td className="px-4 py-3">{item.value}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="rounded-[2rem] border border-white/50 bg-white/90 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#1E40AF]">
                Severity mix
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                Pressure balance
              </h2>
            </div>
            <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-500">
              {dimensionScores.length} dimensions
            </div>
          </div>
          <div className="sr-only">
            Severity mix summary: no current issue {severityBuckets["No current issue"]}, mild {severityBuckets.Mild},
            significant {severityBuckets.Significant}, severe {severityBuckets.Severe}.
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-[180px_minmax(0,1fr)]">
            <div className="h-[180px]">
              <Doughnut
                aria-label="Doughnut chart showing how many diagnostic dimensions fall into each severity band."
                data={doughnutData}
                options={{
                  animation: prefersReducedMotion
                    ? false
                    : {
                        animateRotate: true,
                        animateScale: true,
                        duration: 1150,
                        easing: "easeOutQuart",
                      },
                  cutout: "66%",
                  maintainAspectRatio: false,
                  responsive: true,
                  plugins: {
                    legend: { display: false },
                    tooltip: commonTooltip,
                  },
                }}
              />
            </div>
            <div className="grid gap-3 self-center">
              {[
                { label: "No current issue", value: severityBuckets["No current issue"], color: emerald },
                { label: "Mild", value: severityBuckets.Mild, color: blue },
                { label: "Significant", value: severityBuckets.Significant, color: orange },
                { label: "Severe", value: severityBuckets.Severe, color: rose },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-[1.25rem] border px-4 py-3"
                  style={{ borderColor: surfaceBorder, background: "rgba(248,250,252,0.72)" }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span
                        aria-hidden="true"
                        className="h-3.5 w-3.5 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm font-medium text-slate-700">{item.label}</span>
                    </div>
                    <span className="text-lg font-semibold text-slate-950">{item.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
