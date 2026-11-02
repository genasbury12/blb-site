"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function CopyPrompt({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div>
      <pre className="max-h-72 overflow-auto whitespace-pre-wrap rounded-xl bg-ivory p-4 font-sans text-sm leading-relaxed">{text}</pre>
      <div className="mt-3 flex items-center gap-3">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(text);
              setCopied(true);
              setTimeout(() => setCopied(false), 2500);
            } catch {
              setCopied(false);
            }
          }}
        >
          Copy prompt
        </Button>
        <span aria-live="polite" className="text-sm text-ink-muted">
          {copied ? "Copied" : ""}
        </span>
      </div>
    </div>
  );
}
