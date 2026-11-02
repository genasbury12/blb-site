import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

const control = "mt-1 block w-full rounded-xl border border-mauve bg-white px-3 text-base text-ink placeholder:text-ink-muted";

export function Field({ label, hint, children, htmlFor }: { label: string; hint?: string; children: ReactNode; htmlFor: string }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block text-sm font-semibold text-ink">
        {label}
      </label>
      {hint ? <p className="text-sm text-ink-muted">{hint}</p> : null}
      {children}
    </div>
  );
}

export function TextInput(props: ComponentProps<"input">) {
  return <input {...props} className={cn(control, "min-h-11", props.className)} />;
}

export function TextArea(props: ComponentProps<"textarea">) {
  return <textarea {...props} className={cn(control, "min-h-28 py-2", props.className)} />;
}

export function Select(props: ComponentProps<"select">) {
  return <select {...props} className={cn(control, "min-h-11", props.className)} />;
}

export function Checkbox({ label, ...props }: ComponentProps<"input"> & { label: string }) {
  return (
    <label className="flex min-h-11 items-center gap-3 text-sm font-medium">
      <input type="checkbox" {...props} className="size-5 accent-plum" />
      {label}
    </label>
  );
}

export function StatusPill({ status }: { status: string }) {
  const tone: Record<string, string> = {
    published: "bg-plum text-white",
    approved: "bg-rose text-ink",
    review: "bg-rose-soft text-ink",
    draft: "border border-dashed border-mauve text-ink",
    archived: "bg-ivory text-ink-muted",
  };
  return <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize", tone[status] ?? "bg-rose-soft text-ink")}>{status}</span>;
}

export function DataTable({ caption, head, children }: { caption: string; head: string[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-[22px] border border-rose/70 bg-white">
      <table className="w-full min-w-[640px] text-left text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead className="bg-rose-soft/60 text-[0.7rem] uppercase tracking-[0.14em] text-mauve-ink">
          <tr>
            {head.map((h) => (
              <th key={h} scope="col" className="px-4 py-3 font-semibold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-rose-soft">{children}</tbody>
      </table>
    </div>
  );
}
