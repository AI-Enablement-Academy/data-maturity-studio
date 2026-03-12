import { AssessmentInput, AssessmentSession, ProductType, SavedReportSummary } from "@/lib/diagnostics/types";

const storageVersion = "v2";
const draftKey = (productType: ProductType) => `diagnostics:${storageVersion}:draft:${productType}`;
const resultKey = (productType: ProductType) => `diagnostics:${storageVersion}:result:${productType}`;
const reportHistoryKey = `diagnostics:report-history:${storageVersion}`;
const reportItemKey = (reportId: string) => `diagnostics:${storageVersion}:report-item:${reportId}`;
const storageEventName = "diagnostics-storage";
const DRAFT_RETENTION_MS = 24 * 60 * 60 * 1000;
const REPORT_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;
const legacyDraftKeys = ["diagnostics:draft:dq", "diagnostics:draft:drl"];
const legacyResultKeys = ["diagnostics:result:dq", "diagnostics:result:drl"];
const legacyHistoryKeys = ["diagnostics:report-history:v1"];

interface StoredDraft {
  savedAt: string;
  draft: AssessmentInput;
}

function emptyEvidence() {
  return {
    csvFiles: [],
    metricDefinitionText: "",
    workflowNotesText: "",
  };
}

function sanitizeDraft(draft: AssessmentInput): AssessmentInput {
  return {
    ...draft,
    evidence: emptyEvidence(),
  };
}

function isExpired(expiresAt: string, now = Date.now()) {
  return new Date(expiresAt).getTime() <= now;
}

function reportExpiresAt(completedAt: string) {
  return new Date(new Date(completedAt).getTime() + REPORT_RETENTION_MS).toISOString();
}

function purgeExpiredHistoryItems(history: SavedReportSummary[]) {
  const now = Date.now();
  const staleIds = history.filter((item) => isExpired(item.expiresAt, now)).map((item) => item.id);

  if (typeof window !== "undefined") {
    for (const id of staleIds) {
      window.localStorage.removeItem(reportItemKey(id));
    }
  }

  return history.filter((item) => !staleIds.includes(item.id));
}

function emitStorageEvent() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event(storageEventName));
}

export function loadDraft(productType: ProductType): AssessmentInput | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(draftKey(productType));
  if (!raw) {
    return null;
  }

  try {
    const stored = JSON.parse(raw) as StoredDraft;
    const savedAt = new Date(stored.savedAt).getTime();
    if (!Number.isFinite(savedAt) || savedAt + DRAFT_RETENTION_MS <= Date.now()) {
      window.localStorage.removeItem(draftKey(productType));
      return null;
    }

    return sanitizeDraft(stored.draft);
  } catch {
    return null;
  }
}

export function saveDraft(productType: ProductType, draft: AssessmentInput) {
  if (typeof window === "undefined") {
    return;
  }

  const stored: StoredDraft = {
    savedAt: new Date().toISOString(),
    draft: sanitizeDraft(draft),
  };

  window.localStorage.setItem(draftKey(productType), JSON.stringify(stored));
  emitStorageEvent();
}

export function clearDraft(productType: ProductType) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(draftKey(productType));
  emitStorageEvent();
}

export function loadResult(productType: ProductType): AssessmentSession | null {
  const raw = loadResultSnapshot(productType);
  if (!raw) {
    return null;
  }

  return parseResultSnapshot(raw);
}

export function loadResultSnapshot(productType: ProductType): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(resultKey(productType));
}

export function parseResultSnapshot(raw: string): AssessmentSession | null {
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AssessmentSession;
  } catch {
    return null;
  }
}

function buildSavedReportSummary(result: AssessmentSession): SavedReportSummary {
  return {
    id: result.id,
    productType: result.productType,
    scopeType: result.scopeType,
    useCaseKey: result.useCaseKey,
    completedAt: result.completedAt,
    expiresAt: reportExpiresAt(result.completedAt),
    operatingState: result.operatingState,
    summaryCard: result.resultModel.summaryCard,
    topBlockerTitles: result.resultModel.topBlockers.map((item) => item.title),
  };
}

function parseSavedReportHistory(raw: string | null): SavedReportSummary[] {
  if (!raw) {
    return [];
  }

  try {
    return (JSON.parse(raw) as SavedReportSummary[]).map((item) => ({
      ...item,
      expiresAt: item.expiresAt ?? reportExpiresAt(item.completedAt),
    }));
  } catch {
    return [];
  }
}

export function getSavedReports(productType?: ProductType): SavedReportSummary[] {
  if (typeof window === "undefined") {
    return [];
  }

  const history = purgeExpiredHistoryItems(
    parseSavedReportHistory(window.localStorage.getItem(reportHistoryKey)),
  );
  window.localStorage.setItem(reportHistoryKey, JSON.stringify(history));
  if (!productType) {
    return history;
  }

  return history.filter((report) => report.productType === productType);
}

export function loadReportById(reportId: string): AssessmentSession | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(reportItemKey(reportId));
  if (!raw) {
    return null;
  }

  return parseResultSnapshot(raw);
}

export function deleteSavedReport(reportId: string, productType?: ProductType) {
  if (typeof window === "undefined") {
    return;
  }

  const nextHistory = getSavedReports().filter((item) => item.id !== reportId);
  window.localStorage.removeItem(reportItemKey(reportId));
  window.localStorage.setItem(reportHistoryKey, JSON.stringify(nextHistory));

  if (productType && loadResult(productType)?.id === reportId) {
    window.localStorage.removeItem(resultKey(productType));
  }

  emitStorageEvent();
}

export function clearLocalDiagnosticsData() {
  if (typeof window === "undefined") {
    return;
  }

  const history = parseSavedReportHistory(window.localStorage.getItem(reportHistoryKey));
  for (const report of history) {
    window.localStorage.removeItem(reportItemKey(report.id));
  }

  window.localStorage.removeItem(reportHistoryKey);
  window.localStorage.removeItem(draftKey("dq"));
  window.localStorage.removeItem(draftKey("drl"));
  window.localStorage.removeItem(resultKey("dq"));
  window.localStorage.removeItem(resultKey("drl"));

  for (const key of [...legacyDraftKeys, ...legacyResultKeys, ...legacyHistoryKeys]) {
    window.localStorage.removeItem(key);
  }

  emitStorageEvent();
}

export function saveResult(productType: ProductType, result: AssessmentSession) {
  if (typeof window === "undefined") {
    return;
  }

  const serialized = JSON.stringify(result);
  const summary = buildSavedReportSummary(result);
  const nextHistory = [
    summary,
    ...getSavedReports().filter((item) => item.id !== result.id),
  ].slice(0, 12);

  window.localStorage.setItem(resultKey(productType), serialized);
  window.localStorage.setItem(reportItemKey(result.id), serialized);
  window.localStorage.setItem(reportHistoryKey, JSON.stringify(nextHistory));
  emitStorageEvent();
}

export function subscribeDiagnosticsStorage(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  function handleStorage(event: StorageEvent) {
    if (!event.key || event.key.startsWith("diagnostics:")) {
      onStoreChange();
    }
  }

  window.addEventListener("storage", handleStorage);
  window.addEventListener(storageEventName, onStoreChange);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(storageEventName, onStoreChange);
  };
}
