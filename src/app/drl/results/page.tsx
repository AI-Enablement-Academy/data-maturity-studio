import { Suspense } from "react";

import { ResultsClient } from "@/components/diagnostics/results-client";
import { PageShell } from "@/components/diagnostics/chrome";

export default function DRLResultsPage() {
  return (
    <PageShell
      activeProduct="drl"
      eyebrow="Report"
      title="DRL report"
      summary="Review the likely DRL band, the root-cause profile supporting that band, and the path toward DRL 7."
    >
      <Suspense fallback={<div className="rounded-[2rem] border border-white/50 bg-white/90 p-8">Loading report...</div>}>
        <ResultsClient productType="drl" />
      </Suspense>
    </PageShell>
  );
}
