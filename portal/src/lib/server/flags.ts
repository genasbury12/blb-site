import "server-only";
import { notFound } from "next/navigation";
import { isFeatureEnabled, type FeatureFlag } from "@/lib/env";

/** Deployment flag guard for pages: a disabled section does not exist. */
export function requireFlag(flag: FeatureFlag) {
  if (!isFeatureEnabled(flag)) notFound();
}
