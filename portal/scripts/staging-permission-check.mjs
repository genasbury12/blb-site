#!/usr/bin/env node
/**
 * Signed in permission check against the STAGING Supabase project, using real sign ins for all six
 * test accounts created by provision-test-accounts.mjs. Never run against production.
 *
 *   APP_ENV=staging NEXT_PUBLIC_SUPABASE_URL=... NEXT_PUBLIC_SUPABASE_ANON_KEY=... SUPABASE_SERVICE_ROLE_KEY=... \
 *     node scripts/staging-permission-check.mjs --creds /private/path/creds.txt
 *
 * The creds file is the --out file written by provision-test-accounts.mjs. Passwords are never printed.
 * Fixtures it adds are labeled "STAGING TEST" and are reused on later runs. Rows a check writes as a member
 * are removed at the end unless they are part of the walkthrough fixtures.
 * Exit code 1 when any check fails.
 */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const args = process.argv.slice(2);
const credsPath = args[args.indexOf("--creds") + 1];
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (process.env.APP_ENV === "production") throw new Error("Refusing to run against production.");
if (!url || !anon || !service || !args.includes("--creds")) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY and pass --creds FILE.");
  process.exit(1);
}

const creds = {};
for (const line of readFileSync(credsPath, "utf8").split("\n")) {
  const m = line.match(/^\s{2}(admin|coach|blueprint|accelerator|elite|noaccess)\s+(\S+@\S+)\s+(\S+)\s*$/);
  if (m) creds[m[1]] = { email: m[2], password: m[3] };
}
const ROLES = ["admin", "coach", "blueprint", "accelerator", "elite", "noaccess"];
for (const r of ROLES) if (!creds[r]) throw new Error(`creds file has no ${r} account`);

const opts = { auth: { persistSession: false, autoRefreshToken: false } };
const svc = createClient(url, service, opts);
const as = {};
const id = {};
for (const r of ROLES) {
  const c = createClient(url, anon, opts);
  const { data, error } = await c.auth.signInWithPassword(creds[r]);
  if (error) throw new Error(`sign in failed for ${r}: ${error.message}`);
  as[r] = c;
  id[r] = data.user.id;
}
const anonClient = createClient(url, anon, opts);

let failed = 0;
let passed = 0;
function check(name, ok, detail = "") {
  if (ok) passed += 1;
  else failed += 1;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${!ok && detail ? `  (${detail})` : ""}`);
}
const rows = async (q) => {
  const { data, error } = await q;
  return error ? { error: error.message, data: [] } : { data: data ?? [] };
};
const denied = async (q) => {
  const { data, error } = await q;
  return Boolean(error) || (Array.isArray(data) && data.length === 0);
};

// ---------- Fixtures (service role, labeled) ----------
async function ensure(table, match, values) {
  const found = await svc.from(table).select("id").match(match).limit(1).maybeSingle();
  if (found.error) throw new Error(`${table}: ${found.error.message}`);
  if (found.data) return found.data.id;
  const ins = await svc.from(table).insert({ ...match, ...values }).select("id").single();
  if (ins.error) throw new Error(`${table}: ${ins.error.message}`);
  return ins.data.id;
}
const day = 86400000;
const now = Date.now();
// Realistic times for walkthroughs: group coaching Wednesdays 1 PM Eastern, private call Thursdays 11 AM Eastern.
function nextWeekday(weekday, hourUtc, offsetWeeks = 0) {
  const d = new Date(now);
  d.setUTCHours(hourUtc, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + ((weekday - d.getUTCDay() + 7) % 7 || 7) + 7 * offsetWeeks);
  return d;
}
const eastern1pm = 18; // 18:00 UTC is 1 PM Eastern Standard Time (November to March); staging fixtures only
const groupNext = nextWeekday(3, eastern1pm);
const groupPast = nextWeekday(3, eastern1pm, -1);
const privateNext = nextWeekday(4, eastern1pm - 2);
const hour = 3600000;
async function ensureTimed(table, match, values, start) {
  const rowId = await ensure(table, match, { ...values, starts_at: start.toISOString(), ends_at: new Date(+start + hour).toISOString() });
  await svc.from(table).update({ starts_at: start.toISOString(), ends_at: new Date(+start + hour).toISOString() }).eq("id", rowId);
  return rowId;
}
const upcoming = await ensureTimed("coaching_sessions", { title: "STAGING TEST: Weekly group coaching" }, {
  kind: "group", meeting_url_private: "https://example.invalid/staging-test-meeting", published: true,
}, groupNext);
await ensureTimed("coaching_sessions", { title: "STAGING TEST: Past group coaching with replay" }, {
  kind: "group", recording_url_private: "https://example.invalid/staging-test-replay", published: true,
}, groupPast);
await ensure("workshops", { slug: "staging-test-workshop" }, {
  title: "SAMPLE: Staging test workshop", release_at: new Date(now - day).toISOString(), status: "published", is_sample: true,
});
const board = (await svc.from("elite_boards").select("id, coach_id").eq("client_id", id.elite).single()).data;
await ensure("elite_items", { board_id: board.id, title: "STAGING TEST: Private coach note" }, { kind: "coach_note", body: "Coach only. Clients must never see this.", created_by: id.coach });
await ensure("elite_items", { board_id: board.id, title: "STAGING TEST: Month 1 roadmap focus" }, { kind: "roadmap", month_number: 1, created_by: id.coach });
await ensureTimed("elite_sessions", { board_id: board.id, meeting_url_private: "https://example.invalid/staging-test-private-call" }, {}, privateNext);

// ---------- Entitlements (my_features) ----------
const expectFeatures = {
  admin: [], coach: [], noaccess: [],
  blueprint: ["curriculum.read", "audit.use", "library.read", "roadmap.use"],
  accelerator: ["curriculum.read", "audit.use", "library.read", "roadmap.use", "group_coaching.access", "community.access", "feedback.submit", "workshops.access", "hotseat.apply"],
  elite: ["curriculum.read", "audit.use", "library.read", "roadmap.use", "group_coaching.access", "community.access", "feedback.submit", "workshops.access", "hotseat.apply", "elite_coaching.access", "elite_board.access", "elite_dfu_hours.use"],
};
for (const r of ROLES) {
  const { data, error } = await as[r].rpc("my_features", { p_at: new Date().toISOString() });
  const got = (data ?? []).map((f) => (typeof f === "string" ? f : f.feature_key ?? f.my_features ?? Object.values(f)[0])).sort();
  check(`${r}: features are exactly the purchased set`, !error && JSON.stringify(got) === JSON.stringify([...expectFeatures[r]].sort()), error?.message ?? got.join(","));
}
for (const [r, months] of [["blueprint", 12], ["accelerator", 6], ["elite", 6]]) {
  const key = r === "blueprint" ? "curriculum.read" : "group_coaching.access";
  const { data } = await as[r].from("entitlements").select("starts_at, ends_at").eq("feature_key", key).single();
  const s = new Date(data.starts_at);
  const expected = new Date(s);
  expected.setUTCMonth(expected.getUTCMonth() + months);
  check(`${r}: ${key} lasts ${months} months`, Math.abs(new Date(data.ends_at) - expected) < 2 * day, `${data.starts_at} to ${data.ends_at}`);
}
{
  const { data } = await as.elite.from("entitlements").select("feature_key, ends_at").in("feature_key", ["elite_board.access", "elite_dfu_hours.use"]);
  const b = new Date(data.find((d) => d.feature_key === "elite_board.access").ends_at);
  const h = new Date(data.find((d) => d.feature_key === "elite_dfu_hours.use").ends_at);
  check("elite: DFY hours last 30 days past the coaching period", Math.round((h - b) / day) === 30, `${Math.round((h - b) / day)} days`);
}
for (const r of ROLES) {
  const { data } = await rows(as[r].from("entitlements").select("user_id"));
  const others = data.filter((e) => e.user_id !== id[r]).length;
  check(`${r}: ${r === "admin" ? "can" : "cannot"} read other members' entitlements`, r === "admin" ? others > 0 : others === 0);
}
check("members cannot grant themselves access", await denied(as.blueprint.rpc("admin_grant_entitlement", { p_user: id.blueprint, p_feature: "elite_board.access", p_starts_at: new Date().toISOString(), p_ends_at: null, p_reason: "self grant attempt" })));
check("members cannot insert entitlements directly", await denied(as.noaccess.from("entitlements").insert({ user_id: id.noaccess, feature_key: "curriculum.read", source_type: "manual", starts_at: new Date().toISOString() }).select()));
check("members cannot call the billing processor", await denied(as.noaccess.rpc("billing_apply_checkout", { p: { session_id: "cs_test_attack", user_id: id.noaccess, sku: "elite", plan: "pay_in_full", payment_status: "paid" } })));
check("members cannot give themselves a role", await denied(as.blueprint.from("user_roles").insert({ user_id: id.blueprint, role: "admin" }).select()));
check("coach cannot make themselves admin", await denied(as.coach.from("user_roles").insert({ user_id: id.coach, role: "admin" }).select()));

// ---------- Billing records ----------
for (const r of ROLES) {
  const { data } = await rows(as[r].from("orders").select("user_id, sku, status"));
  const own = data.filter((o) => o.user_id === id[r]);
  const others = data.length - own.length;
  const wantOwn = ["blueprint", "accelerator", "elite"].includes(r) ? 1 : 0;
  check(`${r}: sees ${wantOwn} own order and ${r === "admin" ? "all" : "no"} other orders`, own.length === wantOwn && (r === "admin" ? others >= 3 : others === 0), `${own.length} own, ${others} others`);
}
{
  const { data } = await as.elite.rpc("my_billing_notice");
  check("elite: paid in full shows no billing warning", data === null || (Array.isArray(data) && data.length === 0) || data?.kind == null, JSON.stringify(data));
}

// ---------- Profiles and roles ----------
for (const r of ROLES) {
  const { data } = await rows(as[r].from("profiles").select("user_id"));
  const ids = data.map((p) => p.user_id);
  const expectedVisible = r === "admin" ? ROLES.length : r === "coach" ? 2 : 1; // coach: self + assigned Elite client
  check(`${r}: sees ${expectedVisible === ROLES.length ? "all" : expectedVisible} profile(s)`, r === "admin" ? ids.length >= ROLES.length : ids.length === expectedVisible, `${ids.length}`);
}

// ---------- Audit privacy ----------
const createdDrafts = [];
const { data: version } = await svc.from("audit_versions").select("id").eq("status", "published").limit(1).single();
for (const r of ["blueprint", "accelerator", "elite"]) {
  const existing = await as[r].from("audit_drafts").select("id").limit(1);
  if (!existing.data?.length) {
    const ins = await as[r].from("audit_drafts").insert({ user_id: id[r], version_id: version.id, answers_json: {}, current_question: 1 }).select("id");
    check(`${r}: can start an audit draft`, !ins.error && ins.data?.length === 1, ins.error?.message);
    if (ins.data?.[0]) createdDrafts.push(ins.data[0].id);
  } else check(`${r}: has an audit draft`, true);
}
check("noaccess: cannot start an audit", await denied(as.noaccess.from("audit_drafts").insert({ user_id: id.noaccess, version_id: version.id, answers_json: {} }).select()));
for (const r of ROLES) {
  const d = await rows(as[r].from("audit_drafts").select("user_id"));
  const a = await rows(as[r].from("audit_runs").select("user_id"));
  const otherDrafts = d.data.filter((x) => x.user_id !== id[r]).length;
  const otherRuns = a.data.filter((x) => x.user_id !== id[r] && !(r === "coach" && x.user_id === id.elite)).length;
  check(`${r}: cannot read other members' audit drafts`, otherDrafts === 0, `${otherDrafts}`);
  if (r !== "admin") check(`${r}: cannot read other members' audit results`, otherRuns === 0, `${otherRuns}`);
}
check("members cannot write audit results directly", await denied(as.blueprint.from("audit_runs").insert({ user_id: id.blueprint, version_id: version.id, scoring_version: "x", answers_snapshot_json: {}, category_scores_json: {}, overall_score: 100, assigned_path: "optimize", recommendation_snapshot_json: {} }).select()));
check("members cannot call the audit scorer directly", await denied(as.blueprint.rpc("record_audit_submission", { p_run: {}, p_roadmap: [], p_draft_id: null })));
// Other members' drafts were present while the checks above ran; remove the ones this script created.
if (createdDrafts.length) await svc.from("audit_drafts").delete().in("id", createdDrafts);
{
  const { data } = await as.coach.from("audit_runs").select("user_id");
  check("coach: sees audit results only for assigned clients", (data ?? []).every((x) => x.user_id === id.elite));
}

// ---------- Coaching and workshops ----------
for (const r of ROLES) {
  const s = await rows(as[r].from("coaching_sessions").select("id, meeting_url_private, recording_url_private").like("title", "STAGING TEST%"));
  const w = await rows(as[r].from("workshops").select("id").eq("slug", "staging-test-workshop"));
  const want = ["accelerator", "elite", "admin", "coach"].includes(r);
  check(`${r}: ${want ? "sees" : "does not see"} coaching sessions, links and replays`, want ? s.data.length === 2 && s.data.some((x) => x.recording_url_private) : s.data.length === 0, `${s.data.length}`);
  check(`${r}: ${want ? "sees" : "does not see"} workshops`, want ? w.data.length === 1 : w.data.length === 0, `${w.data.length}`);
}
check("anonymous visitors see no coaching sessions", (await rows(anonClient.from("coaching_sessions").select("id"))).data.length === 0);
{
  const q = await as.accelerator.from("coaching_questions").insert({ session_id: upcoming, user_id: id.accelerator, body: "STAGING TEST question" }).select("id");
  check("accelerator: can send an advance coaching question", !q.error && q.data?.length === 1, q.error?.message);
  if (q.data?.[0]) await svc.from("coaching_questions").delete().eq("id", q.data[0].id);
  check("blueprint: cannot send coaching questions", await denied(as.blueprint.from("coaching_questions").insert({ session_id: upcoming, user_id: id.blueprint, body: "Can I join?" }).select()));
  check("members cannot create coaching sessions", await denied(as.elite.from("coaching_sessions").insert({ kind: "group", title: "Fake", starts_at: new Date().toISOString(), ends_at: new Date(now + 3600000).toISOString(), published: true }).select()));
  check("blueprint: cannot apply for Hot Seat", await denied(as.blueprint.from("hotseat_applications").insert({ user_id: id.blueprint, target_month: "2099-01-01", topic: "Pricing", details: "Details about my pricing", recording_consent: true, consent_text_version: "v1" }).select()));
}

// ---------- Community ----------
{
  const p = await as.accelerator.from("community_posts").insert({ user_id: id.accelerator, title: "STAGING TEST post", body: "Checking community permissions." }).select("id").single();
  check("accelerator: can post in the community", !p.error, p.error?.message);
  for (const r of ROLES) {
    const seen = (await rows(as[r].from("community_posts").select("id").eq("id", p.data?.id ?? "00000000-0000-0000-0000-000000000000"))).data.length;
    const want = ["accelerator", "elite", "admin", "coach"].includes(r);
    check(`${r}: ${want ? "sees" : "does not see"} community posts`, want ? seen === 1 : seen === 0);
  }
  check("blueprint: cannot post in the community", await denied(as.blueprint.from("community_posts").insert({ user_id: id.blueprint, title: "Hello", body: "Can I post?" }).select()));
  check("members cannot pin posts", await denied(as.elite.from("community_posts").insert({ user_id: id.elite, title: "Pin", body: "Pinned", pinned: true }).select()));
  check("members cannot edit someone else's post", await denied(as.elite.from("community_posts").update({ body: "edited" }).eq("id", p.data?.id).select()));
  if (p.data) await svc.from("community_posts").delete().eq("id", p.data.id);
}

// ---------- Feedback ----------
{
  const { data: cycle, error } = await as.accelerator.rpc("my_feedback_cycle");
  const c = Array.isArray(cycle) ? cycle[0] : cycle;
  check("accelerator: has a current feedback cycle", !error && Boolean(c?.cycle_start) && typeof c?.used === "number", error?.message ?? JSON.stringify(cycle));
  const b = await as.blueprint.rpc("my_feedback_cycle");
  const bc = Array.isArray(b.data) ? b.data[0] : b.data;
  check("blueprint: has no feedback cycle", Boolean(b.error) || !bc?.cycle_start, JSON.stringify(b.data));
  check("blueprint: cannot submit feedback", await denied(as.blueprint.from("feedback_submissions").insert({ user_id: id.blueprint, cycle_start: new Date().toISOString(), deliverable_title: "Page", description: "Please review", response_due_at: new Date().toISOString() }).select()));
  check("noaccess: cannot submit feedback", await denied(as.noaccess.from("feedback_submissions").insert({ user_id: id.noaccess, cycle_start: new Date().toISOString(), deliverable_title: "Page", description: "Please review", response_due_at: new Date().toISOString() }).select()));
}

// ---------- Elite privacy ----------
{
  for (const r of ROLES) {
    const b = (await rows(as[r].from("elite_boards").select("id"))).data.length;
    const want = ["elite", "admin", "coach"].includes(r);
    check(`${r}: ${want ? "sees" : "cannot see"} the Elite board`, want ? b === 1 : b === 0, `${b}`);
    const items = (await rows(as[r].from("elite_items").select("kind").eq("board_id", board.id))).data;
    const sessions = (await rows(as[r].from("elite_sessions").select("id").eq("board_id", board.id))).data.length;
    if (r === "elite") {
      check("elite: sees own roadmap", items.some((i) => i.kind === "roadmap"));
      check("elite: never sees private coach notes", !items.some((i) => i.kind === "coach_note"));
      check("elite: sees own private call", sessions >= 1);
    } else if (r === "coach" || r === "admin") {
      check(`${r}: sees board items including coach notes`, items.some((i) => i.kind === "coach_note"));
    } else {
      check(`${r}: cannot read any Elite items or private calls`, items.length === 0 && sessions === 0, `${items.length} items, ${sessions} sessions`);
    }
  }
  check("elite: board coach is the assigned coach", board.coach_id === id.coach);
  const t = await as.elite.from("elite_items").insert({ board_id: board.id, kind: "task", title: "STAGING TEST client task", created_by: id.elite }).select("id").single();
  check("elite: can add a task to own board", !t.error, t.error?.message);
  if (t.data) await svc.from("elite_items").delete().eq("id", t.data.id);
  check("elite: cannot write a coach note", await denied(as.elite.from("elite_items").insert({ board_id: board.id, kind: "coach_note", title: "x", created_by: id.elite }).select()));
  check("accelerator: cannot add items to someone else's board", await denied(as.accelerator.from("elite_items").insert({ board_id: board.id, kind: "request", status: "submitted", title: "Sneaky", created_by: id.accelerator }).select()));
  const { data: bucket } = await svc.from("elite_hour_buckets").select("id, minutes_granted").eq("board_id", board.id).eq("kind", "included").maybeSingle();
  check("elite: 12 included DFY hours", bucket?.minutes_granted === 720, `${bucket?.minutes_granted} minutes`);
  check("elite: cannot log DFY time", await denied(as.elite.from("elite_time_entries").insert({ board_id: board.id, bucket_id: bucket?.id, minutes: 5, work_date: new Date().toISOString().slice(0, 10), note: "Client entry", coach_id: id.elite }).select()));
  check("elite: cannot grant extra hours", await denied(as.elite.from("elite_hour_buckets").insert({ board_id: board.id, kind: "package", minutes_granted: 600, expires_at: new Date(now + 90 * day).toISOString(), note: "free hours" }).select()));
  const hs = await as.elite.rpc("elite_hours_summary", { p_board: board.id });
  check("elite: can read own hours summary", !hs.error, hs.error?.message);
  const hsOther = await as.accelerator.rpc("elite_hours_summary", { p_board: board.id });
  check("elite: hours summary shows the 12 hour included bucket", (hs.data ?? []).some((x) => x.kind === "included" && x.minutes_granted === 720), JSON.stringify(hs.data));
  check("accelerator: cannot read another client's hours summary", Boolean(hsOther.error) || (Array.isArray(hsOther.data) && hsOther.data.length === 0), JSON.stringify(hsOther.data));
}

// ---------- Admin powers ----------
{
  const log = await rows(as.admin.from("admin_audit_log").select("id").limit(1));
  check("admin: can read the audit log", !log.error);
  for (const r of ["coach", "blueprint", "elite", "noaccess"]) {
    const l = await rows(as[r].from("admin_audit_log").select("id").limit(1));
    check(`${r}: cannot read the audit log`, l.data.length === 0);
  }
  const cap = await as.admin.rpc("elite_capacity");
  check("admin: Elite capacity check works", !cap.error, cap.error?.message);
}

await svc.from("app_config").select("key").limit(1); // keep-alive no-op
console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
