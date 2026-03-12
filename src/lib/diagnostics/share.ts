import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from "lz-string";

import { AssessmentSession, SharedReportSnapshot } from "@/lib/diagnostics/types";

function emptyEvidenceSummary() {
  return {
    notes: [],
    tags: [],
    confidenceBoost: 0,
    dimensionAdjustments: {},
  };
}

function createSharedReportSnapshot(session: AssessmentSession): SharedReportSnapshot {
  return {
    id: session.id,
    productType: session.productType,
    scopeType: session.scopeType,
    useCaseKey: session.useCaseKey,
    completedAt: session.completedAt,
    operatingState: session.operatingState,
    confidence: session.confidence,
    resultModel: {
      ...session.resultModel,
      confidence: session.resultModel.confidence,
      evidenceSummary: emptyEvidenceSummary(),
    },
  };
}

export function encodeSharedSession(session: AssessmentSession | SharedReportSnapshot) {
  const snapshot = "answers" in session ? createSharedReportSnapshot(session) : session;
  return compressToEncodedURIComponent(JSON.stringify(snapshot));
}

export function decodeSharedSession(payload: string) {
  try {
    const decompressed = decompressFromEncodedURIComponent(payload);
    if (!decompressed) {
      return null;
    }

    return JSON.parse(decompressed) as SharedReportSnapshot;
  } catch {
    return null;
  }
}
