import { diagnosticDimensions } from "@/lib/diagnostics/catalog";
import {
  AssessmentInput,
  DiagnosticDimensionKey,
  EvidenceSummary,
} from "@/lib/diagnostics/types";

const keywordAdjustments: Array<{
  matcher: RegExp;
  tag: string;
  note: string;
  adjustments: Partial<Record<DiagnosticDimensionKey, number>>;
}> = [
  {
    matcher: /\b(ats|hris|payroll|survey|performance|different systems|finance vs hr|source of truth)\b/i,
    tag: "record-conflict",
    note: "Text evidence mentions conflicting systems, duplicate records, or reconciliation problems.",
    adjustments: {
      record_reliability: 0.5,
      reuse_operating_model: 0.2,
    },
  },
  {
    matcher: /\b(manager judgment|subjective|gut feel|free text|notes|narrative|write-up)\b/i,
    tag: "subjective-signal",
    note: "Text evidence points to narrative-heavy capture or subjective interpretation.",
    adjustments: {
      structure_interpretability: 0.5,
      decision_fit: 0.2,
      record_reliability: 0.2,
    },
  },
  {
    matcher: /\b(recode|mapping|taxonomy|level mismatch|job code|skill code|translation table)\b/i,
    tag: "translation-friction",
    note: "Text evidence shows recurring translation work before reuse.",
    adjustments: {
      structure_interpretability: 0.3,
      reuse_operating_model: 0.4,
      record_reliability: 0.2,
    },
  },
  {
    matcher: /\b(access|approval|security|privacy|restricted|permissions)\b/i,
    tag: "access-friction",
    note: "Text evidence signals access or control friction.",
    adjustments: {
      access_control: 0.5,
      reuse_operating_model: 0.2,
    },
  },
  {
    matcher: /\b(api|integration|manual handoff|export|join|spreadsheet rescue|workaround)\b/i,
    tag: "reuse-friction",
    note: "Text evidence signals brittle downstream reuse and manual rescue work.",
    adjustments: {
      reuse_operating_model: 0.5,
      quality_discipline: 0.2,
    },
  },
];

function mergeAdjustment(
  target: Partial<Record<DiagnosticDimensionKey, number>>,
  next: Partial<Record<DiagnosticDimensionKey, number>>,
) {
  for (const [key, value] of Object.entries(next) as Array<[DiagnosticDimensionKey, number]>) {
    target[key] = Math.min(0.8, (target[key] ?? 0) + value);
  }
}

function summarizeCsvContent(content: string) {
  const lines = content.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) {
    return {
      notes: ["A CSV upload was empty, which lowers confidence in the evidence quality."],
      tags: ["empty-csv"],
      adjustments: {
        record_reliability: 0.2,
        quality_discipline: 0.1,
      } satisfies Partial<Record<DiagnosticDimensionKey, number>>,
      confidenceBoost: 0,
    };
  }

  const headers = lines[0].split(",").map((item) => item.trim());
  const duplicateHeaders = headers.filter(
    (header, index) => header.length > 0 && headers.indexOf(header) !== index,
  );
  const blankHeaders = headers.filter((header) => header.length === 0).length;
  const columnCount = headers.length;
  const notes: string[] = [];
  const tags: string[] = [];
  const adjustments: Partial<Record<DiagnosticDimensionKey, number>> = {};

  if (duplicateHeaders.length > 0) {
    notes.push(`CSV evidence includes duplicate column names: ${duplicateHeaders.join(", ")}.`);
    tags.push("duplicate-columns");
    mergeAdjustment(adjustments, {
      record_reliability: 0.4,
      structure_interpretability: 0.3,
      reuse_operating_model: 0.2,
    });
  }

  if (blankHeaders > 0) {
    notes.push("CSV evidence includes blank headers, suggesting weak structural standards.");
    tags.push("blank-headers");
    mergeAdjustment(adjustments, {
      structure_interpretability: 0.3,
      quality_discipline: 0.2,
    });
  }

  if (columnCount >= 35) {
    notes.push(
      `CSV evidence contains ${columnCount} columns, which may indicate overcollection relative to the decision need.`,
    );
    tags.push("wide-table");
    mergeAdjustment(adjustments, {
      decision_fit: 0.2,
      structure_interpretability: 0.2,
    });
  }

  return {
    notes,
    tags,
    adjustments,
    confidenceBoost: 4,
  };
}

export function summarizeEvidence(input: AssessmentInput): EvidenceSummary {
  const notes: string[] = [];
  const tags: string[] = [];
  const dimensionAdjustments: Partial<Record<DiagnosticDimensionKey, number>> = {};
  let confidenceBoost = 0;

  for (const file of input.evidence.csvFiles) {
    const summary = summarizeCsvContent(file.content);
    notes.push(...summary.notes);
    tags.push(...summary.tags.map((tag) => `${file.fileName}:${tag}`));
    mergeAdjustment(dimensionAdjustments, summary.adjustments);
    confidenceBoost += summary.confidenceBoost;
  }

  const textEvidence = `${input.evidence.metricDefinitionText}\n${input.evidence.workflowNotesText}`.trim();
  if (textEvidence.length > 0) {
    confidenceBoost += 6;
    notes.push("Narrative evidence was supplied, which adds context and can make the diagnosis more specific.");
    tags.push("text-evidence");
  }

  for (const matcher of keywordAdjustments) {
    if (matcher.matcher.test(textEvidence)) {
      tags.push(matcher.tag);
      notes.push(matcher.note);
      mergeAdjustment(dimensionAdjustments, matcher.adjustments);
    }
  }

  if (input.scopeType === "organization") {
    notes.push(
      "Organization mode is directional. Scores are less precise than a workflow-specific assessment.",
    );
  }

  if (notes.length === 0) {
    notes.push(
      "No optional evidence was supplied. Results rely entirely on questionnaire answers.",
    );
  }

  for (const dimension of diagnosticDimensions) {
    if (!(dimension.key in dimensionAdjustments)) {
      dimensionAdjustments[dimension.key] = 0;
    }
  }

  return {
    notes,
    tags,
    confidenceBoost,
    dimensionAdjustments,
  };
}
