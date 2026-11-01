export default function Loading() {
  return (
    <div role="status" aria-live="polite" className="animate-pulse space-y-4">
      <span className="sr-only">Loading</span>
      <div className="h-10 w-2/3 rounded-lg bg-rose-soft" />
      <div className="h-40 rounded-2xl bg-white" />
      <div className="h-24 rounded-2xl bg-white" />
    </div>
  );
}
