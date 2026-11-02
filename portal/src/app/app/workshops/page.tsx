import type { Metadata } from "next";
import Link from "next/link";
import { NoAccess } from "@/components/member/access-states";
import { fmtDay } from "@/components/member/time";
import { PageHeader } from "@/components/shell/page-header";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { requireFlag } from "@/lib/server/flags";
import { getFeatures, requireSession } from "@/lib/server/session";

export const metadata: Metadata = { title: "Workshops" };

export default async function WorkshopsPage() {
  requireFlag("coaching");
  const { supabase } = await requireSession("/app/workshops");
  const features = await getFeatures();
  if (!features.has("workshops.access")) return <NoAccess what="Workshops" />;
  const { data } = await supabase.from("workshops").select("slug, title, description, release_at, duration_seconds, is_sample").order("release_at", { ascending: false });
  return (
    <div>
      <PageHeader eyebrow="Workshops" title="Implementation workshops" lede="Two new prerecorded workshops arrive on the first and third Monday of each month. The full library is yours while your coaching is active." />
      {(data ?? []).length === 0 ? (
        <Card tone="quiet"><p className="text-ink-muted">Workshops appear here on their release dates.</p></Card>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {(data ?? []).map((w) => (
            <li key={w.slug as string}>
              <Link href={`/app/workshops/${w.slug}`} className="block h-full rounded-[22px] border border-rose/70 bg-white p-6 transition hover:-translate-y-0.5 hover:border-plum/40">
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-mauve-ink">
                  Released {fmtDay(w.release_at as string)}{w.duration_seconds ? ` · ${Math.round((w.duration_seconds as number) / 60)} min` : ""}
                </p>
                <p className="mt-2 font-display text-2xl leading-snug">{w.title as string}</p>
                {w.description ? <p className="mt-2 line-clamp-3 text-sm text-ink-muted">{w.description as string}</p> : null}
                {w.is_sample ? <div className="mt-3"><Badge tone="sample">Sample</Badge></div> : null}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
