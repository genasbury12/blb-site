import type { Metadata } from "next";
import Link from "next/link";
import { StatusPill } from "@/components/admin/fields";
import { PageHeader } from "@/components/shell/page-header";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { requireStaff } from "@/lib/server/staff";

export const metadata: Metadata = { title: "Curriculum" };

export default async function CatalogPage() {
  const { supabase, isAdmin } = await requireStaff(["admin", "coach"], "/admin/catalog");
  const [modules, lessons] = await Promise.all([
    supabase.from("modules").select("id, number, title, status").order("number"),
    supabase.from("lessons").select("id, module_id, title, order_index, status, essential, is_sample, video_provider_id, captions_ready").order("order_index"),
  ]);
  return (
    <div>
      <PageHeader
        eyebrow="Curriculum"
        title="Eight modules"
        lede="Lessons move from draft to review to approved before they can be published. Members only ever see published lessons."
        actions={isAdmin ? <ButtonLink href="/admin/catalog/lessons/new">New lesson</ButtonLink> : null}
      />
      <ol className="space-y-5">
        {(modules.data ?? []).map((m) => {
          const ls = (lessons.data ?? []).filter((l) => l.module_id === m.id);
          return (
            <li key={m.id as string}>
              <Card>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-mauve-ink">Module {m.number as number}</p>
                    <h2 className="font-display text-2xl">{m.title as string}</h2>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusPill status={m.status as string} />
                    <Link className="text-sm font-semibold text-plum underline underline-offset-4" href={`/admin/catalog/modules/${m.id}`}>
                      Module settings
                    </Link>
                  </div>
                </div>
                {ls.length ? (
                  <ul className="mt-4 divide-y divide-rose-soft">
                    {ls.map((l) => (
                      <li key={l.id as string} className="flex flex-wrap items-center gap-3 py-2.5">
                        <span className="numeral w-7 text-xl text-mauve-ink">{l.order_index as number}</span>
                        <Link className="font-medium text-ink hover:text-plum hover:underline" href={`/admin/catalog/lessons/${l.id}`}>
                          {l.title as string}
                        </Link>
                        <StatusPill status={l.status as string} />
                        {!l.essential ? <Badge>Optional</Badge> : null}
                        {l.is_sample ? <Badge tone="sample">Sample</Badge> : null}
                        {l.video_provider_id && !l.captions_ready ? <Badge>Captions missing</Badge> : null}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-sm text-ink-muted">No lessons yet.</p>
                )}
              </Card>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
