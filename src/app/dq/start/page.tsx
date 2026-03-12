import { AssessmentFlow } from "@/components/diagnostics/assessment-flow";
import { PageShell } from "@/components/diagnostics/chrome";

export default function DQStartPage() {
  return (
    <PageShell
      activeProduct="dq"
      eyebrow="Assessment"
      title="Run the Data Quality Diagnostic"
      summary="Complete the questionnaire, optionally add evidence, and generate a deterministic diagnostic report."
      variant="task"
    >
      <AssessmentFlow productType="dq" />
    </PageShell>
  );
}
