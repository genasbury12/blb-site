import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { NoAccess } from "@/components/member/access-states";
import { VideoPlayer } from "@/components/learning/video-player";
import { PageHeader } from "@/components/shell/page-header";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { requireFlag } from "@/lib/server/flags";
import { muxPlaybackTokens } from "@/lib/server/mux";
import { getFeatures, requireSession } from "@/lib/server/session";

export const metadata: Metadata = { title: "Workshop" };

export default async function WorkshopPage({ params }: { params: Promise<{ slug: string }> }) {
  requireFlag("coaching");
  const { slug } = await params;
  const { supabase } = await requireSession(`/app/workshops/${slug}`);
  const features = await getFeatures();
  if (!features.has("workshops.access")) return <NoAccess what="Workshops" />;
  if (!/^[a-z0-9-]{3,80}$/.test(slug)) notFound();
  const { data: w } = await supabase.from("workshops").select("title, description, video_provider_id, captions_ready, transcript, is_sample").eq("slug", slug).maybeSingle();
  if (!w) notFound();
  const tokens = w.video_provider_id && w.captions_ready ? muxPlaybackTokens(w.video_provider_id as string) : null;
  return (
    <article className="space-y-8">
      <Link href="/app/workshops" className="text-sm font-semibold text-plum underline-offset-4 hover:underline">All workshops</Link>
      <PageHeader eyebrow="Workshop" title={w.title as string} lede={(w.description as string) ?? undefined} />
      {w.is_sample ? <Badge tone="sample">Sample content for testing</Badge> : null}
      {tokens ? (
        <VideoPlayer playbackId={w.video_provider_id as string} title={w.title as string} tokens={tokens} />
      ) : (
        <div className="flex aspect-video items-center justify-center rounded-[22px] border border-dashed border-mauve/70 bg-gradient-to-br from-white to-rose-soft p-6 text-center">
          <p className="font-display text-2xl">The video is on its way</p>
        </div>
      )}
      {w.transcript ? (
        <Card><details><summary className="cursor-pointer font-display text-xl">Transcript</summary><div className="mt-3 whitespace-pre-line text-[0.95rem] leading-relaxed">{w.transcript as string}</div></details></Card>
      ) : null}
    </article>
  );
}
