import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { ResultsClient } from "@/components/diagnostics/results-client";
import { saveResult } from "@/lib/diagnostics/storage";
import { encodeSharedSession } from "@/lib/diagnostics/share";
import { buildFixtureSession } from "@/lib/diagnostics/test-fixtures";

const mockGet = vi.fn<(key: string) => string | null>();

vi.mock("next/navigation", () => ({
  useSearchParams: () => ({
    get: mockGet,
  }),
}));

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: React.ComponentProps<"a">) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/components/diagnostics/assistant-chat", () => ({
  AssistantChat: () => <div data-testid="assistant-chat">assistant</div>,
}));

vi.mock("@/components/diagnostics/report-charts", () => ({
  ReportCharts: () => <div data-testid="report-charts">charts</div>,
}));

describe("ResultsClient", () => {
  beforeEach(() => {
    const store = new Map<string, string>();
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: {
        getItem: (key: string) => store.get(key) ?? null,
        setItem: (key: string, value: string) => {
          store.set(key, value);
        },
        removeItem: (key: string) => {
          store.delete(key);
        },
        clear: () => {
          store.clear();
        },
      },
    });

    mockGet.mockReset();
    mockGet.mockReturnValue(null);
  });

  it("renders a saved DQ report from local storage", async () => {
    saveResult("dq", buildFixtureSession("dq"));

    render(<ResultsClient productType="dq" />);

    expect(await screen.findByText("Diagnostic dimensions")).toBeInTheDocument();
    expect(screen.getByText("Stabilizing")).toBeInTheDocument();
    expect(screen.getByTestId("assistant-chat")).toBeInTheDocument();
    expect(screen.getByTestId("report-charts")).toBeInTheDocument();
  });

  it("falls back to the DQ result for readiness when launched from the DQ view", async () => {
    mockGet.mockImplementation((key) => (key === "source" ? "dq" : null));
    saveResult("dq", buildFixtureSession("dq"));

    render(<ResultsClient productType="drl" />);

    expect(await screen.findByText("Capability gaps")).toBeInTheDocument();
    expect(screen.getByText("Record Control Reset")).toBeInTheDocument();
    expect(screen.queryByText("Delete from this browser")).not.toBeInTheDocument();
  });

  it("renders a shared report payload from the URL", async () => {
    mockGet.mockImplementation((key) =>
      key === "share" ? encodeSharedSession(buildFixtureSession("dq")) : null,
    );

    render(<ResultsClient productType="dq" />);

    expect(await screen.findByText("Export / share")).toBeInTheDocument();
    expect(screen.getByText("Record Control Reset")).toBeInTheDocument();
  });

  it("hydrates a shared report from the hash without showing the empty state", async () => {
    window.location.hash = `share=${encodeSharedSession(buildFixtureSession("dq"))}`;

    render(<ResultsClient productType="dq" />);

    expect(await screen.findByText("Export / share")).toBeInTheDocument();
    expect(screen.queryByText("No report available yet")).not.toBeInTheDocument();

    window.location.hash = "";
  });
});
