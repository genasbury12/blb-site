import type { Metadata } from "next";
import Link from "next/link";
import { moderate, postAnnouncement } from "@/app/admin/coaching/actions";
import { ActionForm } from "@/components/admin/action-form";
import { Field, TextArea, TextInput } from "@/components/admin/fields";
import { fmtShort } from "@/components/member/time";
import { PageHeader, SectionTitle } from "@/components/shell/page-header";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { requireStaff } from "@/lib/server/staff";

export const metadata: Metadata = { title: "Community moderation" };

function Mod({ id, kind, actions, reportId }: { id: string; kind: "post" | "comment"; actions: ("visible" | "hidden" | "removed" | "pin" | "unpin")[]; reportId?: string }) {
  const labels = { visible: "Restore", hidden: "Hide", removed: "Remove", pin: "Pin", unpin: "Unpin" };
  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((a) => (
        <ActionForm key={a} action={moderate} submitLabel={labels[a]} variant={a === "removed" ? "primary" : "secondary"} className="flex">
          <input type="hidden" name="id" value={id} /><input type="hidden" name="kind" value={kind} /><input type="hidden" name="action" value={a} /><input type="hidden" name="report_id" value={reportId ?? ""} />
        </ActionForm>
      ))}
    </div>
  );
}

export default async function AdminCommunityPage() {
  const { supabase } = await requireStaff(["admin", "coach"], "/admin/community");
  const [reports, posts] = await Promise.all([
    supabase.from("community_reports").select("id, reason, post_id, comment_id, created_at").eq("status", "open").order("created_at"),
    supabase.from("community_posts").select("id, title, body, pinned, moderation_status, created_at, tag").is("deleted_at", null).order("created_at", { ascending: false }).limit(30),
  ]);
  const commentIds = (reports.data ?? []).map((r) => r.comment_id).filter(Boolean) as string[];
  const { data: comments } = commentIds.length ? await supabase.from("community_comments").select("id, body, post_id, moderation_status").in("id", commentIds) : { data: [] };
  const postById = new Map((posts.data ?? []).map((p) => [p.id as string, p]));
  return (
    <div className="space-y-12">
      <PageHeader eyebrow="Community" title="Moderation" lede="Hidden content disappears for members immediately. Removed content stays hidden and is purged by the retention policy." />
      <section aria-labelledby="reports">
        <SectionTitle id="reports">Reports ({reports.data?.length ?? 0})</SectionTitle>
        {(reports.data ?? []).length === 0 ? <Card tone="quiet"><p className="text-ink-muted">No open reports.</p></Card> : null}
        <div className="grid gap-4">
          {(reports.data ?? []).map((r) => {
            const c = (comments ?? []).find((x) => x.id === r.comment_id);
            const p = r.post_id ? postById.get(r.post_id as string) : null;
            return (
              <Card key={r.id as string}>
                <p className="text-sm text-ink-muted">Reported {fmtShort(r.created_at as string)}: {r.reason as string}</p>
                <p className="mt-2 whitespace-pre-line">{c ? (c.body as string) : p ? `${p.title}: ${p.body}` : "Post not in the recent list."}</p>
                {r.post_id ? <Link className="text-sm text-plum underline" href={`/app/community/${r.post_id}`}>Open post</Link> : null}
                <div className="mt-3"><Mod id={(c?.id ?? r.post_id) as string} kind={c ? "comment" : "post"} actions={["hidden", "removed", "visible"]} reportId={r.id as string} /></div>
              </Card>
            );
          })}
        </div>
      </section>
      <section aria-labelledby="announce">
        <SectionTitle id="announce">Post a pinned announcement</SectionTitle>
        <Card><ActionForm action={postAnnouncement} submitLabel="Post announcement"><Field label="Title" htmlFor="an-t"><TextInput id="an-t" name="title" required /></Field><Field label="Message" htmlFor="an-b"><TextArea id="an-b" name="body" required /></Field></ActionForm></Card>
      </section>
      <section aria-labelledby="recent">
        <SectionTitle id="recent">Recent posts</SectionTitle>
        <div className="grid gap-3">
          {(posts.data ?? []).map((p) => (
            <Card key={p.id as string} className="p-5">
              <div className="flex flex-wrap items-center gap-2"><p className="font-semibold">{p.title as string}</p>{p.pinned ? <Badge tone="plum">Pinned</Badge> : null}{p.moderation_status !== "visible" ? <Badge>{p.moderation_status as string}</Badge> : null}</div>
              <p className="mt-1 line-clamp-2 text-sm text-ink-muted">{p.body as string}</p>
              <div className="mt-3"><Mod id={p.id as string} kind="post" actions={[p.pinned ? "unpin" : "pin", p.moderation_status === "visible" ? "hidden" : "visible"]} /></div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
