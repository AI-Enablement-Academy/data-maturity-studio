"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

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

const MAX_CSV_FILES = 3;
const MAX_CSV_BYTES = 2 * 1024 * 1024;

function getDefaultState(productType: ProductType): AssessmentInput {
  return {
    productType,
    scopeType: "use_case",
    useCaseKey: "general_workflow",
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

function hasValidAnswer(value: unknown): value is AnswerValue {
  return value === 0 || value === 1 || value === 2 || value === 3;
}

function getCompletionCount(questions: QuestionDefinition[], answers: AssessmentInput["answers"]) {
  return questions.filter((question) => hasValidAnswer(answers[question.id])).length;
}

export function AssessmentFlow({ productType }: { productType: ProductType }) {
  const router = useRouter();
  const config = productConfigs[productType];
  const supportsEvidence = productType === "dq";
  const steps = useMemo(
    () => (supportsEvidence ? ["Context", "Assessment", "Evidence", "Review"] : ["Context", "Assessment", "Review"]),
    [supportsEvidence],
  );
  const [stepIndex, setStepIndex] = useState(0);
  const [state, setState] = useState<AssessmentInput>(getDefaultState(productType));
  const [unsupportedFiles, setUnsupportedFiles] = useState<string[]>([]);
  const [liveMessage, setLiveMessage] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const stepHeadingRef = useRef<HTMLHeadingElement | null>(null);
  const csvInputRef = useRef<HTMLInputElement | null>(null);
  const csvUploadRequestRef = useRef(0);
  const isGeneratingRef = useRef(false);

  useEffect(() => {
    const draft = loadDraft(productType);
    if (draft) {
      setState(draft);
    }
    trackEvent("assessment_started", { productType });
  }, [productType]);

  useEffect(() => {
    const heading = stepHeadingRef.current;
    if (!heading) {
      return;
    }

    heading.focus();
    setLiveMessage(`Step ${stepIndex + 1} of ${steps.length}: ${steps[stepIndex]}.`);
  }, [stepIndex, steps]);

  const questions = getQuestions(productType, state.scopeType);
  const completionCount = getCompletionCount(questions, state.answers);
  const unansweredQuestions = questions.filter((question) => !hasValidAnswer(state.answers[question.id]));
  const completionPercent = Math.round((completionCount / Math.max(questions.length, 1)) * 100);
  const reviewStepIndex = steps.length - 1;
  const currentStepId = `assessment-step-panel-${steps[stepIndex].toLowerCase()}`;
  const isContextStep = stepIndex === 0;
  const isAssessmentStep = stepIndex === 1;
  const isEvidenceStep = supportsEvidence && stepIndex === 2;
  const isReviewStep = stepIndex === reviewStepIndex;

  function updateState(nextState: AssessmentInput | ((currentState: AssessmentInput) => AssessmentInput)) {
    setState((currentState) => {
      const resolvedState = typeof nextState === "function" ? nextState(currentState) : nextState;
      saveDraft(productType, resolvedState);
      return resolvedState;
    });
  }

  function moveToStep(nextIndex: number) {
    const boundedIndex = Math.max(0, Math.min(reviewStepIndex, nextIndex));
    setStepIndex(boundedIndex);
  }

  function updateAnswer(questionId: string, value: AnswerValue) {
    updateState((currentState) => ({
      ...currentState,
      answers: {
        ...currentState.answers,
        [questionId]: value,
      },
    }));
  }

  async function handleCsvUpload(files: File[]) {
    if (files.length === 0) {
      return;
    }

    const requestId = csvUploadRequestRef.current + 1;
    csvUploadRequestRef.current = requestId;
    const accepted: EvidenceInput["csvFiles"] = [];
    const rejected: string[] = [];

    for (const file of files) {
      if (!file.name.toLowerCase().endsWith(".csv")) {
        rejected.push(file.name);
        continue;
      }

      if (file.size > MAX_CSV_BYTES) {
        rejected.push(`${file.name} (over 2 MB)`);
        continue;
      }

      accepted.push({
        fileName: file.name,
        content: await file.text(),
      });
    }

    if (requestId !== csvUploadRequestRef.current) {
      return;
    }

    let finalRejected = [...rejected];
    updateState((currentState) => {
      const existingFiles = [...currentState.evidence.csvFiles];
      const slotsRemaining = Math.max(0, MAX_CSV_FILES - existingFiles.length);
      const acceptedToStore = accepted.slice(0, slotsRemaining);

      if (accepted.length > slotsRemaining) {
        finalRejected = [
          ...finalRejected,
          ...accepted.slice(slotsRemaining).map((file) => `${file.fileName} (too many files)`),
        ];
      }

      return {
        ...currentState,
        evidence: {
          ...currentState.evidence,
          csvFiles: [...existingFiles, ...acceptedToStore],
        },
      };
    });

    setUnsupportedFiles(finalRejected);
    if (accepted.length > 0 && finalRejected.length === 0) {
      setLiveMessage(
        `${accepted.length} CSV file${accepted.length === 1 ? "" : "s"} ready for review.`,
      );
    } else if (finalRejected.length > 0) {
      setLiveMessage(`Unsupported files ignored: ${finalRejected.join(", ")}.`);
    }
  }

  function removeCsvFile(index: number) {
    csvUploadRequestRef.current += 1;
    setUnsupportedFiles([]);
    setLiveMessage("CSV file removed.");
    updateState((currentState) => ({
      ...currentState,
      evidence: {
        ...currentState.evidence,
        csvFiles: currentState.evidence.csvFiles.filter((_, fileIndex) => fileIndex !== index),
      },
    }));
    if (csvInputRef.current) {
      csvInputRef.current.value = "";
    }
  }

  function handleGenerate() {
    if (unansweredQuestions.length > 0 || isGeneratingRef.current) {
      return;
    }

    isGeneratingRef.current = true;
    setIsGenerating(true);

    try {
      const session = createAssessmentSession(state);
      saveResult(productType, session);
      clearDraft(productType);

      trackEvent("assessment_completed", {
        productType,
        operatingState: session.operatingState,
        scopeType: state.scopeType,
        useCaseKey: state.useCaseKey,
        confidence: session.confidence.label,
      });

      router.push(`${config.routeBase}/results`);
    } catch (error) {
      isGeneratingRef.current = false;
      setIsGenerating(false);
      throw error;
    }
  }

  const reviewResult = buildResultModel(state);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <section className="space-y-6 rounded-[2rem] border border-white/50 bg-white/90 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
        <div aria-live="polite" className="sr-only">
          {liveMessage}
        </div>

        <nav aria-label="Assessment steps">
          <ol className="flex flex-wrap items-center gap-3">
            {steps.map((step, index) => {
              return (
                <li key={step}>
                  <button
                    type="button"
                    onClick={() => moveToStep(index)}
                    aria-current={index === stepIndex ? "step" : undefined}
                    className={`rounded-full px-4 py-2 text-sm transition ${
                      index === stepIndex
                        ? "bg-slate-950 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {index + 1}. {step}
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>

        {isContextStep ? (
          <div className="space-y-8" id={currentStepId}>
            <div className="space-y-3">
              <h2 ref={stepHeadingRef} tabIndex={-1} className="text-2xl font-semibold text-slate-950">
                Set the diagnostic context
              </h2>
              <p className="max-w-2xl text-sm leading-7 text-slate-600">
                Use case mode is the default because it produces stronger, more defensible results. Organization mode is broader and less precise.
              </p>
            </div>

            <fieldset className="space-y-4">
              <legend className="text-sm font-semibold text-slate-700">Assessment scope</legend>
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  {
                    value: "use_case" as ScopeType,
                    title: "Use case mode",
                    summary: "Assess one workflow like reporting, decision support, compliance, or process analytics.",
                  },
                  {
                    value: "organization" as ScopeType,
                    title: "Organization mode",
                    summary: "Get a broader directional read across the organization.",
                  },
                ].map((option) => {
                  const isChecked = state.scopeType === option.value;
                  return (
                    <label
                      key={option.value}
                      className={`cursor-pointer rounded-[1.5rem] border p-5 text-left transition has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-4 has-[:focus-visible]:outline-amber-500 ${
                        isChecked
                          ? "border-slate-950 bg-slate-950 text-white"
                          : "border-slate-200 bg-slate-50 text-slate-800 hover:border-slate-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="scope-type"
                        className="sr-only"
                        checked={isChecked}
                        onChange={() =>
                          updateState((currentState) => ({
                            ...currentState,
                            scopeType: option.value,
                            useCaseKey:
                              option.value === "use_case" ? currentState.useCaseKey ?? "general_workflow" : null,
                          }))
                        }
                      />
                      <p className="text-lg font-semibold">{option.title}</p>
                      <p className={`mt-2 text-sm leading-7 ${isChecked ? "text-slate-200" : "text-slate-600"}`}>
                        {option.summary}
                      </p>
                    </label>
                  );
                })}
              </div>
            </fieldset>

            {state.scopeType === "use_case" ? (
              <div className="space-y-4">
                <label className="text-sm font-semibold text-slate-700" htmlFor="use-case">
                  Choose the workflow to diagnose
                </label>
                <select
                  id="use-case"
                  value={state.useCaseKey ?? "general_workflow"}
                  onChange={(event) =>
                    updateState((currentState) => ({
                      ...currentState,
                      useCaseKey: event.target.value as UseCaseKey,
                    }))
                  }
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 text-slate-900"
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
                Organization mode is useful for broad internal reviews, but expect lower confidence and broader action plans.
              </div>
            )}
          </div>
        ) : null}

        {isAssessmentStep ? (
          <div className="space-y-6" id={currentStepId}>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 ref={stepHeadingRef} tabIndex={-1} className="text-2xl font-semibold text-slate-950">
                  Answer the diagnostic questions
                </h2>
                <p className="text-sm leading-7 text-slate-600">
                  {completionCount} of {questions.length} answered.
                </p>
              </div>
              <div
                aria-label="Assessment completion"
                aria-valuemax={questions.length}
                aria-valuemin={0}
                aria-valuenow={completionCount}
                aria-valuetext={`${completionCount} of ${questions.length} questions answered`}
                className="h-3 w-full max-w-xs overflow-hidden rounded-full bg-slate-100"
                role="progressbar"
              >
                <div
                  className="h-full rounded-full bg-amber-500 transition-all"
                  style={{ width: `${completionPercent}%` }}
                />
              </div>
            </div>

            <div className="space-y-5">
              {questions.map((question, index) => (
                <fieldset key={question.id} aria-describedby={`${question.id}-help`} className="rounded-[1.5rem] border border-slate-200 bg-slate-50/70 p-5">
                  <legend className="max-w-4xl">
                    <span className="text-sm font-semibold tracking-[0.18em] uppercase text-slate-500">
                      Question {index + 1}
                    </span>
                    <span className="mt-4 block text-lg font-medium text-slate-950">{question.prompt}</span>
                  </legend>
                  <p id={`${question.id}-help`} className="mt-2 text-sm leading-7 text-slate-600">{question.helpText}</p>
                  <div className="mt-5 grid gap-3 md:grid-cols-2">
                    {question.options.map((option) => {
                      const isChecked = state.answers[question.id] === option.value;
                      return (
                        <label
                          key={option.value}
                          className={`cursor-pointer rounded-[1.25rem] border px-4 py-4 transition has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-4 has-[:focus-visible]:outline-amber-500 ${
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

        {isEvidenceStep ? (
          <div className="space-y-6" id={currentStepId}>
            <div>
              <h2 ref={stepHeadingRef} tabIndex={-1} className="text-2xl font-semibold text-slate-950">
                Optional evidence inputs
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">
                Evidence adds context and can make the diagnosis more specific. It does not override the scoring model.
              </p>
              <p className="mt-3 max-w-2xl rounded-[1.25rem] border border-sky-200 bg-sky-50 px-4 py-3 text-sm leading-7 text-sky-950">
                Privacy note: CSV contents and pasted notes stay in this tab only. Draft autosave keeps your assessment answers, but not the raw evidence itself. Do not upload PII, confidential records, or anything you are not authorized to use here.
              </p>
              <p className="mt-3 max-w-2xl rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-7 text-slate-700">
                You can continue without uploads or notes. Review will flag any required questions that still need an answer.
              </p>
            </div>

            <div className="space-y-4">
              <label className="block text-sm font-semibold text-slate-700" htmlFor="csv-upload">
                Upload CSV evidence
              </label>
              <input
                ref={csvInputRef}
                id="csv-upload"
                type="file"
                accept=".csv"
                multiple
                onChange={(event) => {
                  const files = Array.from(event.currentTarget.files ?? []);
                  event.currentTarget.value = "";
                  void handleCsvUpload(files);
                }}
                aria-describedby="csv-upload-help"
                className="w-full rounded-[1.25rem] border border-dashed border-slate-300 bg-slate-50 px-4 py-6"
              />
              <p id="csv-upload-help" className="text-sm leading-7 text-slate-600">
                Up to {MAX_CSV_FILES} CSV files, maximum 2 MB each. Unsupported files are ignored.
              </p>
              {state.evidence.csvFiles.length > 0 ? (
                <ul className="space-y-2 text-sm text-slate-600">
                  {state.evidence.csvFiles.map((file, index) => (
                    <li key={file.fileName} className="flex items-center justify-between gap-3 rounded-xl bg-slate-100 px-4 py-3">
                      <span>{file.fileName}</span>
                      <button
                        type="button"
                        onClick={() => removeCsvFile(index)}
                        aria-label={`Remove ${file.fileName}`}
                        className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-white"
                      >
                        Remove
                      </button>
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
                aria-describedby="metric-definition-help"
                value={state.evidence.metricDefinitionText}
                onChange={(event) =>
                  updateState((currentState) => ({
                    ...currentState,
                    evidence: {
                      ...currentState.evidence,
                      metricDefinitionText: event.target.value,
                    },
                  }))
                }
                rows={5}
                placeholder="Paste metric logic, exclusions, or definition disputes here."
                className="w-full rounded-[1.5rem] border border-slate-200 bg-white px-4 py-4 text-slate-900"
              />
              <p id="metric-definition-help" className="text-sm leading-7 text-slate-600">
                Use this for formula notes, exclusions, denominator disputes, or caveats.
              </p>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-semibold text-slate-700" htmlFor="workflow-notes">
                Workflow notes
              </label>
              <textarea
                id="workflow-notes"
                aria-describedby="workflow-notes-help"
                value={state.evidence.workflowNotesText}
                onChange={(event) =>
                  updateState((currentState) => ({
                    ...currentState,
                    evidence: {
                      ...currentState.evidence,
                      workflowNotesText: event.target.value,
                    },
                  }))
                }
                rows={6}
                placeholder="Describe where the team stitches data, rewrites caveats, or loses trust."
                className="w-full rounded-[1.5rem] border border-slate-200 bg-white px-4 py-4 text-slate-900"
              />
              <p id="workflow-notes-help" className="text-sm leading-7 text-slate-600">
                Describe manual stitching, trust breakdowns, approval delays, or data handoff friction.
              </p>
            </div>
          </div>
        ) : null}

        {isReviewStep ? (
          <div className="space-y-6" id={currentStepId}>
            <div>
              <h2 ref={stepHeadingRef} tabIndex={-1} className="text-2xl font-semibold text-slate-950">
                {productType === "drl" ? "Review before generating the readiness check" : "Review before generating the Data Quality Diagnostic"}
              </h2>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                This preview uses the same deterministic engine as the final report.
              </p>
            </div>

            {unansweredQuestions.length > 0 ? (
              <div className="rounded-[1.5rem] border border-rose-200 bg-rose-50 px-5 py-4 text-sm leading-7 text-rose-900">
                Complete all questions before generating the report. Remaining:{" "}
                {unansweredQuestions.map((question) => question.shortLabel).join(", ")}.
              </div>
            ) : (
              <>
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

                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Operating state</p>
                    <p className="mt-3 text-3xl font-semibold text-slate-950">{reviewResult.operatingState}</p>
                    <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
                      {reviewResult.operatingStateRationale.summary}
                    </p>
                  </div>
                  <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">AI suitability</p>
                    <p className="mt-3 text-2xl font-semibold text-slate-950">{reviewResult.aiSuitability.label}</p>
                    <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
                      {reviewResult.aiSuitability.summary}
                    </p>
                  </div>
                </div>
              </>
            )}

            <button
              type="button"
              onClick={handleGenerate}
              disabled={unansweredQuestions.length > 0 || isGenerating}
              className="rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isGenerating ? "Generating..." : "Generate diagnostic report"}
            </button>
          </div>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 pt-4">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => moveToStep(stepIndex - 1)}
              disabled={stepIndex === 0}
              className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-700 disabled:opacity-40"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => moveToStep(stepIndex + 1)}
              disabled={stepIndex === reviewStepIndex}
              className="rounded-full bg-slate-950 px-4 py-2 text-sm text-white disabled:opacity-40"
            >
              Next
            </button>
          </div>
          <Link href={config.routeBase} className="text-sm text-slate-500 underline-offset-4 hover:underline">
            Back to {config.title} overview
          </Link>
        </div>
      </section>

      <aside className="space-y-5">
        <div className="rounded-[2rem] border border-white/50 bg-white/90 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-700">
            {config.title} focus
          </p>
          <h2 className="mt-4 text-2xl font-semibold text-slate-950">{config.title}</h2>
          <p className="mt-4 text-sm leading-7 text-slate-600">{config.positioning}</p>
        </div>

        <div className="rounded-[2rem] border border-white/50 bg-slate-950 p-6 text-sm leading-7 text-slate-200 shadow-[0_24px_80px_rgba(15,23,42,0.14)]">
          <p className="font-semibold text-white">What the report will include</p>
          <ul className="mt-4 space-y-2">
            {productType === "dq" ? (
              <>
                <li>Top 3 blockers and dimension profile</li>
                <li>Current workflow state and AI suitability gate</li>
                <li>Near-term action plan and a scoped follow-on move</li>
                <li>Printable report and JSON export</li>
              </>
            ) : (
              <>
                <li>Current workflow state and why pressure remains</li>
                <li>Dimension profile behind that workflow state</li>
                <li>Capability gaps and next actions</li>
                <li>Printable report and JSON export</li>
              </>
            )}
          </ul>
        </div>
      </aside>
    </div>
  );
}
