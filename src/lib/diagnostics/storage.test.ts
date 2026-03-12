import { beforeEach, describe, expect, it } from "vitest";

import {
  clearLocalDiagnosticsData,
  getSavedReports,
  loadDraft,
  loadReportById,
  saveDraft,
  saveResult,
} from "@/lib/diagnostics/storage";
import { buildFixtureSession } from "@/lib/diagnostics/test-fixtures";
import { AssessmentInput } from "@/lib/diagnostics/types";

function buildDraft(): AssessmentInput {
  return {
    productType: "dq",
    scopeType: "use_case",
    useCaseKey: "general_workflow",
    answers: {
      record_disagreement: 2,
    },
    evidence: {
      csvFiles: [{ fileName: "people.csv", content: "id,name\n1,Ada" }],
      metricDefinitionText: "Headcount excludes interns.",
      workflowNotesText: "Finance and HR still reconcile headcount manually.",
    },
  };
}

describe("report storage", () => {
  beforeEach(() => {
    const store = new Map<string, string>();
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: {
        getItem: (key: string) => store.get(key) ?? null,
        setItem: (key: string, value: string) => {
          store.set(key, value);
        },
        removeItem: (key: string) => {
          store.delete(key);
        },
        clear: () => {
          store.clear();
        },
      },
    });
  });

  it("stores results in recent history and loads them by id", () => {
    const dqSession = buildFixtureSession("dq");
    const drlSession = buildFixtureSession("drl");

    saveResult("dq", dqSession);
    saveResult("drl", drlSession);

    const savedReports = getSavedReports();

    expect(savedReports).toHaveLength(2);
    expect(savedReports[0]?.id).toBe(drlSession.id);
    expect(savedReports[0]?.expiresAt).toBeTruthy();
    expect(savedReports[1]?.id).toBe(dqSession.id);
    expect(loadReportById(dqSession.id)?.resultModel.summaryCard).toBe(dqSession.resultModel.summaryCard);
  });

  it("sanitizes raw evidence before draft autosave", () => {
    saveDraft("dq", buildDraft());

    const loaded = loadDraft("dq");

    expect(loaded?.answers.record_disagreement).toBe(2);
    expect(loaded?.evidence.csvFiles).toEqual([]);
    expect(loaded?.evidence.metricDefinitionText).toBe("");
    expect(loaded?.evidence.workflowNotesText).toBe("");
  });

  it("clears all saved diagnostic data from the browser", () => {
    saveDraft("dq", buildDraft());
    saveResult("dq", buildFixtureSession("dq"));

    clearLocalDiagnosticsData();

    expect(loadDraft("dq")).toBeNull();
    expect(getSavedReports()).toEqual([]);
  });
});
