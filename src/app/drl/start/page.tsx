import { AssessmentFlow } from "@/components/diagnostics/assessment-flow";
import { PageShell } from "@/components/diagnostics/chrome";

export default function DRLStartPage() {
  return (
    <PageShell
      activeProduct="drl"
      eyebrow="Assessment"
      title="Run the Readiness Check"
      summary="Use the shorter assessment when the main question is the current workflow state and what still blocks dependable reuse."
      variant="task"
    >
      <AssessmentFlow productType="drl" />
    </PageShell>
  );
}
