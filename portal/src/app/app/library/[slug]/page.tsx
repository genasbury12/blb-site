import { ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { NoAccess } from "@/components/member/access-states";
import { CopyPrompt } from "@/components/learning/copy-prompt";
import { PageHeader } from "@/components/shell/page-header";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { LIBRARY_KIND_LABELS, type LibraryKind } from "@/domain/library";
import { getFeatures, requireSession } from "@/lib/server/session";

export const metadata: Metadata = { title: "Library item" };

export default async function LibraryItemPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { supabase } = await requireSession(`/app/library/${slug}`);
  const features = await getFeatures();
  if (!features.has("library.read")) return <NoAccess what="The Implementation Library" />;
  if (!/^[a-z0-9-]{3,80}$/.test(slug)) notFound();
  const { data } = await supabase.from("library_items").select("title, kind, summary, body, external_url, tool_cost_note, module_number, is_sample").eq("slug", slug).eq("status", "published").maybeSingle();
  if (!data) notFound();
  const kind = data.kind as LibraryKind;
  return (
    <article>
      <Link href="/app/library" className="text-sm font-semibold text-plum underline-offset-4 hover:underline">Back to the library</Link>
      <div className="mt-6">
        <PageHeader eyebrow={`${LIBRARY_KIND_LABELS[kind]}${data.module_number ? ` · Module ${data.module_number}` : ""}`} title={data.title as string} lede={data.summary as string} />
      </div>
      {data.is_sample ? <div className="mb-6"><Badge tone="sample">Sample content for testing</Badge></div> : null}
      {data.tool_cost_note ? (
        <Alert tone="info" title="About tool costs" className="mb-6">{data.tool_cost_note as string}</Alert>
      ) : null}
      {data.body ? (
        <Card>
          {kind === "ai_prompt" ? (
            <>
              <p className="mb-3 text-sm text-ink-muted">Use this in your own AI assistant. Review and test anything it produces.</p>
              <CopyPrompt text={data.body as string} />
            </>
          ) : (
            <div className="whitespace-pre-line leading-relaxed">{data.body as string}</div>
          )}
        </Card>
      ) : null}
      {data.external_url ? (
        <a className="mt-6 inline-flex items-center gap-2 font-semibold text-plum underline underline-offset-4" href={data.external_url as string} target="_blank" rel="noopener noreferrer">
          Open the resource <ExternalLink className="size-4" aria-hidden /><span className="sr-only">(opens in a new tab)</span>
        </a>
      ) : null}
    </article>
  );
}
