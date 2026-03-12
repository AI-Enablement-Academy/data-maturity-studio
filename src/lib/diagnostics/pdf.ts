import React from "react";
import { DocumentProps, pdf } from "@react-pdf/renderer";

import { ReportPdfDocument } from "@/components/diagnostics/report-pdf";
import { AssessmentSession } from "@/lib/diagnostics/types";

export async function renderReportPdfBuffer(session: AssessmentSession) {
  const document = React.createElement(ReportPdfDocument, {
      session,
      productType: session.productType,
    }) as unknown as React.ReactElement<DocumentProps>;
  const instance = pdf(document);

  const blob = await instance.toBlob();
  const arrayBuffer = await blob.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}
