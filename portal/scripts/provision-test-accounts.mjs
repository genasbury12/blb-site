#!/usr/bin/env node
/**
 * Creates QA accounts in a STAGING Supabase project. Never run against production.
 *
 *   APP_ENV=staging NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
 *     node scripts/provision-test-accounts.mjs --email you@example.com [--with-sample-content] [--out /private/path/creds.txt]
 *
 * - Emails use plus addressing on your own inbox (you+boss-admin@example.com), so allowlisted test emails reach you.
 * - Passwords are random (24 characters) and printed ONCE to this terminal. They are not saved anywhere. Store them in your password manager.
 *   With --out FILE they are written only to FILE (created with owner-only permissions, refused inside the repository)
 *   and the terminal shows emails only.
 * - Program access is created through the real billing function (billing_apply_checkout) with clearly marked
 *   test fixture ids (cs_test_fixture_..., pi_test_fixture_...). No Stripe charge happens.
 * - --with-sample-content publishes the SAMPLE modules, lessons and library items for walkthroughs (staging only).
 */
import { randomBytes, randomUUID } from "node:crypto";
import { writeFileSync, existsSync } from "node:fs";
import { resolve, relative, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const args = process.argv.slice(2);
const emailArg = args[args.indexOf("--email") + 1];
const withSample = args.includes("--with-sample-content");
const outArg = args.includes("--out") ? args[args.indexOf("--out") + 1] : undefined;
const env = process.env.APP_ENV;
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

function fail(msg) {
  console.error(`\n${msg}\n`);
  process.exit(1);
}
if (env === "production") fail("Refusing to run: APP_ENV is production. Test accounts belong in staging only.");
if (!url || !key) fail("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY for the STAGING project.");
if (!emailArg || !/^[^@\s+]+@[^@\s]+\.[^@\s]+$/.test(emailArg)) fail("Pass --email you@example.com (an inbox you own, without a + tag).");

if (args.includes("--out")) {
  if (!outArg || outArg.startsWith("--")) fail("Pass a file path after --out.");
  const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
  const rel = relative(repoRoot, resolve(outArg));
  if (!rel.startsWith("..")) fail("Refusing --out inside the repository. Choose a private path outside it.");
  if (existsSync(outArg)) fail("Refusing to overwrite an existing --out file.");
}

const [local, domain] = emailArg.split("@");
const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const password = () => `${randomBytes(18).toString("base64url")}Aa9`;

const ACCOUNTS = [
  { tag: "admin", name: "Test Admin", role: "admin" },
  { tag: "coach", name: "Test Coach", role: "coach" },
  { tag: "blueprint", name: "Test Blueprint", sku: "blueprint" },
  { tag: "accelerator", name: "Test Accelerator", sku: "accelerator" },
  { tag: "elite", name: "Test Elite", sku: "elite" },
  { tag: "noaccess", name: "Test No Access" },
];

async function ensureUser(email, name, pw) {
  const created = await admin.auth.admin.createUser({ email, password: pw, email_confirm: true, user_metadata: { display_name: name } });
  if (!created.error) return created.data.user.id;
  if (!/already|registered|exists/i.test(created.error.message)) throw created.error;
  // Existing account: reset its password so the printed one works.
  let page = 1;
  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const found = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (found) {
      const upd = await admin.auth.admin.updateUserById(found.id, { password: pw, email_confirm: true });
      if (upd.error) throw upd.error;
      return found.id;
    }
    if (data.users.length < 200) throw new Error(`could not find ${email}`);
    page += 1;
  }
}

const out = [];
for (const a of ACCOUNTS) {
  const email = `${local}+boss-${a.tag}@${domain}`;
  const pw = password();
  const id = await ensureUser(email, a.name, pw);
  if (a.role) {
    const r = await admin.from("user_roles").upsert({ user_id: id, role: a.role }, { onConflict: "user_id,role", ignoreDuplicates: true });
    if (r.error) throw r.error;
  }
  if (a.sku) {
    const existing = await admin.from("orders").select("id").eq("user_id", id).eq("sku", a.sku).like("checkout_session_id", "cs_test_fixture_%").maybeSingle();
    if (!existing.data) {
      const r = await admin.rpc("billing_apply_checkout", {
        p: { session_id: `cs_test_fixture_${randomUUID()}`, user_id: id, email, sku: a.sku, plan: "pay_in_full", payment_status: "paid", payment_intent_id: `pi_test_fixture_${randomUUID()}` },
      });
      if (r.error) throw r.error;
    }
  }
  out.push({ tag: a.tag, email, pw, id });
}

const coach = out.find((o) => o.tag === "coach");
const elite = out.find((o) => o.tag === "elite");
if (coach && elite) {
  await admin.from("elite_boards").update({ coach_id: coach.id }).eq("client_id", elite.id);
  await admin.from("coach_assignments").upsert({ coach_id: coach.id, student_id: elite.id }, { onConflict: "coach_id,student_id", ignoreDuplicates: true });
}

if (withSample) {
  await admin.from("app_config").upsert({ key: "allow_sample_content", value: true });
  await admin.from("modules").update({ status: "published" }).neq("status", "published");
  const { data: mods } = await admin.from("modules").select("id, number");
  for (const m of mods ?? []) {
    const count = m.number === 1 ? 7 : 2;
    const rows = Array.from({ length: count }, (_, i) => ({
      module_id: m.id, slug: `sample-lesson-${i + 1}`, order_index: i + 1, essential: m.number === 1 || i === 0,
      title: `SAMPLE: Module ${m.number} lesson ${i + 1}`, objective: "Placeholder objective. Real lesson content is pending production.",
      assignment: "Placeholder assignment. Real assignment is pending production.", is_sample: true, status: "published",
    }));
    const r = await admin.from("lessons").upsert(rows, { onConflict: "module_id,slug", ignoreDuplicates: true });
    if (r.error) throw r.error;
    await admin.from("milestones").upsert({ module_id: m.id, slug: "sample-milestone", title: `SAMPLE: Module ${m.number} milestone`, order_index: 1, is_sample: true, status: "published" }, { onConflict: "module_id,slug", ignoreDuplicates: true });
  }
}

const lines = [
  "Test accounts (save these in your password manager; they are not stored anywhere else):",
  "",
  ...out.map((o) => `  ${o.tag.padEnd(12)} ${o.email.padEnd(40)} ${o.pw}`),
  "",
  "For the signed in browser tests (run in a terminal only):",
  "",
];
const b = out.find((o) => o.tag === "blueprint");
const n = out.find((o) => o.tag === "noaccess");
lines.push(`  export E2E_SUPABASE=1 E2E_BLUEPRINT_EMAIL='${b.email}' E2E_BLUEPRINT_PASSWORD='${b.pw}' E2E_NOACCESS_EMAIL='${n.email}' E2E_NOACCESS_PASSWORD='${n.pw}'`, "");
if (outArg) {
  writeFileSync(outArg, lines.join("\n"), { mode: 0o600, flag: "wx" });
  console.log(`\nCreated or updated ${out.length} accounts. Passwords were written only to ${outArg}:\n`);
  for (const o of out) console.log(`  ${o.tag.padEnd(12)} ${o.email}`);
  console.log("");
} else {
  console.log("\n" + lines.join("\n"));
}
