"use client";

import { useSyncExternalStore } from "react";

/**
 * Live worksheet progress shared across the page (brief: useWorksheetProgress(slug) for the lesson page and
 * dashboard). The form writes; any client component can read. Server rendered pages compute progress with
 * worksheetProgress() from the stored answers instead.
 */
const values = new Map<string, number>();
const listeners = new Set<() => void>();

export function setWorksheetProgress(slug: string, percent: number) {
  if (values.get(slug) === percent) return;
  values.set(slug, percent);
  for (const l of listeners) l();
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useWorksheetProgress(slug: string): number | undefined {
  return useSyncExternalStore(subscribe, () => values.get(slug), () => undefined);
}
