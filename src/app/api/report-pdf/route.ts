import { NextRequest, NextResponse } from "next/server";

import {
  consumeChatRateLimit,
  getClientIdentifier,
  parseJsonBodyWithLimit,
  validateAssessmentSession,
  validateTrustedOrigin,
} from "@/lib/diagnostics/chat-guard";
import { rebuildAssessmentSession } from "@/lib/diagnostics/engine";
import { renderReportPdfBuffer } from "@/lib/diagnostics/pdf";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!validateTrustedOrigin(request.nextUrl.toString(), request.headers)) {
    return NextResponse.json(
      { message: "Cross-origin PDF export is not allowed." },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }

  const rateLimit = await consumeChatRateLimit(`pdf:${getClientIdentifier(request.headers)}`);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { message: "PDF export is temporarily rate-limited. Try again after the countdown." },
      {
        status: 429,
        headers: {
          "Cache-Control": "no-store",
          "Retry-After": String(rateLimit.retryAfterSeconds),
        },
      },
    );
  }

  const body = await parseJsonBodyWithLimit(request);
  if (!body.ok) {
    return NextResponse.json(
      { message: body.message },
      { status: body.status, headers: { "Cache-Control": "no-store" } },
    );
  }

  const session = validateAssessmentSession(
    typeof body.value === "object" && body.value !== null
      ? (body.value as { session?: unknown }).session
      : null,
  );

  if (!session.ok) {
    return NextResponse.json(
      { message: session.message },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const rebuiltSession = rebuildAssessmentSession(session.value);
  const buffer = await renderReportPdfBuffer(rebuiltSession);

  return new NextResponse(buffer as BodyInit, {
    status: 200,
    headers: {
      "Cache-Control": "no-store",
      "Content-Disposition": `attachment; filename="${rebuiltSession.productType}-diagnostic-report.pdf"`,
      "Content-Type": "application/pdf",
    },
  });
}
