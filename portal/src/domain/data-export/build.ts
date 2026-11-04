import { zipSync, strToU8 } from "fflate";

/**
 * 10_DATA_RIGHTS Slice A: "Download all my data". Pure functions that turn one member's rows into my-data.json, the
 * README and the ZIP, so the shape is tested without a database.
 *
 * What goes in: everything the member wrote or can see about themselves in the portal. Notes staff keep for
 * themselves (private Elite coach notes with their comments and files, admin reasons for manual access changes,
 * Elite application decision notes) go only into the admin copy (owner decision 2026-11-04), never the member's own
 * download. Staff account ids are never exported. The member's coach appears by name only.
 */

export const EXPORT_FORMAT_VERSION = 1;

type Row = Record<string, unknown>;

export type ExportRaw = {
  generatedAt: string;
  email: string | null;
  profile: Row | null;
  coachName: string | null;
  orders: Row[];
  payments: Row[];
  subscriptions: Row[];
  entitlements: Row[];
  modules: { id: string; number: number; title: string }[];
  lessons: { id: string; module_id: string; order_index: number; title: string }[];
  milestones: { id: string; module_id: string; title: string }[];
  lessonProgress: { lesson_id: string; completed_at: string }[];
  milestoneProgress: Row[];
  auditRuns: Row[];
  auditDrafts: Row[];
  roadmapItems: Row[];
  pathChoices: Row[];
  worksheets: { slug: string; version: number; title: string }[];
  worksheetResponses: Row[];
  coachingQuestions: Row[];
  hotSeatApplications: Row[];
  feedback: Row[];
  communityPosts: Row[];
  communityComments: Row[];
  communityReports: Row[];
  eliteApplications: Row[];
  eliteBoard: Row | null;
  eliteItems: Row[];
  eliteItemComments: Row[];
  eliteSessions: Row[];
  eliteCheckins: Row[];
  eliteHourBuckets: Row[];
  eliteTimeEntries: Row[];
  eliteFiles: Row[];
};

/** Files that go next to my-data.json: generated PDFs and the member's own uploads. */
export type ExportFile = { path: string; bytes: Uint8Array };

const pick = (row: Row, keys: string[]) => Object.fromEntries(keys.filter((k) => k in row).map((k) => [k, row[k] ?? null]));
const omit = (row: Row, keys: string[]) => Object.fromEntries(Object.entries(row).filter(([k]) => !keys.includes(k)));

/** Fields that identify staff accounts. Never exported. */
const STAFF_IDS = ["created_by", "decided_by", "responder_id", "resolved_by", "coach_id", "actor_id", "uploaded_by"];
/** Notes only staff see: in the admin copy only. */
const STAFF_NOTES = ["manual_override_reason", "decision_note"];

export type ExportAudience = "member" | "admin";

export function buildExportJson(raw: ExportRaw, files: { path: string; source: string }[] = [], audience: ExportAudience = "member") {
  const forAdmin = audience === "admin";
  const moduleOf = new Map(raw.modules.map((m) => [m.id, m]));
  const lessonOf = new Map(raw.lessons.map((l) => [l.id, l]));
  const milestoneOf = new Map(raw.milestones.map((m) => [m.id, m]));
  const worksheetTitle = new Map(raw.worksheets.map((w) => [`${w.slug}@${w.version}`, w.title]));
  const privateItems = forAdmin ? new Set<string>() : new Set(raw.eliteItems.filter((i) => i.kind === "coach_note").map((i) => i.id as string));
  const hidden = forAdmin ? STAFF_IDS : [...STAFF_IDS, "manual_override_reason"];
  const clean = (rows: Row[], extra: string[] = []) => rows.map((r) => omit(r, [...hidden, ...extra]));

  return {
    about: {
      what: "Everything The BOSS Business System portal stores about you, as of the time below.",
      generated_at: raw.generatedAt,
      format_version: EXPORT_FORMAT_VERSION,
      copy: forAdmin ? "admin copy: includes notes staff keep for themselves" : "member copy",
      files: files.map((f) => ({ path: f.path, what: f.source })),
    },
    profile: { email: raw.email, ...(raw.profile ? omit(raw.profile, ["user_id"]) : {}) },
    coach: raw.coachName ? { name: raw.coachName } : null,
    enrollment: {
      orders: clean(raw.orders, ["user_id"]),
      payments: clean(raw.payments),
      subscriptions: clean(raw.subscriptions, ["user_id"]),
      access: clean(raw.entitlements, ["user_id", "source_id"]),
    },
    audit: {
      submissions: clean(raw.auditRuns, ["user_id"]),
      drafts: clean(raw.auditDrafts, ["user_id"]),
      roadmap: clean(raw.roadmapItems, ["user_id"]),
      path_choices: clean(raw.pathChoices, ["user_id"]),
    },
    learning: {
      lessons_completed: raw.lessonProgress.map((p) => {
        const l = lessonOf.get(p.lesson_id);
        return { module: l ? (moduleOf.get(l.module_id)?.number ?? null) : null, lesson: l?.order_index ?? null, title: l?.title ?? null, completed_at: p.completed_at };
      }),
      milestones: raw.milestoneProgress.map((p) => {
        const m = milestoneOf.get(p.milestone_id as string);
        return {
          module: m ? (moduleOf.get(m.module_id)?.number ?? null) : null,
          title: m?.title ?? null,
          ...pick(p, ["state", "completed_at", "note", "updated_at"]),
          evidence_file: p.evidence_storage_key ? (files.find((f) => f.source === `milestone evidence ${p.milestone_id}`)?.path ?? "not available") : null,
        };
      }),
    },
    worksheets: raw.worksheetResponses.map((r) => ({
      worksheet: r.worksheet_slug,
      title: worksheetTitle.get(`${r.worksheet_slug}@${r.worksheet_version}`) ?? null,
      schema_version: r.worksheet_version,
      ...pick(r, ["status", "answers", "completed_at", "created_at", "updated_at"]),
    })),
    coaching: {
      questions: clean(raw.coachingQuestions, ["user_id"]),
      hot_seat_applications: clean(raw.hotSeatApplications, ["user_id"]),
    },
    feedback: clean(raw.feedback, ["user_id", "file_key"]),
    community: {
      posts: clean(raw.communityPosts, ["user_id"]),
      comments: clean(raw.communityComments, ["user_id"]),
      reports: clean(raw.communityReports, ["reporter_id"]),
    },
    elite: {
      applications: clean(raw.eliteApplications, forAdmin ? ["user_id"] : ["user_id", "decision_note"]),
      board: raw.eliteBoard
        ? {
            claude_board_url: raw.eliteBoard.claude_board_url ?? null,
            created_at: raw.eliteBoard.created_at ?? null,
            items: clean(raw.eliteItems.filter((i) => !privateItems.has(i.id as string)), ["board_id"]),
            comments: clean(raw.eliteItemComments.filter((c) => !privateItems.has(c.item_id as string)), ["user_id"]),
            private_sessions: clean(raw.eliteSessions, ["board_id"]),
            weekly_checkins: clean(raw.eliteCheckins, ["board_id"]),
            hours: { allowances: clean(raw.eliteHourBuckets, ["board_id"]), time_used: clean(raw.eliteTimeEntries, ["board_id"]) },
            files: clean(raw.eliteFiles.filter((f) => !privateItems.has(f.item_id as string)), ["board_id", "storage_key"]),
          }
        : null,
    },
  };
}

export function exportReadme(generatedAt: string, paths: string[] = [], audience: ExportAudience = "member") {
  const day = new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "America/New_York" }).format(new Date(generatedAt));
  const has = (prefix: string) => paths.some((p) => p.startsWith(prefix));
  const extras = [
    has("worksheets/") ? "The worksheets folder has a PDF of each worksheet you completed." : null,
    has("audit-report.pdf") ? "audit-report.pdf is your latest business audit report." : null,
    has("uploads/") ? "The uploads folder has the files you added yourself." : null,
  ].filter(Boolean);
  return [
    `Your data from The BOSS Business System, downloaded on ${day}.`,
    "",
    "my-data.json holds everything the portal stores about you: your profile, enrollment and payments, access dates, your business audit answers and results, your progress and milestones, every worksheet answer, and anything you posted or submitted for coaching, feedback, the community or Elite. It is a plain text file that any text editor can open.",
    ...(extras.length ? [extras.join(" ")] : []),
    audience === "admin"
      ? "This is the admin copy. It also includes notes staff keep for themselves, which the member's own download leaves out."
      : "Private notes your coaches keep for themselves are not included.",
    "",
  ].join("\n");
}

export function exportFilename(generatedAt: string) {
  return `BOSS_my-data_${generatedAt.slice(0, 10)}.zip`;
}

/** Zip my-data.json, README.txt and the files. Paths are made unique; nothing is written to disk. */
export function buildExportZip(json: unknown, generatedAt: string, files: ExportFile[], audience: ExportAudience = "member"): Uint8Array {
  const entries: Record<string, Uint8Array> = {
    "my-data.json": strToU8(JSON.stringify(json, null, 2)),
    "README.txt": strToU8(exportReadme(generatedAt, files.map((f) => f.path), audience)),
  };
  for (const f of files) entries[uniquePath(entries, f.path)] = f.bytes;
  // PDFs and images are already compressed: store them, deflate only text.
  return zipSync(
    Object.fromEntries(Object.entries(entries).map(([p, b]) => [p, [b, { level: /\.(json|txt|csv)$/i.test(p) ? 6 : 0 }]])),
    { mtime: new Date(generatedAt) },
  );
}

function uniquePath(taken: Record<string, unknown>, path: string) {
  if (!(path in taken)) return path;
  const dot = path.lastIndexOf(".");
  const [base, ext] = dot > path.lastIndexOf("/") ? [path.slice(0, dot), path.slice(dot)] : [path, ""];
  for (let n = 2; ; n++) if (!(`${base}-${n}${ext}` in taken)) return `${base}-${n}${ext}`;
}

/** A safe file name for an upload inside the ZIP (keeps the extension, drops folders and odd characters). */
export function safeName(name: string, fallback: string) {
  const last = name.split("/").pop() ?? "";
  const cleaned = last.replace(/[^A-Za-z0-9._ -]/g, "_").replace(/^\.+/, "").slice(-120);
  return cleaned || fallback;
}
