import React from "react";
import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";

import { productConfigs } from "@/lib/diagnostics/product-config";
import { AssessmentSession, ProductType } from "@/lib/diagnostics/types";

const styles = StyleSheet.create({
  page: {
    paddingTop: 32,
    paddingBottom: 32,
    paddingHorizontal: 32,
    backgroundColor: "#F8FAFC",
    color: "#1E293B",
    fontFamily: "Helvetica",
    fontSize: 11,
    lineHeight: 1.5,
  },
  hero: {
    padding: 20,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    border: "1 solid #E2E8F0",
  },
  eyebrow: {
    color: "#1E40AF",
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    fontWeight: 700,
  },
  title: {
    marginTop: 8,
    fontSize: 24,
    fontWeight: 700,
    color: "#0F172A",
  },
  summary: {
    marginTop: 10,
    color: "#475569",
  },
  section: {
    marginTop: 18,
    padding: 16,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    border: "1 solid #E2E8F0",
  },
  sectionTitle: {
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 1.1,
    color: "#1E40AF",
    fontWeight: 700,
  },
  sectionHeading: {
    marginTop: 6,
    fontSize: 18,
    fontWeight: 700,
    color: "#0F172A",
  },
  pillRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
    flexWrap: "wrap",
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#EFF6FF",
    color: "#1E40AF",
    fontSize: 10,
    fontWeight: 700,
  },
  blockerCard: {
    marginTop: 10,
    padding: 12,
    borderRadius: 14,
    backgroundColor: "#F8FAFC",
    border: "1 solid #E2E8F0",
  },
  blockerTitle: {
    fontSize: 12,
    fontWeight: 700,
    color: "#0F172A",
  },
  blockerMeta: {
    marginTop: 4,
    color: "#F97316",
    fontSize: 10,
    fontWeight: 700,
  },
  muted: {
    color: "#475569",
  },
  bulletList: {
    marginTop: 10,
    gap: 8,
  },
  bulletRow: {
    flexDirection: "row",
    gap: 8,
  },
  bullet: {
    color: "#F97316",
    fontWeight: 700,
  },
  table: {
    marginTop: 12,
    border: "1 solid #E2E8F0",
    borderRadius: 12,
    overflow: "hidden",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#F1F5F9",
    borderBottom: "1 solid #E2E8F0",
  },
  tableRow: {
    flexDirection: "row",
    borderBottom: "1 solid #E2E8F0",
  },
  tableCellWide: {
    flex: 1.9,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  tableCellNarrow: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  tableCellAction: {
    flex: 1.6,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  tableLabel: {
    fontWeight: 700,
    color: "#0F172A",
  },
  footer: {
    marginTop: 18,
    paddingTop: 12,
    borderTop: "1 solid #CBD5E1",
    color: "#64748B",
    fontSize: 9,
  },
  twoColumn: {
    flexDirection: "row",
    gap: 12,
  },
  column: {
    flex: 1,
  },
});

export function ReportPdfDocument({
  session,
  productType,
}: {
  session: AssessmentSession;
  productType: ProductType;
}) {
  const config = productConfigs[productType];

  return (
    <Document
      author="AI Enablement Academy"
      creator="Data Quality Studio"
      subject={`${config.shortTitle} diagnostic report`}
      title={`${config.title} report`}
    >
      <Page size="A4" style={styles.page}>
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>{config.title}</Text>
          <Text style={styles.title}>{config.title} report</Text>
          <Text style={styles.summary}>{session.resultModel.summaryCard}</Text>
          <View style={styles.pillRow}>
            <Text style={styles.pill}>{session.resultModel.operatingState}</Text>
            <Text style={styles.pill}>{session.resultModel.aiSuitability.label}</Text>
            <Text style={styles.pill}>{session.scopeType === "use_case" ? "Use case mode" : "Organization mode"}</Text>
            <Text style={styles.pill}>Confidence: {session.resultModel.confidence.label}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top blockers</Text>
          <Text style={styles.sectionHeading}>What is creating the most drag</Text>
          {session.resultModel.topBlockers.map((blocker) => (
            <View key={blocker.key} style={styles.blockerCard}>
              <Text style={styles.blockerTitle}>{blocker.title}</Text>
              <Text style={styles.blockerMeta}>{blocker.severityLabel}</Text>
              <Text style={styles.muted}>{blocker.explanation}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Operating state</Text>
          <Text style={styles.sectionHeading}>Current state and what still blocks stronger reuse</Text>
          <View style={styles.twoColumn}>
            <View style={styles.column}>
              <Text style={styles.blockerTitle}>{session.resultModel.operatingState}</Text>
              <Text style={styles.muted}>{session.resultModel.operatingStateRationale.summary}</Text>
              <Text style={[styles.tableLabel, { marginTop: 10 }]}>AI suitability</Text>
              <Text style={styles.muted}>{session.resultModel.aiSuitability.label}</Text>
              <Text style={styles.muted}>{session.resultModel.aiSuitability.summary}</Text>
            </View>
            <View style={styles.column}>
              <Text style={styles.tableLabel}>Capability gaps</Text>
              <View style={styles.bulletList}>
                {session.resultModel.capabilityGaps.map((item) => (
                  <View key={item} style={styles.bulletRow}>
                    <Text style={styles.bullet}>•</Text>
                    <Text style={styles.muted}>{item}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dimension table</Text>
          <Text style={styles.sectionHeading}>Diagnostic dimensions at a glance</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.tableCellWide}>Dimension</Text>
              <Text style={styles.tableCellNarrow}>Severity</Text>
              <Text style={styles.tableCellAction}>Why it matters</Text>
            </View>
            {session.resultModel.dimensionScores.map((item) => (
              <View key={item.key} style={styles.tableRow}>
                <Text style={styles.tableCellWide}>{item.title}</Text>
                <Text style={styles.tableCellNarrow}>{item.severityLabel}</Text>
                <Text style={styles.tableCellAction}>{item.explanation}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Action plan</Text>
          <Text style={styles.sectionHeading}>Immediate moves and pilot path</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.tableCellWide}>Intervention</Text>
              <Text style={styles.tableCellAction}>Immediate move</Text>
              <Text style={styles.tableCellAction}>Follow-on move</Text>
            </View>
            {session.resultModel.actionPlan.map((item) => (
              <View key={item.title} style={styles.tableRow}>
                <Text style={styles.tableCellWide}>{item.title}</Text>
                <Text style={styles.tableCellAction}>{item.thirtyDayMove}</Text>
                <Text style={styles.tableCellAction}>{item.sixWeekPilotMove}</Text>
              </View>
            ))}
          </View>
        </View>

        <Text style={styles.footer}>
          Built by Adam Kovacs x AI Enablement Academy. Public MIT codebase, limited alpha prototype. This PDF reflects the deterministic report output for the saved session. It is not a certification or formal compliance attestation. The implementation draws on public academic work by Wang & Strong (1996), Pipino, Lee & Wang (2002), Wang (1998), and Lawrence (2017), while the diagnostic dimensions, scoring logic, and action model are original to this tool.
        </Text>
      </Page>
    </Document>
  );
}
