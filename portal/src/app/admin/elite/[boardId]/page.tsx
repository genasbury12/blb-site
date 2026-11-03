import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { assignCoach, logTime, recordPackage, saveItem, scheduleSessions, setClaudeBoard, setPrivateSessionStatus, voidTime } from "@/app/admin/elite/actions";
import { commentOnItem } from "@/app/app/elite/actions";
import { ActionForm } from "@/components/admin/action-form";
import { Field, Select, TextArea, TextInput } from "@/components/admin/fields";
import { fmtMinutes, HoursMeter, type Bucket } from "@/components/elite/hours-meter";
import { fmtDateTime, fmtDay, fmtShort } from "@/components/member/time";
import { PageHeader, SectionTitle } from "@/components/shell/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, Eyebrow } from "@/components/ui/card";
import { requireStaff } from "@/lib/server/staff";

export const metadata: Metadata = { title: "Elite client" };

type Item = { id: string; kind: string; title: string; body: string | null; status: string; month_number: number | null; due_on: string | null; estimated_minutes: number | null; completion_summary: string | null };
const KINDS = { roadmap: "Roadmap", task: "Task", deliverable: "Deliverable", audit: "Audit", coach_note: "Coach note (private)", request: "Request" } as const;
const STATUSES = ["open", "in_progress", "waiting_on_client", "done", "submitted", "scoped", "completed", "declined", "archived"];

function ItemForm({ boardId, item, kind }: { boardId: string; item?: Item; kind?: keyof typeof KINDS }) {
  const k = (item?.kind ?? kind ?? "task") as keyof typeof KINDS;
  const key = item?.id ?? `new-${k}`;
  return (
    <ActionForm action={saveItem} submitLabel={item ? "Save" : `Add ${KINDS[k].toLowerCase()}`} variant={item ? "secondary" : "primary"} className="grid gap-3">
      <input type="hidden" name="id" value={item?.id ?? ""} /><input type="hidden" name="board_id" value={boardId} /><input type="hidden" name="kind" value={k} />
      <Field label="Title" htmlFor={`t-${key}`}><TextInput id={`t-${key}`} name="title" required defaultValue={item?.title} /></Field>
      <Field label="Details" htmlFor={`b-${key}`}><TextArea id={`b-${key}`} name="body" defaultValue={item?.body ?? ""} className="min-h-20" /></Field>
      <div className="grid gap-3 sm:grid-cols-4">
        <Field label="Status" htmlFor={`s-${key}`}><Select id={`s-${key}`} name="status" defaultValue={item?.status ?? (k === "request" ? "submitted" : "open")}>{STATUSES.map((s) => <option key={s} value={s}>{s.replaceAll("_", " ")}</option>)}</Select></Field>
        <Field label="Roadmap month" htmlFor={`m-${key}`}><Select id={`m-${key}`} name="month_number" defaultValue={item?.month_number ?? ""}><option value="">None</option>{[1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n}</option>)}</Select></Field>
        <Field label="Due or target" htmlFor={`d-${key}`}><TextInput id={`d-${key}`} name="due_on" type="date" defaultValue={item?.due_on ?? ""} /></Field>
        <Field label="Estimate (minutes)" htmlFor={`e-${key}`}><TextInput id={`e-${key}`} name="estimated_minutes" type="number" min={0} defaultValue={item?.estimated_minutes ?? ""} /></Field>
      </div>
      {k === "request" ? <Field label="Completion summary (required to complete)" htmlFor={`c-${key}`}><TextArea id={`c-${key}`} name="completion_summary" defaultValue={item?.completion_summary ?? ""} className="min-h-20" /></Field> : <input type="hidden" name="completion_summary" value={item?.completion_summary ?? ""} />}
    </ActionForm>
  );
}

export default async function AdminEliteBoardPage({ params }: { params: Promise<{ boardId: string }> }) {
  const { boardId } = await params;
  const { supabase, isAdmin } = await requireStaff(["admin", "coach"], `/admin/elite/${boardId}`);
  if (!/^[0-9a-f-]{36}$/i.test(boardId)) notFound();
  const { data: board } = await supabase.from("elite_boards").select("id, client_id, coach_id, claude_board_url").eq("id", boardId).maybeSingle();
  if (!board) notFound();
  const [client, items, buckets, entries, sessions, checkins, coaches, comments] = await Promise.all([
    supabase.from("profiles").select("display_name").eq("user_id", board.client_id).maybeSingle(),
    supabase.from("elite_items").select("*").eq("board_id", boardId).order("created_at", { ascending: false }),
    supabase.rpc("elite_hours_summary", { p_board: boardId }),
    supabase.from("elite_time_entries").select("id, minutes, work_date, note, item_id, voided_at, void_reason, bucket_id").eq("board_id", boardId).order("created_at", { ascending: false }),
    supabase.from("elite_sessions").select("*").eq("board_id", boardId).order("starts_at"),
    supabase.from("elite_checkins").select("*").eq("board_id", boardId).order("submitted_at", { ascending: false }),
    isAdmin ? supabase.from("user_roles").select("user_id").eq("role", "coach") : Promise.resolve({ data: [] }),
    supabase.from("elite_item_comments").select("item_id, body, created_at"),
  ]);
  const all = (items.data ?? []) as Item[];
  const requests = all.filter((i) => i.kind === "request");
  const coachIds = (coaches.data ?? []).map((c) => c.user_id as string);
  const { data: coachNames } = coachIds.length ? await supabase.from("profiles").select("user_id, display_name").in("user_id", coachIds) : { data: [] };
  const today = new Date().toISOString().slice(0, 10);
  const lateCheckins = (checkins.data ?? []).filter((c) => new Date(c.submitted_at as string) > new Date(c.due_at as string)).length;

  return (
    <div className="space-y-12">
      <PageHeader eyebrow="Elite client" title={(client.data?.display_name as string) ?? "Client"} actions={<Link className="self-center text-sm font-semibold text-plum underline" href="/admin/elite">All Elite clients</Link>} />

      <Card tone="feature">
        <h2 className="font-display text-2xl">Client board in Claude</h2>
        <p className="mt-1 text-sm text-ink-muted">Tasks, roadmap, files and day to day notes live on the client&apos;s Claude board. Paste its claude.ai link and the client sees an Open your board button in their workspace. Share the board with the client in Claude as well.</p>
        {board.claude_board_url ? <p className="mt-3 text-sm"><a className="font-semibold text-plum underline" href={board.claude_board_url as string} target="_blank" rel="noopener noreferrer">Open the board<span className="sr-only"> (opens in a new tab)</span></a></p> : <p className="mt-3 text-sm text-ink-muted">No board linked yet.</p>}
        <ActionForm action={setClaudeBoard} submitLabel="Save link" variant="secondary" className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
          <input type="hidden" name="board_id" value={boardId} />
          <Field label="Claude board link" hint="Starts with https://claude.ai/. Leave empty and save to remove it." htmlFor="cb-url"><TextInput id="cb-url" name="url" type="url" defaultValue={(board.claude_board_url as string) ?? ""} placeholder="https://claude.ai/..." /></Field>
        </ActionForm>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <h2 className="font-display text-2xl">Hours</h2>
          <div className="mt-4"><HoursMeter buckets={(buckets.data ?? []) as Bucket[]} /></div>
          {isAdmin ? (
            <ActionForm action={recordPackage} submitLabel="Record package" variant="secondary" className="mt-5 grid gap-3 sm:grid-cols-[110px_1fr_auto] sm:items-end">
              <input type="hidden" name="board_id" value={boardId} />
              <Field label="Package" htmlFor="pk-h"><Select id="pk-h" name="hours"><option value="3">3 hours</option><option value="5">5 hours</option><option value="10">10 hours</option></Select></Field>
              <Field label="Payment reference" hint="Packages are sold separately (I-30)." htmlFor="pk-n"><TextInput id="pk-n" name="note" required /></Field>
            </ActionForm>
          ) : null}
        </Card>
        <Card>
          <h2 className="font-display text-2xl">Record time after the work</h2>
          <ActionForm action={logTime} submitLabel="Record time" className="mt-4 grid gap-3">
            <input type="hidden" name="board_id" value={boardId} />
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Allowance" htmlFor="lt-b"><Select id="lt-b" name="bucket_id">{((buckets.data ?? []) as Bucket[]).map((b) => <option key={b.bucket_id} value={b.bucket_id}>{b.kind === "included" ? "Included" : "Package"}: {fmtMinutes(b.minutes_granted - b.minutes_used)} left</option>)}</Select></Field>
              <Field label="Request" htmlFor="lt-i"><Select id="lt-i" name="item_id"><option value="">None</option>{requests.map((r) => <option key={r.id} value={r.id}>{r.title}</option>)}</Select></Field>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Hours" htmlFor="lt-h"><TextInput id="lt-h" name="hours" type="number" min={0} max={10} defaultValue={0} /></Field>
              <Field label="Minutes" htmlFor="lt-m"><TextInput id="lt-m" name="minutes" type="number" min={0} max={59} defaultValue={30} /></Field>
              <Field label="Work date" htmlFor="lt-d"><TextInput id="lt-d" name="work_date" type="date" defaultValue={today} /></Field>
            </div>
            <Field label="What was done" htmlFor="lt-n"><TextInput id="lt-n" name="note" required /></Field>
          </ActionForm>
        </Card>
      </div>

      <section aria-labelledby="requests">
        <SectionTitle id="requests">Implementation requests</SectionTitle>
        <div className="grid gap-4">
          {requests.map((r) => (
            <Card key={r.id}><details><summary className="flex cursor-pointer list-none flex-wrap items-center gap-2"><span className="font-semibold">{r.title}</span><Badge>{r.status}</Badge></summary><div className="mt-4"><ItemForm boardId={boardId} item={r} /></div></details></Card>
          ))}
          {!requests.length ? <Card tone="quiet"><p className="text-ink-muted">No requests yet.</p></Card> : null}
        </div>
      </section>

      <section aria-labelledby="time">
        <SectionTitle id="time">Time ledger</SectionTitle>
        <Card>
          <ul className="divide-y divide-rose-soft text-sm">
            {(entries.data ?? []).map((e) => (
              <li key={e.id as string} className="flex flex-wrap items-center gap-3 py-2.5">
                <span className={e.voided_at ? "text-ink-muted line-through" : "font-semibold"}>{fmtMinutes(e.minutes as number)}</span>
                <span>{fmtDay(e.work_date as string)}: {e.note as string}</span>
                {e.voided_at ? <Badge>Void: {e.void_reason as string}</Badge> : isAdmin ? (
                  <details className="ml-auto"><summary className="cursor-pointer text-plum">Void</summary>
                    <ActionForm action={voidTime} submitLabel="Void entry" variant="secondary" className="mt-2 flex gap-2"><input type="hidden" name="id" value={e.id as string} /><input type="hidden" name="board_id" value={boardId} /><TextInput name="reason" required placeholder="Reason" className="min-h-9 text-sm" /></ActionForm>
                  </details>
                ) : null}
              </li>
            ))}
          </ul>
          {!(entries.data ?? []).length ? <p className="text-sm text-ink-muted">No time recorded.</p> : null}
        </Card>
      </section>

      <section aria-labelledby="sessions" className="grid gap-5 lg:grid-cols-2">
        <Card>
          <h2 id="sessions" className="font-display text-2xl">Private sessions</h2>
          <ul className="mt-3 divide-y divide-rose-soft text-sm">
            {(sessions.data ?? []).map((s) => (
              <li key={s.id as string} className="py-3">
                <div className="flex flex-wrap items-center gap-2"><span>{fmtDateTime(s.starts_at as string)}</span><Badge>{String(s.status).replaceAll("_", " ")}</Badge>{(checkins.data ?? []).some((c) => c.session_id === s.id) ? <Badge tone="plum">Check-in in</Badge> : null}</div>
                {s.status === "scheduled" ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(["completed", "no_show"] as const).map((st) => (
                      <ActionForm key={st} action={setPrivateSessionStatus} submitLabel={st === "completed" ? "Completed" : "No show"} variant="quiet" className="flex"><input type="hidden" name="id" value={s.id as string} /><input type="hidden" name="board_id" value={boardId} /><input type="hidden" name="status" value={st} /></ActionForm>
                    ))}
                    <details><summary className="cursor-pointer text-plum">Coach cancel</summary>
                      <ActionForm action={setPrivateSessionStatus} submitLabel="Cancel and replace" variant="secondary" className="mt-2 flex flex-wrap items-end gap-2"><input type="hidden" name="id" value={s.id as string} /><input type="hidden" name="board_id" value={boardId} /><input type="hidden" name="status" value="coach_canceled" /><Field label="Replacement (Eastern)" htmlFor={`rp-${s.id}`}><TextInput id={`rp-${s.id}`} name="replacement" type="datetime-local" required /></Field></ActionForm>
                    </details>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
          <ActionForm action={scheduleSessions} submitLabel="Schedule weekly sessions" variant="secondary" className="mt-5 grid gap-3">
            <input type="hidden" name="board_id" value={boardId} />
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="First session (Eastern)" htmlFor="ss-f"><TextInput id="ss-f" name="first" type="datetime-local" required /></Field>
              <Field label="Weeks" htmlFor="ss-w"><TextInput id="ss-w" name="weeks" type="number" min={1} max={26} defaultValue={26} /></Field>
            </div>
            <Field label="Private join link (https)" htmlFor="ss-u"><TextInput id="ss-u" name="meeting_url_private" type="url" /></Field>
          </ActionForm>
        </Card>
        <Card>
          <h2 className="font-display text-2xl">Weekly check-ins</h2>
          <p className="text-sm text-ink-muted">{lateCheckins} submitted after the 24 hour deadline. Missed check-in handling follows the service agreement.</p>
          <ul className="mt-3 space-y-3 text-sm">
            {(checkins.data ?? []).map((c) => (
              <li key={c.id as string} className="rounded-xl bg-rose-soft/40 p-4">
                <Eyebrow>Submitted {fmtShort(c.submitted_at as string)}{new Date(c.submitted_at as string) > new Date(c.due_at as string) ? " · late" : ""}</Eyebrow>
                <p className="mt-1"><strong>Accomplished:</strong> {c.accomplishments as string}</p>
                <p><strong>Challenges:</strong> {c.challenges as string}</p>
                <p><strong>Priorities:</strong> {c.top_priorities as string}</p>
                <p><strong>Help needed:</strong> {c.help_needed as string}</p>
              </li>
            ))}
          </ul>
        </Card>
      </section>

      <section aria-labelledby="board">
        <SectionTitle id="board">Private coach notes and earlier board items</SectionTitle>
        <div className="grid gap-4">
          {all.filter((i) => i.kind !== "request").map((i) => (
            <Card key={i.id} className="p-5">
              <details><summary className="flex cursor-pointer list-none flex-wrap items-center gap-2"><Badge tone={i.kind === "coach_note" ? "sample" : "neutral"}>{KINDS[i.kind as keyof typeof KINDS]}</Badge><span className="font-semibold">{i.title}</span>{i.month_number ? <span className="text-sm text-ink-muted">Month {i.month_number}</span> : null}<span className="text-sm text-ink-muted">{i.status.replaceAll("_", " ")}</span></summary>
                <div className="mt-4 grid gap-4">
                  <ItemForm boardId={boardId} item={i} />
                  <div className="text-sm">{(comments.data ?? []).filter((c) => c.item_id === i.id).map((c, n) => <p key={n} className="border-l-2 border-rose pl-3">{c.body as string}</p>)}</div>
                  <ActionForm action={commentOnItem} submitLabel="Comment" variant="quiet" className="flex gap-2"><input type="hidden" name="item_id" value={i.id} /><TextInput name="body" required placeholder="Comment" className="min-h-9 text-sm" /></ActionForm>
                </div>
              </details>
            </Card>
          ))}
          <div className="grid gap-4 md:grid-cols-2">
            {(["coach_note"] as const).map((k) => (
              <Card key={k} tone="quiet"><details><summary className="cursor-pointer font-semibold text-plum">Add {KINDS[k].toLowerCase()}</summary><div className="mt-4"><ItemForm boardId={boardId} kind={k} /></div></details></Card>
            ))}
          </div>
        </div>
      </section>

      <section aria-labelledby="coach" className="grid gap-5 lg:grid-cols-2">
        {isAdmin ? (
          <Card>
            <h2 id="coach" className="font-display text-2xl">Coach</h2>
            <ActionForm action={assignCoach} submitLabel="Assign coach" variant="secondary" className="mt-3 grid gap-3">
              <input type="hidden" name="board_id" value={boardId} />
              <Field label="Coach" htmlFor="co"><Select id="co" name="coach_id" defaultValue={(board.coach_id as string) ?? ""}><option value="">Unassigned</option>{(coachNames ?? []).map((c) => <option key={c.user_id as string} value={c.user_id as string}>{(c.display_name as string) ?? "Coach"}</option>)}</Select></Field>
            </ActionForm>
          </Card>
        ) : null}
      </section>
    </div>
  );
}
