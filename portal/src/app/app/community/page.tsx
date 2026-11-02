import { MessageCircle, Pin } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { createPost } from "@/app/app/coaching/actions";
import { ActionForm } from "@/components/admin/action-form";
import { Field, Select, TextArea, TextInput } from "@/components/admin/fields";
import { NoAccess } from "@/components/member/access-states";
import { fmtShort } from "@/components/member/time";
import { PageHeader } from "@/components/shell/page-header";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { COMMUNITY_TAGS } from "@/domain/coaching";
import { authorNames } from "@/lib/server/community";
import { requireFlag } from "@/lib/server/flags";
import { getFeatures, requireSession } from "@/lib/server/session";

export const metadata: Metadata = { title: "Community" };

export default async function CommunityPage({ searchParams }: { searchParams: Promise<{ tag?: string }> }) {
  requireFlag("community");
  const { supabase } = await requireSession("/app/community");
  const features = await getFeatures();
  if (!features.has("community.access")) return <NoAccess what="The community" />;
  const { tag } = await searchParams;
  let q = supabase.from("community_posts").select("id, user_id, title, body, tag, pinned, created_at, moderation_status").is("deleted_at", null).order("pinned", { ascending: false }).order("created_at", { ascending: false }).limit(40);
  if (tag && tag in COMMUNITY_TAGS) q = q.eq("tag", tag);
  const { data: posts } = await q;
  const ids = (posts ?? []).map((p) => p.id as string);
  const { data: comments } = ids.length ? await supabase.from("community_comments").select("post_id").in("post_id", ids).is("deleted_at", null) : { data: [] };
  const counts = new Map<string, number>();
  for (const c of comments ?? []) counts.set(c.post_id as string, (counts.get(c.post_id as string) ?? 0) + 1);
  const names = await authorNames(supabase, (posts ?? []).map((p) => p.user_id as string));

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
      <div>
        <PageHeader eyebrow="Community" title="Your circle" lede="Share wins, ask questions, and swap resources. The founder answers support questions on Tuesdays and Thursdays." />
        <nav aria-label="Filter posts" className="mb-6 flex flex-wrap gap-2 text-sm">
          <Link href="/app/community" className={`rounded-full border px-4 py-1.5 ${!tag ? "border-plum bg-plum text-white" : "border-rose bg-white"}`}>All</Link>
          {Object.entries(COMMUNITY_TAGS).map(([k, v]) => (
            <Link key={k} href={`/app/community?tag=${k}`} className={`rounded-full border px-4 py-1.5 ${tag === k ? "border-plum bg-plum text-white" : "border-rose bg-white"}`}>{v}</Link>
          ))}
        </nav>
        {(posts ?? []).length === 0 ? (
          <Card tone="quiet"><p className="font-display text-xl">Start the conversation</p><p className="mt-1 text-sm text-ink-muted">Share a win or ask the question you have been sitting on.</p></Card>
        ) : (
          <ul className="space-y-4">
            {(posts ?? []).map((p) => {
              const a = names.get(p.user_id as string);
              return (
                <li key={p.id as string}>
                  <Link href={`/app/community/${p.id}`} className="block rounded-[22px] border border-rose/70 bg-white p-6 transition hover:border-plum/40">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-ink-muted">
                      {p.pinned ? <span className="inline-flex items-center gap-1 font-semibold text-plum"><Pin className="size-3.5" aria-hidden />Pinned</span> : null}
                      {p.tag ? <Badge>{COMMUNITY_TAGS[p.tag as keyof typeof COMMUNITY_TAGS]}</Badge> : null}
                      <span>{a?.name ?? "Member"}{a?.staff ? " · Coach" : ""} · {fmtShort(p.created_at as string)}</span>
                      {p.moderation_status !== "visible" ? <Badge>Hidden by a moderator</Badge> : null}
                    </div>
                    <p className="mt-2 font-display text-2xl leading-snug">{p.title as string}</p>
                    <p className="mt-1 line-clamp-2 text-sm text-ink-muted">{p.body as string}</p>
                    <p className="mt-3 inline-flex items-center gap-1.5 text-sm text-plum"><MessageCircle className="size-4" aria-hidden />{counts.get(p.id as string) ?? 0} replies</p>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      <aside className="lg:pt-32">
        <Card className="lg:sticky lg:top-8">
          <h2 className="font-display text-2xl">New post</h2>
          <ActionForm action={createPost} submitLabel="Post" className="mt-4 space-y-4">
            <Field label="Title" htmlFor="p-title"><TextInput id="p-title" name="title" required maxLength={140} /></Field>
            <Field label="Post" htmlFor="p-body"><TextArea id="p-body" name="body" required maxLength={5000} /></Field>
            <Field label="Type" htmlFor="p-tag">
              <Select id="p-tag" name="tag" defaultValue="">
                <option value="">General</option>
                <option value="win">Win</option>
                <option value="question">Question</option>
                <option value="resource">Resource</option>
              </Select>
            </Field>
            <p className="text-xs text-ink-muted">Members see your first name only. Never share passwords or private customer details.</p>
          </ActionForm>
        </Card>
      </aside>
    </div>
  );
}
