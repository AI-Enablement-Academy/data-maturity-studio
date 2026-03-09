"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useCases } from "@/lib/diagnostics/catalog";
import { buildResultModel, createAssessmentSession } from "@/lib/diagnostics/engine";
import { productConfigs } from "@/lib/diagnostics/product-config";
import { questionBank } from "@/lib/diagnostics/questions";
import { clearDraft, saveDraft, saveResult, loadDraft } from "@/lib/diagnostics/storage";
import { trackEvent } from "@/lib/diagnostics/tracking";
import {
  AnswerValue,
  AssessmentInput,
  EvidenceInput,
  ProductType,
  QuestionDefinition,
  ScopeType,
  UseCaseKey,
} from "@/lib/diagnostics/types";

const steps = ["Context", "Assessment", "Evidence", "Review"];

function getDefaultState(productType: ProductType): AssessmentInput {
  return {
    productType,
    scopeType: "use_case",
    useCaseKey: "general_workforce",
    answers: {},
    evidence: {
      csvFiles: [],
      metricDefinitionText: "",
      workflowNotesText: "",
    },
  };
}

function getQuestions(productType: ProductType, scopeType: ScopeType): QuestionDefinition[] {
  const config = productConfigs[productType];
  return config.questionIds
    .map((questionId) => questionBank.find((question) => question.id === questionId))
    .filter((question): question is QuestionDefinition => Boolean(question))
    .filter((question) => question.scopeTypes.includes(scopeType));
}

function getCompletionCount(questions: QuestionDefinition[], answers: AssessmentInput["answers"]) {
  return questions.filter((question) => answers[question.id] !== undefined).length;
}

export function AssessmentFlow({ productType }: { productType: ProductType }) {
  const router = useRouter();
  const config = productConfigs[productType];
  const [stepIndex, setStepIndex] = useState(0);
  const [state, setState] = useState<AssessmentInput>(getDefaultState(productType));
  const [unsupportedFiles, setUnsupportedFiles] = useState<string[]>([]);

  useEffect(() => {
    const draft = loadDraft(productType);
    if (draft) {
      setState(draft);
    }
    trackEvent("assessment_started", { productType });
  }, [productType]);

  const questions = getQuestions(productType, state.scopeType);
  const completionCount = getCompletionCount(questions, state.answers);
  const unansweredQuestions = questions.filter((question) => state.answers[question.id] === undefined);

  function updateState(nextState: AssessmentInput) {
    setState(nextState);
    saveDraft(productType, nextState);
  }

  function updateAnswer(questionId: string, value: AnswerValue) {
    updateState({
      ...state,
      answers: {
        ...state.answers,
        [questionId]: value,
      },
    });
  }

  async function handleCsvUpload(files: FileList | null) {
    if (!files) {
      return;
    }

    const accepted: EvidenceInput["csvFiles"] = [];
    const rejected: string[] = [];

    for (const file of Array.from(files)) {
      if (!file.name.toLowerCase().endsWith(".csv")) {
        rejected.push(file.name);
        continue;
      }

      accepted.push({
        fileName: file.name,
        content: await file.text(),
      });
    }

    setUnsupportedFiles(rejected);
    updateState({
      ...state,
      evidence: {
        ...state.evidence,
        csvFiles: accepted,
      },
    });
  }

  function handleGenerate() {
    if (unansweredQuestions.length > 0) {
      return;
    }

    const session = createAssessmentSession(state);
    saveResult(productType, session);
    clearDraft(productType);

    trackEvent("assessment_completed", {
      productType,
      drlBand: session.drlBand,
      scopeType: state.scopeType,
      useCaseKey: state.useCaseKey,
      confidence: session.confidence.label,
    });

    router.push(`${config.routeBase}/results`);
  }

  const reviewResult = buildResultModel(state);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <section className="space-y-6 rounded-[2rem] border border-white/50 bg-white/90 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
        <div className="flex flex-wrap items-center gap-3">
          {steps.map((step, index) => (
            <button
              key={step}
              type="button"
              onClick={() => setStepIndex(index)}
              className={`rounded-full px-4 py-2 text-sm transition ${
                index === stepIndex
                  ? "bg-slate-950 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {index + 1}. {step}
            </button>
          ))}
        </div>

        {stepIndex === 0 ? (
          <div className="space-y-8">
            <div className="space-y-3">
              <h2 className="text-2xl font-semibold text-slate-950">Set the diagnostic context</h2>
              <p className="max-w-2xl text-sm leading-7 text-slate-600">
                Use case mode is the default because it produces stronger, more defensible results. Organization mode is directional.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {[
                {
                  value: "use_case" as ScopeType,
                  title: "Use case mode",
                  summary: "Assess one workflow like attrition, internal mobility, succession, or skills.",
                },
                {
                  value: "organization" as ScopeType,
                  title: "Organization mode",
                  summary: "Get a broader directional maturity read across the organization.",
                },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() =>
                    updateState({
                      ...state,
                      scopeType: option.value,
                      useCaseKey:
                        option.value === "use_case" ? state.useCaseKey ?? "general_workforce" : null,
                    })
                  }
                  className={`rounded-[1.5rem] border p-5 text-left transition ${
                    state.scopeType === option.value
                      ? "border-slate-950 bg-slate-950 text-white"
                      : "border-slate-200 bg-slate-50 text-slate-800 hover:border-slate-300"
                  }`}
                >
                  <p className="text-lg font-semibold">{option.title}</p>
                  <p className={`mt-2 text-sm leading-7 ${state.scopeType === option.value ? "text-slate-200" : "text-slate-600"}`}>
                    {option.summary}
                  </p>
                </button>
              ))}
            </div>

            {state.scopeType === "use_case" ? (
              <div className="space-y-4">
                <label className="text-sm font-semibold text-slate-700" htmlFor="use-case">
                  Choose the workflow to diagnose
                </label>
                <select
                  id="use-case"
                  value={state.useCaseKey ?? "general_workforce"}
                  onChange={(event) =>
                    updateState({
                      ...state,
                      useCaseKey: event.target.value as UseCaseKey,
                    })
                  }
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 text-slate-900 outline-none ring-0"
                >
                  {useCases.map((useCase) => (
                    <option key={useCase.key} value={useCase.key}>
                      {useCase.title}
                    </option>
                  ))}
                </select>
                <p className="text-sm leading-7 text-slate-600">
                  {useCases.find((useCase) => useCase.key === state.useCaseKey)?.summary}
                </p>
              </div>
            ) : (
              <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-7 text-amber-900">
                Organization mode is useful for sponsor conversations, but expect lower confidence and broader action plans.
              </div>
            )}
          </div>
        ) : null}

        {stepIndex === 1 ? (
          <div className="space-y-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-2xl font-semibold text-slate-950">Answer the diagnostic questions</h2>
                <p className="text-sm leading-7 text-slate-600">
                  {completionCount} of {questions.length} answered.
                </p>
              </div>
              <div className="h-3 w-full max-w-xs overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-amber-500 transition-all"
                  style={{ width: `${(completionCount / Math.max(questions.length, 1)) * 100}%` }}
                />
              </div>
            </div>

            <div className="space-y-5">
              {questions.map((question, index) => (
                <fieldset
                  key={question.id}
                  className="rounded-[1.5rem] border border-slate-200 bg-slate-50/70 p-5"
                >
                  <legend className="text-sm font-semibold tracking-[0.18em] uppercase text-slate-500">
                    Question {index + 1}
                  </legend>
                  <p className="mt-4 text-lg font-medium text-slate-950">{question.prompt}</p>
                  <p className="mt-2 text-sm leading-7 text-slate-600">{question.helpText}</p>
                  <div className="mt-5 grid gap-3 md:grid-cols-2">
                    {question.options.map((option) => {
                      const isChecked = state.answers[question.id] === option.value;
                      return (
                        <label
                          key={option.value}
                          className={`cursor-pointer rounded-[1.25rem] border px-4 py-4 transition ${
                            isChecked
                              ? "border-slate-950 bg-slate-950 text-white"
                              : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                          }`}
                        >
                          <input
                            type="radio"
                            name={question.id}
                            className="sr-only"
                            checked={isChecked}
                            onChange={() => updateAnswer(question.id, option.value)}
                          />
                          <p className="font-semibold">{option.label}</p>
                          <p className={`mt-2 text-sm leading-6 ${isChecked ? "text-slate-200" : "text-slate-500"}`}>
                            {option.description}
                          </p>
                        </label>
                      );
                    })}
                  </div>
                </fieldset>
              ))}
            </div>
          </div>
        ) : null}

        {stepIndex === 2 ? (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold text-slate-950">Optional evidence inputs</h2>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">
                Evidence improves specificity and confidence. It does not override the scoring model.
              </p>
            </div>

            <div className="space-y-4">
              <label className="block text-sm font-semibold text-slate-700" htmlFor="csv-upload">
                Upload CSV evidence
              </label>
              <input
                id="csv-upload"
                type="file"
                accept=".csv"
                multiple
                onChange={(event) => void handleCsvUpload(event.target.files)}
                className="w-full rounded-[1.25rem] border border-dashed border-slate-300 bg-slate-50 px-4 py-6"
              />
              {state.evidence.csvFiles.length > 0 ? (
                <ul className="space-y-2 text-sm text-slate-600">
                  {state.evidence.csvFiles.map((file) => (
                    <li key={file.fileName} className="rounded-xl bg-slate-100 px-4 py-3">
                      {file.fileName}
                    </li>
                  ))}
                </ul>
              ) : null}
              {unsupportedFiles.length > 0 ? (
                <div className="rounded-[1.25rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                  Unsupported files were ignored: {unsupportedFiles.join(", ")}.
                </div>
              ) : null}
            </div>

            <div className="space-y-3">
              <label className="text-sm font-semibold text-slate-700" htmlFor="metric-definition">
                Metric definition notes
              </label>
              <textarea
                id="metric-definition"
                value={state.evidence.metricDefinitionText}
                onChange={(event) =>
                  updateState({
                    ...state,
                    evidence: {
                      ...state.evidence,
                      metricDefinitionText: event.target.value,
                    },
                  })
                }
                rows={5}
                placeholder="Paste metric logic, exclusions, or definition disputes here."
                className="w-full rounded-[1.5rem] border border-slate-200 bg-white px-4 py-4 text-slate-900 outline-none"
              />
            </div>

            <div className="space-y-3">
              <label className="text-sm font-semibold text-slate-700" htmlFor="workflow-notes">
                Workflow notes
              </label>
              <textarea
                id="workflow-notes"
                value={state.evidence.workflowNotesText}
                onChange={(event) =>
                  updateState({
                    ...state,
                    evidence: {
                      ...state.evidence,
                      workflowNotesText: event.target.value,
                    },
                  })
                }
                rows={6}
                placeholder="Describe where the team stitches data, rewrites caveats, or loses trust."
                className="w-full rounded-[1.5rem] border border-slate-200 bg-white px-4 py-4 text-slate-900 outline-none"
              />
            </div>
          </div>
        ) : null}

        {stepIndex === 3 ? (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold text-slate-950">Review before generating the report</h2>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                This preview uses the same deterministic engine as the final report.
              </p>
            </div>

            {unansweredQuestions.length > 0 ? (
              <div className="rounded-[1.5rem] border border-rose-200 bg-rose-50 px-5 py-4 text-sm leading-7 text-rose-900">
                Complete all questions before generating the report. Remaining:{" "}
                {unansweredQuestions.map((question) => question.shortLabel).join(", ")}.
              </div>
            ) : null}

            <div className="grid gap-4 lg:grid-cols-3">
              {reviewResult.topBlockers.map((blocker) => (
                <div key={blocker.key} className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Top blocker
                  </p>
                  <h3 className="mt-3 text-lg font-semibold text-slate-950">{blocker.title}</h3>
                  <p className="mt-2 text-sm text-amber-700">{blocker.severityLabel}</p>
                </div>
              ))}
            </div>

            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Likely band</p>
              <p className="mt-3 text-3xl font-semibold text-slate-950">{reviewResult.drlBand}</p>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
                {reviewResult.drlRationale.summary}
              </p>
            </div>

            <button
              type="button"
              onClick={handleGenerate}
              disabled={unansweredQuestions.length > 0}
              className="rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              Generate diagnostic report
            </button>
          </div>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 pt-4">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStepIndex((current) => Math.max(0, current - 1))}
              disabled={stepIndex === 0}
              className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-700 disabled:opacity-40"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => setStepIndex((current) => Math.min(steps.length - 1, current + 1))}
              disabled={stepIndex === steps.length - 1}
              className="rounded-full bg-slate-950 px-4 py-2 text-sm text-white disabled:opacity-40"
            >
              Next
            </button>
          </div>
          <Link href={config.routeBase} className="text-sm text-slate-500 underline-offset-4 hover:underline">
            Back to {config.shortTitle} overview
          </Link>
        </div>
      </section>

      <aside className="space-y-5">
        <div className="rounded-[2rem] border border-white/50 bg-white/90 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-700">
            {config.shortTitle} focus
          </p>
          <h2 className="mt-4 text-2xl font-semibold text-slate-950">{config.title}</h2>
          <p className="mt-4 text-sm leading-7 text-slate-600">{config.positioning}</p>
        </div>

        <div className="rounded-[2rem] border border-white/50 bg-slate-950 p-6 text-sm leading-7 text-slate-200 shadow-[0_24px_80px_rgba(15,23,42,0.14)]">
          <p className="font-semibold text-white">What the report will include</p>
          <ul className="mt-4 space-y-2">
            <li>Top 3 blockers and root-cause heatmap</li>
            <li>Likely DRL band and gap to DRL 7</li>
            <li>30-day action plan and optional 6-week pilot move</li>
            <li>Printable report and JSON export</li>
          </ul>
        </div>
      </aside>
    </div>
  );
}
