import { fmtDay } from "@/components/member/time";

export type Bucket = { bucket_id: string; kind: string; minutes_granted: number; minutes_used: number; expires_at: string };

export const fmtMinutes = (m: number) => `${Math.floor(m / 60)}h${m % 60 ? ` ${m % 60}m` : ""}`;

export function HoursMeter({ buckets }: { buckets: Bucket[] }) {
  if (!buckets.length) return <p className="text-sm text-ink-muted">No implementation hours on this workspace.</p>;
  const now = new Date().getTime();
  return (
    <ul className="space-y-4">
      {buckets.map((b) => {
        const left = Math.max(0, b.minutes_granted - b.minutes_used);
        const expired = new Date(b.expires_at).getTime() < now;
        const pct = Math.min(100, (b.minutes_used / b.minutes_granted) * 100);
        return (
          <li key={b.bucket_id}>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="font-semibold">{b.kind === "included" ? "Included hours" : "Extra hours package"}</span>
              <span className="text-sm text-ink-muted">{expired ? "Expired" : "Use by"} {fmtDay(b.expires_at)}</span>
            </div>
            <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-rose-soft" role="progressbar" aria-label={`${b.kind === "included" ? "Included" : "Package"} hours used`} aria-valuemin={0} aria-valuemax={b.minutes_granted} aria-valuenow={b.minutes_used}>
              <div className="h-full rounded-full bg-plum" style={{ width: `${pct}%` }} />
            </div>
            <p className="mt-1 text-sm"><span className="numeral text-xl">{fmtMinutes(left)}</span> left of {fmtMinutes(b.minutes_granted)}</p>
          </li>
        );
      })}
    </ul>
  );
}
