import { describe, expect, it } from "vitest";

import { renderReportPdfBuffer } from "@/lib/diagnostics/pdf";
import { buildFixtureSession } from "@/lib/diagnostics/test-fixtures";

describe("renderReportPdfBuffer", () => {
  it("renders a DQ report to a non-empty PDF buffer", async () => {
    const output = await renderReportPdfBuffer(buildFixtureSession("dq"));

    expect(output).toBeTruthy();
  }, 15000);

  it("renders a readiness report to a non-empty PDF buffer", async () => {
    const output = await renderReportPdfBuffer(buildFixtureSession("drl"));

    expect(output).toBeTruthy();
  }, 15000);
});
