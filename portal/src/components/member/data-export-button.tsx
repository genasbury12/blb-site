"use client";

import { Download, Loader2 } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/cn";

type State = { kind: "idle" } | { kind: "working" } | { kind: "done" } | { kind: "error"; message: string };

/**
 * "Download all my data" (10_DATA_RIGHTS Slice A). Builds the ZIP on the server and saves it here, showing a
 * preparing state meanwhile so a slow build never looks frozen.
 */
export function DataExportButton({ endpoint, label, variant = "primary" }: { endpoint: string; label: string; variant?: "primary" | "secondary" }) {
  const [state, setState] = useState<State>({ kind: "idle" });

  async function run() {
    setState({ kind: "working" });
    try {
      const res = await fetch(endpoint, { method: "POST" });
      if (res.status === 429) {
        const body = (await res.json().catch(() => ({}))) as { retry_after_seconds?: number };
        const minutes = Math.max(1, Math.ceil((body.retry_after_seconds ?? 600) / 60));
        setState({ kind: "error", message: `A download was made a few minutes ago. You can download again in ${minutes} minute${minutes === 1 ? "" : "s"}.` });
        return;
      }
      if (!res.ok) {
        setState({ kind: "error", message: "The download could not be prepared. Please try again in a few minutes, or email us and we will send it." });
        return;
      }
      const name = res.headers.get("Content-Disposition")?.match(/filename="([^"]+)"/)?.[1] ?? "BOSS_my-data.zip";
      const url = URL.createObjectURL(await res.blob());
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
      setState({ kind: "done" });
    } catch {
      setState({ kind: "error", message: "The download could not be prepared. Check your connection and try again." });
    }
  }

  const working = state.kind === "working";
  return (
    <div>
      <button
        type="button"
        onClick={run}
        disabled={working}
        className={cn(
          "inline-flex min-h-11 items-center gap-2 rounded-full px-6 font-semibold disabled:cursor-wait disabled:opacity-70",
          variant === "primary" ? "bg-plum text-white hover:bg-plum-deep" : "border border-mauve bg-white text-ink hover:bg-rose-soft",
        )}
      >
        {working ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Download className="size-4" aria-hidden />}
        {working ? "Preparing your download" : label}
      </button>
      <p role="status" aria-live="polite" className={cn("mt-2 text-sm", state.kind === "error" ? "text-danger" : "text-ink-muted")} data-testid="data-export-status">
        {state.kind === "working"
          ? "Gathering your answers, PDFs and files. This can take up to a minute."
          : state.kind === "done"
            ? "Your download has started. Look for a ZIP file in your downloads."
            : state.kind === "error"
              ? state.message
              : ""}
      </p>
    </div>
  );
}
