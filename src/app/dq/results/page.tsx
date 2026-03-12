import { Suspense } from "react";

import { ResultsClient } from "@/components/diagnostics/results-client";
import { PageShell } from "@/components/diagnostics/chrome";

export default function DQResultsPage() {
  return (
    <PageShell
      activeProduct="dq"
      eyebrow="Report"
      title="Data Quality report"
      summary="Review the dimension profile, current workflow state, and the next moves that would improve trust, reuse, and controlled AI suitability."
      variant="task"
    >
      <Suspense fallback={<div className="rounded-[2rem] border border-white/50 bg-white/90 p-8">Loading report...</div>}>
        <ResultsClient productType="dq" />
      </Suspense>
    </PageShell>
  );
}
