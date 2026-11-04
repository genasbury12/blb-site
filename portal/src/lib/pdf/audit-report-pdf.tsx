import { Document, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";
import { PATH_LABELS } from "@/domain/audit/labels";
import { CATEGORIES, CATEGORY_LABELS, CATEGORY_MODULE } from "@/domain/audit/types";
import type { ReportRun } from "@/components/audit/audit-report";
import { PDF_FONTS as F } from "./brand-fonts";

/**
 * Branded PDF of an audit run (Phase 2: "PDF report"). Built only from the immutable run snapshot.
 * Brand fonts from ./brand-fonts (Cormorant Garamond display, DM Sans body), read from disk.
 */
const C = { plum: "#65474F", ink: "#30282C", muted: "#5A4A50", rose: "#E8C8CB", roseSoft: "#F3E2E3", ivory: "#F7EEE9" };

const s = StyleSheet.create({
  page: { padding: 44, backgroundColor: C.ivory, color: C.ink, fontFamily: F.body, fontSize: 10, lineHeight: 1.5 },
  brand: { fontFamily: F.display, fontSize: 14.5, lineHeight: 1.2, color: C.plum, letterSpacing: 0.5 },
  rule: { height: 1, backgroundColor: C.rose, marginVertical: 12 },
  eyebrow: { fontSize: 7.5, letterSpacing: 1.6, color: C.muted, textTransform: "uppercase" },
  h1: { fontFamily: F.display, fontSize: 31, lineHeight: 1.15, marginTop: 4 },
  h2: { fontFamily: F.display, fontSize: 19, lineHeight: 1.2, marginTop: 18, marginBottom: 6 },
  card: { backgroundColor: "#FFFFFF", borderColor: C.rose, borderWidth: 1, borderRadius: 6, padding: 12, marginBottom: 8 },
  row: { flexDirection: "row", gap: 10 },
  barTrack: { height: 6, backgroundColor: C.roseSoft, borderRadius: 3, marginTop: 3 },
  barFill: { height: 6, backgroundColor: C.plum, borderRadius: 3 },
  small: { fontSize: 8.5, color: C.muted },
  bold: { fontFamily: F.bodyBold },
  footer: { position: "absolute", bottom: 24, left: 44, right: 44, fontSize: 7.5, color: C.muted, textAlign: "center" },
});

const dateFmt = new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "America/New_York" });

export function AuditReportDocument({ run, memberName }: { run: ReportRun; memberName: string | null }) {
  const rec = run.recommendation_snapshot_json;
  const scores = run.category_scores_json;
  return (
    <Document title="BOSS Business Audit Report" author="The BOSS Business System" creator="The BOSS Business System">
      <Page size="LETTER" style={s.page}>
        <Text style={s.brand}>The BOSS Business System</Text>
        <View style={s.rule} />
        <Text style={s.eyebrow}>Business audit report</Text>
        <Text style={s.h1}>{memberName ? `${memberName}, here is where your business stands` : "Where your business stands"}</Text>
        <Text style={[s.small, { marginTop: 4 }]}>Submitted {dateFmt.format(new Date(run.submitted_at))}. {rec.explanations[0]}</Text>

        <View style={[s.row, { marginTop: 14 }]}>
          <View style={[s.card, { width: 150 }]}>
            <Text style={s.eyebrow}>Overall</Text>
            <Text style={{ fontFamily: F.display, fontSize: 40, lineHeight: 1.1 }}>{Math.round(run.overall_score)}%</Text>
            <Text style={[s.small, { marginTop: 4 }]}>Recommended path</Text>
            <Text style={s.bold}>{PATH_LABELS[rec.pathRecommendation.path]}</Text>
          </View>
          <View style={[s.card, { flex: 1 }]}>
            {CATEGORIES.map((c) => (
              <View key={c} style={{ marginBottom: 4 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text>Module {CATEGORY_MODULE[c]}: {CATEGORY_LABELS[c]}</Text>
                  <Text style={s.bold}>{scores[c].display}%</Text>
                </View>
                <View style={s.barTrack}>
                  <View style={[s.barFill, { width: `${Math.max(2, scores[c].display)}%` }]} />
                </View>
              </View>
            ))}
          </View>
        </View>

        <Text style={s.h2} minPresenceAhead={60}>Your top three priorities</Text>
        {rec.priorityRecommendations.map((p) => (
          <View key={p.rank} style={s.card} wrap={false}>
            <Text style={s.eyebrow}>Priority {p.rank}  ·  Module {p.moduleNumber}: {CATEGORY_LABELS[p.category]}</Text>
            <Text style={[s.bold, { fontSize: 11.5, marginTop: 2 }]}>{p.title}</Text>
            <Text style={{ marginTop: 2 }}>{p.reason}</Text>
            {p.lessons.length ? (
              <Text style={[s.small, { marginTop: 4 }]}>
                Start with: {p.lessons.map((l) => l.title + (l.mappingLevel === "category" ? " (matched by area)" : "")).join("; ")}
              </Text>
            ) : null}
          </View>
        ))}

        <Text style={s.h2} minPresenceAhead={60}>Where you are strongest</Text>
        <Text>{rec.strengths.map((x) => `${CATEGORY_LABELS[x.category]} (${x.display}%)`).join("   ·   ")}</Text>

        <Text style={s.h2} break minPresenceAhead={60}>Your suggested six month roadmap</Text>
        <Text style={s.small}>A suggested order, not a deadline. Every module is open now.</Text>
        {rec.roadmapRecommendation.map((m) => (
          <View key={m.month} style={[s.card, { marginTop: 6 }]} wrap={false}>
            <Text style={s.eyebrow}>Month {m.month}</Text>
            <Text style={[s.bold, { fontSize: 11 }]}>{m.theme}</Text>
            {m.items.map((it, i) => (
              <Text key={i} style={{ marginTop: 2 }}>
                {"•"} {it.title}{it.isPriority ? " (priority)" : ""}
              </Text>
            ))}
          </View>
        ))}

        <Text style={s.h2} minPresenceAhead={60}>How this report works</Text>
        {rec.explanations.slice(1).map((e) => (
          <Text key={e} style={{ marginBottom: 3 }}>{e}</Text>
        ))}
        <Text style={[s.small, { marginTop: 6 }]}>Scoring version {run.scoring_version}. Results are based on self reported answers and are not a prediction of revenue.</Text>

        {/* Plain fixed text: @react-pdf 4.9 does not draw render-prop text, so no page numbers (I-64). */}
        <Text style={s.footer} fixed>
          The BOSS Business System  ·  Private to you
        </Text>
      </Page>
    </Document>
  );
}

export async function renderAuditReportPdf(run: ReportRun, memberName: string | null): Promise<Buffer> {
  return renderToBuffer(<AuditReportDocument run={run} memberName={memberName} />);
}
