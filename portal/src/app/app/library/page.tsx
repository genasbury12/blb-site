import type { Metadata } from "next";
import Link from "next/link";
import { NoAccess } from "@/components/member/access-states";
import { PageHeader } from "@/components/shell/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LIBRARY_KINDS, LIBRARY_KIND_LABELS, sanitizeSearch, type LibraryKind } from "@/domain/library";
import { getFeatures, requireSession } from "@/lib/server/session";

export const metadata: Metadata = { title: "Implementation Library" };

type Item = { id: string; slug: string; title: string; kind: LibraryKind; summary: string; module_number: number | null; tags: string[]; is_sample: boolean };

export default async function LibraryPage({ searchParams }: { searchParams: Promise<{ q?: string; kind?: string; module?: string }> }) {
  const { supabase } = await requireSession("/app/library");
  const features = await getFeatures();
  if (!features.has("library.read")) return <NoAccess what="The Implementation Library" />;
  const sp = await searchParams;
  const q = sanitizeSearch(sp.q);
  const kind = LIBRARY_KINDS.includes(sp.kind as LibraryKind) ? (sp.kind as LibraryKind) : null;
  const moduleNumber = Number(sp.module) >= 1 && Number(sp.module) <= 8 ? Number(sp.module) : null;

  let query = supabase.from("library_items").select("id, slug, title, kind, summary, module_number, tags, is_sample").eq("status", "published").order("title");
  if (q) query = query.or(`title.ilike.%${q}%,summary.ilike.%${q}%`);
  if (kind) query = query.eq("kind", kind);
  if (moduleNumber) query = query.eq("module_number", moduleNumber);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  const items = (data ?? []) as Item[];

  return (
    <div>
      <PageHeader
        eyebrow="Implementation Library"
        title="Walkthroughs, recipes and templates"
        lede="Short, practical references for setting things up. Some tools charge their own fees, and each item says when that applies."
      />
      <form className="mb-8 grid gap-3 rounded-[22px] border border-rose/70 bg-white p-4 sm:grid-cols-[2fr_1fr_1fr_auto] sm:items-end" role="search">
        <label className="text-sm font-semibold">
          Search
          <input name="q" defaultValue={sp.q ?? ""} className="mt-1 block min-h-11 w-full rounded-xl border border-mauve px-3" />
        </label>
        <label className="text-sm font-semibold">
          Type
          <select name="kind" defaultValue={kind ?? ""} className="mt-1 block min-h-11 w-full rounded-xl border border-mauve bg-white px-3">
            <option value="">All types</option>
            {LIBRARY_KINDS.map((k) => (
              <option key={k} value={k}>{LIBRARY_KIND_LABELS[k]}</option>
            ))}
          </select>
        </label>
        <label className="text-sm font-semibold">
          Module
          <select name="module" defaultValue={moduleNumber ?? ""} className="mt-1 block min-h-11 w-full rounded-xl border border-mauve bg-white px-3">
            <option value="">All modules</option>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <option key={n} value={n}>Module {n}</option>
            ))}
          </select>
        </label>
        <Button type="submit" variant="secondary">Filter</Button>
      </form>
      {items.length === 0 ? (
        <Card tone="quiet">
          <p className="font-display text-xl">Nothing matches yet</p>
          <p className="mt-1 text-sm text-ink-muted">Try a different word or clear the filters. New items are added as they are published.</p>
        </Card>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {items.map((it) => (
            <li key={it.id}>
              <Link href={`/app/library/${it.slug}`} className="block h-full rounded-[22px] border border-rose/70 bg-white p-6 transition hover:-translate-y-0.5 hover:border-plum/40 hover:shadow-[0_18px_40px_-28px_rgba(101,71,79,0.6)]">
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-mauve-ink">
                  {LIBRARY_KIND_LABELS[it.kind]}{it.module_number ? ` · Module ${it.module_number}` : ""}
                </p>
                <p className="mt-2 font-display text-xl leading-snug">{it.title}</p>
                <p className="mt-2 text-sm text-ink-muted">{it.summary}</p>
                {it.is_sample ? <div className="mt-3"><Badge tone="sample">Sample</Badge></div> : null}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
