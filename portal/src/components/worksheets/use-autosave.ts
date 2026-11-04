"use client";

import { useEffect, useState } from "react";
import type { AnswerValue } from "@/domain/worksheets/schema";

export type SaveFn = (input: { slug: string; patch: Record<string, AnswerValue> }) => Promise<{ ok: true; savedAt: string } | { ok: false; error: string; retry: boolean }>;
export type SaveState = { kind: "idle" } | { kind: "saving" } | { kind: "saved"; at: string } | { kind: "retrying"; message: string } | { kind: "error"; message: string };

export const DEBOUNCE_MS = 800;
const MAX_BACKOFF_MS = 30000;

/**
 * Brief, Slice B autosave: debounce 800 ms per field; one request in flight per response; changes made while a
 * request is in flight are queued (latest value wins) and sent next; failures retry with exponential backoff.
 * Plain class so it is unit testable without a browser.
 */
export class AutosaveController {
  private timers = new Map<string, ReturnType<typeof setTimeout>>();
  private latest = new Map<string, AnswerValue>();
  private pending: Record<string, AnswerValue> = {};
  private failed = false;
  private inFlight = false;
  private backoff = 1000;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private readonly slug: string,
    private readonly save: SaveFn,
    private readonly onState: (s: SaveState) => void,
  ) {}

  queue(key: string, value: AnswerValue) {
    const t = this.timers.get(key);
    if (t) clearTimeout(t);
    this.latest.set(key, value);
    this.timers.set(
      key,
      setTimeout(() => {
        this.timers.delete(key);
        this.pending[key] = value;
        // Start the request on the next tick so fields whose timers fire together go in one request.
        setTimeout(() => void this.flush(), 0);
      }, DEBOUNCE_MS),
    );
  }

  hasUnsaved() {
    return this.timers.size > 0 || this.inFlight || Object.keys(this.pending).length > 0;
  }

  async flush(): Promise<void> {
    if (this.inFlight || !Object.keys(this.pending).length) return;
    const patch = this.pending;
    this.pending = {};
    this.inFlight = true;
    this.onState({ kind: "saving" });
    let result: Awaited<ReturnType<SaveFn>>;
    try {
      result = await this.save({ slug: this.slug, patch });
    } catch {
      result = { ok: false, error: "Not saved, retrying", retry: true };
    }
    this.inFlight = false;
    this.failed = !result.ok;
    if (result.ok) {
      this.backoff = 1000;
      this.onState({ kind: "saved", at: result.savedAt });
      if (Object.keys(this.pending).length) await this.flush();
      return;
    }
    if (!result.retry) {
      this.onState({ kind: "error", message: result.error });
      return;
    }
    // Put the failed changes back underneath anything newer, then retry with backoff.
    this.pending = { ...patch, ...this.pending };
    this.onState({ kind: "retrying", message: "Not saved, retrying" });
    if (this.retryTimer) clearTimeout(this.retryTimer);
    this.retryTimer = setTimeout(() => void this.flush(), this.backoff);
    this.backoff = Math.min(this.backoff * 2, MAX_BACKOFF_MS);
  }

  /**
   * Save everything now, skipping the debounce, and resolve once nothing is waiting (used before Complete, so the
   * server sees the latest answers). Resolves false if a save failed or did not finish in time.
   */
  async settle(timeoutMs = 15000): Promise<boolean> {
    for (const [key, t] of this.timers) {
      clearTimeout(t);
      this.pending[key] = this.latest.get(key)!;
    }
    this.timers.clear();
    const deadline = Date.now() + timeoutMs;
    while (this.inFlight) {
      if (Date.now() > deadline) return false;
      await new Promise((r) => setTimeout(r, 50));
    }
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }
    await this.flush();
    while (this.inFlight) {
      if (Date.now() > deadline) return false;
      await new Promise((r) => setTimeout(r, 50));
    }
    return !this.failed && !Object.keys(this.pending).length;
  }

  dispose() {
    for (const t of this.timers.values()) clearTimeout(t);
    if (this.retryTimer) clearTimeout(this.retryTimer);
  }
}

export function useAutosave(slug: string, save: SaveFn, initialSavedAt: string | null) {
  const [state, setState] = useState<SaveState>(initialSavedAt ? { kind: "saved", at: initialSavedAt } : { kind: "idle" });
  const [ctl] = useState(() => new AutosaveController(slug, save, setState));

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (ctl.hasUnsaved()) e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => {
      window.removeEventListener("beforeunload", warn);
    };
  }, [ctl]);

  return { state, queue: (key: string, value: AnswerValue) => ctl.queue(key, value), settle: () => ctl.settle() };
}
