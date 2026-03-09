import { AssessmentFlow } from "@/components/diagnostics/assessment-flow";
import { PageShell } from "@/components/diagnostics/chrome";

export default function DRLStartPage() {
  return (
    <PageShell
      activeProduct="drl"
      eyebrow="Assessment"
      title="Run the DRL Diagnostic"
      summary="Use the shorter assessment when the main question is maturity banding and the gap to DRL 7."
    >
      <AssessmentFlow productType="drl" />
    </PageShell>
  );
}
