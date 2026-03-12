import { summarizeEvidence } from "@/lib/diagnostics/evidence";
import { AssessmentInput } from "@/lib/diagnostics/types";

const baseInput: AssessmentInput = {
  productType: "dq",
  scopeType: "use_case",
  useCaseKey: "operational_reporting",
  answers: {},
  evidence: {
    csvFiles: [],
    metricDefinitionText: "",
    workflowNotesText: "",
  },
};

describe("summarizeEvidence", () => {
  it("detects duplicate CSV headers and text-based source conflict cues", () => {
    const summary = summarizeEvidence({
      ...baseInput,
      evidence: {
        csvFiles: [
          {
            fileName: "reporting.csv",
            content: "employee_id,level,level,status\n1,L3,L3,active",
          },
        ],
        metricDefinitionText: "Finance vs operations keeps surfacing in reporting debates.",
        workflowNotesText: "The team manually joins ATS and payroll extracts every month.",
      },
    });

    expect(summary.tags.join(" ")).toMatch(/duplicate-columns/);
    expect(summary.tags.join(" ")).toMatch(/record-conflict/);
    expect(summary.dimensionAdjustments.record_reliability).toBeGreaterThan(0);
    expect(summary.notes.length).toBeGreaterThan(1);
  });
});
