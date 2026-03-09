import { rootConditions } from "@/lib/diagnostics/catalog";
import {
  AssessmentInput,
  EvidenceSummary,
  RootConditionKey,
} from "@/lib/diagnostics/types";

const keywordAdjustments: Array<{
  matcher: RegExp;
  tag: string;
  note: string;
  adjustments: Partial<Record<RootConditionKey, number>>;
}> = [
  {
    matcher: /\b(ats|hris|payroll|survey|performance|different systems|finance vs hr)\b/i,
    tag: "source-conflict",
    note: "Text evidence mentions multiple systems or competing sources.",
    adjustments: {
      multiple_data_sources: 0.4,
      system_integration: 0.2,
    },
  },
  {
    matcher: /\b(manager judgment|subjective|gut feel|free text|notes|narrative)\b/i,
    tag: "subjective-signal",
    note: "Text evidence points to subjective or narrative-heavy inputs.",
    adjustments: {
      subjective_judgement: 0.5,
      complex_representation: 0.4,
      input_standards: 0.2,
    },
  },
  {
    matcher: /\b(recode|mapping|taxonomy|level mismatch|job code|skill code)\b/i,
    tag: "taxonomy-friction",
    note: "Text evidence shows taxonomy or coding harmonization work.",
    adjustments: {
      diverse_coding_systems: 0.5,
      multiple_data_sources: 0.2,
    },
  },
  {
    matcher: /\b(access|approval|security|privacy|restricted)\b/i,
    tag: "access-friction",
    note: "Text evidence signals access or permission friction.",
    adjustments: {
      security_access_balance: 0.5,
      resource_limitations: 0.2,
    },
  },
  {
    matcher: /\b(api|integration|manual handoff|export|join)\b/i,
    tag: "integration-friction",
    note: "Text evidence signals integration or handoff weaknesses.",
    adjustments: {
      system_integration: 0.5,
      multiple_data_sources: 0.2,
    },
  },
];

function mergeAdjustment(
  target: Partial<Record<RootConditionKey, number>>,
  next: Partial<Record<RootConditionKey, number>>,
) {
  for (const [key, value] of Object.entries(next) as Array<[RootConditionKey, number]>) {
    target[key] = Math.min(0.8, (target[key] ?? 0) + value);
  }
}

function summarizeCsvContent(content: string) {
  const lines = content.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) {
    return {
      notes: ["A CSV upload was empty, which reduces confidence in evidence quality."],
      tags: ["empty-csv"],
      adjustments: {
        input_standards: 0.2,
      } satisfies Partial<Record<RootConditionKey, number>>,
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
  const adjustments: Partial<Record<RootConditionKey, number>> = {};

  if (duplicateHeaders.length > 0) {
    notes.push(`CSV evidence includes duplicate column names: ${duplicateHeaders.join(", ")}.`);
    tags.push("duplicate-columns");
    mergeAdjustment(adjustments, {
      multiple_data_sources: 0.3,
      diverse_coding_systems: 0.4,
      system_integration: 0.2,
    });
  }

  if (blankHeaders > 0) {
    notes.push("CSV evidence includes blank headers, suggesting weak input standards.");
    tags.push("blank-headers");
    mergeAdjustment(adjustments, {
      input_standards: 0.3,
      complex_representation: 0.2,
    });
  }

  if (columnCount >= 35) {
    notes.push(
      `CSV evidence contains ${columnCount} columns, which may indicate collection breadth without signal design.`,
    );
    tags.push("wide-table");
    mergeAdjustment(adjustments, {
      volume_processing: 0.2,
      complex_representation: 0.2,
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
  const rootConditionAdjustments: Partial<Record<RootConditionKey, number>> = {};
  let confidenceBoost = 0;

  for (const file of input.evidence.csvFiles) {
    const summary = summarizeCsvContent(file.content);
    notes.push(...summary.notes);
    tags.push(...summary.tags.map((tag) => `${file.fileName}:${tag}`));
    mergeAdjustment(rootConditionAdjustments, summary.adjustments);
    confidenceBoost += summary.confidenceBoost;
  }

  const textEvidence = `${input.evidence.metricDefinitionText}\n${input.evidence.workflowNotesText}`.trim();
  if (textEvidence.length > 0) {
    confidenceBoost += 6;
    notes.push("Narrative evidence was supplied, which increases diagnostic confidence.");
    tags.push("text-evidence");
  }

  for (const matcher of keywordAdjustments) {
    if (matcher.matcher.test(textEvidence)) {
      tags.push(matcher.tag);
      notes.push(matcher.note);
      mergeAdjustment(rootConditionAdjustments, matcher.adjustments);
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

  for (const condition of rootConditions) {
    if (!(condition.key in rootConditionAdjustments)) {
      rootConditionAdjustments[condition.key] = 0;
    }
  }

  return {
    notes,
    tags,
    confidenceBoost,
    rootConditionAdjustments,
  };
}
