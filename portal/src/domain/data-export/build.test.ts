import { unzipSync, strFromU8 } from "fflate";
import { describe, expect, it } from "vitest";
import { buildExportJson, buildExportZip, exportFilename, exportReadme, safeName, type ExportRaw } from "./build";

const AT = "2026-11-04T15:00:00.000Z";
const STAFF = "00000000-0000-0000-0000-00000000aaaa";

function raw(over: Partial<ExportRaw> = {}): ExportRaw {
  return {
    generatedAt: AT,
    email: "member@example.invalid",
    profile: { user_id: "u1", display_name: "Test Member", timezone: "America/New_York", created_at: "2026-11-01T00:00:00Z" },
    coachName: "Coach Name",
    orders: [{ id: "o1", user_id: "u1", sku: "blueprint", status: "paid", amount_cents: 49700 }],
    payments: [{ id: "p1", order_id: "o1", amount_cents: 49700, state: "paid" }],
    subscriptions: [],
    entitlements: [{ id: "e1", user_id: "u1", feature_key: "curriculum.read", starts_at: "2026-11-01", ends_at: "2027-11-01", state: "active", manual_override_reason: "staff only note", created_by: STAFF, source_id: "o1" }],
    modules: [{ id: "m1", number: 1, title: "Business Foundation" }],
    lessons: [{ id: "l1", module_id: "m1", order_index: 1, title: "Lesson one" }],
    milestones: [{ id: "ms1", module_id: "m1", title: "I answered Lesson 1" }],
    lessonProgress: [{ lesson_id: "l1", completed_at: "2026-11-02T00:00:00Z" }],
    milestoneProgress: [{ user_id: "u1", milestone_id: "ms1", state: "done", completed_at: "2026-11-02T00:00:00Z", note: "My note", evidence_storage_key: "u1/abc.pdf" }],
    auditRuns: [{ id: "r1", user_id: "u1", overall_score: 44, submitted_at: "2026-11-02T00:00:00Z" }],
    auditDrafts: [],
    roadmapItems: [],
    pathChoices: [{ id: "pc1", user_id: "u1", chosen_path: "optimize", reason: "My reason", actor_id: STAFF }],
    worksheets: [{ slug: "m1-l1-starting-point", version: 1, title: "Lesson 1: Starting Point" }],
    worksheetResponses: [{ id: "w1", user_id: "u1", worksheet_slug: "m1-l1-starting-point", worksheet_version: 1, answers: { q1: "Blog posts" }, status: "complete", completed_at: "2026-11-02T00:00:00Z", created_at: "2026-11-01T00:00:00Z", updated_at: "2026-11-02T00:00:00Z" }],
    coachingQuestions: [],
    hotSeatApplications: [{ id: "h1", user_id: "u1", topic: "Pricing", decision_note: "Selected for March", decided_by: STAFF }],
    feedback: [{ id: "f1", user_id: "u1", deliverable_title: "Sales page", file_key: "u1/f.pdf", response_text: "Looks good", responder_id: STAFF }],
    communityPosts: [{ id: "cp1", user_id: "u1", title: "Hello", body: "Hi all" }],
    communityComments: [],
    communityReports: [],
    eliteApplications: [{ id: "a1", user_id: "u1", name: "Test Member", goals: "Grow", decision_note: "internal only", decided_by: STAFF }],
    eliteBoard: { id: "b1", client_id: "u1", coach_id: STAFF, claude_board_url: "https://claude.ai/x", created_at: "2026-11-01T00:00:00Z" },
    eliteItems: [
      { id: "i1", board_id: "b1", kind: "task", title: "Set up email", created_by: STAFF },
      { id: "i2", board_id: "b1", kind: "coach_note", title: "Private coach note", body: "staff only" },
    ],
    eliteItemComments: [
      { id: "c1", item_id: "i1", user_id: "u1", body: "Done" },
      { id: "c2", item_id: "i2", user_id: STAFF, body: "staff only comment" },
    ],
    eliteSessions: [],
    eliteCheckins: [{ id: "ck1", board_id: "b1", accomplishments: "Shipped", help_needed: "None" }],
    eliteHourBuckets: [],
    eliteTimeEntries: [{ id: "t1", board_id: "b1", minutes: 60, coach_id: STAFF }],
    eliteFiles: [
      { id: "ef1", board_id: "b1", item_id: "i1", label: "Plan.pdf", storage_key: "b1/plan.pdf", uploaded_by: STAFF },
      { id: "ef2", board_id: "b1", item_id: "i2", label: "Private.pdf", storage_key: "b1/private.pdf" },
    ],
    ...over,
  };
}

describe("data export JSON", () => {
  const json = buildExportJson(raw(), [
    { path: "worksheets/BOSS_Module1_Lesson1_Worksheet.pdf", source: "worksheet m1-l1-starting-point" },
    { path: "uploads/milestone-evidence/abc.pdf", source: "milestone evidence ms1" },
  ]);
  const text = JSON.stringify(json);

  it("has the sections the brief lists, in a stable shape", () => {
    expect(Object.keys(json)).toEqual(["about", "profile", "coach", "enrollment", "audit", "learning", "worksheets", "coaching", "feedback", "community", "elite"]);
    expect(json.about).toMatchObject({ generated_at: AT, format_version: 1 });
    expect(json.profile).toMatchObject({ email: "member@example.invalid", display_name: "Test Member" });
    expect(json.coach).toEqual({ name: "Coach Name" });
    expect(json.enrollment.orders).toHaveLength(1);
    expect(json.enrollment.access[0]).toMatchObject({ feature_key: "curriculum.read", ends_at: "2027-11-01" });
    expect(json.audit.submissions).toHaveLength(1);
    expect(json.worksheets[0]).toEqual({
      worksheet: "m1-l1-starting-point",
      title: "Lesson 1: Starting Point",
      schema_version: 1,
      status: "complete",
      answers: { q1: "Blog posts" },
      completed_at: "2026-11-02T00:00:00Z",
      created_at: "2026-11-01T00:00:00Z",
      updated_at: "2026-11-02T00:00:00Z",
    });
    expect(json.learning.lessons_completed[0]).toEqual({ module: 1, lesson: 1, title: "Lesson one", completed_at: "2026-11-02T00:00:00Z" });
    expect(json.learning.milestones[0]).toMatchObject({ module: 1, title: "I answered Lesson 1", note: "My note", evidence_file: "uploads/milestone-evidence/abc.pdf" });
  });

  it("keeps what the member wrote or sees: their reasons, feedback replies, Hot Seat decisions", () => {
    expect(json.audit.path_choices[0]).toMatchObject({ chosen_path: "optimize", reason: "My reason" });
    expect(json.feedback[0]).toMatchObject({ response_text: "Looks good" });
    expect(json.coaching.hot_seat_applications[0]).toMatchObject({ decision_note: "Selected for March" });
  });

  it("leaves out staff only notes, private coach items and staff account ids", () => {
    expect(text).not.toContain("staff only");
    expect(text).not.toContain("Private coach note");
    expect(text).not.toContain("internal only");
    expect(text).not.toContain(STAFF);
    expect(json.elite.board?.items.map((i) => i.title)).toEqual(["Set up email"]);
    expect(json.elite.board?.files.map((f) => f.label)).toEqual(["Plan.pdf"]);
    expect(text).not.toContain('"user_id"');
  });

  it("the admin copy also includes the notes staff keep for themselves, still without staff ids", () => {
    const admin = buildExportJson(raw(), [], "admin");
    const t = JSON.stringify(admin);
    expect(admin.about.copy).toMatch(/admin copy/);
    expect(admin.elite.board?.items.map((i) => i.title)).toEqual(["Set up email", "Private coach note"]);
    expect(admin.elite.board?.comments).toHaveLength(2);
    expect(admin.elite.board?.files).toHaveLength(2);
    expect(admin.enrollment.access[0]).toMatchObject({ manual_override_reason: "staff only note" });
    expect(admin.elite.applications[0]).toMatchObject({ decision_note: "internal only" });
    expect(t).not.toContain(STAFF);
    expect(json.about.copy).toBe("member copy");
    expect(exportReadme(AT, [], "admin")).toContain("admin copy");
    // Stamped with who exported it (Slice D).
    expect(buildExportJson(raw(), [], "admin", "Genasys").about).toMatchObject({ exported_by: "Genasys" });
    expect(exportReadme(AT, [], "admin", "Genasys")).toContain("exported by Genasys on November 4, 2026");
    expect(json.about).not.toHaveProperty("exported_by");
  });

  it("has no Elite board for members without one", () => {
    expect(buildExportJson(raw({ eliteBoard: null })).elite.board).toBeNull();
  });
});

describe("data export ZIP", () => {
  it("contains my-data.json, README.txt and every file, with no duplicate names", () => {
    const pdf = new TextEncoder().encode("%PDF-1.4 test");
    const zip = buildExportZip({ hello: "world" }, AT, [
      { path: "worksheets/BOSS_Module1_Lesson1_Worksheet.pdf", bytes: pdf },
      { path: "audit-report.pdf", bytes: pdf },
      { path: "uploads/feedback/f.pdf", bytes: pdf },
      { path: "uploads/feedback/f.pdf", bytes: pdf },
    ]);
    const files = unzipSync(zip);
    expect(Object.keys(files).sort()).toEqual(["README.txt", "audit-report.pdf", "my-data.json", "uploads/feedback/f-2.pdf", "uploads/feedback/f.pdf", "worksheets/BOSS_Module1_Lesson1_Worksheet.pdf"]);
    expect(JSON.parse(strFromU8(files["my-data.json"]!))).toEqual({ hello: "world" });
    expect(strFromU8(files["README.txt"]!)).toContain("November 4, 2026");
  });

  it("names the download and cleans upload names", () => {
    expect(exportFilename(AT)).toBe("BOSS_my-data_2026-11-04.zip");
    expect(safeName("folder/../My Plan (v2).pdf", "file")).toBe("My Plan _v2_.pdf");
    expect(safeName("...", "file")).toBe("file");
  });

  it("the README describes only what is in the ZIP, in plain English", () => {
    const bare = exportReadme(AT);
    expect(bare).not.toContain("audit-report.pdf");
    expect(bare).not.toContain("uploads folder");
    const full = exportReadme(AT, ["worksheets/a.pdf", "audit-report.pdf", "uploads/feedback/f.pdf"]);
    expect(full).toContain("worksheets folder");
    expect(full).toContain("audit-report.pdf");
    expect(full).toContain("uploads folder");
    expect(full).not.toMatch(/[–—]/);
  });
});
