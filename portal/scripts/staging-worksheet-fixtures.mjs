#!/usr/bin/env node
// Test fixtures for the worksheet browser tests on STAGING (never production).
//
//   node scripts/staging-worksheet-fixtures.mjs setup   --suite journey|module1|export|deletion|retention --env-out /abs/path/outside/repo.sh
//   node scripts/staging-worksheet-fixtures.mjs cleanup --suite journey|module1|export|deletion|retention --env-out /abs/path/outside/repo.sh
//
// journey  (tests/e2e/worksheets.spec.ts): two published STAGING TEST worksheets on Module 2 sample lessons 1 and 2 (lessons without real worksheets),
//          a temporary Blueprint member, the shared test admin and a temporary coach assigned to the member.
// module1  (tests/e2e/worksheets-module1.spec.ts): publishes the seeded Module 1 worksheets (Lessons 1 to 9) and
//          milestones for the run (cleanup restores whatever status each had before), adds a temporary Blueprint
//          member and enables the shared test admin.
// export   (tests/e2e/data-export.spec.ts, 10_DATA_RIGHTS Slice A): a temporary Blueprint member with a completed and
//          an unfinished Module 1 worksheet, a temporary member whose access ended two days ago with a completed one,
//          and the shared test admin. Needs the seeded Module 1 worksheets (any status).
// deletion (tests/e2e/data-deletion.spec.ts, 10_DATA_RIGHTS Slice B): a temporary member with worksheet answers, a
//          path choice and an audit entry naming them; a temporary member whose deletion request is already past its
//          30 days; a temporary coach with a pending request (the staff path); the shared test admin; and a random
//          CRON_SECRET for the daily job. Cleanup deletes whatever the test did not.
// retention (tests/e2e/data-retention.spec.ts, 10_DATA_RIGHTS Slice C): temporary members whose access ended 12
//          months and a day ago (deleted by the job), 12 months less 20 days ago (30 day reminder), 12 months less 5 days
//          ago (7 day reminder), and one with access; the shared test admin; a random CRON_SECRET.
//
// The test admin is ONE reused account (staging-e2e-admin@example.invalid). The CSV export test writes it into the
// append only audit log, so it can never be deleted; instead each setup gives it a fresh random password and the
// admin role, and each cleanup removes the role, scrambles the password and blocks sign in. No new admin accounts
// pile up. Members and coaches are temporary and deleted.
//
// Needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY. Refuses unless the project allows sample content
// (never true in production). Logins go only to --env-out (mode 0600); nothing secret is printed.
import { randomBytes, randomUUID } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const [cmd] = process.argv.slice(2);
const arg = (name) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : undefined;
};
const suite = arg("suite");
const envOut = arg("env-out");
if (!["setup", "cleanup"].includes(cmd) || !["journey", "module1", "export", "deletion", "retention"].includes(suite) || !envOut) {
  console.error("usage: staging-worksheet-fixtures.mjs setup|cleanup --suite journey|module1|export|deletion|retention --env-out /abs/file.sh");
  process.exit(2);
}
const repo = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
if (!isAbsolute(envOut) || !relative(repo, envOut).startsWith("..")) throw new Error("--env-out must be an absolute path outside the repository.");
const STATE = `${envOut}.state.json`;

const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL_ || !KEY) throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
if (process.env.APP_ENV === "production") throw new Error("Refusing: APP_ENV is production.");
const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json", Prefer: "return=representation" };
async function api(method, path, body, okStatuses = []) {
  const r = await fetch(URL_ + path, { method, headers: H, body: body ? JSON.stringify(body) : undefined });
  const t = await r.text();
  if (!r.ok && !okStatuses.includes(r.status)) throw new Error(`${method} ${path.split("?")[0]} ${r.status} ${t.slice(0, 200)}`);
  return t ? JSON.parse(t) : null;
}
const cfg = await api("GET", "/rest/v1/app_config?key=eq.allow_sample_content&select=value");
if (cfg[0]?.value !== true) throw new Error("Refusing: this project does not allow sample content (staging and local only).");

const password = () => randomBytes(18).toString("base64url");
const hex = () => randomBytes(3).toString("hex");
const mod = (await api("GET", "/rest/v1/modules?number=eq.1&select=id,slug"))[0];
if (!mod) throw new Error("Module 1 not found.");
const readState = () => (existsSync(STATE) ? JSON.parse(readFileSync(STATE, "utf8")) : {});
const writeEnv = (vars) =>
  writeFileSync(envOut, `export ${Object.entries(vars).map(([k, v]) => `${k}='${v}'`).join(" ")}\n`, { mode: 0o600 });

// ---- people -----------------------------------------------------------------------------------------------------

async function findUser(email) {
  for (let page = 1; page <= 20; page++) {
    const { users } = await api("GET", `/auth/v1/admin/users?page=${page}&per_page=1000`);
    const hit = users.find((u) => u.email === email);
    if (hit || users.length < 1000) return { hit, users };
  }
  return { hit: undefined, users: [] };
}

async function newMember(displayName, plan = "pay_in_full") {
  const email = `staging-worksheet-${hex()}@example.invalid`, pw = password();
  const u = await api("POST", "/auth/v1/admin/users", { email, password: pw, email_confirm: true, user_metadata: { display_name: displayName } });
  await api("POST", "/rest/v1/rpc/billing_apply_checkout", {
    p: { session_id: `cs_test_fixture_${randomUUID()}`, user_id: u.id, email, sku: "blueprint", plan, payment_status: "paid", payment_intent_id: `pi_test_fixture_${randomUUID()}` },
  });
  return { id: u.id, email, password: pw };
}

async function deleteMember(id) {
  const orders = await api("GET", `/rest/v1/orders?user_id=eq.${id}&select=id`);
  for (const o of orders) await api("DELETE", `/rest/v1/order_payments?order_id=eq.${o.id}`);
  await api("DELETE", `/auth/v1/admin/users/${id}`, undefined, [404]);
  for (const o of orders) await api("DELETE", `/rest/v1/orders?id=eq.${o.id}`);
}

const ADMIN_EMAIL = "staging-e2e-admin@example.invalid";

/** The one reused test admin: found by its fixed email, or adopted from an older blocked staging-ws-admin-*. */
async function enableTestAdmin() {
  const { hit, users } = await findUser(ADMIN_EMAIL);
  let admin = hit;
  if (!admin) {
    const old = users.filter((u) => /^staging-ws-admin-[0-9a-f]{6}@example\.invalid$/.test(u.email ?? "")).sort((a, b) => a.created_at.localeCompare(b.created_at))[0];
    admin = old
      ? await api("PUT", `/auth/v1/admin/users/${old.id}`, { email: ADMIN_EMAIL, email_confirm: true })
      : await api("POST", "/auth/v1/admin/users", { email: ADMIN_EMAIL, password: password(), email_confirm: true });
  }
  const pw = password();
  await api("PUT", `/auth/v1/admin/users/${admin.id}`, { password: pw, ban_duration: "none", user_metadata: { display_name: "STAGING TEST admin" } });
  await api("POST", "/rest/v1/user_roles", { user_id: admin.id, role: "admin" }, [409]);
  return { id: admin.id, email: ADMIN_EMAIL, password: pw };
}

async function disableTestAdmin(id) {
  await api("DELETE", `/rest/v1/coach_assignments?coach_id=eq.${id}`);
  await api("DELETE", `/rest/v1/user_roles?user_id=eq.${id}`);
  await api("PUT", `/auth/v1/admin/users/${id}`, { password: password(), ban_duration: "876000h" });
}

async function newCoach(studentId) {
  const email = `staging-ws-coach-${hex()}@example.invalid`, pw = password();
  const u = await api("POST", "/auth/v1/admin/users", { email, password: pw, email_confirm: true, user_metadata: { display_name: "STAGING TEST coach" } });
  await api("POST", "/rest/v1/user_roles", { user_id: u.id, role: "coach" });
  await api("POST", "/rest/v1/coach_assignments", { coach_id: u.id, student_id: studentId });
  return { id: u.id, email, password: pw };
}

async function deleteCoach(id) {
  await api("DELETE", `/rest/v1/coach_assignments?coach_id=eq.${id}`);
  await api("DELETE", `/rest/v1/user_roles?user_id=eq.${id}`);
  const r = await fetch(`${URL_}/auth/v1/admin/users/${id}`, { method: "DELETE", headers: H });
  // A coach only reads in these tests, so this should never happen; if it does, block the login rather than leave it open.
  if (!r.ok && r.status !== 404) {
    await api("PUT", `/auth/v1/admin/users/${id}`, { password: password(), ban_duration: "876000h" });
    console.log("coach account could not be deleted; its role is removed and sign in is blocked");
  }
}

// ---- suites -----------------------------------------------------------------------------------------------------

const TEST_SLUGS = "staging-test-ws-*";
const M1_SLUG_LIST = [
  "m1-l1-starting-point",
  "m1-l2-business-direction",
  "m1-l3-customer-research",
  "m1-l4-problem-validation",
  "m1-l5-product-direction",
  "m1-l6-positioning",
  "m1-l7-messaging",
  "m1-l8-blog-to-buyer",
  "m1-l9-foundation-blueprint",
];
const M1_SLUGS = `(${M1_SLUG_LIST.join(",")})`;
const M1_LABELS = [
  "I answered Lesson 1: Starting Point",
  "I chose a provisional direction and wrote my hypothesis",
  "I built a buyer snapshot from real evidence",
  "I chose a priority problem and wrote my decision rule",
  "I chose a product concept and wrote a promise I can keep",
  "I wrote a positioning sentence and named who it's not for",
  "I wrote a headline in her words and cut the claims I can't back up",
  "I mapped one post to my offer and tested the path",
  "I finished my Business Foundation Blueprint",
];
const m1Milestones = `module_id=eq.${mod.id}&title=in.(${M1_LABELS.map((l) => `"${l}"`).join(",")})`;

async function setupJourney() {
  const l2 = JSON.parse(readFileSync(join(repo, "portal/src/domain/worksheets/fixtures/m1-l2-business-direction.json"), "utf8"));
  // Module 2's sample lessons 1 and 2: every Module 1 lesson now has its own seeded worksheet, and a lesson shows
  // only one published worksheet.
  const mod2 = (await api("GET", "/rest/v1/modules?number=eq.2&select=id,slug"))[0];
  if (!mod2) throw new Error("Module 2 not found.");
  const lessons = await api("GET", `/rest/v1/lessons?module_id=eq.${mod2.id}&slug=in.(sample-lesson-1,sample-lesson-2)&select=id,slug`);
  const lid = (s) => {
    const l = lessons.find((x) => x.slug === s);
    if (!l) throw new Error(`Module 2 ${s} not found.`);
    return l.id;
  };
  const callbackSchema = {
    slug: "staging-test-ws-l3",
    title: "STAGING TEST callback",
    intro: { title: "Callback check", lead: "Staging test only." },
    sections: [{ key: "recall", number: "1", title: "Your Lesson 2 hypothesis", callback: { worksheet: "staging-test-ws-l2", field: "hypothesis", label: "Lesson 2" }, fields: [{ key: "reflect", type: "textarea", label: "Has anything changed?", max_length: 500 }] }],
    completion: { required_fields: [] },
  };
  await api("POST", "/rest/v1/worksheets", [
    { slug: "staging-test-ws-l2", version: 1, lesson_id: lid("sample-lesson-1"), title: "STAGING TEST Lesson 2 worksheet", schema: { ...l2, slug: "staging-test-ws-l2" }, status: "published" },
    { slug: "staging-test-ws-l3", version: 1, lesson_id: lid("sample-lesson-2"), title: "STAGING TEST Lesson 3 worksheet", schema: callbackSchema, status: "published" },
  ]);
  const member = await newMember("STAGING TEST worksheet");
  const admin = await enableTestAdmin();
  const coach = await newCoach(member.id);
  writeFileSync(STATE, JSON.stringify({ memberId: member.id, adminId: admin.id, coachId: coach.id }), { mode: 0o600 });
  writeEnv({
    E2E_SUPABASE: 1,
    E2E_WS_EMAIL: member.email,
    E2E_WS_PASSWORD: member.password,
    E2E_WS_LESSON_PATH: `/app/training/${mod2.slug}/sample-lesson-1`,
    E2E_WS_CALLBACK_PATH: `/app/training/${mod2.slug}/sample-lesson-2`,
    E2E_WS_ADMIN_EMAIL: admin.email,
    E2E_WS_ADMIN_PASSWORD: admin.password,
    E2E_WS_COACH_EMAIL: coach.email,
    E2E_WS_COACH_PASSWORD: coach.password,
  });
  console.log("journey fixtures ready: 2 test worksheets, temporary member and coach, shared test admin enabled");
}

async function cleanupJourney() {
  const st = readState();
  if (st.memberId) await deleteMember(st.memberId);
  if (st.coachId) await deleteCoach(st.coachId);
  // Disable the shared admin even when the state file is gone (an interrupted run).
  const adminId = st.adminId ?? (await findUser(ADMIN_EMAIL)).hit?.id;
  if (adminId) await disableTestAdmin(adminId);
  await api("DELETE", `/rest/v1/worksheet_responses?worksheet_slug=like.${TEST_SLUGS}`);
  await api("DELETE", `/rest/v1/worksheets?slug=like.${TEST_SLUGS}`);
  console.log("journey cleanup done: test worksheets and temporary accounts removed, shared test admin disabled");
}

async function setupModule1() {
  const sheets = await api("GET", `/rest/v1/worksheets?slug=in.${M1_SLUGS}&version=eq.1&select=id,status`);
  if (sheets.length !== M1_SLUG_LIST.length) throw new Error("Run scripts/seed-worksheets.mjs first (the Module 1 worksheets are missing).");
  const milestones = await api("GET", `/rest/v1/milestones?${m1Milestones}&select=id,status`);
  // Remember each status so cleanup puts back exactly what was there (the owner may have published them).
  const before = { worksheets: sheets.map(({ id, status }) => ({ id, status })), milestones: milestones.map(({ id, status }) => ({ id, status })) };
  await api("PATCH", `/rest/v1/worksheets?slug=in.${M1_SLUGS}&version=eq.1`, { status: "published" });
  await api("PATCH", `/rest/v1/milestones?${m1Milestones}`, { status: "published" });
  const member = await newMember("STAGING TEST module one");
  writeFileSync(STATE, JSON.stringify({ memberId: member.id, before }), { mode: 0o600 });
  // The shared test admin checks the Lesson 3 count tiles and CSV.
  const admin = await enableTestAdmin();
  writeFileSync(STATE, JSON.stringify({ memberId: member.id, adminId: admin.id, before }), { mode: 0o600 });
  writeEnv({
    E2E_SUPABASE: 1,
    E2E_M1_EMAIL: member.email,
    E2E_M1_PASSWORD: member.password,
    E2E_M1_MODULE: mod.slug,
    E2E_M1_ADMIN_EMAIL: admin.email,
    E2E_M1_ADMIN_PASSWORD: admin.password,
  });
  console.log("module1 fixtures ready: Module 1 worksheets and milestones published for the run, temporary member added, shared test admin enabled");
}

async function cleanupModule1() {
  const st = readState();
  if (st.memberId) await deleteMember(st.memberId);
  const adminId = st.adminId ?? (await findUser(ADMIN_EMAIL)).hit?.id;
  if (adminId) await disableTestAdmin(adminId);
  if (!st.before) {
    console.log("module1 cleanup: no saved statuses, so worksheet and milestone statuses were left as they are");
  } else {
    for (const w of st.before.worksheets) await api("PATCH", `/rest/v1/worksheets?id=eq.${w.id}`, { status: w.status });
    for (const m of st.before.milestones) await api("PATCH", `/rest/v1/milestones?id=eq.${m.id}`, { status: m.status });
  }
  console.log("module1 cleanup done: worksheet and milestone statuses restored, temporary member removed, shared test admin disabled");
}

const L1_ANSWERS = { q1: "My blog posts and Pinterest.", q2: "A simple home system for busy parents.", q3: "Partly. I know who I want to help.", realization: "Start with the person and the problem." };

async function setupExport() {
  const m1 = await api("GET", "/rest/v1/worksheets?slug=in.(m1-l1-starting-point,m1-l2-business-direction)&version=eq.1&select=slug");
  if (m1.length !== 2) throw new Error("Run scripts/seed-worksheets.mjs first (the Module 1 worksheets are missing).");
  const now = Date.now();
  const iso = (ms) => new Date(ms).toISOString();
  const member = await newMember("STAGING TEST data export");
  const lapsed = await newMember("STAGING TEST lapsed member");
  await api("POST", "/rest/v1/worksheet_responses", [
    { user_id: member.id, worksheet_slug: "m1-l1-starting-point", worksheet_version: 1, answers: L1_ANSWERS, status: "complete", completed_at: iso(now - 3600e3) },
    { user_id: member.id, worksheet_slug: "m1-l2-business-direction", worksheet_version: 1, answers: { idea_A: "Meal planning for parents" }, status: "in_progress", completed_at: null },
    { user_id: lapsed.id, worksheet_slug: "m1-l1-starting-point", worksheet_version: 1, answers: L1_ANSWERS, status: "complete", completed_at: iso(now - 30 * 864e5) },
  ]);
  // Access ended two days ago (started 400 days ago).
  await api("PATCH", `/rest/v1/entitlements?user_id=eq.${lapsed.id}`, { starts_at: iso(now - 400 * 864e5), ends_at: iso(now - 2 * 864e5) });
  const admin = await enableTestAdmin();
  writeFileSync(STATE, JSON.stringify({ memberIds: [member.id, lapsed.id], adminId: admin.id }), { mode: 0o600 });
  writeEnv({
    E2E_SUPABASE: 1,
    E2E_DX_EMAIL: member.email,
    E2E_DX_PASSWORD: member.password,
    E2E_DX_MEMBER_ID: member.id,
    E2E_DX_LAPSED_EMAIL: lapsed.email,
    E2E_DX_LAPSED_PASSWORD: lapsed.password,
    E2E_DX_ADMIN_EMAIL: admin.email,
    E2E_DX_ADMIN_PASSWORD: admin.password,
    E2E_DX_LESSON_PATH: `/app/training/${mod.slug}/sample-lesson-1`,
  });
  console.log("export fixtures ready: temporary active and lapsed members with worksheet answers, shared test admin enabled");
}

async function cleanupExport() {
  const st = readState();
  for (const id of st.memberIds ?? []) await deleteMember(id);
  const adminId = st.adminId ?? (await findUser(ADMIN_EMAIL)).hit?.id;
  if (adminId) await disableTestAdmin(adminId);
  console.log("export cleanup done: temporary members deleted, shared test admin disabled");
}

async function setupDeletion() {
  const now = Date.now();
  const iso = (ms) => new Date(ms).toISOString();
  const member = await newMember("STAGING TEST deletion");
  const overdue = await newMember("STAGING TEST overdue deletion");
  // On a six payment plan with payments left: an overdue request must wait for an admin.
  const owing = await newMember("STAGING TEST owing deletion", "six_installments");
  await api("PATCH", `/rest/v1/orders?user_id=eq.${owing.id}`, { status: "installments_current", installments_paid: 1 });
  // A member with no request, for the admin "Record deletion request" action.
  const recordable = await newMember("STAGING TEST record deletion");
  const coachEmail = `staging-ws-coach-${hex()}@example.invalid`, coachPw = password();
  const coach = await api("POST", "/auth/v1/admin/users", { email: coachEmail, password: coachPw, email_confirm: true, user_metadata: { display_name: "STAGING TEST staff deletion" } });
  // Record the accounts first, so cleanup finds them even if a later step fails.
  writeFileSync(STATE, JSON.stringify({ memberIds: [member.id, overdue.id, coach.id, owing.id, recordable.id] }), { mode: 0o600 });
  await api("POST", "/rest/v1/user_roles", { user_id: coach.id, role: "coach" });
  await api("POST", "/rest/v1/worksheet_responses", { user_id: member.id, worksheet_slug: "m1-l1-starting-point", worksheet_version: 1, answers: L1_ANSWERS, status: "complete", completed_at: iso(now - 3600e3) });
  await api("POST", "/rest/v1/path_overrides", { user_id: member.id, chosen_path: "build_from_scratch", reason: "Test reason", actor_id: member.id });
  await api("POST", "/rest/v1/admin_audit_log", { actor_id: null, action: "test.mention", entity_type: "user", entity_id: member.id, changed_fields: { note: "STAGING TEST entry naming the member", email: member.email } });
  // A community thread: the member's post with the other member's reply, and the member's reply on the other's post.
  const [post] = await api("POST", "/rest/v1/community_posts", { user_id: member.id, title: "STAGING TEST post to remove", body: "STAGING TEST words that must disappear" });
  const [otherPost] = await api("POST", "/rest/v1/community_posts", { user_id: overdue.id, title: "STAGING TEST other post", body: "STAGING TEST other member post" });
  await api("POST", "/rest/v1/community_comments", { post_id: post.id, user_id: overdue.id, body: "STAGING TEST reply that must stay" });
  await api("POST", "/rest/v1/community_comments", { post_id: otherPost.id, user_id: member.id, body: "STAGING TEST reply words that must disappear" });
  writeFileSync(STATE, JSON.stringify({ memberIds: [member.id, overdue.id, coach.id, owing.id, recordable.id], postIds: [post.id, otherPost.id] }), { mode: 0o600 });
  // A real Stripe test mode customer for the member (test keys only).
  let stripeCustomer = "";
  const sk = process.env.STAGING_STRIPE_SECRET_KEY ?? process.env.STRIPE_SECRET_KEY ?? "";
  if (sk.startsWith("sk_test_")) {
    const r = await fetch("https://api.stripe.com/v1/customers", { method: "POST", headers: { Authorization: `Bearer ${sk}`, "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ email: member.email, name: "STAGING TEST deletion", description: "Staging data rights test; deleted by the test" }) });
    if (!r.ok) throw new Error(`Stripe test customer not created: ${r.status}`);
    stripeCustomer = (await r.json()).id;
    await api("POST", "/rest/v1/stripe_customers", { user_id: member.id, stripe_customer_id: stripeCustomer });
    writeFileSync(STATE, JSON.stringify({ memberIds: [member.id, overdue.id, coach.id, owing.id, recordable.id], postIds: [post.id, otherPost.id], stripeCustomer }), { mode: 0o600 });
  }
  await api("POST", "/rest/v1/deletion_requests", { user_id: overdue.id, requested_at: iso(now - 31 * 864e5), due_at: iso(now - 864e5) });
  await api("POST", "/rest/v1/deletion_requests", { user_id: coach.id });
  await api("POST", "/rest/v1/deletion_requests", { user_id: owing.id, requested_at: iso(now - 31 * 864e5), due_at: iso(now - 864e5) });
  const admin = await enableTestAdmin();
  const cronSecret = randomBytes(24).toString("hex");
  writeFileSync(STATE, JSON.stringify({ memberIds: [member.id, overdue.id, coach.id, owing.id, recordable.id], postIds: [post.id, otherPost.id], stripeCustomer, adminId: admin.id }), { mode: 0o600 });
  writeEnv({
    E2E_SUPABASE: 1,
    E2E_DEL_EMAIL: member.email,
    E2E_DEL_PASSWORD: member.password,
    E2E_DEL_OVERDUE_EMAIL: overdue.email,
    E2E_DEL_OVERDUE_PASSWORD: overdue.password,
    E2E_DEL_STAFF_EMAIL: coachEmail,
    E2E_DEL_STAFF_PASSWORD: coachPw,
    E2E_DEL_ADMIN_EMAIL: admin.email,
    E2E_DEL_ADMIN_PASSWORD: admin.password,
    CRON_SECRET: cronSecret,
    E2E_DEL_STRIPE_CUSTOMER: stripeCustomer,
    E2E_DEL_OWING_EMAIL: owing.email,
    E2E_DEL_OWING_ID: owing.id,
    E2E_DEL_RECORD_ID: recordable.id,
    E2E_DEL_POST_ID: post.id,
  });
  console.log("deletion fixtures ready: temporary member, overdue member, staff member with a request, shared test admin enabled");
}

/** Remove a test account the way the portal does (its path choice can only be removed inside a deletion run). */
async function eraseTestAccount(id) {
  const { hit } = await findUserById(id);
  if (!hit) return;
  let [req] = await api("GET", `/rest/v1/deletion_requests?user_id=eq.${id}&status=in.(pending,processing)&select=id`);
  if (!req) [req] = await api("POST", "/rest/v1/deletion_requests", { user_id: id });
  await api("POST", "/rest/v1/rpc/erase_member_prepare", { p_request: req.id, p_admin: null });
  await api("DELETE", `/rest/v1/user_roles?user_id=eq.${id}`);
  await api("DELETE", `/auth/v1/admin/users/${id}`, undefined, [404]);
  await api("POST", "/rest/v1/rpc/erase_member_finish", { p_request: req.id, p_admin: null });
}

async function findUserById(id) {
  const r = await fetch(`${URL_}/auth/v1/admin/users/${id}`, { headers: H });
  return { hit: r.ok ? await r.json() : undefined };
}

async function cleanupDeletion() {
  const st = readState();
  // Accounts the test already deleted are skipped; anonymized staff accounts are removed here (nothing names them).
  for (const id of st.memberIds ?? []) await eraseTestAccount(id);
  // Test posts outlive their authors by design; remove them (and their replies) from the staging feed.
  if (st.postIds?.length) await api("DELETE", `/rest/v1/community_posts?id=in.(${st.postIds.join(",")})`);
  const sk = process.env.STAGING_STRIPE_SECRET_KEY ?? process.env.STRIPE_SECRET_KEY ?? "";
  if (st.stripeCustomer && sk.startsWith("sk_test_")) await fetch(`https://api.stripe.com/v1/customers/${st.stripeCustomer}`, { method: "DELETE", headers: { Authorization: `Bearer ${sk}` } });
  const adminId = st.adminId ?? (await findUser(ADMIN_EMAIL)).hit?.id;
  if (adminId) await disableTestAdmin(adminId);
  console.log("deletion cleanup done: temporary accounts removed, shared test admin disabled");
}

async function setupRetention() {
  const now = Date.now();
  const iso = (ms) => new Date(ms).toISOString();
  const twelveMonthsAgo = (extraDays) => {
    const d = new Date(now);
    d.setUTCFullYear(d.getUTCFullYear() - 1);
    return d.getTime() + extraDays * 864e5;
  };
  const people = {
    expired: await newMember("STAGING TEST retention expired"),
    thirty: await newMember("STAGING TEST retention 30 days"),
    seven: await newMember("STAGING TEST retention 7 days"),
    active: await newMember("STAGING TEST retention active"),
  };
  // Accounts with no purchase. Their last sign in can only be backdated with database access (the Supabase
  // management API), so they are added only when SUPABASE_ACCESS_TOKEN is set.
  const token = process.env.SUPABASE_ACCESS_TOKEN;
  if (token) {
    for (const key of ["inactiveOld", "inactiveSoon"]) {
      const email = `staging-worksheet-${hex()}@example.invalid`, pw = password();
      const u = await api("POST", "/auth/v1/admin/users", { email, password: pw, email_confirm: true, user_metadata: { display_name: `STAGING TEST ${key}` } });
      people[key] = { id: u.id, email, password: pw };
    }
  }
  writeFileSync(STATE, JSON.stringify({ memberIds: Object.values(people).map((p) => p.id) }), { mode: 0o600 });
  if (token) {
    const ref = new URL(URL_).hostname.split(".")[0];
    const at = (ms) => new Date(ms).toISOString();
    const sql = `update auth.users set last_sign_in_at = '${at(twelveMonthsAgo(-1))}', created_at = '${at(twelveMonthsAgo(-30))}' where id = '${people.inactiveOld.id}';
update auth.users set last_sign_in_at = '${at(twelveMonthsAgo(20))}', created_at = '${at(twelveMonthsAgo(-30))}' where id = '${people.inactiveSoon.id}';`;
    const r = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ query: sql }) });
    if (!r.ok) throw new Error(`backdating sign in failed: ${r.status}`);
  }
  // Access ended: a year and a day ago; a year less 20 days ago; a year less 5 days ago.
  for (const [who, ended] of [["expired", twelveMonthsAgo(-1)], ["thirty", twelveMonthsAgo(20)], ["seven", twelveMonthsAgo(5)]]) {
    await api("PATCH", `/rest/v1/entitlements?user_id=eq.${people[who].id}`, { starts_at: iso(ended - 365 * 864e5), ends_at: iso(ended) });
  }
  const admin = await enableTestAdmin();
  writeFileSync(STATE, JSON.stringify({ memberIds: Object.values(people).map((p) => p.id), adminId: admin.id }), { mode: 0o600 });
  writeEnv({
    E2E_SUPABASE: 1,
    E2E_RET_EXPIRED_EMAIL: people.expired.email,
    E2E_RET_EXPIRED_PASSWORD: people.expired.password,
    E2E_RET_THIRTY_EMAIL: people.thirty.email,
    E2E_RET_THIRTY_PASSWORD: people.thirty.password,
    E2E_RET_SEVEN_EMAIL: people.seven.email,
    E2E_RET_SEVEN_PASSWORD: people.seven.password,
    E2E_RET_ACTIVE_EMAIL: people.active.email,
    E2E_RET_ACTIVE_PASSWORD: people.active.password,
    E2E_RET_INACTIVE_OLD_EMAIL: people.inactiveOld?.email ?? "",
    E2E_RET_INACTIVE_OLD_PASSWORD: people.inactiveOld?.password ?? "",
    E2E_RET_INACTIVE_SOON_EMAIL: people.inactiveSoon?.email ?? "",
    E2E_RET_INACTIVE_SOON_PASSWORD: people.inactiveSoon?.password ?? "",
    E2E_RET_ADMIN_EMAIL: admin.email,
    E2E_RET_ADMIN_PASSWORD: admin.password,
    CRON_SECRET: randomBytes(24).toString("hex"),
  });
  console.log("retention fixtures ready: expired, 30 day, 7 day and active temporary members, shared test admin enabled");
}

async function cleanupRetention() {
  const st = readState();
  for (const id of st.memberIds ?? []) await eraseTestAccount(id);
  const adminId = st.adminId ?? (await findUser(ADMIN_EMAIL)).hit?.id;
  if (adminId) await disableTestAdmin(adminId);
  console.log("retention cleanup done: temporary accounts removed, shared test admin disabled");
}

if (suite === "journey") await (cmd === "setup" ? setupJourney() : cleanupJourney());
else if (suite === "module1") await (cmd === "setup" ? setupModule1() : cleanupModule1());
else if (suite === "export") await (cmd === "setup" ? setupExport() : cleanupExport());
else if (suite === "deletion") await (cmd === "setup" ? setupDeletion() : cleanupDeletion());
else await (cmd === "setup" ? setupRetention() : cleanupRetention());
if (cmd === "cleanup") writeFileSync(envOut, "", { mode: 0o600 });
