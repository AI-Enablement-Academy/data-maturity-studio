import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AssessmentFlow } from "@/components/diagnostics/assessment-flow";
import { AssessmentInput, AssessmentSession, QuestionDefinition, ResultModel } from "@/lib/diagnostics/types";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  loadDraft: vi.fn(),
  saveDraft: vi.fn(),
  saveResult: vi.fn(),
  clearDraft: vi.fn(),
  trackEvent: vi.fn(),
  buildResultModel: vi.fn(),
  createAssessmentSession: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mocks.push,
  }),
}));

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: React.ComponentProps<"a">) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/lib/diagnostics/catalog", () => ({
  useCases: [
    {
      key: "general_workflow",
      title: "General workflow",
      summary: "Default workflow summary.",
    },
  ],
}));

vi.mock("@/lib/diagnostics/questions", () => {
  const options = [
    { value: 0 as const, label: "Low", description: "Low severity." },
    { value: 3 as const, label: "High", description: "High severity." },
  ];

  const questionBank: QuestionDefinition[] = [
    {
      id: "question_one",
      shortLabel: "Question one",
      prompt: "Question one prompt",
      helpText: "Question one help",
      direction: "risk",
      productTypes: ["dq", "drl"],
      scopeTypes: ["use_case", "organization"],
      dimensionWeights: {
        record_reliability: 1,
      },
      signalWeights: {
        capture_foundation: 0.5,
      },
      options,
    },
    {
      id: "question_two",
      shortLabel: "Question two",
      prompt: "Question two prompt",
      helpText: "Question two help",
      direction: "risk",
      productTypes: ["dq", "drl"],
      scopeTypes: ["use_case", "organization"],
      dimensionWeights: {
        reuse_operating_model: 1,
      },
      signalWeights: {
        reuse_governance: 1,
      },
      options,
    },
  ];

  return {
    questionBank,
  };
});

vi.mock("@/lib/diagnostics/product-config", () => ({
  productConfigs: {
    dq: {
      productType: "dq",
      title: "Data Quality Diagnostic",
      shortTitle: "DQ",
      summary: "DQ summary",
      positioning: "DQ positioning",
      routeBase: "/dq",
      questionIds: ["question_one", "question_two"],
    },
    drl: {
      productType: "drl",
      title: "Readiness Check",
      shortTitle: "RC",
      summary: "Readiness summary",
      positioning: "Readiness positioning",
      routeBase: "/drl",
      questionIds: ["question_one", "question_two"],
    },
  },
}));

vi.mock("@/lib/diagnostics/storage", () => ({
  loadDraft: mocks.loadDraft,
  saveDraft: mocks.saveDraft,
  saveResult: mocks.saveResult,
  clearDraft: mocks.clearDraft,
}));

vi.mock("@/lib/diagnostics/tracking", () => ({
  trackEvent: mocks.trackEvent,
}));

vi.mock("@/lib/diagnostics/engine", () => ({
  buildResultModel: mocks.buildResultModel,
  createAssessmentSession: mocks.createAssessmentSession,
}));

function createReviewResult(): ResultModel {
  return {
    topBlockers: [
      {
        key: "record_reliability",
        title: "Record Reliability",
        score: 2,
        severityLabel: "Significant",
        explanation: "Records still need reconciliation.",
        contributingQuestions: ["Question one"],
      },
    ],
    dimensionScores: [],
    operatingState: "Stabilizing",
    operatingStateRationale: {
      state: "Stabilizing",
      summary: "Preview summary.",
      whyNotFurther: [],
      thresholdNotes: [],
    },
    capabilityGaps: [],
    actionPlan: [],
    summaryCard: "Preview summary card.",
    confidence: {
      label: "Moderate",
      score: 0.7,
      notes: [],
    },
    evidenceSummary: {
      notes: [],
      tags: [],
      confidenceBoost: 0,
      dimensionAdjustments: {
        record_reliability: 0,
        decision_fit: 0,
        structure_interpretability: 0,
        access_control: 0,
        quality_discipline: 0,
        reuse_operating_model: 0,
      },
    },
    readinessSignals: {
      capture_foundation: 0,
      analytical_alignment: 0,
      structured_data_readiness: 0,
      access_reliability: 0,
      quality_loop: 0,
      reuse_governance: 0,
      ai_operational_fit: 0,
    },
    aiSuitability: {
      label: "Not ready for dependable AI reuse",
      summary: "Preview AI suitability summary.",
    },
  };
}

function createSession(input: AssessmentInput): AssessmentSession {
  return {
    id: "session-1",
    productType: input.productType,
    scopeType: input.scopeType,
    useCaseKey: input.useCaseKey,
    startedAt: "2026-03-11T10:00:00.000Z",
    completedAt: "2026-03-11T10:05:00.000Z",
    answers: input.answers,
    evidenceSummary: {
      notes: [],
      tags: [],
      confidenceBoost: 0,
      dimensionAdjustments: {
        record_reliability: 0,
        decision_fit: 0,
        structure_interpretability: 0,
        access_control: 0,
        quality_discipline: 0,
        reuse_operating_model: 0,
      },
    },
    scores: {
      record_reliability: 0,
      decision_fit: 0,
      structure_interpretability: 0,
      access_control: 0,
      quality_discipline: 0,
      reuse_operating_model: 0,
    },
    operatingState: "Stabilizing",
    confidence: {
      label: "Moderate",
      score: 0.7,
      notes: [],
    },
    resultModel: createReviewResult(),
  };
}

function createCsvFile(name: string, content: string | Promise<string>) {
  const file = new File(["placeholder"], name, { type: "text/csv" });
  Object.defineProperty(file, "text", {
    configurable: true,
    value: vi.fn(() => Promise.resolve(content)),
  });
  return file;
}

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;

  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });

  return {
    promise,
    resolve,
    reject,
  };
}

async function goToAssessment(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: "Next" }));
}

async function goToEvidence(user: ReturnType<typeof userEvent.setup>) {
  await goToAssessment(user);
  await user.click(screen.getByRole("button", { name: "Next" }));
}

async function answerQuestion(user: ReturnType<typeof userEvent.setup>, prompt: string) {
  const question = screen.getByText(prompt).closest("fieldset");
  expect(question).not.toBeNull();
  await user.click(within(question as HTMLElement).getByRole("radio", { name: /^High\b/i }));
}

describe("AssessmentFlow", () => {
  beforeEach(() => {
    mocks.push.mockReset();
    mocks.loadDraft.mockReset();
    mocks.saveDraft.mockReset();
    mocks.saveResult.mockReset();
    mocks.clearDraft.mockReset();
    mocks.trackEvent.mockReset();
    mocks.buildResultModel.mockReset();
    mocks.createAssessmentSession.mockReset();

    mocks.loadDraft.mockReturnValue(null);
    mocks.buildResultModel.mockImplementation(() => createReviewResult());
    mocks.createAssessmentSession.mockImplementation((input: AssessmentInput) => createSession(input));
  });

  it("allows review navigation with unanswered questions and keeps generation locked", async () => {
    const user = userEvent.setup();

    render(<AssessmentFlow productType="drl" />);

    await goToAssessment(user);
    await answerQuestion(user, "Question one prompt");

    await user.click(screen.getByRole("button", { name: "Next" }));

    expect(screen.getByText("Review before generating the readiness check")).toBeInTheDocument();
    expect(screen.getByText(/Complete all questions before generating the report/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Generate diagnostic report" })).toBeDisabled();
  });

  it("lets users skip the optional evidence step", async () => {
    const user = userEvent.setup();

    render(<AssessmentFlow productType="dq" />);

    await goToAssessment(user);
    await answerQuestion(user, "Question one prompt");
    await answerQuestion(user, "Question two prompt");
    await user.click(screen.getByRole("button", { name: "Next" }));
    await user.click(screen.getByRole("button", { name: "Next" }));

    expect(screen.getByText("Review before generating the Data Quality Diagnostic")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Generate diagnostic report" })).toBeEnabled();
  });

  it("lets users remove a CSV upload and re-upload the same file", async () => {
    const user = userEvent.setup();

    render(<AssessmentFlow productType="dq" />);

    await goToEvidence(user);

    const uploadInput = screen.getByLabelText("Upload CSV evidence") as HTMLInputElement;
    const csvFile = createCsvFile("metrics.csv", "metric,value\nquality,0.9");

    await user.upload(uploadInput, csvFile);

    expect(await screen.findByText("metrics.csv")).toBeInTheDocument();
    expect(uploadInput.value).toBe("");

    await user.click(screen.getByRole("button", { name: "Remove metrics.csv" }));
    expect(screen.queryByText("metrics.csv")).not.toBeInTheDocument();
    expect(uploadInput.value).toBe("");

    await user.upload(uploadInput, csvFile);
    expect(await screen.findByText("metrics.csv")).toBeInTheDocument();
  });

  it("keeps newer evidence state when an older async upload resolves later", async () => {
    const user = userEvent.setup();
    const slowUpload = createDeferred<string>();

    render(<AssessmentFlow productType="dq" />);

    await goToEvidence(user);

    const uploadInput = screen.getByLabelText("Upload CSV evidence") as HTMLInputElement;
    const metricNotes = screen.getByLabelText("Metric definition notes");
    const slowFile = createCsvFile("slow.csv", slowUpload.promise);
    const latestFile = createCsvFile("latest.csv", "metric,value\nlatency,1");

    await user.upload(uploadInput, slowFile);
    await user.type(metricNotes, "Keep this note");
    await user.upload(uploadInput, latestFile);

    expect(await screen.findByText("latest.csv")).toBeInTheDocument();
    expect(screen.queryByText("slow.csv")).not.toBeInTheDocument();

    slowUpload.resolve("metric,value\nstale,1");

    await waitFor(() => {
      expect(screen.queryByText("slow.csv")).not.toBeInTheDocument();
      expect(screen.getByText("latest.csv")).toBeInTheDocument();
      expect(metricNotes).toHaveValue("Keep this note");
    });
  });

  it("guards duplicate generate clicks", async () => {
    const user = userEvent.setup();

    render(<AssessmentFlow productType="drl" />);

    await goToAssessment(user);
    await answerQuestion(user, "Question one prompt");
    await answerQuestion(user, "Question two prompt");
    await user.click(screen.getByRole("button", { name: "Next" }));

    const generateButton = await screen.findByRole("button", { name: "Generate diagnostic report" });

    fireEvent.click(generateButton);
    fireEvent.click(generateButton);

    expect(mocks.createAssessmentSession).toHaveBeenCalledTimes(1);
    expect(mocks.saveResult).toHaveBeenCalledTimes(1);
    expect(mocks.clearDraft).toHaveBeenCalledTimes(1);
    expect(mocks.push).toHaveBeenCalledTimes(1);
    expect(
      mocks.trackEvent.mock.calls.filter(([eventName]) => eventName === "assessment_completed"),
    ).toHaveLength(1);
  });
});
