import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createComment, deleteOwnContent, reportContent } from "@/app/app/coaching/actions";
import { ActionForm } from "@/components/admin/action-form";
import { TextArea, TextInput } from "@/components/admin/fields";
import { NoAccess } from "@/components/member/access-states";
import { fmtShort } from "@/components/member/time";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { COMMUNITY_TAGS } from "@/domain/coaching";
import { authorNames } from "@/lib/server/community";
import { requireFlag } from "@/lib/server/flags";
import { getFeatures, requireSession } from "@/lib/server/session";

export const metadata: Metadata = { title: "Community post" };

type C = { id: string; user_id: string; parent_comment_id: string | null; body: string; created_at: string };

function Report({ postId, commentId }: { postId?: string; commentId?: string }) {
  return (
    <details className="text-xs">
      <summary className="cursor-pointer text-ink-muted hover:text-plum">Report</summary>
      <ActionForm action={reportContent} submitLabel="Send report" variant="quiet" className="mt-2 flex flex-wrap items-end gap-2">
        <input type="hidden" name="post_id" value={postId ?? ""} />
        <input type="hidden" name="comment_id" value={commentId ?? ""} />
        <TextInput name="reason" required placeholder="What is wrong?" className="min-h-9 text-sm" />
      </ActionForm>
    </details>
  );
}

function CommentBlock({ c, reply, who, userId, postId }: { c: C; reply?: boolean; who: string; userId: string; postId: string }) {
  return (
    <div className={reply ? "ml-6 border-l-2 border-rose pl-4" : ""}>
      <p className="text-xs text-ink-muted">{who} · {fmtShort(c.created_at)}</p>
      <p className="mt-1 whitespace-pre-line">{c.body}</p>
      <div className="mt-1 flex gap-4">
        {c.user_id === userId ? (
          <ActionForm action={deleteOwnContent} submitLabel="Delete" variant="quiet" className="text-xs">
            <input type="hidden" name="id" value={c.id} /><input type="hidden" name="kind" value="comment" />
          </ActionForm>
        ) : <Report postId={postId} commentId={c.id} />}
      </div>
    </div>
  );
}

export default async function PostPage({ params }: { params: Promise<{ postId: string }> }) {
  requireFlag("community");
  const { postId } = await params;
  const { supabase, user } = await requireSession(`/app/community/${postId}`);
  const features = await getFeatures();
  if (!features.has("community.access")) return <NoAccess what="The community" />;
  if (!/^[0-9a-f-]{36}$/i.test(postId)) notFound();
  const { data: post } = await supabase.from("community_posts").select("id, user_id, title, body, tag, created_at, deleted_at").eq("id", postId).maybeSingle();
  if (!post || post.deleted_at) notFound();
  const { data: rows } = await supabase.from("community_comments").select("id, user_id, parent_comment_id, body, created_at").eq("post_id", postId).is("deleted_at", null).order("created_at");
  const comments = (rows ?? []) as C[];
  const names = await authorNames(supabase, [post.user_id as string, ...comments.map((c) => c.user_id)]);
  const who = (id: string) => { const a = names.get(id); return `${a?.name ?? "Member"}${a?.staff ? " · Coach" : ""}`; };
  const top = comments.filter((c) => !c.parent_comment_id);

  return (
    <article className="space-y-8">
      <Link href="/app/community" className="text-sm font-semibold text-plum underline-offset-4 hover:underline">Back to the community</Link>
      <Card>
        <div className="flex flex-wrap items-center gap-2 text-xs text-ink-muted">
          {post.tag ? <Badge>{COMMUNITY_TAGS[post.tag as keyof typeof COMMUNITY_TAGS]}</Badge> : null}
          <span>{who(post.user_id as string)} · {fmtShort(post.created_at as string)}</span>
        </div>
        <h1 className="mt-3 font-display text-[2.4rem] font-medium leading-tight">{post.title as string}</h1>
        <p className="mt-3 whitespace-pre-line leading-relaxed">{post.body as string}</p>
        <div className="mt-4">
          {post.user_id === user.id ? (
            <ActionForm action={deleteOwnContent} submitLabel="Delete post" variant="quiet"><input type="hidden" name="id" value={postId} /><input type="hidden" name="kind" value="post" /></ActionForm>
          ) : <Report postId={postId} />}
        </div>
      </Card>
      <section aria-labelledby="replies" className="space-y-5">
        <h2 id="replies" className="font-display text-2xl">{comments.length} {comments.length === 1 ? "reply" : "replies"}</h2>
        {top.map((c) => (
          <Card key={c.id} className="space-y-4 p-5">
            <CommentBlock c={c} who={who(c.user_id)} userId={user.id} postId={postId} />
            {comments.filter((r) => r.parent_comment_id === c.id).map((r) => <CommentBlock key={r.id} c={r} reply who={who(r.user_id)} userId={user.id} postId={postId} />)}
            <details className="text-sm">
              <summary className="cursor-pointer font-semibold text-plum">Reply</summary>
              <ActionForm action={createComment} submitLabel="Reply" variant="secondary" className="mt-2 space-y-2">
                <input type="hidden" name="post_id" value={postId} /><input type="hidden" name="parent_comment_id" value={c.id} />
                <label className="sr-only" htmlFor={`r-${c.id}`}>Your reply</label>
                <TextArea id={`r-${c.id}`} name="body" required maxLength={3000} className="min-h-20" />
              </ActionForm>
            </details>
          </Card>
        ))}
        <Card>
          <ActionForm action={createComment} submitLabel="Post reply">
            <input type="hidden" name="post_id" value={postId} /><input type="hidden" name="parent_comment_id" value="" />
            <label className="block font-semibold" htmlFor="new-reply">Add a reply</label>
            <TextArea id="new-reply" name="body" required maxLength={3000} />
          </ActionForm>
        </Card>
      </section>
    </article>
  );
}
