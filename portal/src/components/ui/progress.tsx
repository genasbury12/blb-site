export function ProgressBar({ value, label }: { value: number; label: string }) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div>
      <div className="flex justify-between text-sm">
        <span>{label}</span>
        <span className="font-semibold">{pct}%</span>
      </div>
      <div
        className="mt-1 h-2.5 w-full overflow-hidden rounded-full bg-rose-soft"
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
      >
        <div className="h-full rounded-full bg-plum" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
