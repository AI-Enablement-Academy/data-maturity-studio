export type TrackingEventName =
  | "assessment_started"
  | "assessment_completed"
  | "report_exported"
  | "report_copied";

export function trackEvent(name: TrackingEventName, payload: Record<string, unknown>) {
  if (typeof window === "undefined") {
    return;
  }

  const envelope = {
    name,
    payload,
    ts: Date.now(),
  };

  window.dispatchEvent(new CustomEvent("diagnostics:event", { detail: envelope }));
  window.dataLayer = window.dataLayer ?? [];
  window.dataLayer.push(envelope);
}

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
  }
}
