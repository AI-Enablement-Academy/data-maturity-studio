import { Suspense } from "react";

import { ResultsClient } from "@/components/diagnostics/results-client";
import { PageShell } from "@/components/diagnostics/chrome";

export default function DRLResultsPage() {
  return (
    <PageShell
      activeProduct="drl"
      eyebrow="Report"
      title="Readiness report"
      summary="Review the current workflow state, the dimension profile supporting it, and the capability gaps that still block stronger reuse."
      variant="task"
    >
      <Suspense fallback={<div className="rounded-[2rem] border border-white/50 bg-white/90 p-8">Loading report...</div>}>
        <ResultsClient productType="drl" />
      </Suspense>
    </PageShell>
  );
}
